"use client";

import Link from "next/link";
import { recordPrintAction } from "./actions";

export function PrintToolbar({ id, format, isDraft, cardLabel }: { id: string; format: "CARD" | "A4"; isDraft: boolean; cardLabel: string }) {
  return (
    <div className="no-print sticky top-0 z-10 border-b border-border bg-surface">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-3">
        <Link href={`/admin/certificates/${id}`} className="btn-secondary">
          ← Back
        </Link>
        <div role="group" aria-label="Print format" className="flex overflow-hidden rounded-md border border-border">
          <Link
            href={`/print/${id}?format=CARD`}
            className={`px-3 py-2 text-sm ${format === "CARD" ? "bg-brand text-white" : "bg-surface"}`}
            aria-current={format === "CARD" ? "page" : undefined}
          >
            Card ({cardLabel})
          </Link>
          <Link
            href={`/print/${id}?format=A4`}
            className={`px-3 py-2 text-sm ${format === "A4" ? "bg-brand text-white" : "bg-surface"}`}
            aria-current={format === "A4" ? "page" : undefined}
          >
            A4 paper
          </Link>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={async () => {
            await recordPrintAction(id, format).catch(() => undefined);
            window.print();
          }}
        >
          {isDraft ? "Print proof" : "Print / Save as PDF"}
        </button>
        <p className="w-full text-xs text-muted">
          In the print dialog choose <strong>Margins: None</strong> and <strong>Scale: 100% / Actual size</strong> so the
          card and QR print at the true size. Choose “Save as PDF” as the printer to download a PDF.
          {format === "CARD" && " The card prints as two pages: front, then back (for duplex card printers)."}
        </p>
      </div>
    </div>
  );
}
