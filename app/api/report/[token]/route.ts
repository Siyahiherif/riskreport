import fs from "node:fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generatePdfReport } from "@/lib/pdf";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const report = await prisma.report.findUnique({ where: { reportToken: token } });
  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  if (report.expiresAt < new Date()) {
    return NextResponse.json({ error: "Report link expired" }, { status: 410 });
  }

  let filePath = report.storageUrl;
  let data: Buffer;
  try {
    data = await fs.readFile(filePath);
  } catch (err) {
    // Attempt to regenerate from scan result if file is missing
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      const scan = await prisma.scan.findUnique({ where: { id: report.scanId } });
      if (!scan?.resultJson) {
        return NextResponse.json({ error: "Report file missing" }, { status: 500 });
      }
      filePath = await generatePdfReport({
        result: scan.resultJson as any,
        productType: "pro",
        reportToken: token,
      });
      await prisma.report.update({ where: { reportToken: token }, data: { storageUrl: filePath } });
      data = await fs.readFile(filePath);
    } else {
      throw err;
    }
  }

  return new NextResponse(data, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="risk-report.pdf"`,
    },
  });
}
