import Link from "next/link";

const NAV_LINKS = [
  { href: "/accuracy", label: "Accuracy" },
  { href: "/how-it-works", label: "How it works" },
];

export function Header() {
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          ScorelineIQ
        </Link>
        <nav className="flex gap-5 text-sm text-zinc-600 dark:text-zinc-400">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-zinc-950 dark:hover:text-zinc-50">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
