import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import type { CertificateStatus } from "@/generated/prisma/enums";
import { normaliseCertificateNumber } from "./number";
import { toPublicCertificate, type PublicCertificate } from "./serialize";

export type PublicLookup = { state: "not_found" } | { state: "found"; certificate: PublicCertificate };

/** Public verification lookup. Drafts and unknown numbers are indistinguishable ("not found"). */
export async function lookupPublicCertificate(rawNumber: string): Promise<PublicLookup> {
  const number = normaliseCertificateNumber(rawNumber);
  if (!number) return { state: "not_found" };
  const cert = await db.certificate.findUnique({
    where: { certificateNumber: number },
    include: { supersededBy: { select: { certificateNumber: true, status: true } } },
  });
  if (!cert || cert.status === "DRAFT") return { state: "not_found" };
  return {
    state: "found",
    certificate: toPublicCertificate(cert, cert.supersededBy?.certificateNumber ?? null),
  };
}

/** Image key for a public (non-draft) certificate, or null. */
export async function publicImageKey(rawNumber: string): Promise<string | null> {
  const number = normaliseCertificateNumber(rawNumber);
  if (!number) return null;
  const cert = await db.certificate.findUnique({
    where: { certificateNumber: number },
    select: { status: true, imageObjectKey: true },
  });
  if (!cert || cert.status === "DRAFT") return null;
  return cert.imageObjectKey;
}

export const STATUSES: CertificateStatus[] = ["DRAFT", "PUBLISHED", "VOIDED", "SUPERSEDED"];
export const PAGE_SIZE = 20;

export type ListFilters = {
  q?: string;
  status?: string;
  from?: string;
  to?: string;
  page?: string;
};

export async function listCertificates(filters: ListFilters) {
  const where: Prisma.CertificateWhereInput = {};
  const q = filters.q?.trim().slice(0, 100);
  if (q) {
    where.OR = [
      { certificateNumber: { contains: q, mode: "insensitive" } },
      { specimenName: { contains: q, mode: "insensitive" } },
    ];
  }
  if (filters.status && (STATUSES as string[]).includes(filters.status)) {
    where.status = filters.status as CertificateStatus;
  }
  const from = filters.from && /^\d{4}-\d{2}-\d{2}$/.test(filters.from) ? new Date(`${filters.from}T00:00:00Z`) : null;
  const to = filters.to && /^\d{4}-\d{2}-\d{2}$/.test(filters.to) ? new Date(`${filters.to}T23:59:59.999Z`) : null;
  if (from || to) {
    // Issued date for issued certificates, otherwise creation date.
    const range = { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) };
    where.AND = [{ OR: [{ issuedAt: range }, { issuedAt: null, createdAt: range }] }];
  }
  const page = Math.max(1, Math.min(10_000, Number.parseInt(filters.page ?? "1", 10) || 1));
  const [total, items] = await Promise.all([
    db.certificate.count({ where }),
    db.certificate.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        certificateNumber: true,
        status: true,
        specimenName: true,
        weightCt: true,
        isDemo: true,
        issuedAt: true,
        createdAt: true,
        updatedAt: true,
        createdBy: { select: { name: true } },
      },
    }),
  ]);
  return { total, items, page, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function dashboardStats() {
  const [grouped, recent] = await Promise.all([
    db.certificate.groupBy({ by: ["status"], _count: { _all: true } }),
    db.certificate.findMany({
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: { id: true, certificateNumber: true, status: true, specimenName: true, updatedAt: true, isDemo: true },
    }),
  ]);
  const counts = { DRAFT: 0, PUBLISHED: 0, VOIDED: 0, SUPERSEDED: 0 } as Record<CertificateStatus, number>;
  for (const g of grouped) counts[g.status] = g._count._all;
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return { counts, total, recent };
}

export async function getCertificateForAdmin(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  return db.certificate.findUnique({
    where: { id },
    include: {
      createdBy: { select: { name: true } },
      revisionOf: { select: { id: true, certificateNumber: true } },
      revisions: { select: { id: true, certificateNumber: true, status: true } },
      supersededBy: { select: { id: true, certificateNumber: true } },
      supersedes: { select: { id: true, certificateNumber: true } },
      auditLogs: {
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { actor: { select: { name: true } } },
      },
    },
  });
}

export type AdminCertificate = NonNullable<Awaited<ReturnType<typeof getCertificateForAdmin>>>;
