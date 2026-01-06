import fs from "node:fs/promises";
import { generateBgIncidentProcedurePdf } from "@/lib/compliance/pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const filePath = await generateBgIncidentProcedurePdf("preview", "Ornek Sirket", { preview: true });
  const data = await fs.readFile(filePath);

  return new Response(new Uint8Array(data), {
    status: 200,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline; filename=\"bg-olay-siber-olay-yonetimi-preview.pdf\"",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
