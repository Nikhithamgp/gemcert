import type { CategoryIcon } from "@/lib/site";

export function GemIcon({ color, edge, className }: { color: string; edge?: string; className?: string }) {
  return (
    <svg viewBox="0 0 48 40" aria-hidden="true" className={className}>
      <polygon points="10,2 38,2 46,13 24,38 2,13" fill={color} stroke={edge ?? color} strokeWidth="1" />
      <polyline points="2,13 46,13" stroke="#fff" strokeOpacity="0.55" fill="none" />
      <polyline points="10,2 16,13 24,38 32,13 38,2" stroke="#fff" strokeOpacity="0.55" fill="none" />
      <polyline points="16,13 24,2 32,13" stroke="#fff" strokeOpacity="0.55" fill="none" />
    </svg>
  );
}

function Pearl({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" className={className}>
      <circle cx="20" cy="20" r="17" fill="#F7F1E6" stroke="#CDBBA2" strokeWidth="1.4" />
      <circle cx="14" cy="13" r="5" fill="#FFFFFF" />
    </svg>
  );
}

export function PearlsIcon({ large = false }: { large?: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      <Pearl className={large ? "h-12 w-12" : "h-9 w-9"} />
      <Pearl className={large ? "h-16 w-16" : "h-13 w-13"} />
      <Pearl className={large ? "h-12 w-12" : "h-9 w-9"} />
    </span>
  );
}

export function RingIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 44" aria-hidden="true" className={className}>
      <circle cx="24" cy="28" r="13" fill="none" stroke="#C9A24B" strokeWidth="5" />
      <polygon points="18,4 30,4 34,9 24,19 14,9" fill="#C0213A" />
      <polyline points="14,9 34,9" stroke="#fff" strokeOpacity="0.6" fill="none" />
    </svg>
  );
}

/** A single rudraksha bead: brown, with mukhi (face) grooves. */
export function RudrakshaIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className={className}>
      <circle cx="24" cy="24" r="20" fill="#8A4B24" stroke="#5E3015" strokeWidth="1.5" />
      <path d="M24 4v40" stroke="#4A2410" strokeWidth="1.6" fill="none" />
      <path d="M24 4c-9 6-9 34 0 40M24 4c9 6 9 34 0 40" stroke="#4A2410" strokeWidth="1.6" fill="none" />
      <path d="M24 4c-17 6-17 34 0 40M24 4c17 6 17 34 0 40" stroke="#4A2410" strokeWidth="1.4" fill="none" />
      <circle cx="24" cy="24" r="3" fill="#F2E7D5" stroke="#4A2410" strokeWidth="1" />
      <ellipse cx="16" cy="13" rx="4" ry="2.5" fill="#fff" fillOpacity="0.2" />
    </svg>
  );
}

/** An arc of dark karungali (ebony) beads, mala-style. */
export function KarungaliIcon({ className }: { className?: string }) {
  const beads = Array.from({ length: 9 }, (_, i) => {
    const a = Math.PI * (0.1 + (0.8 * i) / 8);
    return { x: 40 - 30 * Math.cos(a), y: 10 + 24 * Math.sin(a) };
  });
  return (
    <svg viewBox="0 0 80 52" aria-hidden="true" className={className}>
      <polyline points={beads.map((b) => `${b.x},${b.y}`).join(" ")} stroke="#C9A24B" strokeWidth="1.2" fill="none" />
      {beads.map((b, i) => (
        <g key={i}>
          <circle cx={b.x} cy={b.y} r="5.2" fill="#1E1A17" />
          <circle cx={b.x - 1.6} cy={b.y - 1.8} r="1.4" fill="#fff" fillOpacity="0.35" />
        </g>
      ))}
    </svg>
  );
}

/** A wrapped gift box with a gold ribbon. */
export function GiftIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className={className}>
      <rect x="6" y="20" width="36" height="24" rx="2" fill="#7A1F2B" />
      <rect x="3" y="13" width="42" height="9" rx="2" fill="#962737" />
      <rect x="21" y="13" width="6" height="31" fill="#C9A24B" />
      <path d="M24 13c-4-8-14-8-12-2 1 3 7 2 12 2zM24 13c4-8 14-8 12-2-1 3-7 2-12 2z" fill="none" stroke="#C9A24B" strokeWidth="2.4" strokeLinejoin="round" />
    </svg>
  );
}

/** A short strand of coloured gemstone beads. */
export function BeadsIcon({ className }: { className?: string }) {
  const colors = ["#C0213A", "#D4931F", "#24806A", "#24439A", "#7B45B5", "#E0573A", "#1F8A5B"];
  const beads = colors.map((color, i) => {
    const a = Math.PI * (0.1 + (0.8 * i) / (colors.length - 1));
    return { x: 40 - 30 * Math.cos(a), y: 10 + 24 * Math.sin(a), color };
  });
  return (
    <svg viewBox="0 0 80 52" aria-hidden="true" className={className}>
      <polyline points={beads.map((b) => `${b.x},${b.y}`).join(" ")} stroke="#C9A24B" strokeWidth="1.2" fill="none" />
      {beads.map((b, i) => (
        <g key={i}>
          <circle cx={b.x} cy={b.y} r="6" fill={b.color} />
          <circle cx={b.x - 1.8} cy={b.y - 2} r="1.6" fill="#fff" fillOpacity="0.45" />
        </g>
      ))}
    </svg>
  );
}

export function CategoryIconView({ icon }: { icon: CategoryIcon }) {
  if (icon.kind === "pearls") return <PearlsIcon />;
  if (icon.kind === "beads") return <BeadsIcon className="h-17 w-26" />;
  if (icon.kind === "ring") return <RingIcon className="h-18 w-20" />;
  if (icon.kind === "rudraksha") return <RudrakshaIcon className="h-17 w-17" />;
  if (icon.kind === "karungali") return <KarungaliIcon className="h-17 w-26" />;
  if (icon.kind === "gift") return <GiftIcon className="h-17 w-17" />;
  return <GemIcon color={icon.color} edge={icon.edge} className="h-15 w-18" />;
}

/** Stroke icons (24px grid). */
export function ShieldCheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z" />
      <path d="M8.5 12l2.5 2.5 4.5-5" />
    </svg>
  );
}

export function ChatIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.4A8.4 8.4 0 1 1 21 11.5z" />
    </svg>
  );
}

export function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2z" />
    </svg>
  );
}

export function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}
