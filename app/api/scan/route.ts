import { NextRequest, NextResponse } from "next/server";
import { enqueueScan } from "@/lib/queue";
import { prisma } from "@/lib/db";
import { createQueuedScan, findCachedScan, normalizeDomain } from "@/lib/scan/service";
import { generatePdfReport } from "@/lib/pdf";
import { generateReportToken } from "@/lib/tokens";
import { sendMail } from "@/lib/email";

const windowMs = 60_000;
const maxHits = 20;
const ipHits = new Map<string, { count: number; windowStart: number }>();

const getIp = (req: NextRequest) => {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  // NextRequest doesn't type ip on Node runtime; this fallback is safe.
  // @ts-expect-error ip may exist on some runtimes
  return req.ip || req.headers.get("x-real-ip") || "unknown";
};

const rateLimited = (ip: string) => {
  const now = Date.now();
  const current = ipHits.get(ip);
  if (!current || now - current.windowStart > windowMs) {
    ipHits.set(ip, { count: 1, windowStart: now });
    return false;
  }
  if (current.count >= maxHits) return true;
  ipHits.set(ip, { ...current, count: current.count + 1 });
  return false;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const noStore = { "Cache-Control": "no-store" };

export async function POST(req: NextRequest) {
  try {
    const ip = getIp(req);
    if (rateLimited(ip)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: noStore });
    }

    const body = await req.json();
    const domain = body?.domain as string;
    const emailOptIn = (body?.emailOptIn as string | undefined)?.trim();
    if (!domain) {
      return NextResponse.json({ error: "domain is required" }, { status: 400, headers: noStore });
    }
    if (emailOptIn && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailOptIn)) {
      return NextResponse.json({ error: "invalid email" }, { status: 400, headers: noStore });
    }

    const normalized = normalizeDomain(domain);
    const cached = await findCachedScan(normalized);
    if (cached) {
      if (emailOptIn) {
        await prisma.scan.update({ where: { id: cached.id }, data: { emailOptIn } }).catch(() => {});
        try {
          const reportToken = generateReportToken();
          const pdfPath = await generatePdfReport({ result: cached.result, productType: "pro", reportToken });
          await prisma.report.create({
            data: {
              reportToken,
              scanId: cached.id,
              storageUrl: pdfPath,
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
          });
          const downloadBase = process.env.REPORT_BASE_URL ?? "http://localhost:3000";
          const downloadUrl = `${downloadBase}/api/report/${reportToken}`;
          await sendMail({
            to: emailOptIn,
            subject: `Your passive risk report is ready for ${cached.result.domain}`,
            text: `Your report is ready. Download: ${downloadUrl}`,
            html: `<p>Your passive IT risk report is ready.</p><p><a href="${downloadUrl}">Download PDF</a></p><p>This link expires in 7 days.</p>`,
          });
        } catch (err) {
          console.error("Failed to send cached report email", err);
        }
      }
      return NextResponse.json(
        {
          status: "done",
          cached: true,
          scanId: cached.id,
          result: cached.result,
        },
        { headers: noStore }
      );
    }

    const existingRunning = await prisma.scan.findFirst({
      where: { domain: normalized, status: { in: ["queued", "running"] } },
    });
    if (existingRunning) {
      return NextResponse.json({ status: existingRunning.status, scanId: existingRunning.id }, { headers: noStore });
    }

    const scan = await createQueuedScan(normalized, emailOptIn);
    await enqueueScan(scan.id, normalized);
    return NextResponse.json({ status: scan.status, scanId: scan.id }, { headers: noStore });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400, headers: noStore });
  }
}
