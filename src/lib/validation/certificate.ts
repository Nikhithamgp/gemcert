import { z } from "zod";
import { CARD_COLOR_VALUES } from "@/lib/card-colors";

/** Shared (client + server) validation for certificate drafts. */

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Must be at most ${max} characters`)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional()
    .transform((v) => v ?? null);

const DECIMAL = /^\d{1,7}(\.\d{1,3})?$/;
const NUMBER_OR_RANGE = /^\d{1,3}(\.\d{1,4})?(\s*[-–]\s*\d{1,3}(\.\d{1,4})?)?$/;

/** Value like "9", "6.5-7", "3.99 – 4.01". Empty → null. */
const measurement = (label: string, extra: string[] = []) =>
  z
    .string()
    .trim()
    .max(40)
    .refine(
      (v) => v === "" || NUMBER_OR_RANGE.test(v) || extra.some((e) => e.toLowerCase() === v.toLowerCase()),
      `${label} must be a number or a range such as 1.762-1.770${extra.length ? ` (or ${extra.join(", ")})` : ""}`,
    )
    .transform((v) => (v === "" ? null : v.replace(/\s*[-–]\s*/, " – ")))
    .nullable()
    .optional()
    .transform((v) => v ?? null);

const optionalMm = (label: string) =>
  z
    .string()
    .trim()
    .refine((v) => v === "" || (DECIMAL.test(v) && Number(v) > 0), `${label} must be a positive number (mm)`)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional()
    .transform((v) => v ?? null);

export const TREATMENT_SUGGESTIONS = [
  "No indications of treatment",
  "Heated",
  "Oiled / resin filled",
  "Not tested",
  "Undetermined",
];

export const certificateDraftSchema = z.object({
  specimenName: z
    .string({ error: "Specimen name is required" })
    .trim()
    .min(1, "Specimen name is required")
    .max(120, "Must be at most 120 characters"),
  weightCt: z
    .string({ error: "Weight is required" })
    .trim()
    .min(1, "Weight is required")
    .refine((v) => DECIMAL.test(v), "Weight must be a number with up to 3 decimals, e.g. 2.45")
    .refine((v) => Number(v) > 0, "Weight must be greater than 0"),
  colour: optionalText(80),
  shapeCut: optionalText(80),
  hardness: measurement("Hardness"),
  specificGravity: measurement("Specific gravity"),
  refractiveIndex: measurement("Refractive index", ["OTL"]),
  lengthMm: optionalMm("Length"),
  widthMm: optionalMm("Width"),
  depthMm: optionalMm("Depth"),
  origin: optionalText(120),
  treatment: optionalText(160),
  comments: optionalText(1000),
  internalNotes: optionalText(2000),
  printFormat: z
    .enum(["CARD", "A4", ""])
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v)),
  cardColor: z
    .enum([...CARD_COLOR_VALUES, ""], { error: "Please choose a card colour from the list" })
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v)),
});

export type CertificateDraftInput = z.input<typeof certificateDraftSchema>;
export type CertificateDraft = z.output<typeof certificateDraftSchema>;

export const CERTIFICATE_FIELDS = Object.keys(certificateDraftSchema.shape) as (keyof CertificateDraftInput)[];

/** Extracts the draft fields from FormData as strings. */
export function draftFromFormData(form: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of CERTIFICATE_FIELDS) {
    const value = form.get(key);
    out[key] = typeof value === "string" ? value : "";
  }
  return out;
}

export const voidSchema = z.object({
  reason: z.string().trim().min(5, "Please give a reason (at least 5 characters)").max(500),
});

export type FieldErrors = Partial<Record<string, string[]>>;

export function fieldErrors(error: z.ZodError): FieldErrors {
  return z.flattenError(error).fieldErrors as FieldErrors;
}
