/**
 * Creates the initial administrator from ADMIN_EMAIL / ADMIN_NAME / ADMIN_PASSWORD.
 *
 *   npm run admin:bootstrap
 *
 * - Refuses weak passwords (< 12 chars). There is no default password.
 * - If the user already exists, nothing changes unless --reset-password is given
 *   (useful to recover a lost admin password from the server console).
 */
import bcrypt from "bcryptjs";
import { scriptClient } from "./db";

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const name = process.env.ADMIN_NAME?.trim() || "Administrator";
  const password = process.env.ADMIN_PASSWORD ?? "";
  const reset = process.argv.includes("--reset-password");

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("Set ADMIN_EMAIL to a valid email address.");
  if (password.length < 12) throw new Error("Set ADMIN_PASSWORD to at least 12 characters (no default password exists).");

  const db = scriptClient();
  try {
    const existing = await db.user.findUnique({ where: { email } });
    if (existing && !reset) {
      console.log(`User ${email} already exists — nothing changed. Use --reset-password to set a new password.`);
      return;
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await db.user.upsert({
      where: { email },
      update: { passwordHash, role: "ADMIN", active: true },
      create: { email, name, passwordHash, role: "ADMIN" },
    });
    await db.session.deleteMany({ where: { userId: user.id } });
    await db.auditLog.create({
      data: { action: existing ? "user.password_reset_cli" : "user.bootstrap_admin", actorId: null, after: { email } },
    });
    await db.labSettings.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, certificatePrefix: (process.env.CERTIFICATE_PREFIX || "GEM").toUpperCase() },
    });
    console.log(`${existing ? "Reset password for" : "Created admin"} ${email}.`);
    console.log("Now remove ADMIN_PASSWORD from your .env / hosting environment.");
  } finally {
    await db.$disconnect();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
