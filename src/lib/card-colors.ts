/**
 * Header colours a certificate card can use, chosen per certificate from a dropdown.
 * Shared by the admin form (client) and the print layouts. `null` / "" = shop default
 * (the primary colour from Shop settings).
 *
 * To tweak a shade, change `bg` here. `text` is the header text colour that stays
 * readable on that background.
 */
export const CARD_COLORS = [
  { value: "yellow", label: "Yellow", bg: "#e8b400", text: "#1f1a0e" },
  { value: "blue", label: "Blue", bg: "#1f4e9e", text: "#ffffff" },
  { value: "brown", label: "Brown", bg: "#7a4a23", text: "#ffffff" },
  { value: "grey", label: "Grey / Ash", bg: "#6b7075", text: "#ffffff" },
  { value: "green", label: "Green", bg: "#1e7a46", text: "#ffffff" },
  { value: "white", label: "White", bg: "#ffffff", text: "#1f1a0e", border: "#d9d4ca" },
  { value: "pink", label: "Pink", bg: "#9e2a5b", text: "#ffffff" },
  { value: "red", label: "Red", bg: "#b71c1c", text: "#ffffff" },
] as const;

export type CardColorValue = (typeof CARD_COLORS)[number]["value"];

export const CARD_COLOR_VALUES = CARD_COLORS.map((c) => c.value) as [CardColorValue, ...CardColorValue[]];

export type CardTheme = { bg: string; text: string; border?: string };

/** Header theme for a certificate: the chosen colour, or the shop's primary colour. */
export function cardTheme(value: string | null | undefined, shopPrimary: string): CardTheme {
  const c = CARD_COLORS.find((x) => x.value === value);
  if (!c) return { bg: shopPrimary, text: "#ffffff" };
  return { bg: c.bg, text: c.text, border: "border" in c ? c.border : undefined };
}
