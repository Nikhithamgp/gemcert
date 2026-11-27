import Link from "next/link";

export const metadata = { title: "No access" };

export default function ForbiddenPage() {
  return (
    <div className="card mx-auto max-w-lg p-8 text-center">
      <h1 className="text-xl font-semibold">You don&apos;t have access to this page</h1>
      <p className="mt-2 text-sm text-muted">This action is limited to administrators. Ask an admin if you need it.</p>
      <Link href="/admin" className="btn-secondary mt-6">
        Back to dashboard
      </Link>
    </div>
  );
}
