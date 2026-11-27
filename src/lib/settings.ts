import "server-only";
import { db } from "@/lib/db";
import { env, isProduction } from "@/lib/env";
import { checkPublicBaseUrl } from "@/lib/verify-url";
import { SHOP } from "@/lib/site";

/** Returns the singleton LabSettings row, creating it from env defaults on first use. */
export async function getLabSettings() {
  const existing = await db.labSettings.findUnique({ where: { id: 1 } });
  if (existing) return existing;
  const prefix = (env().CERTIFICATE_PREFIX || SHOP.certificatePrefix).toUpperCase();
  return db.labSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      certificatePrefix: /^[A-Z0-9]{2,8}$/.test(prefix) ? prefix : SHOP.certificatePrefix,
      labName: SHOP.name,
      tagline: SHOP.tagline,
      addressLine: SHOP.addressOneLine,
      phone: SHOP.phoneDisplay,
      primaryColor: "#1c1814",
      accentColor: "#c9a24b",
    },
  });
}

export type LabSettingsRecord = Awaited<ReturnType<typeof getLabSettings>>;

/** Lab Settings value wins; otherwise PUBLIC_BASE_URL from the environment. */
export function effectiveBaseUrl(settings: Pick<LabSettingsRecord, "publicBaseUrl">): string | null {
  return settings.publicBaseUrl || env().PUBLIC_BASE_URL || null;
}

export function baseUrlStatus(settings: Pick<LabSettingsRecord, "publicBaseUrl">) {
  return checkPublicBaseUrl(effectiveBaseUrl(settings), isProduction());
}

/** Branding fields that are safe to show publicly. */
export function publicLabInfo(s: LabSettingsRecord) {
  return {
    labName: s.labName,
    tagline: s.tagline,
    hasLogo: Boolean(s.logoObjectKey),
    logoVersion: s.updatedAt.getTime(),
    addressLine: s.addressLine,
    phone: s.phone,
    email: s.email,
    website: s.website,
    primaryColor: s.primaryColor,
    accentColor: s.accentColor,
    signatoryName: s.signatoryName,
    signatoryTitle: s.signatoryTitle,
    cardFooterText: s.cardFooterText,
    disclaimerText: s.disclaimerText,
  };
}

export type PublicLabInfo = ReturnType<typeof publicLabInfo>;
