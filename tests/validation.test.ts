import { describe, expect, it } from "vitest";
import { certificateDraftSchema } from "@/lib/validation/certificate";
import { labSettingsSchema } from "@/lib/validation/settings";

const valid = { specimenName: "Natural Yellow Sapphire", weightCt: "2.45" };
const errorsFor = (input: Record<string, unknown>) => {
  const r = certificateDraftSchema.safeParse(input);
  return r.success ? {} : r.error.flatten().fieldErrors;
};

describe("certificate draft validation", () => {
  it("accepts a minimal valid draft and normalises blanks to null", () => {
    const r = certificateDraftSchema.parse({ ...valid, colour: "", origin: "  " });
    expect(r.specimenName).toBe("Natural Yellow Sapphire");
    expect(r.weightCt).toBe("2.45");
    expect(r.colour).toBeNull();
    expect(r.origin).toBeNull();
    expect(r.printFormat).toBeNull();
  });

  it("rejects a missing or blank specimen name", () => {
    expect(errorsFor({ weightCt: "1" }).specimenName).toBeDefined();
    expect(errorsFor({ specimenName: "   ", weightCt: "1" }).specimenName).toBeDefined();
  });

  it.each(["", "0", "0.000", "-1", "-0.5", "abc", "1e3", "1.2345", "1,5", "NaN", "Infinity"])(
    "rejects invalid weight %j",
    (weightCt) => {
      expect(errorsFor({ ...valid, weightCt }).weightCt).toBeDefined();
    },
  );

  it.each(["0.01", "2.45", "10", "123.456"])("accepts weight %j", (weightCt) => {
    expect(certificateDraftSchema.safeParse({ ...valid, weightCt }).success).toBe(true);
  });

  it("accepts measurement ranges and normalises the dash", () => {
    const r = certificateDraftSchema.parse({ ...valid, refractiveIndex: "1.762-1.770", specificGravity: "3.99 – 4.01", hardness: "9" });
    expect(r.refractiveIndex).toBe("1.762 – 1.770");
    expect(r.specificGravity).toBe("3.99 – 4.01");
  });

  it("allows OTL for refractive index only", () => {
    expect(certificateDraftSchema.safeParse({ ...valid, refractiveIndex: "OTL" }).success).toBe(true);
    expect(errorsFor({ ...valid, hardness: "OTL" }).hardness).toBeDefined();
  });

  it("rejects non-numeric measurements and negative dimensions", () => {
    expect(errorsFor({ ...valid, specificGravity: "heavy" }).specificGravity).toBeDefined();
    expect(errorsFor({ ...valid, lengthMm: "-3" }).lengthMm).toBeDefined();
    expect(errorsFor({ ...valid, widthMm: "0" }).widthMm).toBeDefined();
  });

  it("enforces length limits", () => {
    expect(errorsFor({ ...valid, specimenName: "x".repeat(121) }).specimenName).toBeDefined();
    expect(errorsFor({ ...valid, comments: "x".repeat(1001) }).comments).toBeDefined();
  });

  it("rejects unknown print formats", () => {
    expect(errorsFor({ ...valid, printFormat: "POSTER" }).printFormat).toBeDefined();
  });

  it("accepts a card colour from the list, blank as shop default, and rejects others", () => {
    expect(certificateDraftSchema.parse({ ...valid, cardColor: "blue" }).cardColor).toBe("blue");
    expect(certificateDraftSchema.parse({ ...valid, cardColor: "" }).cardColor).toBeNull();
    expect(certificateDraftSchema.parse(valid).cardColor).toBeNull();
    expect(errorsFor({ ...valid, cardColor: "purple" }).cardColor).toBeDefined();
  });
});

describe("lab settings validation", () => {
  const base = {
    labName: "Test Lab",
    email: "",
    publicBaseUrl: "",
    certificatePrefix: "gem",
    primaryColor: "#112233",
    accentColor: "#445566",
    cardWidthMm: "85.6",
    cardHeightMm: "54",
    defaultPrintFormat: "CARD",
  };
  it("uppercases the prefix and accepts blank optional values", () => {
    const r = labSettingsSchema.parse(base);
    expect(r.certificatePrefix).toBe("GEM");
    expect(r.publicBaseUrl).toBeNull();
  });
  it("rejects URLs with paths and bad prefixes", () => {
    expect(labSettingsSchema.safeParse({ ...base, publicBaseUrl: "https://x.com/verify" }).success).toBe(false);
    expect(labSettingsSchema.safeParse({ ...base, certificatePrefix: "G-1" }).success).toBe(false);
  });
  it("bounds card dimensions", () => {
    expect(labSettingsSchema.safeParse({ ...base, cardWidthMm: "10" }).success).toBe(false);
    expect(labSettingsSchema.safeParse({ ...base, cardHeightMm: "70" }).success).toBe(true);
  });
});
