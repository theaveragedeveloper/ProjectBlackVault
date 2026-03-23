export const ALLOWED_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png"] as const;

export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
] as const;

export const IMAGE_MIME_BY_EXTENSION: Record<(typeof ALLOWED_IMAGE_EXTENSIONS)[number], string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
};

export const SUPPORTED_IMAGE_FORMATS_LABEL = "JPG, JPEG, PNG";

export const IMAGE_PICKER_ACCEPT = ALLOWED_IMAGE_MIME_TYPES.join(",");
