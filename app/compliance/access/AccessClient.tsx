"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Status =
  | "pending"
  | "ready"
  | "expired"
  | "not_found"
  | "error";

const STATUS_COPY: Record<
  Status,
  { title: string; description: string; tone: "info" | "success" | "danger" }
> = {
  pending: {
    title: "Dokumanlariniz hazirlaniyor",
    description:
      "Odeme onaylandi. Dokumanlariniz olusturuluyor. Biraz sonra tekrar kontrol edin.",
    tone: "info",
  },
  ready: {
    title: "Dokumanlariniz hazir",
    description: "Indirme linkiniz 7 gun boyunca gecerlidir.",
    tone: "success",
  },
  expired: {
    title: "Indirme suresi doldu",
    description:
      "Indirme suresi sona erdi. Yardim icin bizimle iletisime gecin.",
    tone: "danger",
  },
  not_found: {
    title: "Rapor bulunamadi",
    description:
      "Rapor bulunamadi. LUTFEN linkinizi kontrol edin veya tekrar deneyin.",
    tone: "danger",
  },
  error: {
    title: "Bir sorun olustu",
    description: "Daha sonra tekrar deneyin.",
    tone: "danger",
  },
};

export default function AccessClient() {
  const params = useSearchParams();
  const queryToken = params.get("token");
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("pending");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const statusCopy = useMemo(() => STATUS_COPY[status], [status]);

  useEffect(() => {
    if (queryToken) {
      setToken(queryToken);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("compliance_report_token", queryToken);
      }
      return;
    }
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("compliance_report_token");
      if (stored) {
        setToken(stored);
        return;
      }
    }
    setStatus("not_found");
  }, [queryToken]);

  useEffect(() => {
    if (!token) return;

    let timer: NodeJS.Timeout | null = null;
    let stopped = false;

    const poll = async () => {
      if (stopped) return;
      setIsPolling(true);
      try {
        const res = await fetch(`/api/compliance/status/${token}`, {
          cache: "no-store",
        });
        const data = await res.json();
        const nextStatus = (data?.status ?? "error") as Status;
        setStatus(nextStatus);
        if (nextStatus === "ready") {
          setDownloadUrl(`/api/compliance/${token}`);
          setIsPolling(false);
          return;
        }
        if (nextStatus === "expired" || nextStatus === "not_found") {
          setIsPolling(false);
          return;
        }
      } catch {
        setStatus("error");
      } finally {
        if (!stopped && status !== "ready") {
          timer = setTimeout(poll, 5000);
        }
      }
    };

    poll();

    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    };
  }, [token, status]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-16">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Compliance Readiness
          </p>
          <h1 className="text-3xl font-semibold">Dokuman erisim durumu</h1>
          <p className="text-sm text-slate-600">
            Odeme sonrasi dokumanlarinizi buradan takip edebilirsiniz.
          </p>
        </div>

        <div
          className={[
            "rounded-2xl border bg-white p-6 shadow",
            statusCopy.tone === "success" && "border-emerald-200",
            statusCopy.tone === "danger" && "border-rose-200",
            statusCopy.tone === "info" && "border-slate-200",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">{statusCopy.title}</h2>
              <p className="text-sm text-slate-600">
                {statusCopy.description}
              </p>
              {token && (
                <p className="text-xs text-slate-400">
                  Report token: {token}
                </p>
              )}
            </div>
            {isPolling && status === "pending" ? (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500">
                ...
              </div>
            ) : null}
          </div>

          {status === "ready" && downloadUrl ? (
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <a
                href={downloadUrl}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow"
              >
                ZIP indir
              </a>
              <p className="text-xs text-slate-500">
                Indirme linki 7 gun gecerlidir.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
