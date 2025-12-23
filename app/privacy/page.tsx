import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | CyberFaceX",
  description: "Privacy Policy for CyberFaceX Passive IT Risk Intelligence.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-3xl px-6 py-12 space-y-6">
        <div>
          <p className="text-xs uppercase font-semibold text-slate-500">Privacy Policy</p>
          <h1 className="text-3xl font-semibold">CyberFaceX Privacy Policy</h1>
          <p className="text-sm text-slate-600">Last updated: December 2025</p>
        </div>

        <p className="text-sm text-slate-700">
          CyberFaceX (“we”, “our”, “us”) respects your privacy and is committed to protecting personal data. This Privacy Policy
          explains how information is collected, used, and protected when you use https://cyberfacex.com.
        </p>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">1. Information We Collect</h2>
          <p className="text-sm font-semibold">a) Information You Provide</p>
          <ul className="list-disc text-sm text-slate-700 pl-5 space-y-1">
            <li>Email address (when requesting a report or sample PDF)</li>
            <li>Domain name submitted for analysis</li>
          </ul>
          <p className="text-sm font-semibold">b) Automatically Collected Information</p>
          <ul className="list-disc text-sm text-slate-700 pl-5 space-y-1">
            <li>IP address (for security, abuse prevention, and rate limiting)</li>
            <li>Browser and device metadata (user agent)</li>
            <li>Usage data (pages visited, interactions)</li>
          </ul>
          <p className="text-sm text-slate-700">⚠️ We do not collect credentials, passwords, or authentication data.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">2. Nature of the Security Assessment</h2>
          <p className="text-sm text-slate-700">CyberFaceX performs passive, non-intrusive security analysis only, based on publicly observable signals, including:</p>
          <ul className="list-disc text-sm text-slate-700 pl-5 space-y-1">
            <li>DNS records</li>
            <li>TLS/HTTPS handshake data</li>
            <li>HTTP response headers</li>
            <li>Redirect behavior</li>
          </ul>
          <p className="text-sm text-slate-700">We do not:</p>
          <ul className="list-disc text-sm text-slate-700 pl-5 space-y-1">
            <li>Perform port scanning</li>
            <li>Attempt authentication</li>
            <li>Exploit vulnerabilities</li>
            <li>Access private systems</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">3. How We Use Information</h2>
          <ul className="list-disc text-sm text-slate-700 pl-5 space-y-1">
            <li>Generate and deliver IT risk reports</li>
            <li>Improve platform reliability and accuracy</li>
            <li>Prevent abuse and fraud</li>
            <li>Communicate report availability</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">4. Cookies and Tracking</h2>
          <p className="text-sm text-slate-700">
            We use essential cookies required for core functionality. Optional analytics cookies may be used only with user consent.
            See our Cookie Policy for details.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">5. Data Sharing</h2>
          <p className="text-sm text-slate-700">We do not sell or rent personal data. Limited sharing may occur with:</p>
          <ul className="list-disc text-sm text-slate-700 pl-5 space-y-1">
            <li>We do not sell or rent personal data.</li>
            <li>Limited data sharing may occur with trusted third-party service providers, including:

- Authorized payment processors acting as our Merchant of Record
- Infrastructure and service providers (such as hosting, email delivery, and analytics)

All partners process data solely for service delivery purposes and are contractually bound to comply with applicable data protection laws, including GDPR.</li>
          </ul>
          <p className="text-sm text-slate-700">All partners are GDPR-compliant.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">6. Data Retention</h2>
          <ul className="list-disc text-sm text-slate-700 pl-5 space-y-1">
            <li>Report-related data is retained for a limited period (typically 7–30 days)</li>
            <li>Analytics data is aggregated and anonymized</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">7. Your Rights (GDPR / KVKK)</h2>
          <p className="text-sm text-slate-700">You may request:</p>
          <ul className="list-disc text-sm text-slate-700 pl-5 space-y-1">
            <li>Access to your data</li>
            <li>Correction or deletion</li>
            <li>Restriction of processing</li>
          </ul>
          <p className="text-sm text-slate-700">📧 Contact: info@cyberfacex.com</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">8. Contact</h2>
          <p className="text-sm text-slate-700">CyberFaceX</p>
          <p className="text-sm text-slate-700">
            Website: <Link href="https://cyberfacex.com">https://cyberfacex.com</Link>
          </p>
          <p className="text-sm text-slate-700">
            Email: <a href="mailto:info@cyberfacex.com">info@cyberfacex.com</a>
          </p>
        </section>
      </div>
    </div>
  );
}
