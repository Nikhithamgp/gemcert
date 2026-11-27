import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  PUBLIC_BASE_URL: z.string().optional().default(""),
  CERTIFICATE_PREFIX: z.string().optional().default("SLN"),
  STORAGE_DRIVER: z.enum(["local", "s3"]).default("local"),
  LOCAL_STORAGE_DIR: z.string().default("./storage"),
  S3_ENDPOINT: z.string().optional().default(""),
  S3_REGION: z.string().optional().default("auto"),
  S3_BUCKET: z.string().optional().default(""),
  S3_ACCESS_KEY_ID: z.string().optional().default(""),
  S3_SECRET_ACCESS_KEY: z.string().optional().default(""),
  MAX_UPLOAD_MB: z.coerce.number().positive().max(50).default(8),
  SESSION_TTL_HOURS: z.coerce.number().positive().max(24 * 30).default(12),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | undefined;

/** Parsed, validated environment. Parsed lazily so `next build` works without a database. */
export function env(): Env {
  if (!cached) {
    const parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
      throw new Error(`Invalid environment configuration: ${issues}`);
    }
    cached = parsed.data;
  }
  return cached;
}

export const isProduction = () => process.env.NODE_ENV === "production";
