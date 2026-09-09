// Fixed-height reserved space for a future ad unit. No ad network is
// wired in yet (Phase 4) — this exists now so Core Web Vitals (CLS)
// aren't affected later when a real ad script starts filling it.
export function AdSlot({ height = 250, label }: { height?: number; label?: string }) {
  return (
    <div
      style={{ minHeight: height }}
      className="flex items-center justify-center rounded border border-dashed border-zinc-300 bg-zinc-50 text-xs text-zinc-400"
      aria-hidden="true"
    >
      {label ?? "Ad slot reserved"}
    </div>
  );
}
