import type { CertificateStatus } from "@/generated/prisma/enums";

export function StatusBadge({ status, isDemo }: { status: CertificateStatus; isDemo?: boolean }) {
  const styles: Record<CertificateStatus, string> = {
    DRAFT: "bg-gray-100 text-gray-700 ring-gray-300",
    PUBLISHED: "bg-emerald-50 text-emerald-800 ring-emerald-300",
    VOIDED: "bg-red-50 text-red-800 ring-red-300",
    SUPERSEDED: "bg-amber-50 text-amber-800 ring-amber-300",
  };
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${styles[status]}`}>
        {status.charAt(0) + status.slice(1).toLowerCase()}
      </span>
      {isDemo && (
        <span className="inline-flex rounded-full bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-800 ring-1 ring-inset ring-purple-300">
          DEMO
        </span>
      )}
    </span>
  );
}

export function Alert({
  tone = "info",
  title,
  children,
}: {
  tone?: "info" | "warning" | "error" | "success";
  title?: string;
  children?: React.ReactNode;
}) {
  const styles = {
    info: "border-sky-300 bg-sky-50 text-sky-900",
    warning: "border-amber-300 bg-amber-50 text-amber-900",
    error: "border-red-300 bg-red-50 text-red-900",
    success: "border-emerald-300 bg-emerald-50 text-emerald-900",
  }[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`rounded-md border px-4 py-3 text-sm ${styles}`}>
      {title && <p className="font-semibold">{title}</p>}
      {children && <div className={title ? "mt-1" : ""}>{children}</div>}
    </div>
  );
}

export function PageHeader({ title, actions, children }: { title: string; actions?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-4xl text-brand-deep">{title}</h1>
        {children && <div className="mt-1 text-sm text-muted">{children}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function FieldError({ id, errors }: { id: string; errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <p id={id} className="mt-1 text-sm text-danger">
      {errors[0]}
    </p>
  );
}

export function formatDate(d: Date | string | null | undefined, withTime = false): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    timeZone: "UTC",
  }) + (withTime ? " UTC" : "");
}
