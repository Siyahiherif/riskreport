import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const report = await prisma.complianceReport.findUnique({ where: { reportToken: token } });
  if (!report) {
    return Response.json({ status: "not_found" }, { status: 404 });
  }

  if (report.expiresAt < new Date()) {
    return Response.json({ status: "expired" });
  }

  if (report.status !== "ready" || !report.storagePath) {
    return Response.json({ status: "pending" });
  }

  const downloadBase = process.env.REPORT_BASE_URL ?? "http://localhost:3000";
  const downloadUrl = `${downloadBase}/api/compliance/${token}`;

  return Response.json({
    status: "ready",
    reportToken: token,
    downloadUrl,
    expiresAt: report.expiresAt.toISOString(),
  });
}
