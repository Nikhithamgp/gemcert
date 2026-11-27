import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/dal";
import { can } from "@/lib/auth/permissions";
import { getCertificateForAdmin } from "@/lib/certificates/queries";
import { logoUrl, toPrintable } from "@/lib/certificates/printable";
import { baseUrlStatus, getLabSettings, publicLabInfo } from "@/lib/settings";
import { CardBack, CardFront, A4Certificate } from "@/components/certificate/certificate-print";
import { Alert, PageHeader, StatusBadge, formatDate } from "@/components/ui";
import { PublishButton, SimpleActionButton, VoidForm } from "./certificate-actions";

export const metadata = { title: "Certificate" };

const ACTION_LABELS: Record<string, string> = {
  "certificate.create_draft": "Draft created",
  "certificate.update_draft": "Draft edited",
  "certificate.publish": "Published",
  "certificate.void": "Voided",
  "certificate.supersede": "Superseded",
  "certificate.duplicate": "Created by duplicating",
  "certificate.create_revision": "Created as revision",
  "certificate.print": "Printed",
};

export default async function CertificatePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await requirePermission("certificate:view");
  const { id } = await params;
  const sp = await searchParams;
  const cert = await getCertificateForAdmin(id);
  if (!cert) notFound();

  const settings = await getLabSettings();
  const lab = publicLabInfo(settings);
  const printable = await toPrintable(cert);
  const logo = logoUrl(lab);
  const base = baseUrlStatus(settings);
  const width = Number(settings.cardWidthMm);
  const height = Number(settings.cardHeightMm);
  const preferred = cert.printFormat ?? settings.defaultPrintFormat;
  const isDraft = cert.status === "DRAFT";

  const publishBlock = !cert.imageObjectKey
    ? "Add a photograph before publishing."
    : base.errors.length
      ? base.errors.join(" ")
      : undefined;

  return (
    <>
      <PageHeader
        title={cert.specimenName}
        actions={
          <>
            {isDraft && can(user.role, "certificate:editDraft") && (
              <Link href={`/admin/certificates/${cert.id}/edit`} className="btn-secondary">
                Edit draft
              </Link>
            )}
            <Link href={`/print/${cert.id}?format=${preferred}`} className="btn-primary">
              {isDraft ? "Print proof" : "Print / PDF"}
            </Link>
          </>
        }
      >
        <span className="inline-flex flex-wrap items-center gap-2">
          <span className="font-mono">{cert.certificateNumber ?? "No number yet (draft)"}</span>
          <StatusBadge status={cert.status} isDemo={cert.isDemo} />
        </span>
      </PageHeader>

      <div className="mb-6 space-y-3">
        {sp.saved && <Alert tone="success">Draft saved.</Alert>}
        {sp.published && <Alert tone="success" title="Published">Certificate {cert.certificateNumber} is now publicly verifiable.</Alert>}
        {sp.voided && <Alert tone="warning">Certificate voided. Scanning its QR now shows “Voided”.</Alert>}
        {cert.status === "VOIDED" && (
          <Alert tone="error" title={`Voided on ${formatDate(cert.voidedAt, true)}`}>
            Reason (internal): {cert.voidReason}
          </Alert>
        )}
        {cert.status === "SUPERSEDED" && cert.supersededBy && (
          <Alert tone="warning" title="Superseded">
            Replaced by{" "}
            <Link className="underline" href={`/admin/certificates/${cert.supersededBy.id}`}>
              {cert.supersededBy.certificateNumber}
            </Link>
            . The public page points visitors to the new certificate.
          </Alert>
        )}
        {cert.revisionOf && (
          <Alert tone="info">
            Revision of{" "}
            <Link className="underline" href={`/admin/certificates/${cert.revisionOf.id}`}>
              {cert.revisionOf.certificateNumber}
            </Link>
            {isDraft ? " — publishing this draft will mark the original as superseded." : "."}
          </Alert>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 font-semibold">Card preview ({width} × {height} mm)</h2>
            <div className="flex flex-wrap gap-4 overflow-x-auto rounded-lg bg-gray-200 p-6">
              <div className="origin-top-left">
                <CardFront cert={printable} lab={lab} logoUrl={logo} widthMm={width} heightMm={height} />
              </div>
              <CardBack cert={printable} lab={lab} logoUrl={logo} widthMm={width} heightMm={height} />
            </div>
          </section>
          <section>
            <h2 className="mb-3 font-semibold">A4 preview</h2>
            <div className="overflow-hidden rounded-lg bg-gray-200 p-6">
              <div className="h-[calc(297mm*0.5)] w-[calc(210mm*0.5)]">
                <div className="origin-top-left scale-50">
                  <A4Certificate cert={printable} lab={lab} logoUrl={logo} />
                </div>
              </div>
            </div>
          </section>
          {cert.internalNotes && (
            <section className="card p-4">
              <h2 className="font-semibold">Internal notes</h2>
              <p className="mt-1 text-sm whitespace-pre-line text-muted">{cert.internalNotes}</p>
            </section>
          )}
        </div>

        <aside className="space-y-6">
          <section className="card space-y-3 p-4">
            <h2 className="font-semibold">Actions</h2>
            {isDraft &&
              (can(user.role, "certificate:publish") ? (
                <PublishButton id={cert.id} disabledReason={publishBlock} />
              ) : (
                <p className="text-sm text-muted">An administrator must publish this draft.</p>
              ))}
            {cert.status === "PUBLISHED" && can(user.role, "certificate:revise") && <SimpleActionButton id={cert.id} kind="revise" />}
            {can(user.role, "certificate:duplicate") && <SimpleActionButton id={cert.id} kind="duplicate" />}
            {(cert.status === "PUBLISHED" || cert.status === "SUPERSEDED") && can(user.role, "certificate:void") && <VoidForm id={cert.id} />}
          </section>

          {cert.verifyUrl && (
            <section className="card space-y-2 p-4 text-sm">
              <h2 className="font-semibold">Verification</h2>
              <p className="break-all">
                <a href={cert.verifyUrl} target="_blank" rel="noreferrer" className="text-brand underline">
                  {cert.verifyUrl}
                </a>
              </p>
              <div className="flex gap-2">
                <a href={`/api/admin/certificates/${cert.id}/qr?format=png`} className="btn-secondary px-3 py-1">
                  QR PNG
                </a>
                <a href={`/api/admin/certificates/${cert.id}/qr?format=svg`} className="btn-secondary px-3 py-1">
                  QR SVG
                </a>
              </div>
            </section>
          )}

          <section className="card p-4 text-sm">
            <h2 className="mb-2 font-semibold">Details</h2>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
              <dt className="text-muted">Created by</dt>
              <dd>{cert.createdBy.name}</dd>
              <dt className="text-muted">Created</dt>
              <dd>{formatDate(cert.createdAt, true)}</dd>
              <dt className="text-muted">Issued</dt>
              <dd>{formatDate(cert.issuedAt, true)}</dd>
              <dt className="text-muted">Print format</dt>
              <dd>{cert.printFormat ?? `Lab default (${settings.defaultPrintFormat})`}</dd>
            </dl>
            {cert.revisions.length > 0 && (
              <>
                <h3 className="mt-3 font-medium">Revisions</h3>
                <ul className="mt-1 space-y-1">
                  {cert.revisions.map((r) => (
                    <li key={r.id}>
                      <Link href={`/admin/certificates/${r.id}`} className="text-brand underline">
                        {r.certificateNumber ?? "Draft revision"}
                      </Link>{" "}
                      <span className="text-muted">({r.status.toLowerCase()})</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>

          <section className="card p-4 text-sm">
            <h2 className="mb-2 font-semibold">History</h2>
            <ol className="space-y-3">
              {cert.auditLogs.map((log) => (
                <li key={log.id} className="border-l-2 border-border pl-3">
                  <div className="font-medium">{ACTION_LABELS[log.action] ?? log.action}</div>
                  <div className="text-xs text-muted">
                    {formatDate(log.createdAt, true)} · {log.actor?.name ?? "system"}
                  </div>
                  {log.reason && <div className="text-xs">Reason: {log.reason}</div>}
                  {log.action === "certificate.update_draft" && log.after && typeof log.after === "object" && (
                    <div className="text-xs text-muted">Changed: {Object.keys(log.after).join(", ")}</div>
                  )}
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
    </>
  );
}
