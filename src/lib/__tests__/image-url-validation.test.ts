import { describe, expect, it } from "vitest";

import { IMAGE_URL_ALLOWLIST_ERROR, validateOptionalImageUrl } from "../image-url-validation";

describe("validateOptionalImageUrl", () => {
  it("returns allowlist error for non-HTTPS trusted host URL", () => {
    expect(validateOptionalImageUrl("http://images.unsplash.com/photo-123")).toEqual({
      valid: false,
      error: IMAGE_URL_ALLOWLIST_ERROR,
    });
  });
});
