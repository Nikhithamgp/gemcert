import type { CertificateStatus, PrintFormat } from "@/generated/prisma/enums";

/** Minimal shape of a Certificate row needed for serialisation (Decimal-like values have toString). */
type Stringish = { toString(): string } | string;

export type CertificateRow = {
  id: string;
  certificateNumber: string | null;
  status: CertificateStatus;
  specimenName: string;
  weightCt: Stringish;
  colour: string | null;
  shapeCut: string | null;
  hardness: string | null;
  specificGravity: string | null;
  refractiveIndex: string | null;
  lengthMm: Stringish | null;
  widthMm: Stringish | null;
  depthMm: Stringish | null;
  origin: string | null;
  treatment: string | null;
  comments: string | null;
  internalNotes: string | null;
  imageObjectKey: string | null;
  printFormat: PrintFormat | null;
  cardColor: string | null;
  isDemo: boolean;
  issuedAt: Date | null;
  verifyUrl: string | null;
  voidedAt: Date | null;
  voidReason: string | null;
};

const str = (v: Stringish | null) => (v === null || v === undefined ? null : v.toString());

/** Formats a decimal string for display, trimming trailing zeros: "2.450" -> "2.45". */
export function displayDecimal(v: Stringish | null): string | null {
  const s = str(v);
  if (s === null) return null;
  return s.includes(".") ? s.replace(/0+$/, "").replace(/\.$/, "") : s;
}

/** Editable data fields as plain strings — used for forms and audit snapshots. */
export function certificateSnapshot(c: CertificateRow) {
  return {
    specimenName: c.specimenName,
    weightCt: displayDecimal(c.weightCt),
    colour: c.colour,
    shapeCut: c.shapeCut,
    hardness: c.hardness,
    specificGravity: c.specificGravity,
    refractiveIndex: c.refractiveIndex,
    lengthMm: displayDecimal(c.lengthMm),
    widthMm: displayDecimal(c.widthMm),
    depthMm: displayDecimal(c.depthMm),
    origin: c.origin,
    treatment: c.treatment,
    comments: c.comments,
    internalNotes: c.internalNotes,
    printFormat: c.printFormat,
    cardColor: c.cardColor,
    imageObjectKey: c.imageObjectKey,
  };
}

export type CertificateSnapshot = ReturnType<typeof certificateSnapshot>;

export function formatDimensions(c: Pick<CertificateRow, "lengthMm" | "widthMm" | "depthMm">): string | null {
  const parts = [c.lengthMm, c.widthMm, c.depthMm].map(displayDecimal).filter((p): p is string => p !== null);
  return parts.length ? `${parts.join(" × ")} mm` : null;
}

export type PublicStatus = "VERIFIED" | "VOIDED" | "SUPERSEDED";

/**
 * The ONLY certificate data that leaves the server on public pages. Built from an
 * explicit allow-list: no internal ids, private notes, void reasons, creator or
 * storage keys.
 */
export function toPublicCertificate(c: CertificateRow, supersededByNumber: string | null = null) {
  if (c.status === "DRAFT" || !c.certificateNumber) {
    throw new Error("Draft certificates are never public");
  }
  const status: PublicStatus =
    c.status === "PUBLISHED" ? "VERIFIED" : c.status === "VOIDED" ? "VOIDED" : "SUPERSEDED";
  return {
    certificateNumber: c.certificateNumber,
    status,
    specimenName: c.specimenName,
    weightCt: displayDecimal(c.weightCt)!,
    colour: c.colour,
    shapeCut: c.shapeCut,
    hardness: c.hardness,
    specificGravity: c.specificGravity,
    refractiveIndex: c.refractiveIndex,
    dimensions: formatDimensions(c),
    origin: c.origin,
    treatment: c.treatment,
    comments: c.comments,
    hasImage: Boolean(c.imageObjectKey),
    isDemo: c.isDemo,
    issuedAt: c.issuedAt ? c.issuedAt.toISOString() : null,
    voidedAt: c.status === "VOIDED" && c.voidedAt ? c.voidedAt.toISOString() : null,
    supersededByNumber: c.status === "SUPERSEDED" ? supersededByNumber : null,
  };
}

export type PublicCertificate = ReturnType<typeof toPublicCertificate>;
