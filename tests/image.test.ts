import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { ImageValidationError, processImage } from "@/lib/storage/image";
import { OBJECT_KEY_PATTERN, assertValidKey } from "@/lib/storage/keys";

const MB = 1024 * 1024;
const png = (w = 200, h = 200) =>
  sharp({ create: { width: w, height: h, channels: 3, background: "#ff0000" } }).png().toBuffer();

describe("image upload validation", () => {
  it("accepts a real PNG and re-encodes the photo to JPEG with a random key", async () => {
    const out = await processImage(await png(), "photo", 8 * MB);
    expect(out.contentType).toBe("image/jpeg");
    expect(out.key).toMatch(OBJECT_KEY_PATTERN);
    expect((await sharp(out.body).metadata()).format).toBe("jpeg");
  });

  it("strips EXIF metadata", async () => {
    const withExif = await sharp(await png())
      .jpeg()
      .withExif({ IFD0: { Copyright: "SECRET-GPS-OWNER" } })
      .toBuffer();
    const out = await processImage(withExif, "photo", 8 * MB);
    expect(out.body.toString("latin1")).not.toContain("SECRET-GPS-OWNER");
  });

  it("keeps logos as PNG", async () => {
    const out = await processImage(await png(), "logo", 8 * MB);
    expect(out.contentType).toBe("image/png");
    expect(out.key.startsWith("branding/")).toBe(true);
  });

  it("rejects non-images regardless of name", async () => {
    await expect(processImage(Buffer.from("<script>alert(1)</script>"), "photo", 8 * MB)).rejects.toBeInstanceOf(ImageValidationError);
    await expect(processImage(Buffer.from("MZ\x90\x00executable"), "photo", 8 * MB)).rejects.toBeInstanceOf(ImageValidationError);
    const pdf = Buffer.from("%PDF-1.4\n%âãÏÓ\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF");
    await expect(processImage(pdf, "photo", 8 * MB)).rejects.toThrow(/Unsupported/);
  });

  it("rejects SVG (scriptable) images", async () => {
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
    await expect(processImage(svg, "photo", 8 * MB)).rejects.toBeInstanceOf(ImageValidationError);
  });

  it("rejects empty, oversized and tiny images", async () => {
    await expect(processImage(Buffer.alloc(0), "photo", 8 * MB)).rejects.toThrow(/empty/);
    await expect(processImage(await png(), "photo", 100)).rejects.toThrow(/too large/);
    await expect(processImage(await png(10, 10), "photo", 8 * MB)).rejects.toThrow(/too small/);
  });

  it("rejects truncated/corrupt images", async () => {
    const good = await sharp(await png(400, 400)).jpeg().toBuffer();
    await expect(processImage(good.subarray(0, 200), "photo", 8 * MB)).rejects.toBeInstanceOf(ImageValidationError);
  });
});

describe("object keys", () => {
  it("rejects traversal and unexpected keys", () => {
    expect(() => assertValidKey("../../etc/passwd")).toThrow();
    expect(() => assertValidKey("certificates/../x.jpg")).toThrow();
    expect(() => assertValidKey("certificates/abc.exe")).toThrow();
    expect(() => assertValidKey("certificates/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.jpg")).not.toThrow();
  });
});
