/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { SHOP } from "@/lib/site";
import { ShieldCheckIcon } from "./icons";

export function Brand({ onDark = false, compact = false }: { onDark?: boolean; compact?: boolean }) {
  return (
    <Link href="/" className="flex min-w-0 items-center gap-3">
      <img src="/logo.png" alt="" className={compact ? "h-11 w-auto" : "h-14 w-auto sm:h-16"} />
      <span className="flex min-w-0 flex-col leading-tight">
        <span className={`font-display truncate ${compact ? "text-xl" : "text-2xl sm:text-[26px]"} ${onDark ? "text-on-dark" : "text-brand-deep"}`}>
          {SHOP.shortName}
        </span>
        <span className={`mt-1 text-[10px] tracking-[0.28em] uppercase sm:text-[11px] ${onDark ? "text-gold-light" : "text-gold-ink"}`}>
          {SHOP.tagline}
        </span>
      </span>
    </Link>
  );
}

const NAV = [
  { href: "/#collection", label: "Collection" },
  { href: "/#pearls-gold", label: "Pearls" },
  { href: "/#pearls-gold", label: "Gold Jewellery" },
  { href: "/navaratna", label: "Navaratna" },
  { href: "/#visit", label: "Visit Us" },
];

export function SiteHeader() {
  return (
    <>
      <div className="bg-brand-deep text-[13px] text-on-dark-muted">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-x-6 gap-y-1 px-4 py-2 sm:px-6">
          <span>
            Open {SHOP.hoursShort} · Sherpura, Warangal
          </span>
          <span>
            Call / WhatsApp:{" "}
            <a href={`tel:${SHOP.phoneTel}`} className="font-bold text-on-dark no-underline">
              {SHOP.phoneDisplay}
            </a>
          </span>
        </div>
      </div>
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-8 gap-y-3 px-4 py-3 sm:px-6">
          <Brand />
          <nav aria-label="Main" className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[15px]">
            {NAV.map((n) => (
              <Link key={n.label} href={n.href} className="py-2.5 text-brand hover:text-gold-ink">
                {n.label}
              </Link>
            ))}
            <Link
              href="/#verify"
              className="inline-flex items-center gap-2 rounded border border-brand px-4 py-2.5 font-bold text-brand hover:bg-brand hover:text-on-dark"
            >
              <ShieldCheckIcon className="h-4 w-4" />
              Verify Certificate
            </Link>
          </nav>
        </div>
      </header>
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-brand-deep px-4 pt-12 pb-8 text-on-dark-muted sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-x-16 gap-y-8">
        <div className="min-w-0 flex-[1_1_320px]">
          <p className="font-display text-2xl text-on-dark">{SHOP.name}</p>
          <p className="mt-2 text-sm leading-relaxed">
            {SHOP.addressOneLine}
            <br />
            {SHOP.phoneDisplay} · {SHOP.hoursShort}
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap items-start gap-x-7 gap-y-2 text-sm">
          <Link href="/#verify" className="py-1.5 text-on-dark-muted underline hover:text-on-dark">
            Verify a certificate
          </Link>
          <Link href="/#collection" className="py-1.5 text-on-dark-muted underline hover:text-on-dark">
            Collection
          </Link>
          <Link href="/#visit" className="py-1.5 text-on-dark-muted underline hover:text-on-dark">
            Visit us
          </Link>
          <Link href="/login" className="py-1.5 text-on-dark-muted underline hover:text-on-dark">
            Staff login
          </Link>
        </nav>
      </div>
      <div className="mx-auto mt-8 flex max-w-6xl flex-wrap justify-between gap-x-6 gap-y-2 border-t border-white/10 pt-5 text-[13px]">
        {SHOP.gstin ? <span>GSTIN: {SHOP.gstin}</span> : <span />}
        <span>
          © {new Date().getFullYear()} {SHOP.name}
        </span>
      </div>
    </footer>
  );
}
