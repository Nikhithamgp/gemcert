/* eslint-disable @next/next/no-img-element -- print layouts need plain <img> with exact mm sizing */
import type { CertificateStatus } from "@/generated/prisma/enums";
import type { PublicLabInfo } from "@/lib/settings";
import { cardTheme } from "@/lib/card-colors";

export type PrintableCertificate = {
  status: CertificateStatus;
  certificateNumber: string | null;
  specimenName: string;
  properties: [label: string, value: string][];
  comments: string | null;
  imageUrl: string | null;
  issuedAt: string | null;
  verifyUrl: string | null;
  qrSvg: string | null;
  isDemo: boolean;
  /** Card header colour key (see card-colors.ts); null = shop default. */
  cardColor: string | null;
};

type Props = { cert: PrintableCertificate; lab: PublicLabInfo; logoUrl: string | null };

function watermark(cert: PrintableCertificate) {
  if (cert.status === "DRAFT") return "DRAFT – NOT VALID";
  if (cert.status === "VOIDED") return "VOID";
  if (cert.status === "SUPERSEDED") return "SUPERSEDED";
  if (cert.isDemo) return "DEMO";
  return null;
}

function Watermark({ text, sizeEm = 2.6 }: { text: string | null; sizeEm?: number }) {
  if (!text) return null;
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden" aria-hidden>
      <span style={{ fontSize: `${sizeEm}em` }} className="-rotate-[20deg] font-black tracking-widest whitespace-nowrap text-red-600/25">{text}</span>
    </div>
  );
}

function Qr({ cert, sizeEm }: { cert: PrintableCertificate; sizeEm: number }) {
  if (!cert.qrSvg) {
    return (
      <div
        className="flex items-center justify-center border border-dashed border-gray-400 text-center leading-tight text-gray-500"
        style={{ width: `${sizeEm}em`, height: `${sizeEm}em` }}
      >
        {/* Shrink only the label, so the box previews the real QR size. */}
        <span className="text-[0.55em]">QR code is generated on publish</span>
      </div>
    );
  }
  return (
    <div
      className="[&>svg]:block [&>svg]:h-full [&>svg]:w-full"
      style={{ width: `${sizeEm}em`, height: `${sizeEm}em` }}
      dangerouslySetInnerHTML={{ __html: cert.qrSvg }}
    />
  );
}

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }) : "—";

// ---------------------------------------------------------------------------
// Card (front + back). Everything is sized in em, and the card's font size is
// derived from its height, so any configured card size keeps its proportions.

export function CardFront({ cert, lab, logoUrl, widthMm, heightMm }: Props & { widthMm: number; heightMm: number }) {
  const theme = cardTheme(cert.cardColor, lab.primaryColor);
  return (
    <div
      className="print-sheet relative flex flex-col overflow-hidden bg-white text-black shadow-md"
      style={{ width: `${widthMm}mm`, height: `${heightMm}mm`, fontSize: `${heightMm * 0.046}mm`, lineHeight: 1.2 }}
    >
      <div
        className="flex items-center gap-[0.5em] px-[0.8em] py-[0.45em]"
        style={{ background: theme.bg, color: theme.text, borderBottom: theme.border ? `1px solid ${theme.border}` : undefined }}
      >
        {logoUrl && <img src={logoUrl} alt="" className="h-[2em] w-auto rounded-sm bg-white object-contain p-[0.1em]" />}
        <div className="min-w-0 flex-1">
          <div className="truncate text-[1.05em] font-bold">{lab.labName}</div>
          <div className="truncate text-[0.7em] opacity-90">Gemstone Identification Card</div>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 gap-[0.6em] p-[0.6em]">
        <div className="flex aspect-square h-full shrink-0 items-center justify-center overflow-hidden rounded-[0.3em] border border-gray-200 bg-gray-50">
          {cert.imageUrl ? (
            <img src={cert.imageUrl} alt={cert.specimenName} className="h-full w-full object-contain" />
          ) : (
            <span className="text-[0.6em] text-gray-400">No photo</span>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="text-[0.95em] leading-tight font-bold" style={{ color: lab.primaryColor }}>
            {cert.specimenName}
          </div>
          <table className="mt-[0.2em] w-full text-[0.68em] leading-[1.3]">
            <tbody>
              {cert.properties.slice(0, 8).map(([label, value]) => (
                <tr key={label}>
                  <td className="pr-[0.5em] align-top whitespace-nowrap text-gray-600">{label}</td>
                  <td className="align-top font-semibold">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-auto flex items-end justify-between gap-[0.4em]">
            <div className="min-w-0 text-[0.62em] leading-tight">
              <div className="text-gray-600">Certificate No.</div>
              <div className="font-mono text-[1.15em] font-bold">{cert.certificateNumber ?? "— draft —"}</div>
              <div className="text-gray-600">Issued {fmtDate(cert.issuedAt)}</div>
            </div>
            {/* ≈ 20mm on a 54mm-tall card (font-size = 0.046 × height); keeps modules ≈ 0.5mm for reliable phone scans. */}
            <Qr cert={cert} sizeEm={8} />
          </div>
        </div>
      </div>
      <Watermark text={watermark(cert)} />
    </div>
  );
}

const CARD_BACK_IMAGE = "/card-back-navaratna.jpg";
/** Lower = lighter print / less ink (0–1). */
const CARD_BACK_IMAGE_OPACITY = 0.45;

export function CardBack({ cert, lab, widthMm, heightMm }: Props & { widthMm: number; heightMm: number }) {
  const contact = [lab.phone, lab.email, lab.website].filter(Boolean).join(" · ");
  const theme = cardTheme(cert.cardColor, lab.primaryColor);
  return (
    <div
      className="print-sheet relative flex flex-col overflow-hidden bg-white text-black shadow-md"
      style={{ width: `${widthMm}mm`, height: `${heightMm}mm`, fontSize: `${heightMm * 0.046}mm`, lineHeight: 1.25 }}
    >
      {/* Header: certificate number */}
      <div
        className="flex items-center justify-between gap-[0.5em] px-[0.8em] py-[0.35em]"
        style={{ background: theme.bg, color: theme.text, borderBottom: `0.2em solid ${lab.accentColor}` }}
      >
        <span className="text-[0.7em] tracking-wider uppercase opacity-90">Certificate No.</span>
        <span className="font-mono text-[0.95em] font-bold">{cert.certificateNumber ?? "— draft —"}</span>
      </div>

      {/* Middle: pendant photo, centred. Faded on a white background with soft edges to save printer ink. */}
      <div className="flex min-h-0 flex-1 items-center justify-center bg-white">
        <img
          src={CARD_BACK_IMAGE}
          alt="Navaratna pendant"
          className="h-full w-auto object-contain"
          style={{
            opacity: CARD_BACK_IMAGE_OPACITY,
            maskImage: "radial-gradient(ellipse 50% 50% at center, #000 60%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(ellipse 50% 50% at center, #000 60%, transparent 100%)",
          }}
        />
      </div>

      {/* Footer: verification + shop details */}
      <div className="border-t border-gray-200 px-[0.8em] py-[0.35em] text-center text-[0.5em] leading-tight text-gray-700">
        <div>
          <span className="font-semibold" style={{ color: lab.primaryColor }}>
            Verify:
          </span>{" "}
          <span className="font-mono break-all">{cert.verifyUrl ?? "(assigned on publish)"}</span>
        </div>
        <div className="mt-[0.15em]">
          <span className="font-semibold">{lab.labName}</span>
          {lab.addressLine && <> · {lab.addressLine}</>}
        </div>
        {contact && <div>{contact}</div>}
        {(lab.cardFooterText || lab.disclaimerText) && (
          <div className="mt-[0.15em] text-gray-500">{lab.cardFooterText ?? lab.disclaimerText}</div>
        )}
      </div>
      <Watermark text={watermark(cert)} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// A4 report

export function A4Certificate({ cert, lab, logoUrl }: Props) {
  const contact = [lab.addressLine, lab.phone, lab.email, lab.website].filter(Boolean).join(" · ");
  return (
    <div
      className="print-sheet relative flex flex-col overflow-hidden bg-white text-black shadow-md"
      style={{ width: "210mm", height: "297mm", padding: "16mm 16mm 12mm", fontSize: "10.5pt", lineHeight: 1.35 }}
    >
      <header className="flex items-center gap-4 border-b-4 pb-4" style={{ borderColor: lab.primaryColor }}>
        {logoUrl && <img src={logoUrl} alt="" className="h-[22mm] w-auto object-contain" />}
        <div className="flex-1">
          <div className="text-[20pt] font-bold" style={{ color: lab.primaryColor }}>
            {lab.labName}
          </div>
          {lab.tagline && <div className="text-gray-700">{lab.tagline}</div>}
          {contact && <div className="mt-1 text-[8.5pt] text-gray-600">{contact}</div>}
        </div>
      </header>

      <div className="mt-6 flex items-end justify-between">
        <div>
          <div className="text-[9pt] tracking-[0.2em] text-gray-500 uppercase">Gemstone Identification Report</div>
          <div className="mt-1 font-serif text-[22pt] leading-tight">{cert.specimenName}</div>
        </div>
        <div className="text-right">
          <div className="text-[9pt] text-gray-500">Certificate No.</div>
          <div className="font-mono text-[14pt] font-bold">{cert.certificateNumber ?? "— draft —"}</div>
          <div className="text-[9pt] text-gray-600">Issued {fmtDate(cert.issuedAt)}</div>
        </div>
      </div>

      <div className="mt-6 flex gap-8">
        <div className="flex h-[75mm] w-[75mm] shrink-0 items-center justify-center overflow-hidden rounded border border-gray-200 bg-gray-50">
          {cert.imageUrl ? (
            <img src={cert.imageUrl} alt={cert.specimenName} className="h-full w-full object-contain" />
          ) : (
            <span className="text-gray-400">No photo</span>
          )}
        </div>
        <table className="flex-1 self-start">
          <tbody>
            {cert.properties.map(([label, value]) => (
              <tr key={label} className="border-b border-gray-200">
                <td className="py-[2mm] pr-4 text-gray-600">{label}</td>
                <td className="py-[2mm] font-semibold">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {cert.comments && (
        <section className="mt-6">
          <h3 className="text-[9pt] tracking-wider text-gray-500 uppercase">Comments</h3>
          <p className="mt-1 whitespace-pre-line">{cert.comments}</p>
        </section>
      )}

      <div className="mt-auto flex items-end gap-6 border-t border-gray-300 pt-5">
        <Qr cert={cert} sizeEm={9.2 /* ≈ 34mm at 10.5pt */} />
        <div className="flex-1 text-[9pt]">
          <div className="font-semibold" style={{ color: lab.primaryColor }}>
            Verify online
          </div>
          <p>Scan the QR code or visit the address below to confirm this report against the laboratory&apos;s records.</p>
          <p className="mt-1 font-mono text-[8.5pt] break-all">{cert.verifyUrl ?? "(assigned on publish)"}</p>
        </div>
        {(lab.signatoryName || lab.signatoryTitle) && (
          <div className="w-[55mm] text-center text-[9pt]">
            <div className="h-[14mm] border-b border-gray-500" />
            <div className="mt-1 font-semibold">{lab.signatoryName}</div>
            <div className="text-gray-600">{lab.signatoryTitle}</div>
          </div>
        )}
      </div>
      {lab.disclaimerText && <p className="mt-4 text-[7.5pt] leading-snug text-gray-500">{lab.disclaimerText}</p>}
      <Watermark text={watermark(cert)} sizeEm={6} />
    </div>
  );
}
