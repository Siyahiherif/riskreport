import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const revalidate = 0;

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const scan = await prisma.scan.findUnique({ where: { id: params.id } });
  if (!scan) {
    return NextResponse.json({ error: "Scan not found" }, { status: 404 });
  }

  return NextResponse.json({
    scanId: scan.id,
    status: scan.status,
    result: scan.resultJson,
    error: scan.errorMessage,
  });
}
