import { getLabSettings } from "@/lib/settings";
import { storage } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await getLabSettings();
  const obj = settings.logoObjectKey ? await storage().get(settings.logoObjectKey) : null;
  if (!obj) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(obj.body), {
    headers: { "Content-Type": obj.contentType, "Cache-Control": "public, max-age=86400" },
  });
}
