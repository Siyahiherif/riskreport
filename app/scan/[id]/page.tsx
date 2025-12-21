'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ScanResult } from "@/lib/types";

type ScanResponse =
  | { status: "queued" | "running"; scanId: string }
  | { status: "done"; scanId: string; result: ScanResult }
  | { status: "error"; scanId: string; error?: string };

const fetchScan = async (scanId: string): Promise<ScanResponse> => {
  if (!scanId) {
    throw new Error("Scan id is missing");
  }
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const url = origin ? `${origin}/api/scan/${scanId}?t=${Date.now()}` : `/api/scan/${scanId}?t=${Date.now()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error("Scan not found");
  }
  const json = await res.json();
  if (json && typeof json === "object" && "result" in json) {
    return json as ScanResponse;
  }
  // fallback: entire body is the result
  return { status: "done", scanId, result: json as unknown as ScanResult };
};

export default function ScanPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [data, setData] = useState<ScanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.id) {
      setError("Scan not found");
      return;
    }
    let active = true;
    const poll = async () => {
      try {
        const res = await fetchScan(params.id);
        if (!active) return;
        setError(null);
        setData(res);
        if (res.status === "done" || res.status === "error") return;
        setTimeout(poll, 2000);
      } catch (err) {
        if (!active) return;
        setError((err as Error).message);
      }
    };
    poll();
    return () => {
      active = false;
    };
  }, [params.id]);

  const result = data && "result" in data ? data.result : null;
  const statusLabel = data?.status ?? "queued";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase text-slate-500">Scan Status</p>
            <h1 className="text-3xl font-semibold">Domain risk snapshot</h1>
            <p className="text-sm text-slate-600">Passive assessment only - DNS, TLS handshake, HTTP headers, redirects.</p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold shadow ring-1 ring-slate-200">
            <span className={`h-2 w-2 rounded-full ${statusLabel === "done" ? "bg-green-500" : statusLabel === "error" ? "bg-red-500" : "bg-amber-500"}`} />
            {statusLabel.toUpperCase()}
          </div>
        </div>

        {error && !result && <p className="mt-4 text-sm text-red-600">{error}</p>}

        {!result && !error && (
          <div className="mt-8 rounded-2xl bg-white p-6 shadow ring-1 ring-slate-200">
            <p className="text-sm text-slate-700">Running passive checks... This usually takes 10–30 seconds.</p>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-2 w-1/3 animate-pulse rounded-full bg-slate-900" />
            </div>
            <p className="mt-3 text-xs text-slate-500">If it times out, try again; cached results return instantly when available.</p>
          </div>
        )}

        {result && (
          <div className="mt-8 grid gap-6 md:grid-cols-[2fr,1fr]">
            <div className="space-y-6">
              <div className="rounded-2xl bg-white p-6 shadow ring-1 ring-slate-200">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">Overall Score</p>
                    <p className="text-5xl font-semibold">{result.score.overall}</p>
                    <p className="text-sm text-slate-600">{result.score.label}</p>
                  </div>
                  <div className="text-sm text-slate-600">
                    Generated: {new Date(result.generatedAt).toLocaleString()}
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {Object.entries(result.score.categories).map(([key, value]) => (
                    <div key={key} className="rounded-xl bg-slate-50 p-3 text-sm">
                      <p className="text-xs uppercase text-slate-500">{key.replace("_", " ")}</p>
                      <p className="text-xl font-semibold">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow ring-1 ring-slate-200">
                <h2 className="text-xl font-semibold text-slate-900">Top findings</h2>
                <p className="text-sm text-slate-600">Evidence + business impact for the most critical items.</p>
                <div className="mt-4 space-y-3">
                  {result.topFindings.slice(0, 3).map((f) => (
                    <div key={f.id} className="rounded-xl border border-slate-100 p-4">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold">{f.title}</p>
                        <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                          {f.severity.toUpperCase()}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-700">{f.business_impact}</p>
                      <p className="mt-1 text-xs text-slate-500">Evidence: {f.evidence}</p>
                      <div className="mt-2 rounded-lg bg-slate-50 p-2 text-xs text-slate-700">
                        <p className="font-semibold">So what?</p>
                        <p>{f.business_impact}</p>
                        <p className="mt-1 font-semibold">Executive includes:</p>
                        <p>Exact evidence + 30-day action plan + management summary.</p>
                        <button
                          type="button"
                          onClick={() => router.push("/#pricing")}
                          className="mt-2 inline-flex items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-[11px] font-semibold text-white hover:-translate-y-0.5 transition"
                        >
                          Get Executive Report $99
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl bg-slate-900 p-5 text-white shadow-lg">
                <p className="text-sm font-semibold text-slate-200">Upgrade</p>
                <h3 className="text-xl font-semibold">Download the Executive PDF</h3>
                <p className="mt-2 text-sm text-slate-200">
                  Full findings (10–20), evidence, remediation, and a one-page executive summary with 30-day action plan.
                </p>
                <button
                  className="mt-4 w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:-translate-y-0.5"
                  type="button"
                  onClick={() => router.push("/#pricing")}
                >
                  Buy Executive ($99)
                </button>
              </div>

              <div className="rounded-2xl bg-white p-5 shadow ring-1 ring-slate-200">
                <h3 className="text-sm font-semibold text-slate-900">What&apos;s next?</h3>
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  <li>• Review the top risks with stakeholders.</li>
                  <li>• Upgrade to Pro/Executive to download a PDF.</li>
                  <li>• Re-run after fixes; cache refreshes every 24h.</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
