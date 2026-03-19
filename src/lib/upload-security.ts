type SupportedSignature = "pdf" | "jpg" | "png" | "gif" | "webp" | "avif";

function asciiSlice(buffer: Buffer, start: number, end: number): string {
  return buffer.subarray(start, end).toString("ascii");
}

function detectBySignature(buffer: Buffer): SupportedSignature | null {
  if (buffer.length >= 5 && asciiSlice(buffer, 0, 5) === "%PDF-") return "pdf";

  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "png";
  }

  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "jpg";
  }

  if (buffer.length >= 6) {
    const gifHeader = asciiSlice(buffer, 0, 6);
    if (gifHeader === "GIF87a" || gifHeader === "GIF89a") {
      return "gif";
    }
  }

  if (buffer.length >= 12 && asciiSlice(buffer, 0, 4) === "RIFF" && asciiSlice(buffer, 8, 12) === "WEBP") {
    return "webp";
  }

  if (buffer.length >= 12 && asciiSlice(buffer, 4, 8) === "ftyp") {
    const brand = asciiSlice(buffer, 8, 12);
    if (brand === "avif" || brand === "avis") {
      return "avif";
    }
  }

  return null;
}

function normalizeExt(ext: string): SupportedSignature | null {
  const normalized = ext.trim().toLowerCase();
  if (normalized === "jpeg") return "jpg";
  if (normalized === "pdf" || normalized === "jpg" || normalized === "png" || normalized === "gif" || normalized === "webp" || normalized === "avif") {
    return normalized;
  }
  return null;
}

export function extensionFromMime(
  mimeType: string,
  allowedMimeToExt: Record<string, string>
): SupportedSignature | null {
  const mapped = allowedMimeToExt[mimeType.trim().toLowerCase()];
  if (!mapped) return null;
  return normalizeExt(mapped);
}

export function extensionFromFilename(filename: string): SupportedSignature | null {
  const dotIndex = filename.lastIndexOf(".");
  if (dotIndex === -1) return null;
  return normalizeExt(filename.slice(dotIndex + 1));
}

export function validateUploadBuffer(
  buffer: Buffer,
  expectedExtensions: ReadonlySet<string>
): SupportedSignature | null {
  const detected = detectBySignature(buffer);
  if (!detected || !expectedExtensions.has(detected)) {
    return null;
  }
  return detected;
}

export function isSafeDocumentUrl(fileUrl: string): boolean {
  if (!fileUrl.startsWith("/uploads/documents/")) return false;
  const fileName = fileUrl.slice("/uploads/documents/".length);
  return /^[a-zA-Z0-9._-]+$/.test(fileName);
}
