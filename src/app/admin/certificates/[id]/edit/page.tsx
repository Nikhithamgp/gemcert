import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/dal";
import { getCertificateForAdmin } from "@/lib/certificates/queries";
import { certificateSnapshot } from "@/lib/certificates/serialize";
import { Alert, PageHeader } from "@/components/ui";
import { CertificateForm } from "../../certificate-form";

export const metadata = { title: "Edit draft" };

export default async function EditCertificatePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  await requirePermission("certificate:editDraft");
  const { id } = await params;
  const { from } = await searchParams;
  const cert = await getCertificateForAdmin(id);
  if (!cert) notFound();

  if (cert.status !== "DRAFT") {
    return (
      <div className="space-y-4">
        <Alert tone="warning" title="Issued certificates cannot be edited">
          To correct an issued certificate, open it and choose “Create revision”. The revision gets a new number when
          published and the original is marked superseded, so the history stays intact.
        </Alert>
        <Link href={`/admin/certificates/${id}`} className="btn-secondary">
          Back to certificate
        </Link>
      </div>
    );
  }

  const snap = certificateSnapshot(cert);
  const initial = Object.fromEntries(Object.entries(snap).map(([k, v]) => [k, v ?? ""]));

  return (
    <>
      <PageHeader title="Edit draft">
        {cert.revisionOf?.certificateNumber
          ? `Revision of ${cert.revisionOf.certificateNumber}. Publishing it will supersede the original.`
          : "Draft — not visible to the public."}
      </PageHeader>
      {from === "duplicate" && (
        <div className="mb-6">
          <Alert tone="info">This is a new draft copied from an existing certificate. Check every field before saving.</Alert>
        </div>
      )}
      <CertificateForm
        id={cert.id}
        initial={initial}
        currentImageUrl={cert.imageObjectKey ? `/api/admin/certificates/${cert.id}/image?v=${cert.updatedAt.getTime()}` : null}
        cancelHref={`/admin/certificates/${cert.id}`}
      />
    </>
  );
}
