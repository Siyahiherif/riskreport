import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ReportDownloadPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const report = await prisma.report.findUnique({ where: { reportToken: token } });
  if (!report) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="rounded-2xl bg-white p-8 shadow ring-1 ring-slate-200">
          <p className="text-xl font-semibold text-slate-900">Report not found</p>
          <p className="mt-2 text-sm text-slate-600">Check your link or request a new download link.</p>
          <Link href="/" className="mt-4 inline-block text-sm font-semibold text-slate-900 underline">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  const expired = report.expiresAt < new Date();

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="max-w-xl rounded-2xl bg-white p-8 shadow ring-1 ring-slate-200">
        <p className="text-sm font-semibold uppercase text-slate-500">PDF download</p>
        <h1 className="text-2xl font-semibold text-slate-900">Your IT Risk Report</h1>
        <p className="mt-2 text-sm text-slate-700">
          Token: {token} - expires {report.expiresAt.toISOString().slice(0, 16).replace("T", " ")} UTC
        </p>
        {expired ? (
          <p className="mt-4 text-sm text-red-600">This link has expired. Please re-run or purchase a new report.</p>
        ) : (
          <a
            href={`/api/report/${token}`}
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow transition hover:-translate-y-0.5"
          >
            Download PDF
          </a>
        )}
      </div>
    </div>
  );
}