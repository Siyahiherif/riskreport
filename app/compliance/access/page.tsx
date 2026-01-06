"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type StatusResult =
  | { status: "pending" }
  | { status: "ready"; downloadUrl: string; expiresAt: string }
  | { status: "expired" }
  | { status: "not_found" };

export default function ComplianceAccessPage() {
  const params = useSearchParams();
  const [token, setToken] = useState(params.get("token") ?? "");
  const [status, setStatus] = useState<StatusResult | null>(null);
  const [loading, setLoading] = useState(false);

  const checkStatus = async (value: string) => {
    if (!value) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/compliance/status/${value}`);
      const json = await res.json();
      setStatus(json);
    } catch {
      setStatus({ status: "not_found" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      checkStatus(token);
    }
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-3xl px-6 py-12 space-y-8">
        <div>
          <p className="text-xs uppercase font-semibold text-slate-500">Compliance Access</p>
          <h1 className="text-3xl font-semibold">Dokuman Durumu</h1>
          <p className="mt-2 text-sm text-slate-700">
            Rapor ID ile durumunuzu goruntuleyebilirsiniz. Odeme sonrasi dokumanlar hazirlandiginda indirme linki
            acilir.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow">
          <label className="text-sm text-slate-700">
            Rapor ID
            <input
              value={token}
              onChange={(e) => setToken(e.target.value.trim())}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Rapor ID"
            />
          </label>
          <button
            type="button"
            onClick={() => checkStatus(token)}
            className="mt-4 inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            {loading ? "Kontrol ediliyor..." : "Durumu gor"}
          </button>
        </div>

        {status?.status === "pending" && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
            Dokumanlariniz hazirlaniyor. Lutfen birkac dakika sonra tekrar kontrol edin.
          </div>
        )}
        {status?.status === "ready" && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-sm text-emerald-900 space-y-2">
            <p>Dokumanlariniz hazir.</p>
            <a
              href={status.downloadUrl}
              className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              ZIP paketi indir
            </a>
            <p className="text-xs text-emerald-900/80">
              Link {new Date(status.expiresAt).toLocaleDateString()} tarihinde sona erer.
            </p>
          </div>
        )}
        {status?.status === "expired" && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-900">
            Indirme suresi dolmustur. Lutfen destek ile iletisime gecin.
          </div>
        )}
        {status?.status === "not_found" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-700">
            Rapor bulunamadi. Rapor ID bilgisini kontrol edin.
          </div>
        )}
      </div>
    </div>
  );
}
