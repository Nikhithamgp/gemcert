import { AuthError, authorize } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { qrPngBuffer, qrSvg } from "@/lib/qr";

/** Download the QR code of an issued certificate (PNG for most uses, SVG for print shops). */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await authorize("certificate:print");
  } catch (err) {
    if (err instanceof AuthError) return new Response(err.message, { status: err.status });
    throw err;
  }
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Not found", { status: 404 });
  const cert = await db.certificate.findUnique({ where: { id }, select: { verifyUrl: true, certificateNumber: true } });
  if (!cert?.verifyUrl || !cert.certificateNumber) return new Response("This certificate has no QR code yet.", { status: 404 });

  const format = new URL(req.url).searchParams.get("format") === "svg" ? "svg" : "png";
  const filename = `${cert.certificateNumber}-qr.${format}`;
  const headers = { "Content-Disposition": `attachment; filename="${filename}"`, "Cache-Control": "private, no-store" };
  if (format === "svg") {
    return new Response(await qrSvg(cert.verifyUrl), { headers: { ...headers, "Content-Type": "image/svg+xml" } });
  }
  return new Response(new Uint8Array(await qrPngBuffer(cert.verifyUrl, 1200)), { headers: { ...headers, "Content-Type": "image/png" } });
}
