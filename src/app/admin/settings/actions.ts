"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { AUDIT_ACTIONS, diff, writeAudit } from "@/lib/audit";
import { AuthError, authorize } from "@/lib/auth/dal";
import { getLabSettings } from "@/lib/settings";
import { storage } from "@/lib/storage";
import { ImageValidationError, processImage } from "@/lib/storage/image";
import { labSettingsSchema } from "@/lib/validation/settings";
import { clientIp } from "@/lib/request";
import { fieldErrors, type FieldErrors } from "@/lib/validation/certificate";

export type SettingsState = { error?: string; fieldErrors?: FieldErrors; ok?: boolean };

const KEYS = Object.keys(labSettingsSchema.shape) as (keyof typeof labSettingsSchema.shape)[];

export async function saveSettingsAction(_prev: SettingsState, form: FormData): Promise<SettingsState> {
  let actor;
  try {
    actor = await authorize("settings:manage");
  } catch (err) {
    if (err instanceof AuthError) return { error: err.message };
    throw err;
  }
  const raw = Object.fromEntries(KEYS.map((k) => [k, String(form.get(k) ?? "")]));
  const parsed = labSettingsSchema.safeParse(raw);
  if (!parsed.success) return { error: "Please correct the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };

  const current = await getLabSettings();
  let logoObjectKey = current.logoObjectKey;
  const file = form.get("logo");
  if (file && typeof file !== "string" && file.size > 0) {
    try {
      const img = await processImage(Buffer.from(await file.arrayBuffer()), "logo", env().MAX_UPLOAD_MB * 1024 * 1024);
      await storage().put(img.key, img.body, img.contentType);
      logoObjectKey = img.key;
    } catch (err) {
      if (err instanceof ImageValidationError) return { error: err.message, fieldErrors: { logo: [err.message] } };
      throw err;
    }
  } else if (form.get("removeLogo") === "on") {
    logoObjectKey = null;
  }

  const updated = await db.labSettings.update({ where: { id: 1 }, data: { ...parsed.data, logoObjectKey } });
  const before = { ...current, cardWidthMm: current.cardWidthMm.toString(), cardHeightMm: current.cardHeightMm.toString(), updatedAt: null };
  const after = { ...updated, cardWidthMm: updated.cardWidthMm.toString(), cardHeightMm: updated.cardHeightMm.toString(), updatedAt: null };
  const changes = diff(before, after);
  if (changes) {
    await writeAudit(db, {
      action: AUDIT_ACTIONS.SETTINGS_UPDATE,
      actorId: actor.id,
      before: changes.before as never,
      after: changes.after as never,
      ip: await clientIp(),
    });
  }
  // Old logos are only removed after the new one is saved. Certificates reference the
  // current logo at render time, so the previous object is no longer needed.
  if (current.logoObjectKey && current.logoObjectKey !== logoObjectKey) {
    await storage().delete(current.logoObjectKey).catch(() => undefined);
  }
  revalidatePath("/", "layout");
  return { ok: true };
}
