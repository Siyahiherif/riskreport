'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

const perks = [
  "Passive-only checks - no port scans or intrusive probes.",
  "Email security (SPF/DMARC) + TLS + web headers in one score.",
  "Management-ready PDF with business impact and 30-day actions.",
];

const howItWorks = [
  { title: "Enter your domain", desc: "No login required. We normalize and validate your hostname (IDN-safe)." },
  { title: "Passive assessment", desc: "DNS, HTTPS/TLS handshake, HTTP headers, and redirects only." },
  { title: "Download PDF", desc: "Executive-ready report with prioritized fixes and evidence." },
];

export default function Home() {
  const [domain, setDomain] = useState("");
  const [emailOptIn, setEmailOptIn] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain, emailOptIn: emailOptIn || undefined }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error ?? "Scan failed");
      }
      if (json.scanId) {
        router.push(`/scan/${json.scanId}`);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900">
      <header className="mx-auto flex max-w-6xl flex-col gap-10 px-6 pb-20 pt-16 md:flex-row md:items-center md:gap-16">
        <div className="flex-1 space-y-6">
          <p className="inline-block rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
            Passive IT Risk Report
          </p>
          <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
            Get a clear IT security risk score for your company in minutes.
          </h1>
          <p className="max-w-2xl text-lg text-slate-700">
            Passive, non-intrusive analysis for email security, TLS configuration and web security headers. No active scanning.
            Management-ready PDF with prioritized fixes.
          </p>
          <form onSubmit={onSubmit} className="flex flex-col gap-3 rounded-2xl bg-white/80 p-4 shadow-lg ring-1 ring-slate-200 sm:flex-row sm:items-center">
            <input
              type="text"
              required
              placeholder="example.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-slate-900 px-6 py-3 text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Scanning..." : "Get Free Score"}
            </button>
            <a
              className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-lg"
              href="#pricing"
            >
              Executive Report ($99)
            </a>
          </form>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
        <div className="flex-1">
          <label className="text-xs font-semibold text-slate-700">Get the PDF link by email (optional)</label>
          <div className="mt-1 flex items-center gap-2">
            <input
              type="email"
              placeholder="you@company.com"
              value={emailOptIn}
              onChange={(e) => setEmailOptIn(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            />
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">Optional</span>
          </div>
          <p className="mt-1 text-xs text-slate-600">
            We email the download link to you. No marketing spam. If empty, you can still view the free score on screen.
          </p>
        </div>
      </div>
          <ul className="grid gap-2 md:grid-cols-2">
            {perks.map((perk) => (
              <li key={perk} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="mt-1 h-2 w-2 rounded-full bg-green-600" />
                <span>{perk}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex-1 rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Sample Output</p>
              <p className="text-4xl font-semibold">Risk Score 72</p>
              <p className="text-sm text-amber-600">Moderate</p>
            </div>
            <div className="rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white">Passive only</div>
          </div>
          <div className="mt-6 space-y-3">
            <div className="rounded-xl border border-slate-100 p-3">
              <p className="text-sm font-semibold text-slate-900">Top Risks</p>
              <ul className="mt-2 space-y-1 text-sm text-slate-700">
                <li>- DMARC policy missing (invoice fraud risk)</li>
                <li>- HTTP not forced to HTTPS</li>
                <li>- HSTS and CSP headers absent</li>
              </ul>
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm text-slate-700">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs uppercase text-slate-500">Email Security</p>
                <p className="text-xl font-semibold">58</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs uppercase text-slate-500">Transport</p>
                <p className="text-xl font-semibold">80</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs uppercase text-slate-500">Web</p>
                <p className="text-xl font-semibold">70</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-16 px-6 pb-24">
        <section className="grid gap-8 rounded-3xl bg-white p-8 shadow-lg ring-1 ring-slate-200 md:grid-cols-3">
          <div>
            <p className="text-sm font-semibold uppercase text-slate-500">How it works</p>
            <h2 className="text-2xl font-semibold text-slate-900">3 steps to your risk report</h2>
          </div>
          {howItWorks.map((item) => (
            <div key={item.title} className="space-y-2 rounded-2xl bg-slate-50 p-4">
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="text-sm text-slate-700">{item.desc}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-8 md:grid-cols-2">
          <div className="rounded-3xl bg-white p-8 shadow-lg ring-1 ring-slate-200">
            <p className="text-sm font-semibold uppercase text-slate-500">What&apos;s inside</p>
            <h2 className="text-2xl font-semibold text-slate-900">Checks we run</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-700">
              <li>- Email Security: SPF, DMARC policy, MX presence, DKIM note.</li>
              <li>- TLS: HTTPS reachability, certificate validity, expiry countdown.</li>
              <li>- Web Security: HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Server header.</li>
              <li>- Hygiene: HTTP-&gt;HTTPS redirect, www/non-www consistency, homepage status.</li>
            </ul>
          </div>
          <div className="rounded-3xl bg-slate-900 p-8 text-white shadow-xl">
            <h2 className="text-2xl font-semibold">Management-ready PDF</h2>
            <p className="mt-3 text-sm text-slate-200">
              Executive summary, category scores, top 3 risks, and a 30-day action plan. Detailed findings include evidence, business impact, and remediation steps.
            </p>
            <a
              href="#pricing"
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-slate-900 font-semibold shadow-lg transition hover:-translate-y-0.5"
            >
              View pricing
            </a>
            <p className="mt-4 text-xs uppercase tracking-[0.15em] text-slate-300">
              Passive assessment - No port scans - No Shodan
            </p>
          </div>
        </section>

        <section id="pricing" className="rounded-3xl bg-white p-8 shadow-lg ring-1 ring-slate-200">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase text-slate-500">Pricing</p>
              <h2 className="text-2xl font-semibold text-slate-900">Choose your report</h2>
              <p className="text-sm text-slate-700">Free for top 3 risks; upgrade for full PDF and prioritized fixes.</p>
            </div>
            <div className="text-sm text-slate-600">
              Payments are handled by our authorized Merchant of Record. No company required.
            </div>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              { title: "Free", price: "$0", cta: "Get free score", features: ["Overall + category scores", "Top 3 findings", "24h cache"], highlight: false },
              { title: "Executive", price: "$99", cta: "Get Executive Report", features: ["Executive summary (1 page)", "Business impact + evidence", "30-day action plan", "Full findings (10-20)", "PDF (6-10 pages)"], highlight: true },
              { title: "Pro (optional)", price: "$49", cta: "See Pro details", features: ["Full findings + evidence", "Prioritized remediation", "PDF (5-8 pages)"], highlight: false },
            ].map((plan) => (
              <div
                key={plan.title}
                className={`rounded-2xl border p-6 shadow-sm ${plan.highlight ? "border-slate-900 bg-slate-900 text-white shadow-xl" : "border-slate-200 bg-white"}`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">{plan.title}</h3>
                  {plan.highlight && (
                    <span className="rounded-full bg-white/15 px-3 py-1 text-xs uppercase tracking-wide">
                      Best for mgmt
                    </span>
                  )}
                </div>
                <p className="mt-4 text-3xl font-semibold">{plan.price}</p>
                <ul className="mt-4 space-y-2 text-sm text-slate-200 md:text-slate-700">
                  {plan.features.map((f) => (
                    <li key={f} className={plan.highlight ? "text-slate-100" : "text-slate-700"}>
                      - {f}
                    </li>
                  ))}
                </ul>
                <button
                  className={`mt-6 w-full rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    plan.highlight
                      ? "bg-white text-slate-900 hover:-translate-y-0.5 hover:shadow-lg"
                      : "bg-slate-900 text-white hover:-translate-y-0.5 hover:shadow-lg"
                  }`}
                  type="button"
                  onClick={() => router.push("/#pricing")}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-slate-600">
            Guarantee: If we can&apos;t generate a report for your domain, you&apos;ll be refunded automatically.
          </p>
        </section>

        <section className="grid gap-6 rounded-3xl bg-white p-8 shadow-lg ring-1 ring-slate-200 md:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase text-slate-500">Trust</p>
            <h2 className="text-2xl font-semibold text-slate-900">Designed for teams without a SOC</h2>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              <li>- Passive analysis only - safe to run without approvals.</li>
              <li>- Clear, management-ready wording for stakeholders.</li>
              <li>- Cache keeps costs low; 24h reuse on the same domain.</li>
              <li>- Built for IT Managers, SysAdmins, and founders who need a management-ready summary.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-dashed border-slate-200 p-6">
            <p className="text-sm font-semibold text-slate-900">Sample report</p>
            <p className="mt-2 text-sm text-slate-700">
              See what your leadership will receive: executive summary, category scores, and prioritized remediation.
            </p>
            <Link
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5"
              href="/api/report/sample"
              target="_blank"
              rel="noopener noreferrer"
            >
              View sample PDF
            </Link>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-8 shadow-lg ring-1 ring-slate-200">
          <h2 className="text-2xl font-semibold text-slate-900">FAQ</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              { q: "Is this a penetration test?", a: "No. It is a passive security assessment using public signals only." },
              { q: "Do you scan ports?", a: "No. We only inspect DNS, HTTPS/TLS handshake, HTTP headers, and redirects." },
              { q: "How accurate is it?", a: "Findings reflect best-practice configuration from passive data - no exploitation attempts." },
              { q: "How long does it take?", a: "Typically 10-30 seconds. Paid users get cached results instantly when available." },
            ].map((item) => (
              <div key={item.q} className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">{item.q}</p>
                <p className="mt-2 text-sm text-slate-700">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-6 rounded-3xl bg-white p-8 shadow-lg ring-1 ring-slate-200">
          <h2 className="text-2xl font-semibold text-slate-900">What is a Passive IT Security Risk Assessment?</h2>
          <p className="text-sm text-slate-700">
            We analyze publicly observable signals only: DNS, TLS/HTTPS handshake, HTTP response headers, and redirect behavior. No intrusive scans, no port probing, no authentication attempts.
          </p>
          <h3 className="text-xl font-semibold text-slate-900">Email Security Risks We Detect (SPF, DMARC, DKIM)</h3>
          <p className="text-sm text-slate-700">We check SPF presence, DMARC policy strength, and DKIM alignment notes to surface spoofing and invoice fraud risks.</p>
          <h3 className="text-xl font-semibold text-slate-900">TLS & HTTPS Configuration Issues Explained</h3>
          <p className="text-sm text-slate-700">We verify HTTPS reachability, certificate validity, expiry countdown, and HTTP→HTTPS enforcement to prevent downgrade risks.</p>
          <h3 className="text-xl font-semibold text-slate-900">Web Security Headers That Impact Your Risk Score</h3>
          <p className="text-sm text-slate-700">HSTS, CSP, X-Frame-Options, X-Content-Type-Options, and Referrer-Policy are evaluated to reduce browser-based attack exposure.</p>
          <h3 className="text-xl font-semibold text-slate-900">Who Is This Report For?</h3>
          <p className="text-sm text-slate-700">IT Managers, founders, and security owners who need a management-ready summary without intrusive scans.</p>
        </section>
      </main>
      <footer className="border-t border-slate-200 bg-white/90 backdrop-blur py-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 text-sm text-slate-600">
          <div>CyberFaceX Passive IT Risk Intelligence</div>
          <div className="flex items-center gap-3">
            <a className="underline hover:text-slate-900" href="/privacy">Privacy Policy</a>
            <span>•</span>
            <a className="underline hover:text-slate-900" href="/cookie">Cookie Policy</a>
            <span>•</span>
            <a className="underline hover:text-slate-900" href="/terms">Terms of Service</a>
            <span>•</span>
            <a className="underline hover:text-slate-900" href="/pricing">Pricing</a>
            <span>•</span>
            <a className="underline hover:text-slate-900" href="/refund">Refund Policy</a>
            <span>•</span>
            <a className="underline hover:text-slate-900" href="/blog">Blog</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
