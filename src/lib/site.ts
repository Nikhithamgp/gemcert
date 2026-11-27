/**
 * Shop details and marketing content for the public website.
 *
 * Name, address and phone are also stored in Lab settings (editable in /admin/settings);
 * the values here seed those settings on first run and fill in things settings
 * do not hold (hours, WhatsApp, categories).
 */

export const SHOP = {
  name: "Sri Laxmi Narasimha Gems & Jewellery",
  shortName: "Sri Laxmi Narasimha",
  tagline: "Gems & Jewellery",
  addressLines: ["9-9-28, Vishwa Karma Street", "Near Classic Snooker Parlour, Sherpura", "Warangal, Telangana 506002"],
  addressOneLine: "9-9-28, Vishwa Karma St, near Classic Snooker Parlour, Sherpura, Warangal, Telangana 506002",
  phoneDisplay: "+91 88977 58822",
  phoneTel: "+918897758822",
  whatsapp: "918897758822",
  hoursShort: "Mon–Sat, 9 AM – 10 PM",
  hoursLong: "Monday – Saturday, 9:00 AM – 10:00 PM",
  closedNote: "Closed on Sunday",
  mapsQuery: "9-9-28 Vishwa Karma St, Sherpura, Warangal, Telangana 506002",
  /** Shown in the footer only once filled in. */
  gstin: null as string | null,
  exchangePolicy:
    "Exchange and buy-back terms are explained at the time of purchase and printed on your bill. Please ask our staff for details.",
  certificatePrefix: "SLN",
} as const;

export const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(SHOP.mapsQuery)}`;
export const mapsEmbed = `https://www.google.com/maps?q=${encodeURIComponent(SHOP.mapsQuery)}&output=embed`;

export function whatsappLink(message?: string) {
  return `https://wa.me/${SHOP.whatsapp}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}

export type CategoryIcon =
  | { kind: "gem"; color: string; edge?: string }
  | { kind: "pearls" }
  | { kind: "beads" }
  | { kind: "ring" }
  | { kind: "rudraksha" }
  | { kind: "karungali" }
  | { kind: "gift" };

/** `href` sends the card to its own page; without it the card opens a WhatsApp enquiry. */
export const CATEGORIES: { name: string; blurb: string; icon: CategoryIcon; href?: string }[] = [
  { name: "Navaratna", blurb: "All nine stones, sold singly or as matched sets for rings and pendants.", icon: { kind: "gem", color: "#D4931F" }, href: "/navaratna" },
  { name: "Pearls", blurb: "Natural and cultured pearls, loose or strung, with origin and type stated.", icon: { kind: "pearls" } },
  { name: "Gold Jewellery", blurb: "Hallmarked gold rings, pendants and chains, and stone settings made to order.", icon: { kind: "ring" } },
  { name: "CZ Stones", blurb: "Cubic zirconia in all cuts, sizes and colours, clearly sold as CZ.", icon: { kind: "gem", color: "#DCE8F4", edge: "#8FA6BE" } },
  { name: "Moissanites", blurb: "Brilliant lab-created moissanite, a diamond alternative, stated as such.", icon: { kind: "gem", color: "#CFEFEA", edge: "#6FAFA6" } },
  { name: "Beads", blurb: "Gemstone and crystal beads, loose or strung into malas and bracelets.", icon: { kind: "beads" } },
  { name: "Rudraksha", blurb: "Genuine rudraksha beads by mukhi, malas and bracelets, with origin stated.", icon: { kind: "rudraksha" } },
  { name: "Karungali", blurb: "Original karungali (ebony) malas, bracelets and pendants.", icon: { kind: "karungali" } },
  { name: "Gifting Items", blurb: "Spiritual and gemstone gifts for festivals, weddings and special occasions.", icon: { kind: "gift" } },
];

export const NAVARATNA: { name: string; local: string; graha: string; color: string; edge?: string; blurb: string }[] = [
  { name: "Ruby", local: "Manikya", graha: "Sun", color: "#C0213A", blurb: "Deep red corundum, prized for rich colour and clarity. Natural or heated, always stated." },
  { name: "Pearl", local: "Moti", graha: "Moon", color: "#F7F1E6", edge: "#CDBBA2", blurb: "Soft white lustre. Natural and cultured pearls, with the type clearly stated." },
  { name: "Red Coral", local: "Moonga", graha: "Mars", color: "#E0573A", blurb: "Organic coral in red to orange-red shades, shaped as ovals, triangles and beads." },
  { name: "Emerald", local: "Panna", graha: "Mercury", color: "#1F8A5B", blurb: "Green beryl, valued for an even, vivid colour. Any oiling or treatment disclosed." },
  { name: "Yellow Sapphire", local: "Pukhraj", graha: "Jupiter", color: "#E3B320", blurb: "Golden-yellow corundum from light lemon to deep canary, in a range of sizes." },
  { name: "Diamond", local: "Heera", graha: "Venus", color: "#E6EEF5", edge: "#A9B8C6", blurb: "Natural diamonds graded for cut, colour and clarity, with carat weight on the bill." },
  { name: "Blue Sapphire", local: "Neelam", graha: "Saturn", color: "#24439A", blurb: "Blue corundum from cornflower to royal blue. Origin and treatment stated." },
  { name: "Hessonite", local: "Gomed", graha: "Rahu", color: "#C46A1E", blurb: "Honey to cinnamon-brown garnet with a warm glow, clean and well cut." },
  { name: "Cat's Eye", local: "Vaidurya", graha: "Ketu", color: "#A7A05A", blurb: "Chrysoberyl showing a sharp band of light that moves across the stone." },
];
