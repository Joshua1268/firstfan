import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { config, proxy } from "./proxy";

afterEach(() => vi.unstubAllEnvs());

function rewriteTarget(url: string): string | null {
  return proxy(new NextRequest(url)).headers.get("x-middleware-rewrite");
}

describe("proxy", () => {
  it("only runs on API paths", () => {
    expect(config.matcher).toBe("/api/:path*");
  });
  it("sends API calls to the Django URL read at request time", () => {
    vi.stubEnv("API_INTERNAL_URL", "http://backend:8000");
    expect(rewriteTarget("http://127.0.0.1:3000/api/health/")).toBe("http://backend:8000/api/health/");
    vi.stubEnv("API_INTERNAL_URL", "http://other:9000");
    expect(rewriteTarget("http://127.0.0.1:3000/api/health/")).toBe("http://other:9000/api/health/");
  });
  it("keeps the trailing slash and the query string", () => {
    vi.stubEnv("API_INTERNAL_URL", "http://backend:8000");
    expect(rewriteTarget("http://127.0.0.1:3000/api/projects/?page=2")).toBe(
      "http://backend:8000/api/projects/?page=2",
    );
    expect(rewriteTarget("http://127.0.0.1:3000/api/health")).toBe("http://backend:8000/api/health");
  });
  it("leaves public stats to the Next route handler", () => {
    expect(rewriteTarget("http://127.0.0.1:3000/api/public/stats")).toBeNull();
    expect(rewriteTarget("http://127.0.0.1:3000/api/public/stats/")).toBeNull();
  });
});
