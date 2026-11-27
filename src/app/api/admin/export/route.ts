import { AUDIT_ACTIONS, writeAudit } from "@/lib/audit";
import { AuthError, authorize } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { clientIp } from "@/lib/request";

export const dynamic = "force-dynamic";

/**
 * Full data export (admin only) for records/off-site copies. This complements —
 * it does not replace — regular PostgreSQL backups (see README) and object storage backups.
 */
export async function GET() {
  let actor;
  try {
    actor = await authorize("data:export");
  } catch (err) {
    if (err instanceof AuthError) return new Response(err.message, { status: err.status });
    throw err;
  }
  const [settings, certificates, auditLogs, users] = await Promise.all([
    db.labSettings.findUnique({ where: { id: 1 } }),
    db.certificate.findMany({ orderBy: { createdAt: "asc" } }),
    db.auditLog.findMany({ orderBy: { createdAt: "asc" } }),
    db.user.findMany({ select: { id: true, name: true, email: true, role: true, active: true, createdAt: true } }),
  ]);
  await writeAudit(db, { action: AUDIT_ACTIONS.EXPORT, actorId: actor.id, ip: await clientIp() });
  const body = JSON.stringify(
    { exportedAt: new Date().toISOString(), settings, users, certificates, auditLogs },
    (_k, v) => (typeof v === "object" && v !== null && v.constructor?.name === "Decimal" ? v.toString() : v),
    2,
  );
  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="gemcert-export-${stamp}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
