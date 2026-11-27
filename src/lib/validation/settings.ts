import { z } from "zod";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional()
    .transform((v) => v ?? null);

const hexColour = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, "Use a hex colour such as #1e3a5f");

const mm = (label: string, min: number, max: number) =>
  z
    .string()
    .trim()
    .regex(/^\d{1,3}(\.\d{1,2})?$/, `${label} must be a number in mm`)
    .refine((v) => Number(v) >= min && Number(v) <= max, `${label} must be between ${min} and ${max} mm`);

export const labSettingsSchema = z.object({
  labName: z.string().trim().min(2, "Lab name is required").max(120),
  tagline: optionalText(160),
  addressLine: optionalText(300),
  phone: optionalText(60),
  email: z
    .string()
    .trim()
    .max(200)
    .refine((v) => v === "" || z.email().safeParse(v).success, "Enter a valid email")
    .transform((v) => (v === "" ? null : v)),
  website: optionalText(200),
  publicBaseUrl: z
    .string()
    .trim()
    .max(200)
    .refine((v) => v === "" || /^https?:\/\/[^\s/]+(:\d+)?\/?$/.test(v), "Use an origin like https://verify.yourlab.com (no path)")
    .transform((v) => (v === "" ? null : v.replace(/\/$/, ""))),
  certificatePrefix: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{2,8}$/, "Prefix must be 2–8 letters/digits, e.g. GEM"),
  primaryColor: hexColour,
  accentColor: hexColour,
  signatoryName: optionalText(120),
  signatoryTitle: optionalText(120),
  cardFooterText: optionalText(200),
  disclaimerText: optionalText(1000),
  cardWidthMm: mm("Card width", 50, 210),
  cardHeightMm: mm("Card height", 30, 297),
  defaultPrintFormat: z.enum(["CARD", "A4"]),
});

export type LabSettingsInput = z.input<typeof labSettingsSchema>;

export const userCreateSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(120),
  email: z.string().trim().toLowerCase().max(200).pipe(z.email("Enter a valid email")),
  role: z.enum(["ADMIN", "OPERATOR"]),
  password: z.string().min(12, "Password must be at least 12 characters").max(200),
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: z.string().min(12, "Password must be at least 12 characters").max(200),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().max(200).pipe(z.email("Enter a valid email")),
  password: z.string().min(1, "Enter your password").max(200),
});
