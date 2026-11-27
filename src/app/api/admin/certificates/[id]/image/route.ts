import { AuthError, authorize } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { storage } from "@/lib/storage";

/** Staff-only access to any certificate photo, including drafts. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await authorize("certificate:view");
  } catch (err) {
    if (err instanceof AuthError) return new Response(err.message, { status: err.status });
    throw err;
  }
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Not found", { status: 404 });
  const cert = await db.certificate.findUnique({ where: { id }, select: { imageObjectKey: true } });
  const obj = cert?.imageObjectKey ? await storage().get(cert.imageObjectKey) : null;
  if (!obj) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(obj.body), {
    headers: {
      "Content-Type": obj.contentType,
      "Cache-Control": "private, max-age=3600",
      "Content-Disposition": "inline",
    },
  });
}
