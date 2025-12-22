import ScanClient from "./ScanClient";
import { ScanResult } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = { params: { id: string } };

type ScanApiResponse = {
  scanId: string;
  status: "queued" | "running" | "done" | "error";
  result?: ScanResult;
  cached?: boolean;
  error?: string;
};

const fetchScan = async (id: string): Promise<ScanApiResponse | null> => {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
  const url = `${base}/api/scan/${id}`;
  try {
    const res = await fetch(url.startsWith("http") ? url : `/api/scan/${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    const json = (await res.json()) as ScanApiResponse;
    return json;
  } catch {
    return null;
  }
};

export default async function ScanPage({ params }: Props) {
  const scan = await fetchScan(params.id);

  if (!scan) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h1 className="text-3xl font-semibold">Domain risk snapshot</h1>
          <p className="mt-2 text-sm text-slate-600">Passive assessment only — DNS, TLS handshake, HTTP headers, redirects.</p>
          <div className="mt-6 rounded-2xl bg-white p-6 shadow ring-1 ring-slate-200">
            <p className="text-sm font-semibold text-red-600">Scan not found</p>
            <p className="mt-2 text-sm text-slate-700">The scan ID could not be located or could not be loaded. Please start a new scan from the homepage.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <ScanClient scanId={scan.scanId} initialData={scan} />
      </div>
    </div>
  );
}
