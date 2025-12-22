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

export default async function ScanPage({ params }: Props) {
  const initialData: ScanApiResponse = {
    scanId: params.id,
    status: "queued",
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <ScanClient scanId={initialData.scanId} initialData={initialData} />
      </div>
    </div>
  );
}
