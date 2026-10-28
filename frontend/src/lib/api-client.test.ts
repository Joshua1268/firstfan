import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiFetch, asApiError } from "./api-client";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

let fetchMock: ReturnType<typeof vi.fn>;

function setCookie(cookie: string) {
  vi.stubGlobal("document", { cookie });
}

function headersOf(call: number): Headers {
  return new Headers(fetchMock.mock.calls[call][1].headers);
}

async function apiErrorOf(promise: Promise<unknown>): Promise<ApiError> {
  const error = await promise.catch((e) => e);
  expect(error).toBeInstanceOf(ApiError);
  return error as ApiError;
}

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => vi.unstubAllGlobals());

describe("apiFetch", () => {
  it("sends the session cookie and no csrf header on GET", async () => {
    setCookie("csrftoken=abc");
    fetchMock.mockResolvedValue(jsonResponse({ id: 1 }));

    expect(await apiFetch("/api/projects/1/")).toEqual({ id: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][1].credentials).toBe("same-origin");
    expect(headersOf(0).has("X-CSRFToken")).toBe(false);
  });

  it("sends the csrf token and json body on POST", async () => {
    setCookie("sessionid=x; csrftoken=abc");
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }, 201));

    await apiFetch("/api/projects/", { method: "POST", json: { name: "Appli" } });
    expect(headersOf(0).get("X-CSRFToken")).toBe("abc");
    expect(headersOf(0).get("Content-Type")).toBe("application/json");
    expect(fetchMock.mock.calls[0][1].body).toBe('{"name":"Appli"}');
  });

  it("fetches the csrf cookie once when it is missing", async () => {
    setCookie("");
    fetchMock.mockImplementation(async (path: string) => {
      if (path === "/api/auth/csrf/") {
        setCookie("csrftoken=fresh");
        return new Response(null, { status: 204 });
      }
      return jsonResponse({});
    });

    await apiFetch("/api/a/", { method: "POST", json: {} });
    expect(fetchMock.mock.calls.map((c) => c[0])).toEqual(["/api/auth/csrf/", "/api/a/"]);
    expect(headersOf(1).get("X-CSRFToken")).toBe("fresh");

    await apiFetch("/api/b/", { method: "POST", json: {} });
    expect(fetchMock.mock.calls.map((c) => c[0])).toEqual(["/api/auth/csrf/", "/api/a/", "/api/b/"]);
  });

  it("passes FormData through without a content type", async () => {
    setCookie("csrftoken=abc");
    fetchMock.mockResolvedValue(jsonResponse({}));
    const form = new FormData();
    form.append("file", "x");

    await apiFetch("/api/upload/", { method: "POST", body: form });
    expect(fetchMock.mock.calls[0][1].body).toBe(form);
    expect(headersOf(0).has("Content-Type")).toBe(false);
  });

  it("returns undefined on 204", async () => {
    setCookie("csrftoken=abc");
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    expect(await apiFetch("/api/a/", { method: "DELETE" })).toBeUndefined();
  });

  it("throws an ApiError with fields on 400", async () => {
    setCookie("csrftoken=abc");
    fetchMock.mockResolvedValue(jsonResponse({ email: ["Adresse invalide."] }, 400));

    const error = await apiErrorOf(apiFetch("/api/a/", { method: "POST", json: {} }));
    expect(error.status).toBe(400);
    expect(error.fields).toEqual({ email: ["Adresse invalide."] });
    expect(error.detail).toBeNull();
  });

  it("throws an ApiError with detail on 409", async () => {
    setCookie("csrftoken=abc");
    fetchMock.mockResolvedValue(jsonResponse({ detail: "Déjà payé." }, 409));

    const error = await apiErrorOf(apiFetch("/api/a/", { method: "POST" }));
    expect(error.status).toBe(409);
    expect(error.detail).toBe("Déjà payé.");
    expect(error.message).toBe("Déjà payé.");
    expect(error.fields).toEqual({});
  });

  it("throws an ApiError when the body is not json", async () => {
    fetchMock.mockResolvedValue(new Response("<html>", { status: 500 }));

    const error = await apiErrorOf(apiFetch("/api/a/"));
    expect(error.status).toBe(500);
    expect(error.detail).toBeNull();
  });
});

describe("asApiError", () => {
  it("keeps an ApiError as is", () => {
    const error = new ApiError(400, { email: ["Adresse invalide."] });
    expect(asApiError(error)).toBe(error);
  });

  it("turns a network failure into a readable ApiError", () => {
    const error = asApiError(new TypeError("Failed to fetch"));
    expect(error.status).toBe(0);
    expect(error.detail).toBe("Connexion impossible. Vérifie ton réseau et réessaie.");
  });
});
