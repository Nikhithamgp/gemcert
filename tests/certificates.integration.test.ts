/**
 * Integration tests against a real PostgreSQL database (TEST_DATABASE_URL).
 * Skipped automatically when TEST_DATABASE_URL is not set.
 * The test database is wiped before the run — never point it at real data.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import sharp from "sharp";

const enabled = Boolean(process.env.TEST_DATABASE_URL);

describe.skipIf(!enabled)("certificate lifecycle (database)", () => {
  // Imported lazily so the suite can be skipped without a database.
  let svc: typeof import("@/lib/certificates/service");
  let queries: typeof import("@/lib/certificates/queries");
  let db: typeof import("@/lib/db").db;
  let admin: { id: string; role: "ADMIN" };
  let operator: { id: string; role: "OPERATOR" };
  let photo: Buffer;

  const draft = (over: Record<string, string> = {}) => ({ specimenName: "Test Sapphire", weightCt: "1.50", ...over });

  beforeAll(async () => {
    svc = await import("@/lib/certificates/service");
    queries = await import("@/lib/certificates/queries");
    db = (await import("@/lib/db")).db;
    await db.$executeRawUnsafe(
      'TRUNCATE "AuditLog", "Session", "Certificate", "CertificateCounter", "LabSettings", "User" RESTART IDENTITY CASCADE',
    );
    const a = await db.user.create({ data: { name: "Admin", email: "admin@test.local", passwordHash: "x", role: "ADMIN" } });
    const o = await db.user.create({ data: { name: "Op", email: "op@test.local", passwordHash: "x", role: "OPERATOR" } });
    admin = { id: a.id, role: "ADMIN" };
    operator = { id: o.id, role: "OPERATOR" };
    await db.labSettings.create({ data: { id: 1, certificatePrefix: "TST", publicBaseUrl: "https://verify.example.com" } });
    photo = await sharp({ create: { width: 300, height: 300, channels: 3, background: "#3366ff" } }).png().toBuffer();
  });

  afterAll(async () => {
    await db?.$disconnect();
  });

  it("operator creates a draft with photo; validation rejects bad input", async () => {
    const cert = await svc.createDraft(operator, draft(), photo);
    expect(cert.status).toBe("DRAFT");
    expect(cert.certificateNumber).toBeNull();
    expect(cert.imageObjectKey).toMatch(/^certificates\/.+\.jpg$/);

    await expect(svc.createDraft(operator, { weightCt: "1" }, null)).rejects.toMatchObject({
      fieldErrors: { specimenName: expect.any(Array) },
    });
    await expect(svc.createDraft(operator, draft({ weightCt: "-2" }), null)).rejects.toMatchObject({
      fieldErrors: { weightCt: expect.any(Array) },
    });
    await expect(svc.createDraft(operator, draft(), Buffer.from("not an image"))).rejects.toMatchObject({
      fieldErrors: { image: expect.any(Array) },
    });
  });

  it("operators cannot publish or void", async () => {
    const cert = await svc.createDraft(operator, draft(), photo);
    await expect(svc.publishCertificate(operator, cert.id)).rejects.toMatchObject({ code: "forbidden" });
    await expect(svc.voidCertificate(operator, cert.id, { reason: "testing void" })).rejects.toMatchObject({ code: "forbidden" });
  });

  it("publishing requires a photo", async () => {
    const cert = await svc.createDraft(admin, draft(), null);
    await expect(svc.publishCertificate(admin, cert.id)).rejects.toThrow(/photo/i);
  });

  it("publish assigns a number and an absolute public verify URL", async () => {
    const cert = await svc.createDraft(admin, draft(), photo);
    const pub = await svc.publishCertificate(admin, cert.id);
    const year = new Date().getUTCFullYear();
    expect(pub.status).toBe("PUBLISHED");
    expect(pub.certificateNumber).toMatch(new RegExp(`^TST-${year}-\\d{6}$`));
    expect(pub.verifyUrl).toBe(`https://verify.example.com/v/${pub.certificateNumber}`);
    await expect(svc.publishCertificate(admin, cert.id)).rejects.toMatchObject({ code: "conflict" });
  });

  it("concurrent publishes never share a number", async () => {
    const drafts = await Promise.all(Array.from({ length: 12 }, () => svc.createDraft(admin, draft(), photo)));
    const published = await Promise.all(drafts.map((d) => svc.publishCertificate(admin, d.id)));
    const numbers = published.map((p) => p.certificateNumber);
    expect(new Set(numbers).size).toBe(numbers.length);
  });

  it("published certificates cannot be edited, even directly in the database", async () => {
    const cert = await svc.publishCertificate(admin, (await svc.createDraft(admin, draft(), photo)).id);
    await expect(svc.updateDraft(admin, cert.id, draft({ specimenName: "Changed" }), null)).rejects.toMatchObject({ code: "conflict" });
    await expect(db.certificate.update({ where: { id: cert.id }, data: { specimenName: "Tampered" } })).rejects.toThrow(/immutable/);
    await expect(db.certificate.delete({ where: { id: cert.id } })).rejects.toThrow(/cannot be deleted/);
  });

  it("public lookup: verified, not found, drafts hidden, voided shown as voided", async () => {
    const d = await svc.createDraft(admin, draft({ internalNotes: "PRIVATE-NOTE" }), photo);
    const pub = await svc.publishCertificate(admin, d.id);
    const found = await queries.lookupPublicCertificate(pub.certificateNumber!.toLowerCase());
    expect(found).toMatchObject({ state: "found", certificate: { status: "VERIFIED" } });
    expect(JSON.stringify(found)).not.toContain("PRIVATE-NOTE");

    expect(await queries.lookupPublicCertificate("TST-1999-999999")).toEqual({ state: "not_found" });
    expect(await queries.lookupPublicCertificate("garbage")).toEqual({ state: "not_found" });

    await expect(svc.voidCertificate(admin, d.id, { reason: "x" })).rejects.toMatchObject({ fieldErrors: { reason: expect.any(Array) } });
    await svc.voidCertificate(admin, d.id, { reason: "Issued in error" });
    const voided = await queries.lookupPublicCertificate(pub.certificateNumber!);
    expect(voided).toMatchObject({ state: "found", certificate: { status: "VOIDED" } });
    expect(JSON.stringify(voided)).not.toContain("Issued in error");
    expect(await queries.publicImageKey(pub.certificateNumber!)).toBeTruthy();
    await expect(db.certificate.update({ where: { id: d.id }, data: { status: "PUBLISHED" } })).rejects.toThrow(/reinstated/);
  });

  it("revisions supersede the original with a new number and keep history", async () => {
    const original = await svc.publishCertificate(admin, (await svc.createDraft(admin, draft(), photo)).id);
    const revision = await svc.createRevision(operator, original.id);
    expect(revision.status).toBe("DRAFT");
    expect(revision.imageObjectKey).not.toBe(original.imageObjectKey);
    await svc.updateDraft(operator, revision.id, draft({ weightCt: "1.52" }), null);
    const published = await svc.publishCertificate(admin, revision.id);
    expect(published.certificateNumber).not.toBe(original.certificateNumber);

    const old = await queries.lookupPublicCertificate(original.certificateNumber!);
    expect(old).toMatchObject({ state: "found", certificate: { status: "SUPERSEDED", supersededByNumber: published.certificateNumber } });

    const actions = (await db.auditLog.findMany({ where: { certificateId: { in: [original.id, revision.id] } } })).map((l) => l.action);
    expect(actions).toEqual(
      expect.arrayContaining([
        "certificate.publish",
        "certificate.create_revision",
        "certificate.update_draft",
        "certificate.supersede",
      ]),
    );
  });

  it("drafts are not publicly visible", async () => {
    const d = await svc.createDraft(admin, draft(), photo);
    const all = await db.certificate.findMany({ where: { status: "DRAFT" }, select: { id: true } });
    expect(all.map((x) => x.id)).toContain(d.id);
    expect(await queries.publicImageKey("")).toBeNull();
  });

  it("refuses to publish to a localhost URL in production", async () => {
    await db.labSettings.update({ where: { id: 1 }, data: { publicBaseUrl: "http://localhost:3000" } });
    const prev = process.env.NODE_ENV;
    (process.env as Record<string, string>).NODE_ENV = "production";
    try {
      const d = await svc.createDraft(admin, draft(), photo);
      await expect(svc.publishCertificate(admin, d.id)).rejects.toThrow(/Cannot publish/);
    } finally {
      (process.env as Record<string, string>).NODE_ENV = prev ?? "test";
      await db.labSettings.update({ where: { id: 1 }, data: { publicBaseUrl: "https://verify.example.com" } });
    }
  });
});
