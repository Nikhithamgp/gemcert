import type { Metadata } from "next";
import { lookupPublicCertificate } from "@/lib/certificates/queries";
import { safeDecode } from "@/lib/certificates/number";
import { getLabSettings, publicLabInfo } from "@/lib/settings";
import { LIMITS, rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";
import { PublicShell } from "@/components/public/public-shell";
import { LookupForm } from "@/components/public/lookup-form";
import { NotFoundView, VerificationView } from "@/components/public/verification-view";
import { Alert } from "@/components/ui";

// Always rendered per request so a void is visible the moment it happens.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ number: string }> }): Promise<Metadata> {
  const { number } = await params;
  return { title: `Certificate ${safeDecode(number).slice(0, 30)}`, robots: { index: false, follow: false } };
}

export default async function VerifyPage({ params }: { params: Promise<{ number: string }> }) {
  const { number: rawParam } = await params;
  const number = safeDecode(rawParam).slice(0, 40);
  const settings = await getLabSettings();
  const lab = publicLabInfo(settings);
  const example = `${settings.certificatePrefix}-${new Date().getFullYear()}-000123`;

  const limit = rateLimit(`verify:${await clientIp()}`, LIMITS.publicLookup.limit, LIMITS.publicLookup.windowMs);
  if (!limit.ok) {
    return (
      <PublicShell>
        <div className="mx-auto max-w-2xl">
          <Alert tone="warning" title="Too many requests">
            Please wait about {limit.retryAfterSec} seconds and try again.
          </Alert>
        </div>
      </PublicShell>
    );
  }

  const result = await lookupPublicCertificate(number);
  return (
    <PublicShell>
      {result.state === "found" ? (
        <VerificationView cert={result.certificate} lab={lab} example={example} />
      ) : (
        <div className="mx-auto flex max-w-2xl flex-col gap-6">
          <NotFoundView number={number} />
          <div className="rounded-lg border border-border bg-surface p-6 sm:p-8">
            <LookupForm example={example} size="lg" />
          </div>
        </div>
      )}
    </PublicShell>
  );
}
