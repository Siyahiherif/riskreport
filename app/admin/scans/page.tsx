import Link from "next/link";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminScansPage() {
  const token = process.env.ADMIN_TOKEN;
  const user = process.env.ADMIN_USER;
  const pass = process.env.ADMIN_PASS;
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get("admin_token")?.value;
  const allowed = [token, user && pass ? `${user}:${pass}` : null].filter(Boolean) as string[];
  if (!allowed.length || !cookieToken || !allowed.includes(cookieToken)) {
    redirect("/admin/login");
  }

  const scans = await prisma.scan.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { order: true },
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-6xl px-6 py-10 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">All scans (latest 100)</h1>
          <div className="flex gap-2">
            <Link href="/admin" className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800">
              Dashboard
            </Link>
            <Link href="/admin/logout" className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800">
              Log out
            </Link>
          </div>
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
                <th className="px-4 py-3">Error</th>
              </tr>
            </thead>
            <tbody>
              {scans.map((scan) => {
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
                    <td className="px-4 py-2 text-red-600 text-xs">{scan.errorMessage ?? ""}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
