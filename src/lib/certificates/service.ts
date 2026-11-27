import "server-only";
import { db } from "@/lib/db";
import { env, isProduction } from "@/lib/env";
import { AUDIT_ACTIONS, diff, writeAudit } from "@/lib/audit";
import { can, type Permission } from "@/lib/auth/permissions";
import type { Role } from "@/generated/prisma/enums";
import { getLabSettings, effectiveBaseUrl } from "@/lib/settings";
import { storage } from "@/lib/storage";
import { ImageValidationError, processImage } from "@/lib/storage/image";
import { buildVerifyUrl, checkPublicBaseUrl } from "@/lib/verify-url";
import { certificateDraftSchema, fieldErrors, voidSchema, type FieldErrors } from "@/lib/validation/certificate";
import { allocateCertificateNumber } from "./number";
import { certificateSnapshot } from "./serialize";
import { randomUUID } from "node:crypto";

export type Actor = { id: string; role: Role };
export type Ctx = { ip?: string | null };

export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly fieldErrors?: FieldErrors,
    public readonly code: "invalid" | "forbidden" | "not_found" | "conflict" = "invalid",
  ) {
    super(message);
  }
}

function assertCan(actor: Actor, permission: Permission) {
  if (!can(actor.role, permission)) {
    throw new ServiceError("You do not have permission to do that.", undefined, "forbidden");
  }
}

function parseDraft(input: unknown) {
  const parsed = certificateDraftSchema.safeParse(input);
  if (!parsed.success) {
    throw new ServiceError("Please correct the highlighted fields.", fieldErrors(parsed.error));
  }
  return parsed.data;
}

async function storePhoto(image: Buffer | null) {
  if (!image) return null;
  try {
    const processed = await processImage(image, "photo", env().MAX_UPLOAD_MB * 1024 * 1024);
    await storage().put(processed.key, processed.body, processed.contentType);
    return processed.key;
  } catch (err) {
    if (err instanceof ImageValidationError) {
      throw new ServiceError(err.message, { image: [err.message] });
    }
    throw err;
  }
}

async function deleteObjectQuietly(key: string | null | undefined) {
  if (!key) return;
  try {
    await storage().delete(key);
  } catch (err) {
    console.error("Failed to delete stored object", key, err);
  }
}

/** Copies a stored photo to a new key so every certificate owns its own object. */
async function copyPhoto(key: string | null): Promise<string | null> {
  if (!key) return null;
  const obj = await storage().get(key);
  if (!obj) return null;
  const newKey = `certificates/${randomUUID()}.jpg`;
  await storage().put(newKey, obj.body, obj.contentType);
  return newKey;
}

/** Locks the certificate row for the rest of the transaction (serialises publish/edit/void). */
type LockClient = { $queryRaw<T = unknown>(query: TemplateStringsArray, ...values: unknown[]): Promise<T> };
async function lockCertificate(tx: LockClient, id: string) {
  await tx.$queryRaw`SELECT id FROM "Certificate" WHERE id = ${id}::uuid FOR UPDATE`;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function assertId(id: string) {
  if (!UUID.test(id)) throw new ServiceError("Certificate not found.", undefined, "not_found");
}

// ---------------------------------------------------------------------------

export async function createDraft(actor: Actor, input: unknown, image: Buffer | null, ctx: Ctx = {}) {
  assertCan(actor, "certificate:create");
  const data = parseDraft(input);
  const imageObjectKey = await storePhoto(image);
  try {
    return await db.$transaction(async (tx) => {
      const cert = await tx.certificate.create({
        data: { ...data, imageObjectKey, createdById: actor.id },
      });
      await writeAudit(tx, {
        action: AUDIT_ACTIONS.CREATE_DRAFT,
        actorId: actor.id,
        certificateId: cert.id,
        after: certificateSnapshot(cert),
        ip: ctx.ip,
      });
      return cert;
    });
  } catch (err) {
    await deleteObjectQuietly(imageObjectKey);
    throw err;
  }
}

export async function updateDraft(
  actor: Actor,
  id: string,
  input: unknown,
  image: Buffer | null,
  opts: { removeImage?: boolean } = {},
  ctx: Ctx = {},
) {
  assertCan(actor, "certificate:editDraft");
  assertId(id);
  const data = parseDraft(input);
  const newKey = await storePhoto(image);
  let oldKeyToDelete: string | null = null;
  try {
    const updated = await db.$transaction(async (tx) => {
      await lockCertificate(tx, id);
      const current = await tx.certificate.findUnique({ where: { id } });
      if (!current) throw new ServiceError("Certificate not found.", undefined, "not_found");
      if (current.status !== "DRAFT") {
        throw new ServiceError(
          "Published certificates cannot be edited. Create a revision instead.",
          undefined,
          "conflict",
        );
      }
      let imageObjectKey = current.imageObjectKey;
      if (newKey) imageObjectKey = newKey;
      else if (opts.removeImage) imageObjectKey = null;
      if (imageObjectKey !== current.imageObjectKey) oldKeyToDelete = current.imageObjectKey;

      const cert = await tx.certificate.update({ where: { id }, data: { ...data, imageObjectKey } });
      const changes = diff(certificateSnapshot(current), certificateSnapshot(cert));
      if (changes) {
        await writeAudit(tx, {
          action: AUDIT_ACTIONS.UPDATE_DRAFT,
          actorId: actor.id,
          certificateId: id,
          before: changes.before as never,
          after: changes.after as never,
          ip: ctx.ip,
        });
      }
      return cert;
    });
    await deleteObjectQuietly(oldKeyToDelete);
    return updated;
  } catch (err) {
    await deleteObjectQuietly(newKey);
    throw err;
  }
}

export async function publishCertificate(actor: Actor, id: string, ctx: Ctx = {}) {
  assertCan(actor, "certificate:publish");
  assertId(id);
  const settings = await getLabSettings();
  const base = checkPublicBaseUrl(effectiveBaseUrl(settings), isProduction());
  if (base.errors.length || !base.url) {
    throw new ServiceError(`Cannot publish: ${base.errors.join(" ")}`, undefined, "conflict");
  }

  return db.$transaction(async (tx) => {
    await lockCertificate(tx, id);
    const cert = await tx.certificate.findUnique({ where: { id } });
    if (!cert) throw new ServiceError("Certificate not found.", undefined, "not_found");
    if (cert.status !== "DRAFT") throw new ServiceError("Only drafts can be published.", undefined, "conflict");
    // Re-validate stored data in case rules tightened since the draft was saved.
    parseDraft(Object.fromEntries(Object.entries(certificateSnapshot(cert)).map(([k, v]) => [k, v ?? ""])));
    if (!cert.imageObjectKey) {
      throw new ServiceError("Add a gemstone photograph before publishing.", { image: ["A photo is required to publish"] }, "conflict");
    }

    const issuedAt = new Date();
    const certificateNumber = await allocateCertificateNumber(tx, settings.certificatePrefix, issuedAt.getUTCFullYear());
    const verifyUrl = buildVerifyUrl(base.url!, certificateNumber);
    const published = await tx.certificate.update({
      where: { id },
      data: { status: "PUBLISHED", certificateNumber, issuedAt, verifyUrl },
    });
    await writeAudit(tx, {
      action: AUDIT_ACTIONS.PUBLISH,
      actorId: actor.id,
      certificateId: id,
      after: { certificateNumber, verifyUrl, issuedAt: issuedAt.toISOString() },
      ip: ctx.ip,
    });

    if (cert.revisionOfId) {
      await lockCertificate(tx, cert.revisionOfId);
      const original = await tx.certificate.findUnique({ where: { id: cert.revisionOfId } });
      if (original && original.status === "PUBLISHED") {
        await tx.certificate.update({
          where: { id: original.id },
          data: { status: "SUPERSEDED", supersededById: id },
        });
        await writeAudit(tx, {
          action: AUDIT_ACTIONS.SUPERSEDE,
          actorId: actor.id,
          certificateId: original.id,
          before: { status: "PUBLISHED" },
          after: { status: "SUPERSEDED", supersededByNumber: certificateNumber },
          reason: `Replaced by revision ${certificateNumber}`,
          ip: ctx.ip,
        });
      }
    }
    return published;
  });
}

export async function voidCertificate(actor: Actor, id: string, input: unknown, ctx: Ctx = {}) {
  assertCan(actor, "certificate:void");
  assertId(id);
  const parsed = voidSchema.safeParse(input);
  if (!parsed.success) throw new ServiceError("Please give a reason.", fieldErrors(parsed.error));
  return db.$transaction(async (tx) => {
    await lockCertificate(tx, id);
    const cert = await tx.certificate.findUnique({ where: { id } });
    if (!cert) throw new ServiceError("Certificate not found.", undefined, "not_found");
    if (cert.status !== "PUBLISHED" && cert.status !== "SUPERSEDED") {
      throw new ServiceError("Only issued certificates can be voided.", undefined, "conflict");
    }
    const voided = await tx.certificate.update({
      where: { id },
      data: { status: "VOIDED", voidedAt: new Date(), voidReason: parsed.data.reason },
    });
    await writeAudit(tx, {
      action: AUDIT_ACTIONS.VOID,
      actorId: actor.id,
      certificateId: id,
      before: { status: cert.status },
      after: { status: "VOIDED" },
      reason: parsed.data.reason,
      ip: ctx.ip,
    });
    return voided;
  });
}

async function copyAsDraft(actor: Actor, id: string, mode: "duplicate" | "revision", ctx: Ctx) {
  assertCan(actor, mode === "duplicate" ? "certificate:duplicate" : "certificate:revise");
  assertId(id);
  const source = await db.certificate.findUnique({ where: { id } });
  if (!source) throw new ServiceError("Certificate not found.", undefined, "not_found");
  if (mode === "revision" && source.status !== "PUBLISHED") {
    throw new ServiceError("Only published certificates can be revised.", undefined, "conflict");
  }
  const snap = certificateSnapshot(source);
  const imageObjectKey = await copyPhoto(source.imageObjectKey);
  try {
    return await db.$transaction(async (tx) => {
      const draft = await tx.certificate.create({
        data: {
          specimenName: source.specimenName,
          weightCt: source.weightCt,
          colour: source.colour,
          shapeCut: source.shapeCut,
          hardness: source.hardness,
          specificGravity: source.specificGravity,
          refractiveIndex: source.refractiveIndex,
          lengthMm: source.lengthMm,
          widthMm: source.widthMm,
          depthMm: source.depthMm,
          origin: source.origin,
          treatment: source.treatment,
          comments: source.comments,
          internalNotes: source.internalNotes,
          printFormat: source.printFormat,
          cardColor: source.cardColor,
          isDemo: source.isDemo,
          imageObjectKey,
          createdById: actor.id,
          revisionOfId: mode === "revision" ? source.id : null,
        },
      });
      await writeAudit(tx, {
        action: mode === "duplicate" ? AUDIT_ACTIONS.DUPLICATE : AUDIT_ACTIONS.CREATE_REVISION,
        actorId: actor.id,
        certificateId: draft.id,
        after: { ...snap, imageObjectKey, sourceCertificateNumber: source.certificateNumber },
        ip: ctx.ip,
      });
      return draft;
    });
  } catch (err) {
    await deleteObjectQuietly(imageObjectKey);
    throw err;
  }
}

export const duplicateCertificate = (actor: Actor, id: string, ctx: Ctx = {}) =>
  copyAsDraft(actor, id, "duplicate", ctx);

/** Corrections to issued certificates: a new draft that supersedes the original once published. */
export const createRevision = (actor: Actor, id: string, ctx: Ctx = {}) => copyAsDraft(actor, id, "revision", ctx);

export async function recordPrint(actor: Actor, id: string, format: "CARD" | "A4", ctx: Ctx = {}) {
  assertCan(actor, "certificate:print");
  await writeAudit(db, {
    action: AUDIT_ACTIONS.PRINT,
    actorId: actor.id,
    certificateId: id,
    after: { format },
    ip: ctx.ip,
  });
}
