import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const report = await prisma.complianceReport.findUnique({ where: { reportToken: token } });
  if (!report) {
    return new Response("Not found", { status: 404 });
  }
  if (report.expiresAt < new Date()) {
    return new Response("Expired", { status: 410 });
  }

  const filePath = report.storagePath || path.join(process.cwd(), "reports", "compliance", `${token}.zip`);
  let data: Buffer;
  try {
    data = await fs.readFile(filePath);
  } catch {
    return new Response("File not found", { status: 404 });
  }

  return new Response(data, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="compliance-package-${token}.zip"`,
    },
  });
}
