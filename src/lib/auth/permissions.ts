import type { Role } from "@/generated/prisma/enums";

/**
 * Central permission table. Operators prepare drafts; publishing, voiding and
 * administration are admin-only.
 */
export const PERMISSIONS = {
  "certificate:view": ["ADMIN", "OPERATOR"],
  "certificate:create": ["ADMIN", "OPERATOR"],
  "certificate:editDraft": ["ADMIN", "OPERATOR"],
  "certificate:print": ["ADMIN", "OPERATOR"],
  "certificate:duplicate": ["ADMIN", "OPERATOR"],
  "certificate:revise": ["ADMIN", "OPERATOR"],
  "certificate:publish": ["ADMIN"],
  "certificate:void": ["ADMIN"],
  "settings:manage": ["ADMIN"],
  "users:manage": ["ADMIN"],
  "data:export": ["ADMIN"],
  "audit:view": ["ADMIN", "OPERATOR"],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: Role | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return (PERMISSIONS[permission] as readonly Role[]).includes(role);
}
