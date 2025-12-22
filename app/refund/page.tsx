export const metadata = {
  title: "Refund Policy | CyberFaceX",
  description: "Refund Policy for CyberFaceX digital security reports.",
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-3xl px-6 py-12 space-y-6">
        <div>
          <p className="text-xs uppercase font-semibold text-slate-500">Refund Policy</p>
          <h1 className="text-3xl font-semibold">CyberFaceX Refund Policy</h1>
        </div>

        <p className="text-sm text-slate-700">
          CyberFaceX provides digital security reports generated on demand. Due to the nature of the service, refunds are generally not provided once a report has been generated and delivered.
        </p>
        <p className="text-sm text-slate-700">
          If you experience a technical issue or incorrect charge, please contact us at <a href="mailto:info@cyberfacex.com">info@cyberfacex.com</a> within 7 days.
        </p>
        <p className="text-sm text-slate-700">We review refund requests on a case-by-case basis.</p>
      </div>
    </div>
  );
}
