import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/db";
import { evaluateCompliance } from "@/lib/compliance/engine";
import { buildCheckoutUrl } from "@/lib/compliance/checkout";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizePayload(body: any) {
  if (!body || typeof body !== "object") return null;
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const companyName = typeof body.companyName === "string" ? body.companyName.trim() : undefined;
  const answers = body.answers && typeof body.answers === "object" ? body.answers : null;
  if (!email || !email.includes("@") || !answers) return null;
  return { email, companyName, answers };
}

export async function POST(req: Request) {
  try {
    const payload = normalizePayload(await req.json());
    if (!payload) {
      return NextResponse.json({ error: "invalid input" }, { status: 400 });
    }

    const reportToken = uuidv4().replace(/-/g, "");
    const result = evaluateCompliance(payload.answers);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.complianceReport.create({
      data: {
        reportToken,
        email: payload.email,
        companyName: payload.companyName,
        answers: payload.answers,
        score: result.score,
        riskLevel: result.riskLevel,
        readiness: result.readiness,
        expiresAt,
      },
    });

    const checkoutUrl = buildCheckoutUrl({
      reportToken,
      email: payload.email,
      companyName: payload.companyName,
    });

    return NextResponse.json({
      ok: true,
      reportToken,
      checkoutUrl,
      score: result.score,
      riskLevel: result.riskLevel,
      readiness: result.readiness,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (err: any) {
    console.error("Compliance submit error", err);
    return NextResponse.json({ error: err?.message ?? "Invalid request" }, { status: 400 });
  }
}
