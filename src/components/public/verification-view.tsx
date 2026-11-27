/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import type { PublicCertificate } from "@/lib/certificates/serialize";
import type { PublicLabInfo } from "@/lib/settings";
import { SHOP, whatsappLink } from "@/lib/site";
import { CheckIcon } from "@/components/site/icons";
import { LookupForm } from "./lookup-form";

/**
 * Public verification page body. Presentation only: data and security checks
 * live in the page and lib/certificates.
 */

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }) : "—";

function StatusBanner({ cert, lab }: { cert: PublicCertificate; lab: PublicLabInfo }) {
  if (cert.status === "VERIFIED") {
    return (
      <div role="status" className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-lg border border-[#9fcdae] bg-[#e6f3ea] px-5 py-5 sm:px-6">
        <span className="flex h-13 w-13 flex-none items-center justify-center rounded-full bg-[#1e6b3a] text-white">
          <CheckIcon className="h-7 w-7" />
        </span>
        <div className="min-w-0 flex-[1_1_300px]">
          <p className="text-2xl font-bold text-[#14532d]">Verified</p>
          <p className="mt-1 text-[15px] leading-snug text-[#1f4d2e]">
            This certificate was issued by {lab.labName} and matches our records.
          </p>
        </div>
      </div>
    );
  }
  if (cert.status === "VOIDED") {
    return (
      <div role="alert" className="rounded-lg border border-[#e8a9a0] bg-[#fbe9e7] px-5 py-5 sm:px-6">
        <p className="text-2xl font-bold text-[#8a1c12]">Voided</p>
        <p className="mt-1 text-[15px] leading-snug text-[#6b1f17]">
          This certificate was cancelled by the shop{cert.voidedAt ? ` on ${fmt(cert.voidedAt)}` : ""} and is no longer
          valid. Do not rely on it. Questions? Call{" "}
          <a href={`tel:${SHOP.phoneTel}`} className="font-bold text-[#6b1f17] underline">
            {SHOP.phoneDisplay}
          </a>
          .
        </p>
      </div>
    );
  }
  return (
    <div role="alert" className="rounded-lg border border-[#e5c77d] bg-[#fff4dc] px-5 py-5 sm:px-6">
      <p className="text-2xl font-bold text-[#6b4a00]">Superseded</p>
      <p className="mt-1 text-[15px] leading-snug text-[#5c4310]">
        A corrected certificate replaces this one, so this one is no longer current.
        {cert.supersededByNumber && (
          <>
            {" "}
            See{" "}
            <Link href={`/v/${encodeURIComponent(cert.supersededByNumber)}`} className="font-bold text-[#5c4310] underline">
              {cert.supersededByNumber} →
            </Link>
          </>
        )}
      </p>
    </div>
  );
}

export function VerificationView({ cert, lab, example }: { cert: PublicCertificate; lab: PublicLabInfo; example: string }) {
  const rows: [string, string | null][] = [
    ["Weight", `${cert.weightCt} ct`],
    ["Colour", cert.colour],
    ["Shape & cut", cert.shapeCut],
    ["Dimensions", cert.dimensions],
    ["Hardness", cert.hardness ? `${cert.hardness} (Mohs)` : null],
    ["Specific gravity", cert.specificGravity],
    ["Refractive index", cert.refractiveIndex],
    ["Treatment", cert.treatment],
    ["Origin", cert.origin],
  ];
  const muted = cert.status !== "VERIFIED";

  return (
    <div className="flex flex-col gap-6">
      <StatusBanner cert={cert} lab={lab} />
      {cert.isDemo && (
        <p className="rounded-md border border-purple-300 bg-purple-50 px-3 py-2 text-sm font-medium text-purple-900">
          DEMO record for testing only. Not a real gemstone certificate.
        </p>
      )}

      <article className={`overflow-hidden rounded-lg border border-border bg-surface ${muted ? "opacity-80" : ""}`}>
        <div className="flex flex-wrap">
          {cert.hasImage && (
            <div className="flex min-w-0 flex-[1_1_340px] items-center justify-center bg-sand p-6 sm:p-8">
              <img
                src={`/api/public/certificates/${encodeURIComponent(cert.certificateNumber)}/image`}
                alt={`Photograph of ${cert.specimenName}`}
                className="max-h-[420px] w-full rounded object-contain"
              />
            </div>
          )}
          <div className="min-w-0 flex-[1.4_1_420px] px-5 py-7 sm:px-10 sm:py-9">
            <p className="eyebrow tracking-[0.24em]">Certificate No.</p>
            <p className="mt-1.5 font-mono text-xl font-bold tracking-wide break-all text-brand-deep sm:text-2xl">
              {cert.certificateNumber}
            </p>
            <h1 className="font-display mt-5 text-4xl leading-tight text-brand-deep sm:text-[42px]">{cert.specimenName}</h1>
            <p className="mt-1 text-[15px] text-muted">Issued {fmt(cert.issuedAt)}</p>

            <dl className="mt-6 grid grid-cols-[minmax(120px,1fr)_1.4fr] border-t border-[#ede3d3] text-[15px]">
              {rows
                .filter((r): r is [string, string] => Boolean(r[1]))
                .map(([label, value]) => (
                  <div key={label} className="contents">
                    <dt className="border-b border-[#ede3d3] py-3 pr-3 text-muted">{label}</dt>
                    <dd className="border-b border-[#ede3d3] py-3 font-bold">{value}</dd>
                  </div>
                ))}
            </dl>

            {cert.comments && (
              <div className="mt-6">
                <h2 className="eyebrow tracking-[0.24em]">Comments</h2>
                <p className="mt-1.5 text-[15px] leading-relaxed whitespace-pre-line">{cert.comments}</p>
              </div>
            )}
          </div>
        </div>
      </article>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))] gap-5">
        <div className="rounded-lg border border-border bg-surface px-6 py-6 sm:px-7">
          <p className="eyebrow tracking-[0.24em]">Issued by</p>
          <p className="font-display mt-2.5 text-2xl text-brand-deep">{lab.labName}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">{lab.addressLine ?? SHOP.addressOneLine}</p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <a href={`tel:${SHOP.phoneTel}`} className="btn-primary h-11 px-5 font-bold">
              Call shop
            </a>
            <a href={whatsappLink(`Hello, I have a question about certificate ${cert.certificateNumber}.`)} className="btn h-11 border border-brand bg-surface px-5 font-bold text-brand hover:bg-sand">
              WhatsApp
            </a>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-surface px-6 py-6 sm:px-7">
          <p className="eyebrow mb-3 tracking-[0.24em]">Check another certificate</p>
          <LookupForm id="another-number" example={example} />
        </div>
      </div>

      <section className="text-[13px] leading-relaxed text-muted">
        <p>
          “Verified” confirms that this certificate number was issued by {lab.labName} and that the details above match the
          shop&apos;s records. Descriptions and measurements are as recorded by the shop.
        </p>
        {lab.disclaimerText && <p className="mt-2">{lab.disclaimerText}</p>}
      </section>
    </div>
  );
}

export function NotFoundView({ number }: { number: string }) {
  return (
    <div role="alert" className="rounded-lg border border-[#cfc3b5] bg-[#f1ece6] px-5 py-5 sm:px-6">
      <p className="text-2xl font-bold text-[#3d2e28]">Not found</p>
      <p className="mt-1 text-[15px] leading-snug text-[#4f403a]">
        No certificate matches <span className="font-mono font-bold break-all">{number || "(empty)"}</span>. Check the
        number on your card and try again, or call us on{" "}
        <a href={`tel:${SHOP.phoneTel}`} className="font-bold text-[#4f403a] underline">
          {SHOP.phoneDisplay}
        </a>
        .
      </p>
    </div>
  );
}
