import Link from "next/link";

const navItems = [
  { href: "/", label: "Risk Report" },
  { href: "/compliance", label: "Compliance Readiness" },
  { href: "/blog", label: "Blog" },
  { href: "/pricing", label: "Pricing" },
];

export default function SiteHeader() {
  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
        <Link href="/" className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-900">
          CyberFaceX
        </Link>
        <nav className="flex flex-wrap items-center gap-4 text-sm font-semibold text-slate-700">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-slate-900">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
