import { publicImageKey } from "@/lib/certificates/queries";
import { safeDecode } from "@/lib/certificates/number";
import { LIMITS, rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";
import { storage } from "@/lib/storage";

/** Public photo for an issued certificate. Drafts are never served. */
export async function GET(_req: Request, { params }: { params: Promise<{ number: string }> }) {
  const limit = rateLimit(`img:${await clientIp()}`, LIMITS.publicLookup.limit * 2, LIMITS.publicLookup.windowMs);
  if (!limit.ok) return new Response("Too many requests", { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } });

  const { number } = await params;
  const key = await publicImageKey(safeDecode(number));
  const obj = key ? await storage().get(key) : null;
  if (!obj) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(obj.body), {
    headers: {
      "Content-Type": obj.contentType,
      // Photos of issued certificates never change (corrections get a new number).
      "Cache-Control": "public, max-age=86400",
      "Content-Disposition": "inline",
    },
  });
}
