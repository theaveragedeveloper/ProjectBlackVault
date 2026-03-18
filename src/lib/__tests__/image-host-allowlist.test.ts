import { describe, expect, it } from "vitest";

import { isTrustedExternalImageUrl } from "../image-host-allowlist";

describe("isTrustedExternalImageUrl", () => {
  it("allows HTTPS URLs from trusted hosts", () => {
    expect(isTrustedExternalImageUrl("https://images.unsplash.com/photo-123")).toBe(true);
  });

  it("rejects HTTP URLs even when host is trusted", () => {
    expect(isTrustedExternalImageUrl("http://images.unsplash.com/photo-123")).toBe(false);
  });

  it("rejects non-allowlisted hosts", () => {
    expect(isTrustedExternalImageUrl("https://example.com/photo-123")).toBe(false);
  });
});
