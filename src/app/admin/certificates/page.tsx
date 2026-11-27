import Link from "next/link";
import { requirePermission } from "@/lib/auth/dal";
import { STATUSES, listCertificates, type ListFilters } from "@/lib/certificates/queries";
import { displayDecimal } from "@/lib/certificates/serialize";
import { PageHeader, StatusBadge, formatDate } from "@/components/ui";

export const metadata = { title: "Certificates" };

export default async function CertificateListPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requirePermission("certificate:view");
  const sp = await searchParams;
  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const filters: ListFilters = { q: one("q"), status: one("status"), from: one("from"), to: one("to"), page: one("page") };
  const { items, total, page, pageCount } = await listCertificates(filters);

  const pageHref = (p: number) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(filters)) if (v && k !== "page") qs.set(k, v);
    qs.set("page", String(p));
    return `/admin/certificates?${qs}`;
  };
  const filtered = Boolean(filters.q || filters.status || filters.from || filters.to);

  return (
    <>
      <PageHeader
        title="Certificates"
        actions={
          <Link href="/admin/certificates/new" className="btn-primary">
            + New certificate
          </Link>
        }
      >
        {total} {total === 1 ? "record" : "records"}
        {filtered ? " match your filters" : ""}
      </PageHeader>

      <form className="card mb-6 grid gap-3 p-4 sm:grid-cols-[2fr_1fr_1fr_1fr_auto]" role="search">
        <div>
          <label htmlFor="q" className="label">
            Search
          </label>
          <input id="q" name="q" defaultValue={filters.q} placeholder="Certificate number or stone name" className="input" />
        </div>
        <div>
          <label htmlFor="status" className="label">
            Status
          </label>
          <select id="status" name="status" defaultValue={filters.status ?? ""} className="input">
            <option value="">All</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="from" className="label">
            From
          </label>
          <input id="from" name="from" type="date" defaultValue={filters.from} className="input" />
        </div>
        <div>
          <label htmlFor="to" className="label">
            To
          </label>
          <input id="to" name="to" type="date" defaultValue={filters.to} className="input" />
        </div>
        <div className="flex items-end gap-2">
          <button type="submit" className="btn-primary">
            Filter
          </button>
          {filtered && (
            <Link href="/admin/certificates" className="btn-secondary">
              Clear
            </Link>
          )}
        </div>
      </form>

      <div className="card overflow-x-auto">
        {items.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-muted">
            {filtered ? "No certificates match these filters." : "No certificates yet."}
          </p>
        ) : (
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-border bg-gray-50 text-left text-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Number</th>
                <th className="px-4 py-2 font-medium">Specimen</th>
                <th className="px-4 py-2 text-right font-medium">Weight</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Issued</th>
                <th className="px-4 py-2 font-medium">Updated</th>
                <th className="px-4 py-2">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-mono">{c.certificateNumber ?? <span className="text-muted">— draft —</span>}</td>
                  <td className="px-4 py-2 font-medium">{c.specimenName}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{displayDecimal(c.weightCt)} ct</td>
                  <td className="px-4 py-2">
                    <StatusBadge status={c.status} isDemo={c.isDemo} />
                  </td>
                  <td className="px-4 py-2">{formatDate(c.issuedAt)}</td>
                  <td className="px-4 py-2 text-muted">{formatDate(c.updatedAt)}</td>
                  <td className="px-4 py-2 text-right whitespace-nowrap">
                    <Link href={`/admin/certificates/${c.id}`} className="text-brand underline">
                      Open
                    </Link>
                    {c.status === "DRAFT" && (
                      <Link href={`/admin/certificates/${c.id}/edit`} className="ml-3 text-brand underline">
                        Edit
                      </Link>
                    )}
                    {c.status === "PUBLISHED" && (
                      <Link href={`/print/${c.id}`} className="ml-3 text-brand underline">
                        Print
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {pageCount > 1 && (
        <nav aria-label="Pagination" className="mt-4 flex items-center justify-between text-sm">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className="btn-secondary">
              ← Previous
            </Link>
          ) : (
            <span />
          )}
          <span className="text-muted">
            Page {page} of {pageCount}
          </span>
          {page < pageCount ? (
            <Link href={pageHref(page + 1)} className="btn-secondary">
              Next →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </>
  );
}
