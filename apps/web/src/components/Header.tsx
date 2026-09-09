import Link from "next/link";

const NAV_LINKS = [
  { href: "/accuracy", label: "Accuracy" },
  { href: "/how-it-works", label: "How it works" },
];

export function Header() {
  return (
    <header className="bg-blue-700">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight text-white">
          ScorelineIQ
        </Link>
        <nav className="flex gap-5 text-sm text-blue-100">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-white">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
