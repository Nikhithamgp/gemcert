import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Mulish } from "next/font/google";
import { SHOP } from "@/lib/site";
import "./globals.css";

// All pages read live data (lab settings, certificate status, sessions).
export const dynamic = "force-dynamic";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
  variable: "--font-cormorant",
});
const body = Mulish({ subsets: ["latin"], display: "swap", variable: "--font-mulish" });

export const metadata: Metadata = {
  title: { default: SHOP.name, template: `%s · ${SHOP.shortName}` },
  description: `Genuine gemstones, pearls, gold jewellery and Navaratna sets in Warangal. Verify your ${SHOP.shortName} gemstone certificate online.`,
  icons: { icon: "/logo-icon.png", apple: "/logo-icon.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#7a3f49",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`h-full antialiased ${display.variable} ${body.variable}`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
