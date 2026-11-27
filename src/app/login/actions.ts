"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { AUDIT_ACTIONS, writeAudit } from "@/lib/audit";
import { burnPasswordCheck, verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession, readSessionUser } from "@/lib/auth/session";
import { LIMITS, rateLimit, resetRateLimit } from "@/lib/rate-limit";
import { clientIp, userAgent } from "@/lib/request";
import { loginSchema } from "@/lib/validation/settings";

export type LoginState = { error?: string; email?: string };

const GENERIC = "Invalid email or password.";

export async function loginAction(_prev: LoginState, form: FormData): Promise<LoginState> {
  const ip = await clientIp();
  const email = String(form.get("email") ?? "").slice(0, 200);

  const ipLimit = rateLimit(`login:ip:${ip}`, LIMITS.loginPerIp.limit, LIMITS.loginPerIp.windowMs);
  const acctLimit = rateLimit(
    `login:acct:${email.toLowerCase().trim()}`,
    LIMITS.loginPerAccount.limit,
    LIMITS.loginPerAccount.windowMs,
  );
  if (!ipLimit.ok || !acctLimit.ok) {
    const wait = Math.ceil(Math.max(ipLimit.retryAfterSec, acctLimit.retryAfterSec) / 60);
    return { error: `Too many sign-in attempts. Try again in about ${wait} minute(s).`, email };
  }

  const parsed = loginSchema.safeParse({ email, password: form.get("password") });
  if (!parsed.success) return { error: GENERIC, email };

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  const ok = user && user.active ? await verifyPassword(parsed.data.password, user.passwordHash) : await burnPasswordCheck(parsed.data.password);

  if (!user || !ok) {
    if (user) await writeAudit(db, { action: AUDIT_ACTIONS.LOGIN_FAILED, actorId: user.id, ip });
    return { error: GENERIC, email };
  }

  resetRateLimit(`login:acct:${parsed.data.email}`);
  await createSession(user.id, { ip, userAgent: await userAgent() });
  await writeAudit(db, { action: AUDIT_ACTIONS.LOGIN, actorId: user.id, ip });

  const next = String(form.get("next") ?? "");
  redirect(next.startsWith("/admin") || next.startsWith("/print/") ? next : "/admin");
}

export async function logoutAction() {
  const user = await readSessionUser();
  await destroySession();
  if (user) await writeAudit(db, { action: AUDIT_ACTIONS.LOGOUT, actorId: user.id, ip: await clientIp() });
  redirect("/login");
}
