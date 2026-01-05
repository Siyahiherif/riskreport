import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";
import archiver from "archiver";
import { ComplianceAnswers, ComplianceResult } from "./engine";
import { buildPolicySections, generateComplianceSummaryPdf, generatePolicyPdf } from "./pdf";

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

  const policySections = buildPolicySections(answers, companyName);

  const summaryPath = await generateComplianceSummaryPdf(reportToken, companyName, result, result.missingAreas);
  const infoSecurityPath = await generatePolicyPdf(reportToken, "info-security", "Bilgi Guvenligi Politikasi", policySections.infoSecurity);
  const accessControlPath = await generatePolicyPdf(reportToken, "access-control", "Erisim Kontrol Politikasi", policySections.accessControl);
  const loggingPath = await generatePolicyPdf(reportToken, "logging-monitoring", "Loglama ve Izleme Politikasi", policySections.loggingMonitoring);
  const incidentPath = await generatePolicyPdf(reportToken, "incident-response", "Olay Mudahale Proseduru", policySections.incidentResponse);
  const riskSummaryPath = await generatePolicyPdf(reportToken, "risk-summary", "Risk Degerlendirme Ozeti", policySections.riskSummary);

  const zipPath = path.join(reportDir, `${reportToken}.zip`);
  const output = fs.createWriteStream(zipPath);
  const archive = archiver("zip", { zlib: { level: 9 } });

  const files = [summaryPath, infoSecurityPath, accessControlPath, loggingPath, incidentPath, riskSummaryPath];

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
