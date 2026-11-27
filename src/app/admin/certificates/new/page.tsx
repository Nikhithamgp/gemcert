import { requirePermission } from "@/lib/auth/dal";
import { PageHeader } from "@/components/ui";
import { CertificateForm } from "../certificate-form";

export const metadata = { title: "New certificate" };

export default async function NewCertificatePage() {
  await requirePermission("certificate:create");
  return (
    <>
      <PageHeader title="New certificate">
        Saved as a draft. A certificate number and QR code are assigned when an administrator publishes it.
      </PageHeader>
      <CertificateForm cancelHref="/admin/certificates" />
    </>
  );
}
