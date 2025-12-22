export const metadata = {
  title: "Cookie Policy | CyberFaceX",
  description: "Cookie Policy for CyberFaceX Passive IT Risk Intelligence.",
};

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-3xl px-6 py-12 space-y-6">
        <div>
          <p className="text-xs uppercase font-semibold text-slate-500">Cookie Policy</p>
          <h1 className="text-3xl font-semibold">CyberFaceX Cookie Policy</h1>
        </div>

        <p className="text-sm text-slate-700">
          CyberFaceX uses cookies and similar technologies to ensure proper functionality and improve user experience.
        </p>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">1. What Are Cookies?</h2>
          <p className="text-sm text-slate-700">Cookies are small text files stored on your device when visiting a website.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">2. Types of Cookies We Use</h2>
          <p className="text-sm font-semibold">Essential Cookies (Always Active)</p>
          <ul className="list-disc text-sm text-slate-700 pl-5 space-y-1">
            <li>Required for website operation</li>
            <li>Security and abuse prevention</li>
            <li>Report delivery flow</li>
          </ul>
          <p className="text-sm font-semibold">Analytics Cookies (Optional)</p>
          <ul className="list-disc text-sm text-slate-700 pl-5 space-y-1">
            <li>Used to understand website usage</li>
            <li>Activated only after consent</li>
            <li>Aggregated, non-identifying data</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">3. Managing Cookies</h2>
          <p className="text-sm text-slate-700">
            You can accept or reject non-essential cookies via the cookie banner and change preferences anytime.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">4. Third-Party Cookies</h2>
          <p className="text-sm text-slate-700">
            Some services (analytics, payments) may set cookies in accordance with their own policies.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">5. Contact</h2>
          <p className="text-sm text-slate-700">For questions: info@cyberfacex.com</p>
        </section>
      </div>
    </div>
  );
}
