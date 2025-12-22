import { ScanStatus } from "@prisma/client";
import { prisma } from "../db";
import { ANALYSIS_VERSION, CACHE_TTL_MS } from "../constants";
import { computeOverallScore, selectTopFindings } from "../scoring";
import { Finding, ScanResult } from "../types";
import { runDnsChecks, runHeaderChecks, runRedirectChecks, runTlsChecks } from "./modules";
import { assertPublicHostname, toAsciiDomain } from "./security";
import { sendMail } from "../email";
import { generatePdfReport } from "../pdf";
import { generateReportToken } from "../tokens";

export const normalizeDomain = (input: string): string => {
  try {
    const url = input.startsWith("http") ? new URL(input) : new URL(`http://${input}`);
    return toAsciiDomain(url.hostname.toLowerCase());
  } catch {
    throw new Error("Invalid domain");
  }
};

export const buildCacheKey = (domain: string) => `${ANALYSIS_VERSION}:${domain}`;

export const findCachedScan = async (
  domain: string
): Promise<{ id: string; result: ScanResult } | null> => {
  const now = Date.now();
  const since = new Date(now - CACHE_TTL_MS);
  const cacheKey = buildCacheKey(domain);
  const scan = await prisma.scan.findFirst({
    where: {
      cacheKey,
      status: ScanStatus.done,
      createdAt: { gte: since },
    },
    orderBy: { createdAt: "desc" },
  });
  if (!scan?.resultJson) return null;
  return { id: scan.id, result: scan.resultJson as ScanResult };
};

export const createQueuedScan = async (domain: string, emailOptIn?: string) => {
  const normalized = normalizeDomain(domain);
  await assertPublicHostname(normalized);
  return prisma.scan.create({
    data: {
      domain: normalized,
      emailOptIn: emailOptIn || null,
      cacheKey: buildCacheKey(normalized),
      status: ScanStatus.queued,
      analysisVersion: ANALYSIS_VERSION,
    },
  });
};

export const runScanAndPersist = async (scanId: string, domain: string): Promise<ScanResult> => {
  const existingScan = await prisma.scan.findUnique({ where: { id: scanId } });
  await prisma.scan.update({
    where: { id: scanId },
    data: { status: ScanStatus.running },
  });

  try {
    const normalized = normalizeDomain(domain);
    await assertPublicHostname(normalized);
    const findings: Finding[] = [];
    const [dnsFindings, tlsFindings, headerFindings, redirectFindings] = await Promise.all([
      runDnsChecks(normalized),
      runTlsChecks(normalized),
      runHeaderChecks(normalized),
      runRedirectChecks(normalized),
    ]);
    findings.push(...dnsFindings, ...tlsFindings, ...headerFindings, ...redirectFindings);

    const score = computeOverallScore(findings);
    const result: ScanResult = {
      domain: normalized,
      analysisVersion: ANALYSIS_VERSION,
      findings,
      score,
      generatedAt: new Date().toISOString(),
      topFindings: selectTopFindings(findings),
    };

    await prisma.scan.update({
      where: { id: scanId },
      data: {
        status: ScanStatus.done,
        finishedAt: new Date(),
        resultJson: result,
      },
    });

    if (existingScan?.emailOptIn) {
      try {
        const reportToken = generateReportToken();
        const pdfPath = await generatePdfReport({ result, productType: "pro", reportToken });
        await prisma.report.create({
          data: {
            reportToken,
            scanId,
            storageUrl: pdfPath,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        });
        const downloadBase = process.env.REPORT_BASE_URL ?? "http://localhost:3000";
        const downloadUrl = `${downloadBase}/api/report/${reportToken}`;
        await sendMail({
          to: existingScan.emailOptIn,
          subject: `Your passive risk report is ready for ${result.domain}`,
          text: `Your report is ready. Download: ${downloadUrl}`,
          html: `<p>Your passive IT risk report is ready.</p><p><a href="${downloadUrl}">Download PDF</a></p><p>This link expires in 7 days.</p>`,
        });
      } catch (emailErr) {
        console.error("Failed to send report email", emailErr);
      }
    }

    return result;
  } catch (err) {
    await prisma.scan.update({
      where: { id: scanId },
      data: { status: ScanStatus.error, errorMessage: (err as Error).message, finishedAt: new Date() },
    });
    throw err;
  }
};
