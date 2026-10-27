import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_API_URL, apiBaseUrl } from "./api-url";
import { fetchPublicStats } from "./stats";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("apiBaseUrl", () => {
  it("defaults to the dev Django on 127.0.0.1:8010", () => {
    vi.stubEnv("API_INTERNAL_URL", "");
    expect(DEFAULT_API_URL).toBe("http://127.0.0.1:8010");
    expect(apiBaseUrl()).toBe("http://127.0.0.1:8010");
  });
  it("uses API_INTERNAL_URL when set", () => {
    vi.stubEnv("API_INTERNAL_URL", "http://api:8000");
    expect(apiBaseUrl()).toBe("http://api:8000");
  });
  it("is the base used by fetchPublicStats", async () => {
    vi.stubEnv("API_INTERNAL_URL", "");
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await fetchPublicStats();
    expect(fetchMock.mock.calls[0][0]).toBe("http://127.0.0.1:8010/api/public/stats/");
  });
});
