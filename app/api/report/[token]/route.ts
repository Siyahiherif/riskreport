import fs from "node:fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  const report = await prisma.report.findUnique({ where: { reportToken: params.token } });
  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  if (report.expiresAt < new Date()) {
    return NextResponse.json({ error: "Report link expired" }, { status: 410 });
  }

  const data = await fs.readFile(report.storageUrl);
  return new NextResponse(data, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="risk-report.pdf"`,
    },
  });
}
