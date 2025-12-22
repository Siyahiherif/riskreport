export const metadata = {
  title: "Pricing | CyberFaceX",
  description: "Pricing for CyberFaceX passive IT risk reports.",
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-4xl px-6 py-12 space-y-8">
        <div>
          <p className="text-xs uppercase font-semibold text-slate-500">Pricing</p>
          <h1 className="text-3xl font-semibold">Choose your report</h1>
          <p className="text-sm text-slate-700 mt-2">
            Passive IT risk scoring with executive-ready PDF reports. Payments processed via third-party providers.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Free</h2>
            <p className="mt-2 text-3xl font-semibold">$0</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              <li>- Passive IT risk score</li>
              <li>- Limited findings (on-screen)</li>
              <li>- No account required</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Professional Report</h2>
            <p className="mt-2 text-3xl font-semibold">$99</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              <li>- Full executive PDF report</li>
              <li>- Detailed findings and recommendations</li>
              <li>- 7-day secure download link</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
