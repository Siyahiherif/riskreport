export const metadata = {
  title: "Terms of Service | CyberFaceX",
  description: "Terms of Service for CyberFaceX Passive IT Risk Intelligence.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-3xl px-6 py-12 space-y-6">
        <div>
          <p className="text-xs uppercase font-semibold text-slate-500">Terms of Service</p>
          <h1 className="text-3xl font-semibold">CyberFaceX Terms of Service</h1>
        </div>

        <p className="text-sm text-slate-700">
          By using https://cyberfacex.com, you agree to the following terms.
        </p>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">1. Service Description</h2>
          <p className="text-sm text-slate-700">
            CyberFaceX provides passive IT risk intelligence reports based solely on publicly observable data.
          </p>
          <p className="text-sm text-slate-700">The service does not:</p>
          <ul className="list-disc text-sm text-slate-700 pl-5 space-y-1">
            <li>Replace penetration testing</li>
            <li>Guarantee absence of vulnerabilities</li>
            <li>Provide exploitation or intrusion services</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">2. Authorized Use</h2>
          <p className="text-sm text-slate-700">You confirm that:</p>
          <ul className="list-disc text-sm text-slate-700 pl-5 space-y-1">
            <li>You own or are authorized to analyze the submitted domain</li>
            <li>You will not use reports for unlawful purposes</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">3. Limitation of Liability</h2>
          <p className="text-sm text-slate-700">CyberFaceX is not liable for:</p>
          <ul className="list-disc text-sm text-slate-700 pl-5 space-y-1">
            <li>Business decisions based on the report</li>
            <li>Incomplete public data</li>
            <li>Security incidents unrelated to our analysis</li>
          </ul>
          <p className="text-sm text-slate-700">Reports are informational only.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">4. Payments & Refunds</h2>
          <p className="text-sm text-slate-700">Paid reports are processed via third-party providers.</p>
          <p className="text-sm text-slate-700">Refunds apply only if a report cannot be generated.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">5. Changes</h2>
          <p className="text-sm text-slate-700">We may update these terms at any time.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">6. Contact</h2>
          <p className="text-sm text-slate-700">info@cyberfacex.com</p>
        </section>
      </div>
    </div>
  );
}
