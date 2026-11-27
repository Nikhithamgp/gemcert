import "server-only";
import type { PrintableCertificate } from "@/components/certificate/certificate-print";
import { qrSvg } from "@/lib/qr";
import { displayDecimal, formatDimensions, type CertificateRow } from "./serialize";

/** Ordered label/value pairs shown on cards, reports and the public page. Blank values are omitted. */
export function propertyRows(c: Pick<
  CertificateRow,
  "weightCt" | "colour" | "shapeCut" | "lengthMm" | "widthMm" | "depthMm" | "hardness" | "specificGravity" | "refractiveIndex" | "treatment" | "origin"
>): [string, string][] {
  const rows: [string, string | null][] = [
    ["Weight", `${displayDecimal(c.weightCt)} ct`],
    ["Colour", c.colour],
    ["Shape & cut", c.shapeCut],
    ["Dimensions", formatDimensions(c)],
    ["Hardness", c.hardness ? `${c.hardness} (Mohs)` : null],
    ["Specific gravity", c.specificGravity],
    ["Refractive index", c.refractiveIndex],
    ["Treatment", c.treatment],
    ["Origin", c.origin],
  ];
  return rows.filter((r): r is [string, string] => Boolean(r[1]));
}

export async function toPrintable(c: CertificateRow & { updatedAt: Date }): Promise<PrintableCertificate> {
  return {
    status: c.status,
    certificateNumber: c.certificateNumber,
    specimenName: c.specimenName,
    properties: propertyRows(c),
    comments: c.comments,
    imageUrl: c.imageObjectKey ? `/api/admin/certificates/${c.id}/image?v=${c.updatedAt.getTime()}` : null,
    issuedAt: c.issuedAt?.toISOString() ?? null,
    verifyUrl: c.verifyUrl,
    qrSvg: c.verifyUrl ? await qrSvg(c.verifyUrl) : null,
    isDemo: c.isDemo,
    cardColor: c.cardColor,
  };
}

/** URL of a logo uploaded in Shop settings, or null if none was uploaded. */
export function uploadedLogoUrl(lab: { hasLogo: boolean; logoVersion: number }) {
  return lab.hasLogo ? `/api/public/logo?v=${lab.logoVersion}` : null;
}

/** Logo for cards and pages: the uploaded one, else the shop's built-in logo. */
export function logoUrl(lab: { hasLogo: boolean; logoVersion: number }): string {
  return uploadedLogoUrl(lab) ?? "/logo.png";
}
