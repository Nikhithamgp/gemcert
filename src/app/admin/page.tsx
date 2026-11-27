import Link from "next/link";
import { requirePermission } from "@/lib/auth/dal";
import { dashboardStats } from "@/lib/certificates/queries";
import { PageHeader, StatusBadge, formatDate } from "@/components/ui";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  await requirePermission("certificate:view");
  const { counts, total, recent } = await dashboardStats();
  const tiles = [
    { label: "Total", value: total, href: "/admin/certificates" },
    { label: "Drafts", value: counts.DRAFT, href: "/admin/certificates?status=DRAFT" },
    { label: "Published", value: counts.PUBLISHED, href: "/admin/certificates?status=PUBLISHED" },
    { label: "Voided", value: counts.VOIDED, href: "/admin/certificates?status=VOIDED" },
    { label: "Superseded", value: counts.SUPERSEDED, href: "/admin/certificates?status=SUPERSEDED" },
  ];
  return (
    <>
      <PageHeader
        title="Dashboard"
        actions={
          <Link href="/admin/certificates/new" className="btn-primary">
            + New certificate
          </Link>
        }
      />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {tiles.map((t) => (
          <Link key={t.label} href={t.href} className="card p-4 hover:border-brand">
            <p className="text-sm text-muted">{t.label}</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums">{t.value}</p>
          </Link>
        ))}
      </div>

      <section className="card mt-8">
        <h2 className="border-b border-border px-4 py-3 font-semibold">Recently updated</h2>
        {recent.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted">
            No certificates yet.{" "}
            <Link href="/admin/certificates/new" className="text-brand underline">
              Create the first one
            </Link>
            .
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {recent.map((c) => (
              <li key={c.id}>
                <Link href={`/admin/certificates/${c.id}`} className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-gray-50">
                  <span className="w-44 font-mono text-sm">{c.certificateNumber ?? "— (draft)"}</span>
                  <span className="flex-1 font-medium">{c.specimenName}</span>
                  <StatusBadge status={c.status} isDemo={c.isDemo} />
                  <span className="text-sm text-muted">{formatDate(c.updatedAt, true)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
