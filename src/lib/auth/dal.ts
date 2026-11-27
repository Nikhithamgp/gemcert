import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { readSessionUser } from "./session";
import { can, type Permission } from "./permissions";

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof readSessionUser>>>;

/** Current user (memoised per request), or null. */
export const getCurrentUser = cache(async () => readSessionUser());

/** For pages: redirects to /login when signed out. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** For pages: requires a permission, sending the user to a "no access" page otherwise. */
export async function requirePermission(permission: Permission): Promise<CurrentUser> {
  const user = await requireUser();
  if (!can(user.role, permission)) redirect("/admin/forbidden");
  return user;
}

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly status: 401 | 403,
  ) {
    super(message);
  }
}

/** For server actions / route handlers: throws AuthError instead of redirecting. */
export async function authorize(permission: Permission): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("You are not signed in.", 401);
  if (!can(user.role, permission)) throw new AuthError("You do not have permission to do that.", 403);
  return user;
}
