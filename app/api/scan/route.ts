import { NextRequest, NextResponse } from "next/server";
import { enqueueScan } from "@/lib/queue";
import { prisma } from "@/lib/db";
import { createQueuedScan, findCachedScan, normalizeDomain } from "@/lib/scan/service";

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

export async function POST(req: NextRequest) {
  try {
    const ip = getIp(req);
    if (rateLimited(ip)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await req.json();
    const domain = body?.domain as string;
    if (!domain) {
      return NextResponse.json({ error: "domain is required" }, { status: 400 });
    }

    const normalized = normalizeDomain(domain);
    const cached = await findCachedScan(normalized);
    if (cached) {
      return NextResponse.json({
        status: "done",
        cached: true,
        scanId: cached.id,
        result: cached.result,
      });
    }

    const existingRunning = await prisma.scan.findFirst({
      where: { domain: normalized, status: { in: ["queued", "running"] } },
    });
    if (existingRunning) {
      return NextResponse.json({ status: existingRunning.status, scanId: existingRunning.id });
    }

    const scan = await createQueuedScan(normalized);
    await enqueueScan(scan.id, normalized);
    return NextResponse.json({ status: scan.status, scanId: scan.id });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
