import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/dal";
import { SHOP } from "@/lib/site";
import { Brand } from "@/components/site/site-chrome";
import { CheckIcon } from "@/components/site/icons";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Staff sign in", robots: { index: false } };

const POINTS = ["Add stones with photo and measurements", "Publish to get a number and QR code", "Print the card or A4 report"];

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await getCurrentUser()) redirect("/admin");
  const { next } = await searchParams;
  return (
    <div className="flex min-h-full flex-1 flex-wrap">
      <section className="flex min-w-0 flex-[1_1_480px] flex-col justify-between gap-10 bg-brand px-6 py-10 text-on-dark sm:px-14 sm:py-14">
        <Brand onDark />
        <div>
          <p className="eyebrow text-gold-light">Staff area</p>
          <h1 className="font-display mt-4 max-w-md text-[40px] leading-[1.08] sm:text-[52px]">Create, print and manage certificates.</h1>
          <ul className="mt-7 flex flex-col gap-3 text-base text-on-dark-muted">
            {POINTS.map((p) => (
              <li key={p} className="flex items-center gap-3">
                <CheckIcon className="h-[18px] w-[18px] flex-none text-gold-light" />
                {p}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-[13px] text-on-dark-muted">
          Sherpura, Warangal · {SHOP.phoneDisplay}
        </p>
      </section>

      <main className="flex min-w-0 flex-[1_1_480px] items-center justify-center bg-background px-6 py-14">
        <div className="flex w-full max-w-[400px] flex-col gap-5">
          <div>
            <h2 className="font-display text-[40px] text-brand-deep">Sign in</h2>
            <p className="mt-1.5 text-[15px] text-muted">
              For shop staff only. Customers can{" "}
              <Link href="/#verify" className="text-brand underline">
                verify a certificate here
              </Link>
              .
            </p>
          </div>
          <LoginForm next={typeof next === "string" ? next : undefined} />
          <p className="border-t border-border pt-4 text-[13px] leading-relaxed text-muted">
            Forgot your password? Ask the shop admin to reset it. After 5 failed attempts, sign-in pauses for up to 15
            minutes.
          </p>
        </div>
      </main>
    </div>
  );
}
