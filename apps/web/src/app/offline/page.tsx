import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "You're offline",
  robots: { index: false },
};

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <h1 className="text-2xl font-bold text-neutral">You&apos;re offline</h1>
      <p className="max-w-sm text-sm text-tertiary">
        Predictions and live scores need a connection to load. Reconnect and try again.
      </p>
    </div>
  );
}
