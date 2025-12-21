import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const noStore = { "Cache-Control": "no-store" };

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const scan = await prisma.scan.findUnique({ where: { id } });
  if (!scan) {
    return NextResponse.json({ error: "Scan not found" }, { status: 404, headers: noStore });
  }

  return NextResponse.json(
    {
      scanId: scan.id,
      status: scan.status,
      result: scan.resultJson,
      error: scan.errorMessage,
    },
    { headers: noStore }
  );
}
