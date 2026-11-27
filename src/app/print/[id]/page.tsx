import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/dal";
import { getCertificateForAdmin } from "@/lib/certificates/queries";
import { logoUrl, toPrintable } from "@/lib/certificates/printable";
import { getLabSettings, publicLabInfo } from "@/lib/settings";
import { A4Certificate, CardBack, CardFront } from "@/components/certificate/certificate-print";
import { PrintToolbar } from "./print-toolbar";

export const metadata: Metadata = { title: "Print certificate", robots: { index: false } };

export default async function PrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ format?: string }>;
}) {
  await requirePermission("certificate:print");
  const { id } = await params;
  const { format: rawFormat } = await searchParams;
  const cert = await getCertificateForAdmin(id);
  if (!cert) notFound();

  const settings = await getLabSettings();
  const lab = publicLabInfo(settings);
  const printable = await toPrintable(cert);
  const logo = logoUrl(lab);
  const format = rawFormat === "A4" || rawFormat === "CARD" ? rawFormat : (cert.printFormat ?? settings.defaultPrintFormat);
  const width = Number(settings.cardWidthMm);
  const height = Number(settings.cardHeightMm);
  const pageSize = format === "A4" ? "210mm 297mm" : `${width}mm ${height}mm`;

  return (
    <div className="min-h-full flex-1 bg-gray-200 print:bg-white">
      {/* Exact physical page size for the chosen format. */}
      <style>{`@page { size: ${pageSize}; margin: 0; } @media print { html, body { width: auto; } }`}</style>
      <PrintToolbar id={cert.id} format={format} isDraft={cert.status === "DRAFT"} cardLabel={`${width}×${height} mm`} />
      <div className="flex flex-col items-center gap-6 py-8 print:block print:gap-0 print:p-0">
        {format === "A4" ? (
          <A4Certificate cert={printable} lab={lab} logoUrl={logo} />
        ) : (
          <>
            <CardFront cert={printable} lab={lab} logoUrl={logo} widthMm={width} heightMm={height} />
            <CardBack cert={printable} lab={lab} logoUrl={logo} widthMm={width} heightMm={height} />
          </>
        )}
      </div>
    </div>
  );
}
