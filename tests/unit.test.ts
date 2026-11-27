import { describe, expect, it } from "vitest";
import { formatCertificateNumber, normaliseCertificateNumber, safeDecode } from "@/lib/certificates/number";
import { buildVerifyUrl, checkPublicBaseUrl } from "@/lib/verify-url";
import { PERMISSIONS, can } from "@/lib/auth/permissions";
import { toPublicCertificate, type CertificateRow } from "@/lib/certificates/serialize";
import { rateLimit } from "@/lib/rate-limit";
import { diff } from "@/lib/audit";

describe("certificate numbers", () => {
  it("formats with zero padding", () => {
    expect(formatCertificateNumber("GEM", 2026, 1)).toBe("GEM-2026-000001");
    expect(formatCertificateNumber("GEM", 2026, 1234567)).toBe("GEM-2026-1234567");
  });
  it("rejects invalid sequences", () => {
    expect(() => formatCertificateNumber("GEM", 2026, 0)).toThrow();
    expect(() => formatCertificateNumber("GEM", 2026, 1.5)).toThrow();
  });
  it("normalises user input", () => {
    expect(normaliseCertificateNumber("  gem-2026-000001 ")).toBe("GEM-2026-000001");
    expect(normaliseCertificateNumber("GEM–2026–000001")).toBe("GEM-2026-000001");
    expect(normaliseCertificateNumber("GEM-2026-1")).toBeNull();
    expect(normaliseCertificateNumber("'; DROP TABLE x;--")).toBeNull();
    expect(normaliseCertificateNumber("")).toBeNull();
    expect(normaliseCertificateNumber("A".repeat(100))).toBeNull();
  });
  it("decodes safely", () => {
    expect(safeDecode("GEM%2D1")).toBe("GEM-1");
    expect(safeDecode("%E0%A4%A")).toBe("%E0%A4%A");
  });
});

describe("public base URL rules", () => {
  it("requires a configured URL", () => {
    expect(checkPublicBaseUrl("", true).errors.length).toBeGreaterThan(0);
    expect(checkPublicBaseUrl(null, false).errors.length).toBeGreaterThan(0);
  });
  it("blocks localhost, private IPs and http in production", () => {
    for (const url of ["http://localhost:3000", "https://localhost", "https://192.168.1.5", "https://10.0.0.2", "http://verify.lab.com"]) {
      expect(checkPublicBaseUrl(url, true).errors.length, url).toBeGreaterThan(0);
    }
  });
  it("accepts a public https origin in production", () => {
    const r = checkPublicBaseUrl("https://verify.lab.com/", true);
    expect(r.errors).toEqual([]);
    expect(r.url).toBe("https://verify.lab.com");
  });
  it("only warns about localhost in development", () => {
    const r = checkPublicBaseUrl("http://localhost:3000", false);
    expect(r.errors).toEqual([]);
    expect(r.warnings.length).toBeGreaterThan(0);
  });
  it("rejects paths and credentials", () => {
    expect(checkPublicBaseUrl("https://lab.com/verify", true).errors.length).toBeGreaterThan(0);
    expect(checkPublicBaseUrl("https://user:pw@lab.com", true).errors.length).toBeGreaterThan(0);
    expect(checkPublicBaseUrl("ftp://lab.com", true).errors.length).toBeGreaterThan(0);
  });
  it("builds absolute verify URLs", () => {
    expect(buildVerifyUrl("https://verify.lab.com", "GEM-2026-000001")).toBe("https://verify.lab.com/v/GEM-2026-000001");
  });
});

describe("permissions", () => {
  it("operators cannot publish, void or administer", () => {
    for (const p of ["certificate:publish", "certificate:void", "settings:manage", "users:manage", "data:export"] as const) {
      expect(can("OPERATOR", p), p).toBe(false);
      expect(can("ADMIN", p), p).toBe(true);
    }
  });
  it("operators can prepare and print drafts", () => {
    for (const p of ["certificate:create", "certificate:editDraft", "certificate:print", "certificate:view"] as const) {
      expect(can("OPERATOR", p)).toBe(true);
    }
  });
  it("anonymous users can do nothing", () => {
    for (const p of Object.keys(PERMISSIONS) as (keyof typeof PERMISSIONS)[]) {
      expect(can(null, p)).toBe(false);
      expect(can(undefined, p)).toBe(false);
    }
  });
});

describe("public certificate DTO", () => {
  const row: CertificateRow = {
    id: "11111111-1111-1111-1111-111111111111",
    certificateNumber: "GEM-2026-000001",
    status: "PUBLISHED",
    specimenName: "Natural Ruby",
    weightCt: "1.230",
    colour: "Red",
    shapeCut: null,
    hardness: "9",
    specificGravity: null,
    refractiveIndex: null,
    lengthMm: "6.00",
    widthMm: "5.10",
    depthMm: null,
    origin: null,
    treatment: "Heated",
    comments: "Public comment",
    internalNotes: "SECRET internal note",
    imageObjectKey: "certificates/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.jpg",
    printFormat: null,
    cardColor: "blue",
    isDemo: false,
    issuedAt: new Date("2026-01-02T00:00:00Z"),
    verifyUrl: "https://verify.lab.com/v/GEM-2026-000001",
    voidedAt: null,
    voidReason: "SECRET void reason",
  };

  it("never exposes internal fields", () => {
    const dto = toPublicCertificate({ ...row, status: "VOIDED", voidedAt: new Date() });
    const json = JSON.stringify(dto);
    expect(json).not.toContain("SECRET");
    expect(json).not.toContain(row.id);
    expect(json).not.toContain("certificates/");
    expect(Object.keys(dto)).not.toContain("internalNotes");
    expect(Object.keys(dto)).not.toContain("voidReason");
    expect(Object.keys(dto)).not.toContain("createdById");
  });

  it("maps statuses and formats values", () => {
    expect(toPublicCertificate(row).status).toBe("VERIFIED");
    expect(toPublicCertificate({ ...row, status: "VOIDED" }).status).toBe("VOIDED");
    expect(toPublicCertificate({ ...row, status: "SUPERSEDED" }, "GEM-2026-000002").supersededByNumber).toBe("GEM-2026-000002");
    const dto = toPublicCertificate(row);
    expect(dto.weightCt).toBe("1.23");
    expect(dto.dimensions).toBe("6 × 5.1 mm");
  });

  it("refuses to serialise drafts", () => {
    expect(() => toPublicCertificate({ ...row, status: "DRAFT" })).toThrow();
  });
});

describe("rate limiter", () => {
  it("blocks after the limit and resets after the window", () => {
    const key = `test:${Math.random()}`;
    const t = 1_000_000;
    expect(rateLimit(key, 2, 1000, t).ok).toBe(true);
    expect(rateLimit(key, 2, 1000, t).ok).toBe(true);
    const blocked = rateLimit(key, 2, 1000, t + 10);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSec).toBe(1);
    expect(rateLimit(key, 2, 1000, t + 1001).ok).toBe(true);
  });
});

describe("audit diff", () => {
  it("returns only changed keys", () => {
    expect(diff({ a: 1, b: "x" }, { a: 1, b: "y" })).toEqual({ before: { b: "x" }, after: { b: "y" } });
    expect(diff({ a: 1 }, { a: 1 })).toBeNull();
  });
});
