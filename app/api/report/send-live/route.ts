import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateReportToken } from "@/lib/tokens";
import { generatePdfReport } from "@/lib/pdf";
import { sendMail, composeReportEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };
const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const scanId = (body?.scanId as string | undefined)?.trim();
    const email = (body?.email as string | undefined)?.trim();

    if (!scanId || !email || !emailRegex.test(email)) {
      return NextResponse.json({ error: "invalid input" }, { status: 400, headers: noStore });
    }

    const scan = await prisma.scan.findUnique({ where: { id: scanId } });
    if (!scan || scan.status !== "done" || !scan.resultJson) {
      return NextResponse.json({ error: "scan not ready" }, { status: 400, headers: noStore });
    }

    const token = generateReportToken();
    const pdfPath = await generatePdfReport({
      result: scan.resultJson as any,
      productType: "executive",
      reportToken: token,
    });

    await prisma.report.create({
      data: {
        reportToken: token,
        scanId: scan.id,
        storageUrl: pdfPath,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const downloadBase = process.env.REPORT_BASE_URL ?? process.env.REPORT_BASE ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const downloadUrl = `${downloadBase}/api/report/${token}`;
    const domain = (scan.resultJson as any)?.domain ?? scan.domain;
    const mail = composeReportEmail({ to: email, domain, downloadUrl });
    await sendMail(mail);

    return NextResponse.json({ ok: true }, { headers: noStore });
  } catch (err) {
    console.error("send-live failed", err);
    return NextResponse.json({ error: "failed" }, { status: 500, headers: noStore });
  }
}
