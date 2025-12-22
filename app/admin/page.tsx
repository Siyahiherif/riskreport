import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";

const formatNumber = (n: number | null) => (n === null ? "-" : n.toLocaleString("en-US"));

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const token = process.env.ADMIN_TOKEN;
  const user = process.env.ADMIN_USER;
  const pass = process.env.ADMIN_PASS;
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get("admin_token")?.value;

  const cookieAllowed = [
    token,
    user && pass ? `${user}:${pass}` : null,
  ].filter(Boolean) as string[];

  if (!cookieAllowed.length || !cookieToken || !cookieAllowed.includes(cookieToken)) {
    redirect("/admin/login");
  }

  const [totalScans, todayScans, weekScans, monthScans, avgScoreRow, freeCount, execCount, recentScans, recentReports] =
    await Promise.all([
      prisma.scan.count(),
      prisma.scan.count({ where: { createdAt: { gte: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) } } }),
      prisma.scan.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
      prisma.scan.count({ where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } }),
      prisma.scan.findMany({
        where: { status: "done" },
        select: { resultJson: true },
        take: 200,
        orderBy: { createdAt: "desc" },
      }),
      prisma.scan.count({ where: { order: null } }),
      prisma.order.count(),
      prisma.scan.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { order: true },
      }),
      prisma.report.findMany({ orderBy: { createdAt: "desc" }, take: 10, include: { scan: true } }),
    ]);

  const avgScore = (() => {
    const scores = (avgScoreRow as any[])
      .map((s) => (s.resultJson as any)?.score?.overall as number | undefined)
      .filter((n) => typeof n === "number") as number[];
    if (!scores.length) return null;
    const sum = scores.reduce((a, b) => a + b, 0);
    return sum / scores.length;
  })();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-6xl px-6 py-10 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase font-semibold text-slate-500">Admin</p>
            <h1 className="text-3xl font-semibold">CyberFaceX Dashboard</h1>
          </div>
          <Link
            href="/"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 hover:-translate-y-0.5 hover:shadow"
          >
            Back to site
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total scans" value={formatNumber(totalScans)} />
          <StatCard label="Today" value={formatNumber(todayScans)} />
          <StatCard label="Last 7 days" value={formatNumber(weekScans)} />
          <StatCard label="Last 30 days" value={formatNumber(monthScans)} />
          <StatCard label="Avg risk score" value={avgScore ? avgScore.toFixed(1) : "-"} />
          <StatCard label="Free reports" value={formatNumber(freeCount)} />
          <StatCard label="Paid (Pro/Exec)" value={formatNumber(execCount)} />
          <StatCard label="Recent reports" value={formatNumber(recentReports.length)} />
        </div>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recent scans</h2>
            <Link href="/admin/scans" className="text-sm font-semibold text-slate-700 underline">
              View all
            </Link>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-4 py-3">Domain</th>
                  <th className="px-4 py-3">Package</th>
                  <th className="px-4 py-3">Risk score</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {recentScans.map((scan) => {
                  const score = (scan.resultJson as any)?.score?.overall as number | undefined;
                  return (
                    <tr key={scan.id} className="border-t border-slate-100">
                      <td className="px-4 py-2">{scan.domain}</td>
                      <td className="px-4 py-2">{scan.order ? scan.order.productType : "Free"}</td>
                      <td className="px-4 py-2">{score ?? "-"}</td>
                      <td className="px-4 py-2 capitalize">{scan.status}</td>
                      <td className="px-4 py-2">
                        {new Date(scan.createdAt).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recent reports</h2>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-4 py-3">Report token</th>
                  <th className="px-4 py-3">Domain</th>
                  <th className="px-4 py-3">Expires</th>
                  <th className="px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {recentReports.map((r) => (
                  <tr key={r.reportToken} className="border-t border-slate-100">
                    <td className="px-4 py-2">{r.reportToken}</td>
                    <td className="px-4 py-2">{r.scan?.domain ?? "-"}</td>
                    <td className="px-4 py-2">
                      {new Date(r.expiresAt).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}
                    </td>
                    <td className="px-4 py-2">
                      {new Date(r.createdAt).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs uppercase font-semibold text-slate-500">{label}</p>
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}
