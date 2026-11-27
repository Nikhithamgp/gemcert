import type { Prisma } from "@/generated/prisma/client";

export const AUDIT_ACTIONS = {
  CREATE_DRAFT: "certificate.create_draft",
  UPDATE_DRAFT: "certificate.update_draft",
  PUBLISH: "certificate.publish",
  VOID: "certificate.void",
  SUPERSEDE: "certificate.supersede",
  DUPLICATE: "certificate.duplicate",
  CREATE_REVISION: "certificate.create_revision",
  PRINT: "certificate.print",
  LOGIN: "auth.login",
  LOGIN_FAILED: "auth.login_failed",
  LOGOUT: "auth.logout",
  SETTINGS_UPDATE: "settings.update",
  USER_CREATE: "user.create",
  USER_UPDATE: "user.update",
  PASSWORD_CHANGE: "user.password_change",
  EXPORT: "data.export",
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

type AuditClient = { auditLog: { create(args: { data: Prisma.AuditLogUncheckedCreateInput }): Promise<unknown> } };

export async function writeAudit(
  client: AuditClient,
  entry: {
    action: AuditAction;
    actorId?: string | null;
    certificateId?: string | null;
    before?: Prisma.InputJsonValue | null;
    after?: Prisma.InputJsonValue | null;
    reason?: string | null;
    ip?: string | null;
  },
) {
  await client.auditLog.create({
    data: {
      action: entry.action,
      actorId: entry.actorId ?? null,
      certificateId: entry.certificateId ?? null,
      before: entry.before ?? undefined,
      after: entry.after ?? undefined,
      reason: entry.reason ?? null,
      ip: entry.ip ?? null,
    },
  });
}

/** Returns only the keys whose values differ, for compact before/after audit entries. */
export function diff(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): { before: Record<string, unknown>; after: Record<string, unknown> } | null {
  const b: Record<string, unknown> = {};
  const a: Record<string, unknown> = {};
  for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (JSON.stringify(before[key] ?? null) !== JSON.stringify(after[key] ?? null)) {
      b[key] = before[key] ?? null;
      a[key] = after[key] ?? null;
    }
  }
  return Object.keys(a).length ? { before: b, after: a } : null;
}
