import socket

import httpx
import pytest

from campaigns import page_reader
from campaigns.page_reader import read_page_text

ADDRESSES = {
    "app.example": "93.184.216.34",
    "intranet.example": "192.168.1.10",
    "127.0.0.1": "127.0.0.1",
    "10.0.0.5": "10.0.0.5",
    "169.254.169.254": "169.254.169.254",
}


class FakeWeb:
    def __init__(self, monkeypatch):
        self.monkeypatch = monkeypatch
        self.requests = []

    def serve(self, handler):
        def recorded(request):
            self.requests.append(request)
            return handler(request)

        def client(timeout_s):
            return httpx.Client(transport=httpx.MockTransport(recorded), timeout=timeout_s)

        self.monkeypatch.setattr(page_reader, "_client", client)


def fake_getaddrinfo(host, port, *args, **kwargs):
    if host not in ADDRESSES:
        raise socket.gaierror("unknown host")
    return [(socket.AF_INET, socket.SOCK_STREAM, 6, "", (ADDRESSES[host], port))]


@pytest.fixture
def web(monkeypatch):
    monkeypatch.setattr(page_reader.socket, "getaddrinfo", fake_getaddrinfo)
    return FakeWeb(monkeypatch)


def html(body: str, head: str = "") -> httpx.Response:
    page = f"<html><head>{head}</head><body>{body}</body></html>"
    return httpx.Response(200, headers={"content-type": "text/html; charset=utf-8"}, text=page)


@pytest.mark.parametrize(
    "url",
    [
        "http://127.0.0.1:8010/admin/",
        "http://10.0.0.5/",
        "http://169.254.169.254/latest/meta-data/",
        "http://intranet.example/",
        "file:///etc/passwd",
        "ftp://app.example/",
        "http://unknown.example/",
    ],
)
def test_fetch_refuses_private_hosts(web, url):
    web.serve(lambda request: html("secret"))
    assert read_page_text(url) is None
    assert web.requests == []


def test_redirect_to_private_host_refused(web):
    web.serve(lambda request: httpx.Response(302, headers={"location": "http://169.254.169.254/"}))
    assert read_page_text("https://app.example/") is None
    assert len(web.requests) == 1


def test_too_many_redirects(web):
    web.serve(lambda request: httpx.Response(302, headers={"location": "/next"}))
    assert read_page_text("https://app.example/") is None
    assert len(web.requests) == 4


def test_request_pinned_to_checked_address(web):
    web.serve(lambda request: html("Bonjour"))
    assert read_page_text("https://app.example/home") == "Bonjour"
    request = web.requests[0]
    assert request.url.host == "93.184.216.34"
    assert request.url.path == "/home"
    assert request.headers["host"] == "app.example"


def test_fetch_extracts_visible_text(web):
    head = '<title>Compta Express</title><meta name="description" content="Factures simples">'
    body = "<script>var x = 1;</script><style>p {}</style><p>Crée   tes factures</p><p>en 2 clics</p>"
    web.serve(lambda request: html(body, head))
    assert (
        read_page_text("https://app.example/")
        == "Compta Express\nFactures simples\nCrée tes factures en 2 clics"
    )


def test_fetch_truncates(web):
    body = "<p>" + "mot " * 3000 + "</p><p>FIN</p>"
    web.serve(lambda request: html(body))
    text = read_page_text("https://app.example/")
    assert len(text) == 4000
    assert read_page_text("https://app.example/", max_bytes=1000).count("mot") < 250
    assert "FIN" not in read_page_text("https://app.example/", max_bytes=1000)


def test_non_html_or_error_returns_none(web):
    web.serve(lambda request: httpx.Response(200, json={"a": 1}))
    assert read_page_text("https://app.example/") is None
    web.serve(lambda request: httpx.Response(500, text="boom"))
    assert read_page_text("https://app.example/") is None


def test_network_error_returns_none(web):
    def fail(request):
        raise httpx.ConnectTimeout("slow")

    web.serve(fail)
    assert read_page_text("https://app.example/") is None
