import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { env, isProduction } from "@/lib/env";

const cookieName = () => (isProduction() ? "__Host-gc_session" : "gc_session");

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

/** Creates a DB-backed session and sets the HTTP-only cookie. Call from a server action. */
export async function createSession(userId: string, meta: { ip?: string; userAgent?: string | null }) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + env().SESSION_TTL_HOURS * 3600_000);
  await db.session.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt,
      ip: meta.ip?.slice(0, 100),
      userAgent: meta.userAgent?.slice(0, 300) ?? null,
    },
  });
  (await cookies()).set(cookieName(), token, {
    httpOnly: true,
    secure: isProduction(),
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/** Returns the active user for the current request, or null. */
export async function readSessionUser() {
  const token = (await cookies()).get(cookieName())?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { select: { id: true, name: true, email: true, role: true, active: true } } },
  });
  if (!session || session.expiresAt <= new Date() || !session.user.active) return null;
  return session.user;
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(cookieName())?.value;
  if (token) await db.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  store.delete(cookieName());
}

/** Signs a user out everywhere (used when deactivating or resetting a password). */
export async function destroyAllSessionsFor(userId: string) {
  await db.session.deleteMany({ where: { userId } });
}

export const SESSION_COOKIE_NAMES = ["__Host-gc_session", "gc_session"];
