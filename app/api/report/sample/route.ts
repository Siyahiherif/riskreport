import { NextResponse } from "next/server";
import { generatePdfReport } from "@/lib/pdf";
import { sampleResult } from "@/lib/sample";
import { generateReportToken } from "@/lib/tokens";
import fs from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

export async function GET() {
  const token = `sample-${generateReportToken().slice(0, 8)}`;
  const filePath = path.join(process.cwd(), "reports", `${token}.pdf`);
  const exists = await fs
    .access(filePath)
    .then(() => true)
    .catch(() => false);

  let finalPath = filePath;
  if (!exists) {
    finalPath = await generatePdfReport({ result: sampleResult, productType: "executive", reportToken: token });
  }

  const data = await fs.readFile(finalPath);
  return new NextResponse(data, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename=\"sample-risk-report.pdf\"`,
    },
  });
}
