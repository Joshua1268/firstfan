import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchPublicStats } from "./stats";

function mockFetch(body: unknown, status = 200) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status })));
}
function mockFetchReject() {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
}

afterEach(() => vi.unstubAllGlobals());

describe("fetchPublicStats", () => {
  it("returns parsed stats", async () => {
    const stats = { tests_in_progress: 2, verified_testers: 5, apps_tested: 1, demo: true };
    mockFetch(stats);
    expect(await fetchPublicStats()).toEqual(stats);
  });
  it("returns null on network error", async () => {
    mockFetchReject();
    expect(await fetchPublicStats()).toBeNull();
  });
  it("returns null on non-200", async () => {
    mockFetch({}, 503);
    expect(await fetchPublicStats()).toBeNull();
  });
});
