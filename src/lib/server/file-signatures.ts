export interface DetectedFileSignature {
  extension: "jpg" | "png" | "webp" | "avif" | "pdf";
  mimeType: string;
}

export function detectFileSignature(buffer: Buffer): DetectedFileSignature | null {
  if (buffer.length < 12) return null;

  if (
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return { extension: "jpg", mimeType: "image/jpeg" };
  }

  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return { extension: "png", mimeType: "image/png" };
  }

  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { extension: "webp", mimeType: "image/webp" };
  }

  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return { extension: "pdf", mimeType: "application/pdf" };
  }

  if (
    buffer[4] === 0x66 &&
    buffer[5] === 0x74 &&
    buffer[6] === 0x79 &&
    buffer[7] === 0x70 &&
    buffer[8] === 0x61 &&
    buffer[9] === 0x76 &&
    buffer[10] === 0x69 &&
    buffer[11] === 0x66
  ) {
    return { extension: "avif", mimeType: "image/avif" };
  }

  return null;
}

export function isHeicFamilySignature(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;
  if (!(buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70)) {
    return false;
  }

  const brand = buffer.subarray(8, 12).toString("ascii").toLowerCase();
  return brand === "heic" || brand === "heix" || brand === "hevc" || brand === "hevx" || brand === "mif1";
}
