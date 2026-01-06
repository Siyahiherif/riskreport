import fs from "node:fs/promises";
import path from "node:path";
import type { ReactNode } from "react";
import { Document, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";
import { ComplianceResult } from "./engine";

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 11, fontFamily: "Helvetica", color: "#0f172a" },
  h1: { fontSize: 18, fontWeight: 700, marginBottom: 6 },
  h2: { fontSize: 13, fontWeight: 700, marginTop: 10, marginBottom: 4 },
  h3: { fontSize: 12, fontWeight: 700, marginTop: 8, marginBottom: 2 },
  muted: { color: "#475569" },
  section: { marginBottom: 8 },
  paragraph: { marginBottom: 4, lineHeight: 1.5 },
  headerBox: { borderWidth: 1, borderColor: "#0f172a", marginBottom: 14 },
  headerRow: { flexDirection: "row" },
  headerCell: { borderRightWidth: 1, borderBottomWidth: 1, borderColor: "#0f172a", padding: 8, flex: 1 },
  headerCellLast: { borderBottomWidth: 1, borderColor: "#0f172a", padding: 8, flex: 1 },
  headerMeta: { fontSize: 9, lineHeight: 1.4 },
  bullet: { marginLeft: 10 },
  footer: { position: "absolute", bottom: 24, left: 36, right: 36, fontSize: 9, color: "#475569" },
  previewStamp: { fontSize: 9, color: "#64748b", marginBottom: 6 },
});

const formatDate = (date: Date) => date.toISOString().slice(0, 10);

const DocShell = ({ title, children }: { title: string; children: ReactNode }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.h1}>{title}</Text>
      {children}
    </Page>
  </Document>
);

const buildInfoLines = (companyName?: string) => {
  const name = companyName || "Belirtilmedi";
  return [`Sirket: ${name}`, `Tarih: ${formatDate(new Date())}`, "Versiyon: v1.0"];
};

export async function generateComplianceSummaryPdf(
  reportToken: string,
  companyName: string | undefined,
  result: ComplianceResult,
  missingAreas: string[],
) {
  const filePath = path.join(process.cwd(), "reports", "compliance", `${reportToken}-summary.pdf`);
  const doc = (
    <DocShell title="Compliance Readiness Ozeti">
      <View style={styles.section}>
        {buildInfoLines(companyName).map((line) => (
          <Text key={line}>{line}</Text>
        ))}
      </View>
      <View style={styles.section}>
        <Text style={styles.h2}>Risk Skoru</Text>
        <Text>
          {result.score} / 100 - {result.riskLevel} Risk
        </Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.h2}>Hazirlik Durumu</Text>
        <Text>ISO 27001: {result.readiness.iso27001}</Text>
        <Text>KVKK: {result.readiness.kvkk}</Text>
        <Text>SOC2 (Security): {result.readiness.soc2}</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.h2}>Eksik Alanlar</Text>
        {missingAreas.length ? missingAreas.map((item) => <Text key={item}>- {item}</Text>) : <Text>Belirgin eksik alan yok</Text>}
      </View>
    </DocShell>
  );
  const buffer = await pdf(doc).toBuffer();
  await fs.writeFile(filePath, buffer);
  return filePath;
}

const templatePath = path.join(process.cwd(), "lib", "compliance", "templates", "bg-incident-procedure.txt");

const normalizeCompanyName = (companyName?: string) => companyName?.trim() || "Sirket";

const isHeading = (text: string) => {
  if (/^\d+(\.\d+)*\.?\s/.test(text)) return true;
  if (/^[A-Z0-9\s\-\.]+$/.test(text.replace(/[^A-Z0-9\s\-\.]/g, ""))) return true;
  return false;
};

const renderParagraph = (text: string, idx: number) => {
  const trimmed = text.trim();
  if (!trimmed) return null;
  if (isHeading(trimmed)) {
    return (
      <Text key={`h-${idx}`} style={styles.h2}>
        {trimmed}
      </Text>
    );
  }
  const bullet = trimmed.startsWith("•") || trimmed.startsWith("-");
  return (
    <Text key={`p-${idx}`} style={[styles.paragraph, bullet ? styles.bullet : undefined]}>
      {trimmed}
    </Text>
  );
};

async function loadBgIncidentParagraphs(companyName?: string) {
  const raw = await fs.readFile(templatePath, "utf-8");
  const name = normalizeCompanyName(companyName);
  const replaced = raw.replace(/\{\{COMPANY\}\}/g, name);
  return replaced.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
}

const chunkParagraphs = (items: string[], size: number) => {
  const chunks: string[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

export async function generateBgIncidentProcedurePdf(
  reportToken: string,
  companyName: string | undefined,
  options?: { preview?: boolean },
) {
  const reportDir = path.join(process.cwd(), "reports", "compliance");
  await fs.mkdir(reportDir, { recursive: true });
  const filePath = path.join(reportDir, `${reportToken}-bg-olay-siber-olay-yonetimi.pdf`);
  const orgName = normalizeCompanyName(companyName);
  const paragraphs = await loadBgIncidentParagraphs(companyName);
  const limited = options?.preview ? paragraphs.slice(0, 8) : paragraphs;
  const pageChunks = options?.preview ? [limited] : chunkParagraphs(limited, 32);

  const doc = (
    <Document>
      {pageChunks.map((chunk, pageIndex) => (
        <Page key={`page-${pageIndex}`} size="A4" style={styles.page}>
          <View style={styles.headerBox}>
            <View style={styles.headerRow}>
              <View style={[styles.headerCell, { flex: 0.8 }]}>
                <Text style={{ fontSize: 9 }}>LOGO</Text>
                <Text style={{ fontSize: 10, marginTop: 6 }}>{orgName}</Text>
              </View>
              <View style={[styles.headerCell, { flex: 1.4 }]}>
                <Text style={{ fontSize: 12, fontWeight: 700, textAlign: "center" }}>
                  BG Olay ve Siber Olay Yonetimi Proseduru
                </Text>
              </View>
              <View style={[styles.headerCellLast, { flex: 1.2 }]}>
                <Text style={styles.headerMeta}>DOKUMAN NO: PRO-BT-003</Text>
                <Text style={styles.headerMeta}>YAYIN TARIHI: 10.07.2024</Text>
                <Text style={styles.headerMeta}>REV. TARIHI: 26.12.2025</Text>
                <Text style={styles.headerMeta}>VERSIYON NO: 2</Text>
              </View>
            </View>
            <View style={{ flexDirection: "row" }}>
              <View style={[styles.headerCell, { flex: 0.8, borderBottomWidth: 0 }]} />
              <View style={[styles.headerCell, { flex: 1.4, borderBottomWidth: 0 }]}>
                <Text style={styles.headerMeta}>Hazirlayan: Bilgi Guvenligi Sorumlusu</Text>
                <Text style={styles.headerMeta}>Onaylayan: Yonetim Kurulu</Text>
              </View>
              <View style={[styles.headerCellLast, { flex: 1.2, borderBottomWidth: 0 }]}>
                <Text style={styles.headerMeta}>
                  SAYFA NO:{" "}
                  <Text render={({ pageNumber, totalPages }) => `Sayfa ${pageNumber} / ${totalPages}`} />
                </Text>
              </View>
            </View>
          </View>

          {options?.preview && pageIndex === 0 && (
            <Text style={styles.previewStamp}>PREVIEW - REDACTED EXCERPT</Text>
          )}

          {chunk.map((text, idx) => renderParagraph(text, pageIndex * 1000 + idx))}

          <Text style={styles.footer}>Generated for {orgName} | Report ID: {reportToken}</Text>
        </Page>
      ))}
    </Document>
  );
  const buffer = await pdf(doc).toBuffer();
  await fs.writeFile(filePath, buffer);
  return filePath;
}
