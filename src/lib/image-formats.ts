export const ALLOWED_IMAGE_EXTENSIONS = ["jpg", "png", "webp", "avif"] as const;

export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;

export const IMAGE_MIME_BY_EXTENSION: Record<(typeof ALLOWED_IMAGE_EXTENSIONS)[number], string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
};

export const SUPPORTED_IMAGE_FORMATS_LABEL = "JPG, PNG, WebP, AVIF";

export const IMAGE_PICKER_ACCEPT = ALLOWED_IMAGE_MIME_TYPES.join(",");
