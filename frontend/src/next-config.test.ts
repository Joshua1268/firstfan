import { describe, expect, it } from "vitest";
import nextConfig from "../next.config";

describe("next config", () => {
  it("lets proxied API bodies hold three 5 MB captures", () => {
    expect(nextConfig.experimental?.proxyClientMaxBodySize).toBe("20mb");
  });
});
