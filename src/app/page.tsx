/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { getLabSettings } from "@/lib/settings";
import { CATEGORIES, NAVARATNA, SHOP, mapsEmbed, mapsLink, whatsappLink } from "@/lib/site";
import { SiteFooter, SiteHeader } from "@/components/site/site-chrome";
import { CategoryIconView, ChatIcon, GemIcon, PearlsIcon, RingIcon, ShieldCheckIcon } from "@/components/site/icons";
import { LookupForm } from "@/components/public/lookup-form";

const TRUST = [
  {
    title: "Certificate with QR",
    body: "Each certified gemstone gets a printed card with photo, weight and properties, plus a QR code anyone can scan to check it.",
  },
  {
    title: "Verify any time",
    body: "Your certificate stays checkable on this website. If a record is ever corrected, the page points to the new number.",
  },
  {
    title: "Honest disclosure",
    body: "Natural, heated or treated: we tell you exactly what you are buying, with carat weight and origin on the bill.",
  },
  { title: "Exchange policy", body: SHOP.exchangePolicy },
];

export default async function HomePage() {
  const settings = await getLabSettings();
  const example = `${settings.certificatePrefix}-${new Date().getFullYear()}-000123`;

  return (
    <div className="flex min-h-full flex-1 flex-col bg-background">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-brand text-on-dark">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-12 px-4 pt-14 pb-28 sm:px-6 sm:pt-20 sm:pb-32">
            <div className="min-w-0 flex-[1_1_460px]">
              <p className="eyebrow text-gold-light">A family gem house · Warangal</p>
              <h1 className="font-display mt-5 text-[44px] leading-[1.04] sm:text-[64px]">
                Genuine gemstones &amp; gold, chosen with care and certified for you.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-on-dark-muted">
                Precious, semi-precious and natural stones, pearls, gold jewellery and complete Navaratna sets. Every
                certified gemstone comes with a card you can verify online in seconds.
              </p>
              <div className="mt-9 flex flex-wrap gap-3.5">
                <Link href="#collection" className="btn-gold">
                  Browse collection
                </Link>
                <a href={whatsappLink("Hello, I would like to know more about your stones.")} className="btn-outline-light">
                  <ChatIcon className="h-[18px] w-[18px]" />
                  Ask on WhatsApp
                </a>
              </div>
            </div>
            <div className="flex min-w-0 flex-[1_1_380px] justify-center">
              <img
                src="/logo.webp"
                alt="Sri Lakshmi Narasimha Swamy"
                width={900}
                height={815}
                className="h-auto w-full max-w-[460px]"
              />
            </div>
          </div>
        </section>

        {/* Verify band */}
        <section id="verify" className="scroll-mt-6 px-4 sm:px-6">
          <div className="relative mx-auto -mt-16 flex max-w-5xl flex-wrap items-center gap-x-12 gap-y-7 rounded-lg border border-border bg-surface px-6 py-8 shadow-[0_18px_40px_rgba(14,12,10,0.14)] sm:px-10 sm:py-9">
            <div className="flex min-w-0 flex-[1_1_340px] items-start gap-4">
              <span className="flex h-14 w-14 flex-none items-center justify-center rounded-full bg-sand text-brand">
                <ShieldCheckIcon className="h-7 w-7" />
              </span>
              <div>
                <h2 className="font-display text-[32px] leading-tight text-brand-deep">Verify your certificate</h2>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">
                  Scan the QR code on your card with your phone camera, or type the certificate number printed on it.
                </p>
              </div>
            </div>
            <div className="min-w-0 flex-[1_1_420px]">
              <LookupForm example={example} size="lg" />
            </div>
          </div>
        </section>

        {/* Categories */}
        <section id="collection" className="scroll-mt-6 px-4 pt-24 pb-22 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <p className="eyebrow text-center">Our collection</p>
            <h2 className="font-display mt-3 mb-12 text-center text-[40px] text-brand-deep sm:text-5xl">Shop by category</h2>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
              {CATEGORIES.map((c) => {
                const cardClass =
                  "group flex flex-col gap-2.5 rounded-lg border border-border bg-surface p-6 transition-shadow hover:shadow-md";
                const body = (
                  <>
                    <span className="flex h-[170px] items-center justify-center rounded bg-sand">
                      <CategoryIconView icon={c.icon} />
                    </span>
                    <h3 className="font-display mt-2.5 text-[28px] text-brand-deep">{c.name}</h3>
                    <p className="text-[15px] leading-relaxed text-muted">{c.blurb}</p>
                    <span className="mt-auto pt-2 text-sm font-bold text-brand group-hover:text-gold-ink">
                      {c.href ? "View all types →" : "Enquire on WhatsApp →"}
                    </span>
                  </>
                );
                return c.href ? (
                  <Link key={c.name} href={c.href} className={cardClass}>
                    {body}
                  </Link>
                ) : (
                  <a
                    key={c.name}
                    href={whatsappLink(`Hello, I am interested in ${c.name}. Please share what you have.`)}
                    className={cardClass}
                  >
                    {body}
                  </a>
                );
              })}
            </div>
            <p className="mt-8 text-center text-[15px] text-muted">
              We don&apos;t sell online. See the stones at the shop, or message us and we&apos;ll share photos and prices.
            </p>
          </div>
        </section>

        {/* Pearls & Gold */}
        <section id="pearls-gold" className="scroll-mt-6 px-4 pb-24 sm:px-6">
          <div className="mx-auto grid max-w-6xl grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] gap-6">
            <div className="flex flex-wrap items-center gap-7 rounded-lg bg-brand-deep p-8 text-on-dark sm:p-10">
              <div className="min-w-0 flex-[1_1_240px]">
                <p className="eyebrow text-gold-light">Pearls</p>
                <h3 className="font-display mt-2.5 mb-3 text-[34px] leading-tight">Moon&apos;s gem, chosen by lustre</h3>
                <p className="mb-5 text-[15px] leading-relaxed text-on-dark-muted">
                  Basra, South Sea and freshwater pearls. We tell you whether each pearl is natural or cultured.
                </p>
                <a href={whatsappLink("Hello, I am interested in pearls.")} className="text-[15px] font-bold text-gold-light">
                  Enquire about pearls →
                </a>
              </div>
              <span className="flex h-[170px] flex-[0_1_200px] items-center justify-center rounded-md bg-white/5">
                <PearlsIcon large />
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-7 rounded-lg bg-sand p-8 sm:p-10">
              <div className="min-w-0 flex-[1_1_240px]">
                <p className="eyebrow">Gold jewellery</p>
                <h3 className="font-display mt-2.5 mb-3 text-[34px] leading-tight text-brand-deep">Your stone, set in gold</h3>
                <p className="mb-5 text-[15px] leading-relaxed text-muted">
                  Rings, pendants and lockets in hallmarked gold. Bring your own stone, or choose one from us.
                </p>
                <a href={whatsappLink("Hello, I am interested in gold jewellery.")} className="text-[15px] font-bold text-brand">
                  Enquire about jewellery →
                </a>
              </div>
              <span className="flex h-[170px] flex-[0_1_200px] items-center justify-center rounded-md bg-white/60">
                <RingIcon className="h-24 w-26" />
              </span>
            </div>
          </div>
        </section>

        {/* Navaratna */}
        <section id="navaratna" className="scroll-mt-6 bg-sand px-4 py-22 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
              <div className="min-w-0 flex-[1_1_520px]">
                <p className="eyebrow">Navaratna</p>
                <h2 className="font-display mt-3 mb-3 text-[40px] text-brand-deep sm:text-5xl">The nine sacred stones</h2>
                <p className="max-w-xl leading-relaxed text-muted">
                  Each stone is traditionally linked to one of the nine grahas. Buy individually or as a matched set for
                  rings and pendants.
                </p>
              </div>
              <Link
                href="/navaratna"
                className="rounded border border-brand px-5 py-3 font-bold text-brand hover:bg-brand hover:text-on-dark"
              >
                View all nine stones
              </Link>
            </div>
            <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-9 lg:gap-3.5">
              {NAVARATNA.map((s) => (
                <li
                  key={s.name}
                  className="flex flex-col items-center gap-1.5 rounded-md border border-[#e5d9c4] bg-[#fffdf8] px-2.5 py-5 text-center"
                >
                  <GemIcon color={s.color} edge={s.edge} className="h-9 w-10" />
                  <span className="mt-1.5 text-[15px] font-bold text-brand-deep">{s.name}</span>
                  <span className="text-[13px] text-muted">{s.graha}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Trust */}
        <section className="px-4 py-24 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <p className="eyebrow text-center">Why families trust us</p>
            <h2 className="font-display mt-3 mb-14 text-center text-[40px] text-brand-deep sm:text-5xl">What you get with every stone</h2>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-10">
              {TRUST.map((t) => (
                <div key={t.title} className="border-t-2 border-brand pt-5">
                  <h3 className="font-display mb-2.5 text-[26px] text-brand-deep">{t.title}</h3>
                  <p className="text-[15px] leading-relaxed text-muted">{t.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Visit */}
        <section id="visit" className="scroll-mt-6 bg-brand px-4 py-22 text-on-dark sm:px-6">
          <div className="mx-auto flex max-w-6xl flex-wrap items-stretch gap-12">
            <div className="min-w-0 flex-[1_1_420px]">
              <p className="eyebrow text-gold-light">Visit the shop</p>
              <h2 className="font-display mt-3 mb-7 text-[40px] sm:text-5xl">See the stones in person</h2>
              <address className="text-[17px] leading-loose text-on-dark-muted not-italic">
                {SHOP.addressLines.map((l) => (
                  <span key={l} className="block">
                    {l}
                  </span>
                ))}
              </address>
              <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-5 gap-y-2">
                <dt className="text-gold-light">Hours</dt>
                <dd>
                  {SHOP.hoursLong}
                  <span className="block text-sm text-on-dark-muted">{SHOP.closedNote}</span>
                </dd>
                <dt className="text-gold-light">Phone</dt>
                <dd>
                  <a href={`tel:${SHOP.phoneTel}`} className="font-bold text-on-dark underline">
                    {SHOP.phoneDisplay}
                  </a>
                </dd>
              </dl>
              <div className="mt-8 flex flex-wrap gap-3.5">
                <a href={mapsLink} className="btn-gold" target="_blank" rel="noreferrer">
                  Get directions
                </a>
                <a href={`tel:${SHOP.phoneTel}`} className="btn-outline-light">
                  Call the shop
                </a>
                <a href={whatsappLink()} className="btn-outline-light">
                  WhatsApp
                </a>
              </div>
            </div>
            <div className="min-h-[340px] min-w-0 flex-[1_1_420px] overflow-hidden rounded-md border border-white/15 bg-brand-deep">
              <iframe
                title={`Map showing ${SHOP.name}`}
                src={mapsEmbed}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-full min-h-[340px] w-full border-0"
              />
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
