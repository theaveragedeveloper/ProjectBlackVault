type FileSignature = {
  extension: string;
  mimeType: string;
};

const HEIC_FAMILY_BRANDS = ["heic", "heix", "hevc", "hevx", "mif1", "msf1"];

const JPEG_SOI_1 = 0xff;
const JPEG_SOI_2 = 0xd8;
const JPEG_SOI_3 = 0xff;

export function detectFileSignature(buffer: Buffer): FileSignature | null {
  if (buffer.length < 12) {
    return null;
  }

  // JPEG: FF D8 FF
  if (
    buffer[0] === JPEG_SOI_1 &&
    buffer[1] === JPEG_SOI_2 &&
    buffer[2] === JPEG_SOI_3
  ) {
    return { extension: "jpg", mimeType: "image/jpeg" };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { extension: "png", mimeType: "image/png" };
  }

  // WEBP: RIFF....WEBP
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

  // AVIF: ISO BMFF with ftyp and major brand avif/avis/mif1/msf1
  if (
    buffer[4] === 0x66 &&
    buffer[5] === 0x74 &&
    buffer[6] === 0x79 &&
    buffer[7] === 0x70
  ) {
    const majorBrand = buffer.subarray(8, 12).toString("ascii");
    const compatibleBrands = buffer.subarray(8, 64).toString("ascii");
    if (
      ["avif", "avis"].includes(majorBrand) ||
      compatibleBrands.includes("avif") ||
      compatibleBrands.includes("avis")
    ) {
      return { extension: "avif", mimeType: "image/avif" };
    }
  }

  // PDF: %PDF-
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46 &&
    buffer[4] === 0x2d
  ) {
    return { extension: "pdf", mimeType: "application/pdf" };
  }

  return null;
}

export function isHeicFamilySignature(buffer: Buffer): boolean {
  if (buffer.length < 12) {
    return false;
  }

  // HEIC/HEIF: ISO BMFF container with ftyp and HEIC-family brands.
  if (
    buffer[4] !== 0x66 ||
    buffer[5] !== 0x74 ||
    buffer[6] !== 0x79 ||
    buffer[7] !== 0x70
  ) {
    return false;
  }

  const majorBrand = buffer.subarray(8, 12).toString("ascii");
  const compatibleBrands = buffer.subarray(8, 96).toString("ascii");

  return (
    HEIC_FAMILY_BRANDS.includes(majorBrand) ||
    HEIC_FAMILY_BRANDS.some((brand) => compatibleBrands.includes(brand))
  );
}
