"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { AUDIT_ACTIONS, writeAudit } from "@/lib/audit";
import { AuthError, authorize, getCurrentUser } from "@/lib/auth/dal";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { destroyAllSessionsFor, createSession } from "@/lib/auth/session";
import { clientIp, userAgent } from "@/lib/request";
import { fieldErrors, type FieldErrors } from "@/lib/validation/certificate";
import { passwordChangeSchema, userCreateSchema } from "@/lib/validation/settings";

export type UserFormState = { error?: string; fieldErrors?: FieldErrors; ok?: string };

export async function createUserAction(_prev: UserFormState, form: FormData): Promise<UserFormState> {
  let actor;
  try {
    actor = await authorize("users:manage");
  } catch (err) {
    if (err instanceof AuthError) return { error: err.message };
    throw err;
  }
  const parsed = userCreateSchema.safeParse({
    name: form.get("name"),
    email: form.get("email"),
    role: form.get("role"),
    password: form.get("password"),
  });
  if (!parsed.success) return { error: "Please correct the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  if (await db.user.findUnique({ where: { email: parsed.data.email } })) {
    return { error: "A user with that email already exists.", fieldErrors: { email: ["Already in use"] } };
  }
  const user = await db.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role,
      passwordHash: await hashPassword(parsed.data.password),
    },
  });
  await writeAudit(db, {
    action: AUDIT_ACTIONS.USER_CREATE,
    actorId: actor.id,
    after: { userId: user.id, email: user.email, role: user.role },
    ip: await clientIp(),
  });
  revalidatePath("/admin/users");
  return { ok: `Created ${user.email}. Share the temporary password securely and ask them to change it.` };
}

export async function updateUserAction(userId: string, _prev: UserFormState, form: FormData): Promise<UserFormState> {
  let actor;
  try {
    actor = await authorize("users:manage");
  } catch (err) {
    if (err instanceof AuthError) return { error: err.message };
    throw err;
  }
  const role = form.get("role") === "ADMIN" ? "ADMIN" : "OPERATOR";
  const active = form.get("active") === "on";
  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target) return { error: "User not found." };
  if (target.id === actor.id && (!active || role !== "ADMIN")) {
    return { error: "You cannot deactivate or demote your own account." };
  }
  if (target.role === "ADMIN" && (role !== "ADMIN" || !active)) {
    const otherAdmins = await db.user.count({ where: { role: "ADMIN", active: true, id: { not: target.id } } });
    if (otherAdmins === 0) return { error: "At least one active administrator is required." };
  }
  await db.user.update({ where: { id: userId }, data: { role, active } });
  if (!active) await destroyAllSessionsFor(userId);
  await writeAudit(db, {
    action: AUDIT_ACTIONS.USER_UPDATE,
    actorId: actor.id,
    before: { userId, role: target.role, active: target.active },
    after: { userId, role, active },
    ip: await clientIp(),
  });
  revalidatePath("/admin/users");
  return { ok: "Saved." };
}

export async function changePasswordAction(_prev: UserFormState, form: FormData): Promise<UserFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "You are not signed in." };
  const parsed = passwordChangeSchema.safeParse({
    currentPassword: form.get("currentPassword"),
    newPassword: form.get("newPassword"),
    confirmPassword: form.get("confirmPassword"),
  });
  if (!parsed.success) return { error: "Please correct the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  const record = await db.user.findUniqueOrThrow({ where: { id: user.id } });
  if (!(await verifyPassword(parsed.data.currentPassword, record.passwordHash))) {
    return { fieldErrors: { currentPassword: ["Current password is incorrect"] }, error: "Password not changed." };
  }
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(parsed.data.newPassword) } });
  // Sign out other devices, keep this one signed in.
  await destroyAllSessionsFor(user.id);
  const ip = await clientIp();
  await createSession(user.id, { ip, userAgent: await userAgent() });
  await writeAudit(db, { action: AUDIT_ACTIONS.PASSWORD_CHANGE, actorId: user.id, ip });
  return { ok: "Password changed. Other devices have been signed out." };
}
