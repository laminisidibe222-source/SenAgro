import { Sprout } from "lucide-react";

/** Brand tile — gold gradient square with the sprout glyph. */
export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-xl bg-gradient-to-br from-gold-300 via-gold-400 to-gold-500 text-[#2a1f05] shadow-[0_6px_16px_-8px_rgba(180,138,24,0.9)]"
      style={{ width: size, height: size }}
    >
      <Sprout size={Math.round(size * 0.55)} strokeWidth={2.2} />
    </span>
  );
}

/** Wordmark — "Sen" in ink, "Agro" in gold, sized relative to the tile. */
export function Logo({ size = 36 }: { size?: number }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark size={size} />
      <span className="font-display font-bold tracking-tight" style={{ fontSize: Math.round(size * 0.62) }}>
        Sen<span className="text-accent">Agro</span>
      </span>
    </span>
  );
}
