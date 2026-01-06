import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";
import archiver from "archiver";
import { ComplianceAnswers, ComplianceResult } from "./engine";
import { generateBgIncidentProcedurePdf } from "./pdf";

export type CompliancePackageResult = {
  zipPath: string;
  files: string[];
};

export async function generateCompliancePackage({
  reportToken,
  companyName,
  answers,
  result,
}: {
  reportToken: string;
  companyName?: string;
  answers: ComplianceAnswers;
  result: ComplianceResult;
}): Promise<CompliancePackageResult> {
  const reportDir = path.join(process.cwd(), "reports", "compliance");
  await fsPromises.mkdir(reportDir, { recursive: true });

  const bgIncidentPath = await generateBgIncidentProcedurePdf(reportToken, companyName);

  const zipPath = path.join(reportDir, `${reportToken}.zip`);
  const output = fs.createWriteStream(zipPath);
  const archive = archiver("zip", { zlib: { level: 9 } });

  const files = [bgIncidentPath];

  await new Promise<void>((resolve, reject) => {
    output.on("close", () => resolve());
    archive.on("error", (err) => reject(err));
    archive.pipe(output);
    files.forEach((filePath) => {
      archive.file(filePath, { name: path.basename(filePath) });
    });
    archive.finalize();
  });

  return { zipPath, files };
}
