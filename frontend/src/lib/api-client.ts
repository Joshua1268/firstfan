export class ApiError extends Error {
  status: number;
  fields: Record<string, string[]>;
  detail: string | null;

  constructor(status: number, body: unknown) {
    const data = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
    const detail = typeof data.detail === "string" ? data.detail : null;
    super(detail ?? `Erreur ${status}`);
    this.status = status;
    this.detail = detail;
    this.fields = {};
    for (const [name, messages] of Object.entries(data)) {
      if (Array.isArray(messages)) this.fields[name] = messages.map(String);
    }
  }
}

// fetch rejects with a TypeError when the network fails: give it the same shape as an API error.
export function asApiError(e: unknown): ApiError {
  return e instanceof ApiError
    ? e
    : new ApiError(0, { detail: "Connexion impossible. Vérifie ton réseau et réessaie." });
}

function readCsrfCookie(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function csrfToken(): Promise<string | null> {
  if (!readCsrfCookie()) {
    // Django sets the csrftoken cookie on this response.
    await fetch("/api/auth/csrf/", { credentials: "same-origin" });
  }
  return readCsrfCookie();
}

export async function apiFetch<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, ...options } = init;
  const method = (options.method ?? "GET").toUpperCase();
  const headers = new Headers(options.headers);

  if (json !== undefined) {
    headers.set("Content-Type", "application/json");
    options.body = JSON.stringify(json);
  }
  if (method !== "GET") {
    const token = await csrfToken();
    if (token) headers.set("X-CSRFToken", token);
  }

  const res = await fetch(path, { ...options, method, headers, credentials: "same-origin" });
  if (res.status === 204) return undefined as T;

  const body = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, body);
  return body as T;
}
