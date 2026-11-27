"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AuthError, authorize } from "@/lib/auth/dal";
import {
  ServiceError,
  createDraft,
  createRevision,
  duplicateCertificate,
  publishCertificate,
  updateDraft,
  voidCertificate,
} from "@/lib/certificates/service";
import { clientIp } from "@/lib/request";
import { draftFromFormData, type FieldErrors } from "@/lib/validation/certificate";

export type FormState = { error?: string; fieldErrors?: FieldErrors; values?: Record<string, string>; ok?: boolean };

function toState(err: unknown, values?: Record<string, string>): FormState {
  if (err instanceof ServiceError || err instanceof AuthError) {
    return { error: err.message, fieldErrors: err instanceof ServiceError ? err.fieldErrors : undefined, values };
  }
  console.error(err);
  return { error: "Something went wrong. Please try again.", values };
}

async function imageFrom(form: FormData): Promise<Buffer | null> {
  const file = form.get("image");
  if (!file || typeof file === "string" || file.size === 0) return null;
  return Buffer.from(await file.arrayBuffer());
}

export async function saveDraftAction(_prev: FormState, form: FormData): Promise<FormState> {
  const values = draftFromFormData(form);
  const id = String(form.get("id") ?? "");
  let targetId: string;
  try {
    const actor = await authorize(id ? "certificate:editDraft" : "certificate:create");
    const image = await imageFrom(form);
    const ctx = { ip: await clientIp() };
    const cert = id
      ? await updateDraft(actor, id, values, image, { removeImage: form.get("removeImage") === "on" }, ctx)
      : await createDraft(actor, values, image, ctx);
    targetId = cert.id;
  } catch (err) {
    return toState(err, values);
  }
  revalidatePath("/admin", "layout");
  redirect(`/admin/certificates/${targetId}?saved=1`);
}

export async function publishAction(id: string, _prev: FormState): Promise<FormState> {
  try {
    const actor = await authorize("certificate:publish");
    await publishCertificate(actor, id, { ip: await clientIp() });
  } catch (err) {
    return toState(err);
  }
  revalidatePath("/admin", "layout");
  redirect(`/admin/certificates/${id}?published=1`);
}

export async function voidAction(id: string, _prev: FormState, form: FormData): Promise<FormState> {
  try {
    const actor = await authorize("certificate:void");
    await voidCertificate(actor, id, { reason: String(form.get("reason") ?? "") }, { ip: await clientIp() });
  } catch (err) {
    return toState(err);
  }
  revalidatePath("/admin", "layout");
  redirect(`/admin/certificates/${id}?voided=1`);
}

export async function duplicateAction(id: string, _prev: FormState): Promise<FormState> {
  let newId: string;
  try {
    const actor = await authorize("certificate:duplicate");
    newId = (await duplicateCertificate(actor, id, { ip: await clientIp() })).id;
  } catch (err) {
    return toState(err);
  }
  revalidatePath("/admin", "layout");
  redirect(`/admin/certificates/${newId}/edit?from=duplicate`);
}

export async function reviseAction(id: string, _prev: FormState): Promise<FormState> {
  let newId: string;
  try {
    const actor = await authorize("certificate:revise");
    newId = (await createRevision(actor, id, { ip: await clientIp() })).id;
  } catch (err) {
    return toState(err);
  }
  revalidatePath("/admin", "layout");
  redirect(`/admin/certificates/${newId}/edit?from=revision`);
}
