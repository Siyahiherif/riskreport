import { Suspense } from "react";
import AccessClient from "./AccessClient";

export default function ComplianceAccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 text-slate-900">
          <div className="mx-auto max-w-3xl px-6 py-16">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow">
              <p className="text-sm text-slate-600">Yukleniyor...</p>
            </div>
          </div>
        </div>
      }
    >
      <AccessClient />
    </Suspense>
  );
}
