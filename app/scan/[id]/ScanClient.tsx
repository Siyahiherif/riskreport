"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ScanResult } from "@/lib/types";

type ScanApiResponse = {
  scanId: string;
  status: "queued" | "running" | "done" | "error";
  result?: ScanResult;
  cached?: boolean;
  error?: string;
};

type Props = {
  scanId: string;
  initialData: ScanApiResponse;
};

const statusStyles: Record<
  ScanApiResponse["status"],
  { label: string; dot: string; text: string; bg: string }
> = {
  queued: { label: "Queued", dot: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50" },
  running: { label: "Running", dot: "bg-blue-500", text: "text-blue-700", bg: "bg-blue-50" },
  done: { label: "Ready", dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" },
  error: { label: "Error", dot: "bg-red-500", text: "text-red-700", bg: "bg-red-50" },
};

const categoryLabels: Record<string, string> = {
  hygiene: "Hygiene",
  web_security: "Web Security",
  email_security: "Email Security",
  transport_security: "Transport Security",
};

function StatusBadge({ status, cached }: { status: ScanApiResponse["status"]; cached?: boolean }) {
  const cfg = statusStyles[status] ?? statusStyles.queued;
  return (
    <div className={`flex items-center gap-2 rounded-full ${cfg.bg} px-4 py-2 text-sm font-semibold ${cfg.text}`}>
      <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
      {cfg.label}
      {cached ? <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs font-semibold text-slate-700">Cached</span> : null}
    </div>
  );
}

function ScoreCards({ result }: { result: ScanResult }) {
  return (
    <div className="mt-6 grid gap-4 md:grid-cols-2">
      <div className="rounded-2xl bg-slate-900 px-6 py-5 text-white shadow-lg">
        <p className="text-sm uppercase text-slate-300">Risk score</p>
        <div className="mt-2 flex items-end gap-3">
          <p className="text-5xl font-semibold leading-none">{result.score.overall}</p>
          <p className="text-lg font-semibold text-amber-200">{result.score.label}</p>
        </div>
        <p className="mt-2 text-sm text-slate-200">Overall score based on weighted findings.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 rounded-2xl bg-white p-4 shadow ring-1 ring-slate-200">
        {Object.entries(result.score.categories).map(([key, value]) => (
          <div key={key} className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs uppercase text-slate-500">{categoryLabels[key] ?? key}</p>
            <p className="text-2xl font-semibold text-slate-900">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function FindingsList({ result }: { result: ScanResult }) {
  const list = result.topFindings?.length ? result.topFindings : result.findings?.slice(0, 3) ?? [];
  if (!list.length) return null;

  return (
    <div className="mt-6 rounded-2xl bg-white p-5 shadow ring-1 ring-slate-200">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase text-slate-500">Top risks</p>
          <p className="text-sm text-slate-600">Business impact and recommended fixes.</p>
        </div>
        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">Showing {list.length}</div>
      </div>
      <ul className="mt-4 space-y-4">
        {list.map((f) => (
          <li key={f.id} className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{f.title}</p>
                <p className="text-xs text-slate-500">
                  {categoryLabels[f.category] ?? f.category} • {f.severity.toUpperCase()}
                </p>
              </div>
              <span className="rounded-full bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700">Weight {f.weight}</span>
            </div>
            <p className="mt-2 text-sm text-slate-700">{f.summary}</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">Business impact</p>
            <p className="text-sm text-slate-700">{f.business_impact}</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">Recommendation</p>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {f.recommendation?.map((rec) => (
                <li key={rec}>{rec}</li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-slate-500">Evidence: {f.evidence}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ScanClient({ scanId, initialData }: Props) {
  const routeParams = useParams();
  const resolvedScanId = (scanId || (routeParams?.id as string) || "").trim();

  const [data, setData] = useState<ScanApiResponse>(initialData);
  const [lastResult, setLastResult] = useState<ScanResult | undefined>(initialData.result);
  const [fetchError, setFetchError] = useState<string | null>(initialData.error ?? null);
  const [email, setEmail] = useState("");
  const [sendState, setSendState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [sendError, setSendError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const poll = async () => {
      try {
        if (!resolvedScanId) {
          setFetchError("Scan ID missing in URL.");
          return;
        }
        const res = await fetch(`/api/scan/${resolvedScanId}?t=${Date.now()}`, { cache: "no-store" });
        const json = (await res.json()) as ScanApiResponse;
        if (cancelled) return;
        setData((prev) => ({ ...prev, ...json }));
        if (json.result) setLastResult(json.result);
        setFetchError(null);
        if (json.status === "done" || json.status === "error") return;
        timer = setTimeout(poll, 4000);
      } catch (err) {
        if (cancelled) return;
        setFetchError((err as Error).message);
        timer = setTimeout(poll, 6000);
      }
    };

    if (initialData.status !== "done" || !initialData.result) {
      poll();
    }

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [initialData.status, resolvedScanId, initialData.result]);

  const status = data.status ?? initialData.status;
  const currentResult = useMemo(() => data.result ?? lastResult, [data.result, lastResult]);

  const showWaiting = !currentResult && (status === "queued" || status === "running");
  const showMissingResult = status === "done" && !currentResult;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase text-slate-500">Scan Status</p>
          <h1 className="text-3xl font-semibold">Domain risk snapshot</h1>
          <p className="text-sm text-slate-600">Passive assessment only — DNS, TLS handshake, HTTP headers, redirects.</p>
          <p className="text-xs text-slate-500">Scan ID: {resolvedScanId || "unknown"}</p>
          <p className="text-xs text-slate-500 mt-1">
            Free scans are cached for 24 hours; repeated scans within that window return the cached result.
          </p>
        </div>
        <StatusBadge status={status} cached={data.cached} />
      </div>

      {fetchError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {fetchError}
        </div>
      )}

      {status === "error" && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Scan failed. {data.error || "Please try again from the homepage."}
        </div>
      )}

      {showWaiting && (
        <div className="rounded-2xl bg-white p-6 shadow ring-1 ring-slate-200">
          <p className="text-sm font-semibold text-slate-900">Running passive checks...</p>
          <p className="mt-1 text-sm text-slate-600">This usually takes 10-30 seconds. Cached results return instantly when available.</p>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-2 w-1/3 animate-pulse rounded-full bg-slate-900" />
          </div>
        </div>
      )}

      {showMissingResult && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Scan finished but no result was returned. Please refresh or start a new scan.
        </div>
      )}

      {currentResult ? (
        <div className="space-y-6">
          <div className="rounded-2xl bg-white p-6 shadow ring-1 ring-slate-200">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">{currentResult.domain}</p>
                <p className="text-xs text-slate-600">Generated at {new Date(currentResult.generatedAt).toLocaleString()}</p>
              </div>
              {data.cached ? (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">Cached result</span>
              ) : null}
            </div>
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">🔒 Want the full report?</p>
                <p className="text-sm text-slate-700">Get the executive-ready PDF with prioritized fixes.</p>
              </div>
              <form
                className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!currentResult) return;
                  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
                    setSendError("Enter a valid email.");
                    return;
                  }
                  setSendError(null);
                  setSendState("sending");
                  try {
                    const res = await fetch("/api/report/send-live", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ scanId: resolvedScanId, email: email.trim() }),
                    });
                    if (!res.ok) throw new Error(await res.text());
                    setSendState("sent");
                  } catch (err) {
                    setSendState("error");
                    setSendError("Could not send the PDF. Please try again.");
                  }
                }}
              >
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={sendState === "sending" || !currentResult}
                    className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:-translate-y-0.5 hover:shadow-lg transition disabled:opacity-60"
                  >
                    {sendState === "sent" ? "Sent!" : sendState === "sending" ? "Sending..." : "Send PDF to my email"}
                  </button>
                  {sendState === "sent" && <span className="text-xs font-semibold text-emerald-700">Email sent</span>}
                </div>
                {sendError && <p className="text-xs text-red-600">{sendError}</p>}
              </form>
            </div>
            <ScoreCards result={currentResult} />
          </div>

          <FindingsList result={currentResult} />
        </div>
      ) : null}
    </div>
  );
}
