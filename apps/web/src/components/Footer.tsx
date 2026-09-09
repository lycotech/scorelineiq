import Link from "next/link";

const FOOTER_LINKS = [
  { href: "/about", label: "About" },
  { href: "/how-it-works", label: "How predictions are made" },
  { href: "/responsible-gambling", label: "Responsible gambling" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

export function Footer() {
  return (
    <footer className="border-t border-blue-100 bg-blue-50">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-8 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>&copy; {new Date().getFullYear()} ScorelineIQ. Statistical analysis, not betting advice.</p>
        <nav className="flex flex-wrap gap-4">
          {FOOTER_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-blue-700">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
