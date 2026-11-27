"use server";

import { authorize } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { recordPrint } from "@/lib/certificates/service";
import { clientIp } from "@/lib/request";

export async function recordPrintAction(id: string, format: "CARD" | "A4") {
  const actor = await authorize("certificate:print");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return;
  const cert = await db.certificate.findUnique({ where: { id }, select: { status: true } });
  // Proof prints of drafts are not audited; issued certificates are (reprint tracking).
  if (!cert || cert.status === "DRAFT") return;
  await recordPrint(actor, id, format === "A4" ? "A4" : "CARD", { ip: await clientIp() });
}
