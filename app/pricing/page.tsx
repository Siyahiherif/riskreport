export const metadata = {
  title: "Pricing | CyberFaceX",
  description: "Pricing for CyberFaceX passive IT risk reports.",
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-5xl px-6 py-12 space-y-10">
        <div className="space-y-2">
          <p className="text-xs uppercase font-semibold text-slate-500">Pricing</p>
          <h1 className="text-3xl font-semibold">Get a clear IT security risk picture — in minutes</h1>
          <p className="text-sm text-slate-700">
            Identify email, web, and transport security risks using passive analysis. Executive-ready PDF with prioritized fixes.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 items-stretch">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:col-span-1">
            <h2 className="text-lg font-semibold text-slate-900">Free ($0)</h2>
            <p className="text-sm text-slate-600 mt-1">Preview your risk posture</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">$0</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              <li>✔ Passive IT risk score</li>
              <li>✔ Top 3 findings (on-screen)</li>
              <li>✖ No PDF download</li>
              <li>✖ No recommendations/evidence</li>
              <li>✖ No email delivery</li>
            </ul>
            <a
              className="mt-5 inline-flex w-full items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
              href="/#scan"
            >
              Get free risk score
            </a>
          </div>

          <div className="rounded-2xl border border-slate-900 bg-slate-900 p-6 shadow-lg text-white md:col-span-2 relative overflow-hidden">
            <div className="absolute right-4 top-4 rounded-full bg-amber-400 px-3 py-1 text-xs font-semibold text-slate-900 shadow-sm">Best for teams</div>
            <h2 className="text-xl font-semibold">Professional Executive Report</h2>
            <p className="text-sm text-slate-200 mt-1">Designed for founders &amp; IT managers</p>
            <p className="mt-3 text-4xl font-semibold">$99</p>
            <p className="text-xs text-slate-200">One-time payment</p>
            <ul className="mt-5 space-y-2 text-sm text-slate-100">
              <li>✔ Full executive-ready PDF (6–10 pages)</li>
              <li>✔ Business impact explained</li>
              <li>✔ Prioritized remediation steps</li>
              <li>✔ Evidence &amp; screenshots</li>
              <li>✔ 7-day secure download link</li>
            </ul>
            <a
              className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow hover:bg-slate-100"
              href="/?plan=executive"
            >
              Get Professional Report – $99 (one-time)
            </a>
            <p className="mt-3 text-xs text-slate-200">
              Unlock detailed findings, business impact, and fix priorities in a downloadable PDF.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
          <h3 className="text-lg font-semibold text-slate-900">Why teams use CyberFaceX</h3>
          <div className="grid gap-3 md:grid-cols-2 text-sm text-slate-700">
            <div>• Passive only — no intrusive scanning</div>
            <div>• No access required — external signals only</div>
            <div>• Board &amp; management-ready reporting</div>
            <div>• GDPR-friendly, zero credential collection</div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-100 p-4 text-xs text-slate-700">
          Payments are securely processed by Paddle (Merchant of Record). We never store card details.
        </div>
      </div>
    </div>
  );
}
