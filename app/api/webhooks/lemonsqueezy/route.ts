import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generatePdfReport } from "@/lib/pdf";
import { evaluateCompliance } from "@/lib/compliance/engine";
import { generateCompliancePackage } from "@/lib/compliance/package";
import { composeComplianceEmail, sendMail } from "@/lib/email";
import { buildCacheKey, createQueuedScan, normalizeDomain } from "@/lib/scan/service";
import { ScanResult } from "@/lib/types";
import { generateReportToken } from "@/lib/tokens";
import { CACHE_TTL_MS } from "@/lib/constants";
import { runScanAndPersist } from "@/lib/scan/service";

export const runtime = "nodejs";

const verifySignature = (raw: string, signature: string | null) => {
  const secret = process.env.LS_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const hmac = crypto.createHmac("sha256", secret).update(raw).digest("hex");
  const sigBuf = Buffer.from(signature);
  const hmacBuf = Buffer.from(hmac);
  if (sigBuf.length !== hmacBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, hmacBuf);
};

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-signature");
  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  const eventName = payload?.meta?.event_name as string;
  if (!eventName || !eventName.includes("payment") && !eventName.includes("order")) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const data = payload?.data;
  const lemonOrderId = data?.id as string;
  const attributes = data?.attributes ?? {};
  const productId = String(attributes.product_id ?? "");
  const email = attributes.user_email ?? attributes.email ?? null;
  const complianceProductId = process.env.LS_PRODUCT_COMPLIANCE;
  const domainField =
    attributes?.custom_fields?.domain ??
    attributes?.custom_field?.domain ??
    attributes?.custom_domain ??
    attributes?.domain;
  const complianceToken =
    attributes?.custom_fields?.reportToken ??
    attributes?.custom_fields?.report_token ??
    attributes?.custom_field?.reportToken ??
    attributes?.custom_field?.report_token ??
    attributes?.custom_report_token ??
    attributes?.custom?.reportToken ??
    attributes?.custom?.report_token ??
    payload?.meta?.custom_data?.reportToken ??
    payload?.meta?.custom_data?.report_token ??
    null;

  if (productId && complianceProductId && productId === complianceProductId) {
    if (!complianceToken || typeof complianceToken !== "string") {
      return NextResponse.json({ error: "reportToken is required in custom fields." }, { status: 400 });
    }

    const report = await prisma.complianceReport.findUnique({ where: { reportToken: complianceToken } });
    if (!report) {
      return NextResponse.json({ error: "Compliance report not found." }, { status: 404 });
    }
    if (report.status === "ready" && report.storagePath) {
      return NextResponse.json({ ok: true, idempotent: true });
    }
    if (!report.answers) {
      return NextResponse.json({ error: "Compliance answers missing." }, { status: 500 });
    }

    const result = evaluateCompliance(report.answers as any);
    const pkg = await generateCompliancePackage({
      reportToken: complianceToken,
      companyName: report.companyName ?? undefined,
      answers: report.answers as any,
      result,
    });

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.complianceReport.update({
      where: { reportToken: complianceToken },
      data: {
        status: "ready",
        paidAt: new Date(),
        paymentId: lemonOrderId,
        storagePath: pkg.zipPath,
        expiresAt,
      },
    });

    const downloadBase = process.env.REPORT_BASE_URL ?? "http://localhost:3000";
    const downloadUrl = `${downloadBase}/api/compliance/${complianceToken}`;
    await sendMail(
      composeComplianceEmail({
        to: report.email,
        companyName: report.companyName ?? undefined,
        downloadUrl,
        expiresDays: 7,
      }),
    ).then(async () => {
      await prisma.complianceReport.update({
        where: { reportToken: complianceToken },
        data: { emailSentAt: new Date() },
      });
    }).catch((err) => {
      console.error("Failed to send compliance email", err);
    });

    return NextResponse.json({ ok: true, compliance: true });
  }

  if (!domainField) {
    return NextResponse.json({ error: "Domain is required in checkout custom field." }, { status: 400 });
  }

  const normalizedDomain = normalizeDomain(domainField);
  const execId = process.env.LS_PRODUCT_EXECUTIVE;
  const productType = productId === execId ? "executive" : "pro";

  // Idempotency: if order already processed, return existing token
  const existingOrder = await prisma.order.findUnique({ where: { lemonOrderId } });
  if (existingOrder?.reportToken) {
    const downloadUrlBase = process.env.REPORT_BASE_URL ?? "http://localhost:3000";
    const downloadUrl = `${downloadUrlBase}/api/report/${existingOrder.reportToken}`;
    return NextResponse.json({ ok: true, reportToken: existingOrder.reportToken, downloadUrl, idempotent: true });
  }

  // Find cached scan if available
  const cacheKey = buildCacheKey(normalizedDomain);
  const since = new Date(Date.now() - CACHE_TTL_MS);
  const cachedScan = await prisma.scan.findFirst({
    where: { cacheKey, status: "done", createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
  });

  let scanId = cachedScan?.id;
  let result = cachedScan?.resultJson as ScanResult | undefined;

  if (!result) {
    const scan = await createQueuedScan(normalizedDomain);
    scanId = scan.id;
    // Run inline to deliver PDF quickly for paid users
    result = await runScanAndPersist(scan.id, normalizedDomain);
  }

  if (!scanId || !result) {
    return NextResponse.json({ error: "Failed to create scan result" }, { status: 500 });
  }

  const reportToken = generateReportToken();
  const pdfPath = await generatePdfReport({
    result,
    productType: productType === "executive" ? "executive" : "pro",
    reportToken,
  });

  const downloadUrlBase = process.env.REPORT_BASE_URL ?? "http://localhost:3000";
  const downloadUrl = `${downloadUrlBase}/api/report/${reportToken}`;

  await prisma.order.upsert({
    where: { lemonOrderId },
    update: { productType, domain: normalizedDomain, reportToken, scanId },
    create: {
      lemonOrderId,
      email,
      productType,
      domain: normalizedDomain,
      reportToken,
      scanId,
    },
  });

  await prisma.report.create({
    data: {
      reportToken,
      scanId,
      storageUrl: pdfPath,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return NextResponse.json({ ok: true, reportToken, downloadUrl });
}
