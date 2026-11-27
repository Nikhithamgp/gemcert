-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'OPERATOR');

-- CreateEnum
CREATE TYPE "CertificateStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'VOIDED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "PrintFormat" AS ENUM ('CARD', 'A4');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'OPERATOR',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "labName" TEXT NOT NULL DEFAULT 'Your Gemmological Laboratory',
    "tagline" TEXT,
    "logoObjectKey" TEXT,
    "addressLine" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "publicBaseUrl" TEXT,
    "certificatePrefix" TEXT NOT NULL DEFAULT 'GEM',
    "primaryColor" TEXT NOT NULL DEFAULT '#1e3a5f',
    "accentColor" TEXT NOT NULL DEFAULT '#b08d57',
    "signatoryName" TEXT,
    "signatoryTitle" TEXT,
    "cardFooterText" TEXT,
    "disclaimerText" TEXT,
    "cardWidthMm" DECIMAL(6,2) NOT NULL DEFAULT 85.6,
    "cardHeightMm" DECIMAL(6,2) NOT NULL DEFAULT 54,
    "defaultPrintFormat" "PrintFormat" NOT NULL DEFAULT 'CARD',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CertificateCounter" (
    "key" TEXT NOT NULL,
    "lastValue" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CertificateCounter_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "Certificate" (
    "id" UUID NOT NULL,
    "certificateNumber" TEXT,
    "status" "CertificateStatus" NOT NULL DEFAULT 'DRAFT',
    "specimenName" TEXT NOT NULL,
    "weightCt" DECIMAL(10,3) NOT NULL,
    "colour" TEXT,
    "shapeCut" TEXT,
    "hardness" TEXT,
    "specificGravity" TEXT,
    "refractiveIndex" TEXT,
    "lengthMm" DECIMAL(8,2),
    "widthMm" DECIMAL(8,2),
    "depthMm" DECIMAL(8,2),
    "origin" TEXT,
    "treatment" TEXT,
    "comments" TEXT,
    "internalNotes" TEXT,
    "imageObjectKey" TEXT,
    "printFormat" "PrintFormat",
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "issuedAt" TIMESTAMP(3),
    "verifyUrl" TEXT,
    "voidedAt" TIMESTAMP(3),
    "voidReason" TEXT,
    "createdById" UUID NOT NULL,
    "revisionOfId" UUID,
    "supersededById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "actorId" UUID,
    "certificateId" UUID,
    "action" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "reason" TEXT,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_certificateNumber_key" ON "Certificate"("certificateNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_supersededById_key" ON "Certificate"("supersededById");

-- CreateIndex
CREATE INDEX "Certificate_status_idx" ON "Certificate"("status");

-- CreateIndex
CREATE INDEX "Certificate_specimenName_idx" ON "Certificate"("specimenName");

-- CreateIndex
CREATE INDEX "Certificate_issuedAt_idx" ON "Certificate"("issuedAt");

-- CreateIndex
CREATE INDEX "Certificate_createdAt_idx" ON "Certificate"("createdAt");

-- CreateIndex
CREATE INDEX "Certificate_revisionOfId_idx" ON "Certificate"("revisionOfId");

-- CreateIndex
CREATE INDEX "AuditLog_certificateId_createdAt_idx" ON "AuditLog"("certificateId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_revisionOfId_fkey" FOREIGN KEY ("revisionOfId") REFERENCES "Certificate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_supersededById_fkey" FOREIGN KEY ("supersededById") REFERENCES "Certificate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_certificateId_fkey" FOREIGN KEY ("certificateId") REFERENCES "Certificate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Integrity rules enforced by the database itself (defence in depth).
-- ---------------------------------------------------------------------------

ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_weight_positive" CHECK ("weightCt" > 0);
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_issued_has_number"
  CHECK ("status" = 'DRAFT' OR ("certificateNumber" IS NOT NULL AND "issuedAt" IS NOT NULL AND "verifyUrl" IS NOT NULL));
ALTER TABLE "LabSettings" ADD CONSTRAINT "LabSettings_singleton" CHECK ("id" = 1);

-- Issued certificates are immutable: data, number, QR URL and photo can never change,
-- they can never return to DRAFT, and a VOIDED certificate can never be reinstated.
CREATE FUNCTION certificate_guard_update() RETURNS trigger AS $$
BEGIN
  IF OLD."status" <> 'DRAFT' THEN
    IF NEW."status" = 'DRAFT' THEN
      RAISE EXCEPTION 'Issued certificate % cannot return to draft', OLD."certificateNumber";
    END IF;
    IF OLD."status" = 'VOIDED' AND NEW."status" <> 'VOIDED' THEN
      RAISE EXCEPTION 'Voided certificate % cannot be reinstated', OLD."certificateNumber";
    END IF;
    IF NEW."certificateNumber" IS DISTINCT FROM OLD."certificateNumber"
      OR NEW."specimenName" IS DISTINCT FROM OLD."specimenName"
      OR NEW."weightCt" IS DISTINCT FROM OLD."weightCt"
      OR NEW."colour" IS DISTINCT FROM OLD."colour"
      OR NEW."shapeCut" IS DISTINCT FROM OLD."shapeCut"
      OR NEW."hardness" IS DISTINCT FROM OLD."hardness"
      OR NEW."specificGravity" IS DISTINCT FROM OLD."specificGravity"
      OR NEW."refractiveIndex" IS DISTINCT FROM OLD."refractiveIndex"
      OR NEW."lengthMm" IS DISTINCT FROM OLD."lengthMm"
      OR NEW."widthMm" IS DISTINCT FROM OLD."widthMm"
      OR NEW."depthMm" IS DISTINCT FROM OLD."depthMm"
      OR NEW."origin" IS DISTINCT FROM OLD."origin"
      OR NEW."treatment" IS DISTINCT FROM OLD."treatment"
      OR NEW."comments" IS DISTINCT FROM OLD."comments"
      OR NEW."imageObjectKey" IS DISTINCT FROM OLD."imageObjectKey"
      OR NEW."issuedAt" IS DISTINCT FROM OLD."issuedAt"
      OR NEW."verifyUrl" IS DISTINCT FROM OLD."verifyUrl"
      OR NEW."isDemo" IS DISTINCT FROM OLD."isDemo"
    THEN
      RAISE EXCEPTION 'Issued certificate % is immutable; create a revision instead', OLD."certificateNumber";
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "Certificate_guard_update" BEFORE UPDATE ON "Certificate"
  FOR EACH ROW EXECUTE FUNCTION certificate_guard_update();

-- Issued certificates are never deleted (only DEMO records may be removed).
CREATE FUNCTION certificate_guard_delete() RETURNS trigger AS $$
BEGIN
  IF OLD."status" <> 'DRAFT' AND NOT OLD."isDemo" THEN
    RAISE EXCEPTION 'Issued certificate % cannot be deleted; void it instead', OLD."certificateNumber";
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "Certificate_guard_delete" BEFORE DELETE ON "Certificate"
  FOR EACH ROW EXECUTE FUNCTION certificate_guard_delete();

-- Audit log is append-only.
CREATE FUNCTION audit_log_append_only() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION 'AuditLog is append-only';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "AuditLog_append_only" BEFORE UPDATE ON "AuditLog"
  FOR EACH ROW EXECUTE FUNCTION audit_log_append_only();
