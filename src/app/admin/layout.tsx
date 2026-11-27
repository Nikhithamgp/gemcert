/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth/dal";
import { can } from "@/lib/auth/permissions";
import { baseUrlStatus, getLabSettings } from "@/lib/settings";
import { SHOP } from "@/lib/site";
import { logoutAction } from "@/app/login/actions";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin" }, robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const settings = await getLabSettings();
  const base = baseUrlStatus(settings);
  const nav = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/certificates", label: "Certificates" },
    { href: "/admin/certificates/new", label: "New certificate" },
    ...(can(user.role, "settings:manage") ? [{ href: "/admin/settings", label: "Shop settings" }] : []),
    ...(can(user.role, "users:manage") ? [{ href: "/admin/users", label: "Staff users" }] : []),
  ];

  return (
    <div className="flex min-h-full flex-1 flex-wrap items-stretch">
      <aside className="no-print flex flex-[1_1_240px] flex-col gap-7 bg-brand-deep px-4 py-6 text-on-dark-muted md:max-w-[260px]">
        <Link href="/admin" className="flex items-center gap-2.5 px-2">
          <img src="/logo.png" alt="" className="h-11 w-auto" />
          <span className="leading-tight">
            <span className="font-display block text-xl text-on-dark">{SHOP.shortName}</span>
            <span className="block text-[10px] tracking-[0.26em] text-gold-light">ADMIN</span>
          </span>
        </Link>
        <nav aria-label="Admin" className="flex flex-wrap gap-1 text-[15px] md:flex-col">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="rounded px-3.5 py-3 text-on-dark-muted hover:bg-white/10 hover:text-on-dark">
              {n.label}
            </Link>
          ))}
          <Link href="/" className="rounded px-3.5 py-3 text-on-dark-muted hover:bg-white/10 hover:text-on-dark">
            View website ↗
          </Link>
        </nav>
        <div className="mt-auto border-t border-white/10 px-2 pt-4 text-[13px]">
          <Link href="/admin/account" className="block text-on-dark hover:underline">
            <span className="font-bold">{user.name}</span> <span className="text-on-dark-muted">({user.role.toLowerCase()})</span>
          </Link>
          <form action={logoutAction} className="mt-2.5">
            <button type="submit" className="cursor-pointer py-1 text-gold-light underline">
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-[999_1_640px] flex-col">
        {(base.errors.length > 0 || base.warnings.length > 0) && (
          <div className="no-print border-b border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900 sm:px-8">
            <strong>QR / public URL: </strong>
            {[...base.errors, ...base.warnings].join(" ")}{" "}
            {can(user.role, "settings:manage") && (
              <Link href="/admin/settings" className="underline">
                Fix in Shop settings
              </Link>
            )}
          </div>
        )}
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
