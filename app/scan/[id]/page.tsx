import { prisma } from "@/lib/db";
import { ScanResult } from "@/lib/types";
import ScanClient from "./ScanClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = { params: { id: string } };

export default async function ScanPage({ params }: Props) {
  const scan = await prisma.scan.findUnique({ where: { id: params.id } });

  if (!scan) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h1 className="text-3xl font-semibold">Domain risk snapshot</h1>
          <p className="mt-2 text-sm text-slate-600">Passive assessment only — DNS, TLS handshake, HTTP headers, redirects.</p>
          <div className="mt-6 rounded-2xl bg-white p-6 shadow ring-1 ring-slate-200">
            <p className="text-sm font-semibold text-red-600">Scan not found</p>
            <p className="mt-2 text-sm text-slate-700">The scan ID could not be located. Please start a new scan from the homepage.</p>
          </div>
        </div>
      </div>
    );
  }

  const initialData = {
    scanId: scan.id,
    status: scan.status,
    result: scan.resultJson as ScanResult | undefined,
    error: scan.errorMessage ?? undefined,
    cached: false,
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <ScanClient scanId={scan.id} initialData={initialData} />
      </div>
    </div>
  );
}
