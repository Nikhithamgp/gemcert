import Link from "next/link";
import { requirePermission } from "@/lib/auth/dal";
import { env } from "@/lib/env";
import { getLabSettings, publicLabInfo } from "@/lib/settings";
import { uploadedLogoUrl } from "@/lib/certificates/printable";
import { PageHeader } from "@/components/ui";
import { SettingsForm } from "./settings-form";

export const metadata = { title: "Shop settings" };

export default async function SettingsPage() {
  await requirePermission("settings:manage");
  const s = await getLabSettings();
  const values: Record<string, string> = {
    labName: s.labName,
    tagline: s.tagline ?? "",
    addressLine: s.addressLine ?? "",
    phone: s.phone ?? "",
    email: s.email ?? "",
    website: s.website ?? "",
    publicBaseUrl: s.publicBaseUrl ?? "",
    certificatePrefix: s.certificatePrefix,
    primaryColor: s.primaryColor,
    accentColor: s.accentColor,
    signatoryName: s.signatoryName ?? "",
    signatoryTitle: s.signatoryTitle ?? "",
    cardFooterText: s.cardFooterText ?? "",
    disclaimerText: s.disclaimerText ?? "",
    cardWidthMm: s.cardWidthMm.toString(),
    cardHeightMm: s.cardHeightMm.toString(),
    defaultPrintFormat: s.defaultPrintFormat,
  };
  return (
    <>
      <PageHeader
        title="Shop settings"
        actions={
          <a href="/api/admin/export" className="btn-secondary">
            Export all data (JSON)
          </a>
        }
      >
        Branding and configuration used on cards, reports and the public verification page.{" "}
        <Link href="/" className="underline" target="_blank">
          View public site
        </Link>
      </PageHeader>
      <SettingsForm values={values} logoUrl={uploadedLogoUrl(publicLabInfo(s))} envBaseUrl={env().PUBLIC_BASE_URL} />
    </>
  );
}
