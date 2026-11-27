import Link from "next/link";
import { NAVARATNA, whatsappLink } from "@/lib/site";
import { SiteFooter, SiteHeader } from "@/components/site/site-chrome";
import { ChatIcon, GemIcon } from "@/components/site/icons";

export const metadata = {
  title: "Navaratna",
  description: "The nine sacred Navaratna stones: ruby, pearl, red coral, emerald, yellow sapphire, diamond, blue sapphire, hessonite and cat's eye.",
};

export default function NavaratnaPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-background">
      <SiteHeader />

      <main className="flex-1">
        {/* Intro */}
        <section className="bg-sand px-4 pt-12 pb-16 sm:px-6 sm:pt-14">
          <div className="mx-auto max-w-6xl">
            <nav aria-label="Breadcrumb" className="text-sm text-muted">
              <Link href="/" className="hover:text-brand">
                Home
              </Link>
              <span className="mx-2">/</span>
              <Link href="/#collection" className="hover:text-brand">
                Collection
              </Link>
              <span className="mx-2">/</span>
              <span className="text-brand-deep">Navaratna</span>
            </nav>
            <p className="eyebrow mt-8">Navaratna</p>
            <h1 className="font-display mt-3 text-[44px] leading-tight text-brand-deep sm:text-[56px]">The nine sacred stones</h1>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
              Each stone is traditionally linked to one of the nine grahas. Buy any stone on its own, or choose a matched
              set of all nine for a ring or pendant.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {NAVARATNA.map((s) => (
                <span key={s.name} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/70">
                  <GemIcon color={s.color} edge={s.edge} className="h-5 w-6" />
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Stones */}
        <section className="px-4 py-16 sm:px-6">
          <ul className="mx-auto grid max-w-6xl grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
            {NAVARATNA.map((s) => (
              <li key={s.name}>
                <a
                  href={whatsappLink(`Hello, I am interested in ${s.name} (${s.local}). Please share what you have.`)}
                  className="group flex h-full flex-col gap-2.5 rounded-lg border border-border bg-surface p-6 transition-shadow hover:shadow-md"
                >
                  <span className="flex h-[150px] items-center justify-center rounded bg-sand">
                    <GemIcon color={s.color} edge={s.edge} className="h-15 w-18" />
                  </span>
                  <div className="mt-2.5 flex items-baseline justify-between gap-3">
                    <h2 className="font-display text-[28px] text-brand-deep">{s.name}</h2>
                    <span className="text-xs font-bold tracking-[0.14em] whitespace-nowrap text-gold-ink uppercase">{s.graha}</span>
                  </div>
                  <p className="-mt-1.5 text-[15px] italic text-muted">{s.local}</p>
                  <p className="text-[15px] leading-relaxed text-muted">{s.blurb}</p>
                  <span className="mt-auto pt-2 text-sm font-bold text-brand group-hover:text-gold-ink">Enquire on WhatsApp →</span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        {/* Full set */}
        <section className="px-4 pb-20 sm:px-6">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 rounded-lg bg-brand-deep p-8 text-on-dark sm:p-10">
            <div className="min-w-0 flex-[1_1_420px]">
              <h2 className="font-display text-[34px] leading-tight">Looking for a complete Navaratna set?</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-on-dark-muted">
                We match all nine stones by size and colour and can set them in gold as a ring or pendant.
              </p>
            </div>
            <a href={whatsappLink("Hello, I am interested in a Navaratna set.")} className="btn-gold">
              <ChatIcon className="h-[18px] w-[18px]" />
              Ask about Navaratna sets
            </a>
          </div>
          <p className="mt-8 text-center text-[15px] text-muted">
            We don&apos;t sell online. See the stones at the shop, or message us and we&apos;ll share photos and prices.
          </p>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
