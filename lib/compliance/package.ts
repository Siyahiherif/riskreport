import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";
import archiver from "archiver";
import { ComplianceAnswers, ComplianceResult } from "./engine";
import {
  generateBgIncidentProcedurePdf,
  generateDenetimProcedurePdf,
  generateKullaniciKimlikProcedurePdf,
  generateSureklilikProcedurePdf,
  generateYedeklemeProcedurePdf,
} from "./pdf";

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
  const denetimPath = await generateDenetimProcedurePdf(reportToken, companyName);
  const yedeklemePath = await generateYedeklemeProcedurePdf(reportToken, companyName);
  const kimlikPath = await generateKullaniciKimlikProcedurePdf(reportToken, companyName);
  const sureklilikPath = await generateSureklilikProcedurePdf(reportToken, companyName);

  const zipPath = path.join(reportDir, `${reportToken}.zip`);
  const output = fs.createWriteStream(zipPath);
  const archive = archiver("zip", { zlib: { level: 9 } });

  const files = [bgIncidentPath, denetimPath, yedeklemePath, kimlikPath, sureklilikPath];

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
