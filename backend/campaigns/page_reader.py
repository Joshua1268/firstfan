import ipaddress
import socket
from html.parser import HTMLParser
from urllib.parse import urljoin, urlsplit

import httpx

MAX_CHARS = 4000
MAX_REDIRECTS = 3
SKIPPED_TAGS = {"script", "style", "noscript", "template"}


class _TextParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.title = ""
        self.description = ""
        self.words: list[str] = []
        self._stack: list[str] = []

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        if tag == "meta" and (attributes.get("name") or "").lower() == "description":
            self.description = attributes.get("content") or ""
        elif tag in SKIPPED_TAGS or tag == "title":
            self._stack.append(tag)

    def handle_endtag(self, tag):
        if self._stack and self._stack[-1] == tag:
            self._stack.pop()

    def handle_data(self, data):
        if not self._stack:
            self.words.extend(data.split())
        elif self._stack[-1] == "title":
            self.title += data


def _visible_text(page: str) -> str:
    parser = _TextParser()
    parser.feed(page)
    parts = [" ".join(parser.title.split()), " ".join(parser.description.split()), " ".join(parser.words)]
    return "\n".join(part for part in parts if part)[:MAX_CHARS]


def _public_ip(host: str, port: int) -> str | None:
    try:
        infos = socket.getaddrinfo(host, port, type=socket.SOCK_STREAM)
    except (OSError, UnicodeError):
        return None
    addresses = [ipaddress.ip_address(info[4][0]) for info in infos]
    # Every address must be public, or a name with one private record could still reach it.
    if not addresses or any(not ip.is_global or ip.is_multicast for ip in addresses):
        return None
    return str(addresses[0])


def _client(timeout_s: float) -> httpx.Client:
    return httpx.Client(timeout=timeout_s, follow_redirects=False)


def _pinned_request(client: httpx.Client, url: str) -> httpx.Request | None:
    parts = urlsplit(url)
    if parts.scheme not in ("http", "https") or not parts.hostname:
        return None
    port = parts.port or (443 if parts.scheme == "https" else 80)
    ip = _public_ip(parts.hostname, port)
    if ip is None:
        return None
    # Connect to the checked address so a second DNS answer cannot point elsewhere.
    host = f"[{ip}]" if ":" in ip else ip
    pinned = parts._replace(netloc=f"{host}:{port}" if parts.port else host).geturl()
    return client.build_request(
        "GET",
        pinned,
        headers={"Host": parts.netloc.rsplit("@", 1)[-1]},
        extensions={"sni_hostname": parts.hostname},
    )


def _read_limited(response: httpx.Response, max_bytes: int) -> bytes:
    body = b""
    for chunk in response.iter_bytes():
        body += chunk
        if len(body) >= max_bytes:
            break
    return body[:max_bytes]


def read_page_text(url: str, *, max_bytes: int = 200_000, timeout_s: float = 5.0) -> str | None:
    try:
        with _client(timeout_s) as client:
            for _ in range(MAX_REDIRECTS + 1):
                request = _pinned_request(client, url)
                if request is None:
                    return None
                response = client.send(request, stream=True)
                try:
                    if response.is_redirect:
                        url = urljoin(url, response.headers["location"])
                        continue
                    if response.status_code != 200 or "html" not in response.headers.get("content-type", ""):
                        return None
                    body = _read_limited(response, max_bytes)
                finally:
                    response.close()
                return _visible_text(body.decode(response.encoding or "utf-8", errors="replace"))
    except (httpx.HTTPError, OSError, ValueError, KeyError):
        return None
    return None
