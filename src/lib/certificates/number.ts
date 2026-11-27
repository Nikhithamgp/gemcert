/** Certificate number helpers. Format: PREFIX-YYYY-NNNNNN, e.g. GEM-2026-000001. */

export const CERTIFICATE_NUMBER_PATTERN = /^[A-Z0-9]{2,8}-\d{4}-\d{6,9}$/;

export function formatCertificateNumber(prefix: string, year: number, sequence: number): string {
  if (!Number.isInteger(sequence) || sequence < 1) throw new Error("Sequence must be a positive integer");
  return `${prefix}-${year}-${String(sequence).padStart(6, "0")}`;
}

export function counterKey(prefix: string, year: number) {
  return `${prefix}-${year}`;
}

/** Normalises user-typed input (" gem-2026-000001 ") for lookup; returns null if it cannot be a valid number. */
export function normaliseCertificateNumber(input: string | null | undefined): string | null {
  if (!input) return null;
  const cleaned = input.trim().toUpperCase().replace(/\s+/g, "").replace(/[–—]/g, "-");
  if (cleaned.length > 30) return null;
  return CERTIFICATE_NUMBER_PATTERN.test(cleaned) ? cleaned : null;
}

type RawQueryClient = {
  $queryRaw<T = unknown>(query: TemplateStringsArray, ...values: unknown[]): Promise<T>;
};

/**
 * Atomically allocates the next sequence for a prefix/year.
 *
 * `INSERT ... ON CONFLICT DO UPDATE ... RETURNING` takes a row lock, so concurrent
 * publishers are serialised and each receives a distinct value. It runs inside
 * the publish transaction, so a number is either issued together with the
 * certificate or not at all; issued numbers are never decremented or reused,
 * even when a certificate is later voided. The unique index on
 * Certificate.certificateNumber is the final safety net.
 */
export async function allocateCertificateNumber(tx: RawQueryClient, prefix: string, year: number): Promise<string> {
  const key = counterKey(prefix, year);
  const rows = await tx.$queryRaw<{ lastValue: number }[]>`
    INSERT INTO "CertificateCounter" ("key", "lastValue", "updatedAt")
    VALUES (${key}, 1, now())
    ON CONFLICT ("key") DO UPDATE
      SET "lastValue" = "CertificateCounter"."lastValue" + 1, "updatedAt" = now()
    RETURNING "lastValue"`;
  const value = Number(rows[0]?.lastValue);
  return formatCertificateNumber(prefix, year, value);
}

/** decodeURIComponent that never throws on malformed input. */
export function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
