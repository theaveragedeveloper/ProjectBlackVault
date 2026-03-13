import { isLocalImagePath, isTrustedExternalImageUrl } from "@/lib/image-host-allowlist";

export const IMAGE_URL_ALLOWLIST_ERROR =
  "Image URL host is not allowed. Use uploads or a trusted image host.";

export function isAllowedImageUrlForStorage(url: string): boolean {
  return isLocalImagePath(url) || isTrustedExternalImageUrl(url);
}

export function validateOptionalImageUrl(url: unknown): { valid: true; normalized: string | null } | { valid: false; error: string } {
  if (url === undefined || url === null) {
    return { valid: true, normalized: null };
  }

  if (typeof url !== "string") {
    return { valid: false, error: "imageUrl must be a string or null" };
  }

  const trimmed = url.trim();
  if (trimmed === "") {
    return { valid: true, normalized: null };
  }

  if (!isAllowedImageUrlForStorage(trimmed)) {
    return { valid: false, error: IMAGE_URL_ALLOWLIST_ERROR };
  }

  return { valid: true, normalized: trimmed };
}
