import { ScanStatus } from "@prisma/client";
import { prisma } from "../db";
import { ANALYSIS_VERSION, CACHE_TTL_MS } from "../constants";
import { computeOverallScore, selectTopFindings } from "../scoring";
import { Finding, ScanResult } from "../types";
import { runDnsChecks, runHeaderChecks, runRedirectChecks, runTlsChecks } from "./modules";
import { assertPublicHostname, toAsciiDomain } from "./security";

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

    return result;
  } catch (err) {
    await prisma.scan.update({
      where: { id: scanId },
      data: { status: ScanStatus.error, errorMessage: (err as Error).message, finishedAt: new Date() },
    });
    throw err;
  }
};
