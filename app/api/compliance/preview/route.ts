import fs from "node:fs/promises";
import {
  generateBgIncidentProcedurePdf,
  generateDenetimProcedurePdf,
  generateKullaniciKimlikProcedurePdf,
  generateSureklilikProcedurePdf,
  generateYedeklemeProcedurePdf,
} from "@/lib/compliance/pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const doc = searchParams.get("doc");
  const generator =
    doc === "yedekleme"
      ? generateYedeklemeProcedurePdf
      : doc === "denetim"
      ? generateDenetimProcedurePdf
      : doc === "kimlik"
      ? generateKullaniciKimlikProcedurePdf
      : doc === "sureklilik"
      ? generateSureklilikProcedurePdf
      : generateBgIncidentProcedurePdf;
  const filePath = await generator("preview", "Ornek Sirket", { preview: true });
  const filename =
    doc === "yedekleme"
      ? "yedekleme-yonetimi-preview.pdf"
      : doc === "denetim"
      ? "denetim-izleri-yonetimi-preview.pdf"
      : doc === "kimlik"
      ? "kullanici-kimlik-yonetimi-preview.pdf"
      : doc === "sureklilik"
      ? "is-bt-sureklilik-preview.pdf"
      : "bg-olay-siber-olay-yonetimi-preview.pdf";
  const data = await fs.readFile(filePath);

  return new Response(new Uint8Array(data), {
    status: 200,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
