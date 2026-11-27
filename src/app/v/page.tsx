import { redirect } from "next/navigation";
import { normaliseCertificateNumber } from "@/lib/certificates/number";
import { getLabSettings } from "@/lib/settings";
import { PublicShell } from "@/components/public/public-shell";
import { LookupForm } from "@/components/public/lookup-form";
import { NotFoundView } from "@/components/public/verification-view";

export const metadata = { title: "Verify a certificate", robots: { index: false } };

/** Handles the manual lookup form: /v?number=... */
export default async function VerifyLookupPage({ searchParams }: { searchParams: Promise<{ number?: string }> }) {
  const { number } = await searchParams;
  const raw = typeof number === "string" ? number.slice(0, 40) : "";
  const normalised = normaliseCertificateNumber(raw);
  if (normalised) redirect(`/v/${encodeURIComponent(normalised)}`);

  const settings = await getLabSettings();
  const example = `${settings.certificatePrefix}-${new Date().getFullYear()}-000123`;
  return (
    <PublicShell>
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        {raw && <NotFoundView number={raw} />}
        <div className="rounded-lg border border-border bg-surface p-6 sm:p-8">
          <h1 className="font-display mb-2 text-3xl text-brand-deep">Verify your certificate</h1>
          <p className="mb-5 text-[15px] text-muted">
            Scan the QR code on your card, or type the certificate number printed on it.
          </p>
          <LookupForm defaultValue={raw} example={example} size="lg" />
        </div>
      </div>
    </PublicShell>
  );
}
