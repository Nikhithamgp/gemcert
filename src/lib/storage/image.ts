import { randomUUID } from "node:crypto";
import { fileTypeFromBuffer } from "file-type";
import sharp from "sharp";

export const ALLOWED_IMAGE_MIME = ["image/jpeg", "image/png", "image/webp"] as const;

export class ImageValidationError extends Error {}

export type ProcessedImage = { key: string; body: Buffer; contentType: "image/jpeg" | "image/png" };

/**
 * Validates an uploaded image by its *content* (magic bytes, not the file name
 * or browser-supplied type), then re-encodes it with sharp. Re-encoding strips
 * EXIF/GPS metadata and guarantees the stored object is a plain raster image.
 */
export async function processImage(
  input: Buffer,
  kind: "photo" | "logo",
  maxBytes: number,
): Promise<ProcessedImage> {
  if (input.byteLength === 0) throw new ImageValidationError("The file is empty.");
  if (input.byteLength > maxBytes) {
    throw new ImageValidationError(`Image is too large. Maximum size is ${Math.round(maxBytes / 1024 / 1024)} MB.`);
  }
  const detected = await fileTypeFromBuffer(input);
  if (!detected || !(ALLOWED_IMAGE_MIME as readonly string[]).includes(detected.mime)) {
    throw new ImageValidationError("Unsupported file. Please upload a JPEG, PNG or WebP image.");
  }

  let pipeline;
  try {
    pipeline = sharp(input, { limitInputPixels: 50_000_000, failOn: "error" }).rotate();
    const meta = await pipeline.metadata();
    if (!meta.width || !meta.height || meta.width < 50 || meta.height < 50) {
      throw new ImageValidationError("Image is too small (minimum 50×50 pixels).");
    }
  } catch (err) {
    if (err instanceof ImageValidationError) throw err;
    throw new ImageValidationError("The image could not be read. It may be corrupted.");
  }

  if (kind === "photo") {
    const body = await pipeline
      .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: 86, mozjpeg: true })
      .toBuffer();
    return { key: `certificates/${randomUUID()}.jpg`, body, contentType: "image/jpeg" };
  }

  const body = await pipeline
    .resize({ width: 800, height: 800, fit: "inside", withoutEnlargement: true })
    .png({ compressionLevel: 9 })
    .toBuffer();
  return { key: `branding/${randomUUID()}.png`, body, contentType: "image/png" };
}
