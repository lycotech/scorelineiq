// Fixed left-rail affiliate banner, shown only in the gutter outside
// main's max-w-6xl column — hidden below 2xl so it never overlaps page
// content on narrower desktop windows, and never shows on mobile/tablet
// where there's no room for a 120x600 creative. A plain <img>, not
// next/image: this is a pre-sized animated GIF from a third party —
// Next's image optimizer would re-encode it and drop the animation.
export function AffiliateSkyscraper() {
  return (
    <div className="pointer-events-none fixed inset-y-0 left-0 z-40 hidden w-32 items-center justify-center 2xl:flex">
      <div className="pointer-events-auto flex flex-col items-center gap-1">
        <span className="text-[10px] uppercase tracking-wide text-tertiary">Sponsored</span>
        <a href="https://www.interserver.net/r/1109312" target="_blank" rel="noopener noreferrer sponsored">
          {/* eslint-disable-next-line @next/next/no-img-element -- next/image would re-encode this and drop the GIF animation */}
          <img
            src="https://www.interserver.net/logos/Y2019-120x600-1.gif"
            alt="InterServer Web Hosting and VPS"
            width={120}
            height={600}
          />
        </a>
      </div>
    </div>
  );
}
