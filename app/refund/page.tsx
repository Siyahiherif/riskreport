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
          CyberFaceX Refund Policy
          <br />
          We offer a 14-day no-questions-asked refund policy.
        </p>
        <p className="text-sm text-slate-700">
          If you are not satisfied with your purchase for any reason, you are entitled to request a full refund within 14 days of the purchase date by contacting us at{" "}
          <a href="mailto:info@cyberfacex.com">info@cyberfacex.com</a>.
        </p>
        <p className="text-sm text-slate-700">Refunds will be issued to the original payment method in accordance with Paddle’s refund policy.</p>
      </div>
    </div>
  );
}
