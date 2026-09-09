"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "Today's Predictions" },
  { href: "/accuracy", label: "Model Accuracy & Backtests" },
  { href: "/how-it-works", label: "How It Works" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight text-neutral">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-sm font-bold text-white">
            S
          </span>
          ScorelineIQ
        </Link>
        <nav className="flex flex-1 flex-wrap items-center gap-1 text-sm font-medium">
          {NAV_LINKS.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/" ||
                  pathname.startsWith("/predictions") ||
                  pathname.startsWith("/match") ||
                  pathname.startsWith("/league")
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={
                  isActive
                    ? "rounded-md bg-primary px-3 py-1.5 text-white"
                    : "rounded-md px-3 py-1.5 text-tertiary hover:bg-background hover:text-neutral"
                }
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
