import fs from "node:fs/promises";
import path from "node:path";
import type { ReactNode } from "react";
import { Document, Font, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";
import { ComplianceResult } from "./engine";

const fontPath = path.join(process.cwd(), "CALIBRI.ttf");
Font.register({ family: "Calibri", src: fontPath });
Font.register({ family: "Calibri", src: fontPath, fontWeight: "bold" });

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 12, fontFamily: "Calibri", color: "#0f172a" },
  h1: { fontSize: 13, fontWeight: "bold", marginBottom: 6 },
  h2: { fontSize: 13, fontWeight: "bold", marginTop: 10, marginBottom: 4 },
  h3: { fontSize: 13, fontWeight: "bold", marginTop: 8, marginBottom: 2 },
  muted: { color: "#475569" },
  section: { marginBottom: 8 },
  paragraph: { marginBottom: 4, lineHeight: 1.5 },
  headerBox: { borderWidth: 1, borderColor: "#0f172a", marginBottom: 14 },
  headerRow: { flexDirection: "row" },
  headerCell: { borderRightWidth: 1, borderBottomWidth: 1, borderColor: "#0f172a", padding: 8, flex: 1 },
  headerCellLast: { borderBottomWidth: 1, borderColor: "#0f172a", padding: 8, flex: 1 },
  headerMeta: { fontSize: 11, lineHeight: 1.4 },
  bullet: { marginLeft: 12 },
  footer: { position: "absolute", bottom: 24, left: 36, right: 36, fontSize: 10, color: "#475569" },
  previewStamp: { fontSize: 10, color: "#64748b", marginBottom: 6 },
  tocTitle: { fontSize: 13, fontWeight: "bold", marginBottom: 8 },
  tocLine: { fontSize: 12, marginBottom: 4 },
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

const headingPhrases = [
  "GIRIS",
  "AMAC",
  "KAPSAM",
  "ILGILI KANUN VE DUZENLEMELER",
  "TANIMLAMALAR VE KISALTMALAR",
  "GOREV VE SORUMLULUKLAR",
  "UYGULAMA",
  "BILGI GUVENLIGI OLAYLARININ TANIMLANMASI",
  "BILGI GUVENLIGI OLAYLARININ TESPIT EDILMESI VE BILDIRILMESI",
  "BILGI GUVENLIGI OLAYLARININ ANALIZ EDILMESI VE ILETISIM",
  "BILGI GUVENLIGI OLAYLARINA MUDAHALE EDILMESI",
  "BILGI GUVENLIGI OLAYLARINA ILISKIN KANITLARIN ELDE EDILMESI",
  "BILGI GUVENLIGI OLAYLARININ KAPATILMASI",
  "BILGI GUVENLIGI OLAYLARININ RAPORLANMASI VE IZLENMESI",
  "SIBER OLAY YONETIMI",
  "SIBER OLAYLARIN TESPIT EDILMESI",
  "SIBER OLAYLARIN SINIFLANDIRILMASI",
  "SIBER OLAYLARA MUDAHALE SURECI",
  "SIBER OLAY SONRASINDA IZLENECEK ADIMLAR",
  "SIBER OLAYLARIN ANALIZI VE PAYDASLAR ILE ILISKILER",
  "ILGILI DOKUMANLAR",
];

const foldTurkish = (text: string) =>
  text
    .replace(/İ/g, "I")
    .replace(/İ/g, "I")
    .replace(/Ğ/g, "G")
    .replace(/Ü/g, "U")
    .replace(/Ş/g, "S")
    .replace(/Ö/g, "O")
    .replace(/Ç/g, "C");

const normalizeHeadingLine = (text: string) => {
  const match = text.match(/^(\d+(?:\.\d+)*)(\.?)(\s*)(.+)$/);
  if (match) {
    const [, num, dot, , rest] = match;
    return `${num}${dot ? "." : ""} ${rest}`;
  }
  return text;
};

const isHeading = (text: string) => {
  const cleaned = text.trim();
  if (!cleaned) return false;
  if (/^\d+(\.\d+)*\.?\s*\S+/.test(cleaned)) return true;
  const upper = normalizeForMatch(cleaned);
  if (headingPhrases.some((phrase) => upper.startsWith(phrase))) return true;
  if (cleaned.length <= 80 && cleaned === cleaned.toUpperCase()) return true;
  return false;
};

const isListTrigger = (line: string) =>
  /:$/.test(line) ||
  /siralani|siralanmis|erisilmelidir|asagidaki|asagida/.test(foldTurkish(line.toLowerCase()));

const inlineLabelPrefixes = [
  "KRITIK",
  "YUKSEK",
  "ORTA",
  "DUSUK",
  "ANLIK MUDAHALE",
  "GUNLUK MUDAHALE",
  "3 GUNLUK MUDAHALE",
  "HAFTALIK MUDAHALE",
];

const isInlineLabel = (line: string) => {
  const idx = line.indexOf(":");
  if (idx <= 0 || idx > 40) return false;
  const head = normalizeForMatch(line.slice(0, idx));
  return inlineLabelPrefixes.some((prefix) => head.startsWith(prefix));
};

type LineToken = { type: "heading" | "bullet" | "text"; text: string };

const tokenizeLines = (rawLines: string[]) => {
  const tokens: LineToken[] = [];
  let listMode = false;
  let previous = "";
  rawLines.forEach((line) => {
    let current = line.replace(/\s+/g, " ").trim();
    if (!current) {
      listMode = false;
      return;
    }
    if (current === previous) return;
    previous = current;

    if (current.startsWith("•") || current.startsWith("-")) {
      tokens.push({ type: "bullet", text: current.replace(/^[-•]\s*/, "") });
      return;
    }

    if (isHeading(current)) {
      listMode = false;
      tokens.push({ type: "heading", text: normalizeHeadingLine(current) });
      return;
    }

    if (listMode && isInlineLabel(current)) {
      listMode = false;
    }

    if (listMode) {
      tokens.push({ type: "bullet", text: current });
      return;
    }

    tokens.push({ type: "text", text: current });
    if (isListTrigger(current)) {
      listMode = true;
    }
  });
  return tokens;
};

const renderToken = (token: LineToken, idx: number) => {
  if (token.type === "heading") {
    return (
      <Text key={`h-${idx}`} style={styles.h2}>
        {token.text}
      </Text>
    );
  }
  if (token.type === "bullet") {
    return (
      <Text key={`b-${idx}`} style={[styles.paragraph, styles.bullet]}>
        • {token.text}
      </Text>
    );
  }
  return (
    <Text key={`p-${idx}`} style={styles.paragraph}>
      {token.text}
    </Text>
  );
};

async function loadBgIncidentParagraphs(companyName?: string) {
  const raw = await fs.readFile(templatePath, "utf-8");
  const name = normalizeCompanyName(companyName);
  const replaced = raw.replace(/\{\{COMPANY\}\}/g, name).replace(/Moneyout/gi, name);
  const lines = replaced.split(/\n/).map((line) => line.trim()).filter(Boolean);
  return stripPreamble(lines);
}

const chunkParagraphs = (items: LineToken[], size: number) => {
  const chunks: LineToken[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

const tocItems = [
  { label: "1. GIRIS", page: "3" },
  { label: "1.1 Amac", page: "3" },
  { label: "1.2 Kapsam", page: "3" },
  { label: "1.3 Ilgili Kanun ve Duzenlemeler", page: "3" },
  { label: "1.4 Tanimlamalar ve Kisaltmalar", page: "3" },
  { label: "2. GOREV VE SORUMLULUKLAR", page: "4" },
  { label: "2.1 Bilgi Guvenligi Sorumlusu", page: "4" },
  { label: "2.2 BT Muduru", page: "4" },
  { label: "2.3 Tedarikci Firma", page: "5" },
  { label: "2.4 Kurulus Personeli", page: "5" },
  { label: "3. UYGULAMA", page: "5" },
  { label: "3.1 Bilgi Guvenligi Olaylarinin Tanimlanmasi", page: "5" },
  { label: "3.2 Bilgi Guvenligi Olaylarinin Tespit Edilmesi ve Bildirilmesi", page: "7" },
  { label: "3.3 Bilgi Guvenligi Olaylarinin Analiz Edilmesi ve Iletisim", page: "8" },
  { label: "3.4 Bilgi Guvenligi Olaylarina Mudahale Edilmesi", page: "8" },
  { label: "3.5 Bilgi Guvenligi Olaylarina Iliskin Kanitlarin Elde Edilmesi", page: "9" },
  { label: "3.6 Bilgi Guvenligi Olaylarinin Kapatilmasi", page: "9" },
  { label: "3.7 Bilgi Guvenligi Olaylarinin Raporlanmasi ve Izlenmesi", page: "10" },
  { label: "3.8 Siber Olay Yonetimi", page: "10" },
  { label: "3.8.1 Siber Olaylarin Tespit Edilmesi", page: "10" },
  { label: "3.8.2 Siber Olaylarin Siniflandirilmasi", page: "11" },
  { label: "3.8.3 Siber Olaylara Mudahale Sureci", page: "11" },
  { label: "3.8.4 Siber Olay Sonrasinda Izlenecek Adimlar", page: "13" },
  { label: "3.8.5 Siber Olaylarin Analizi ve Paydaslar ile Iliskiler", page: "13" },
  { label: "4. ILGILI DOKUMANLAR", page: "15" },
];

const renderHeader = (orgName: string) => (
  <View style={styles.headerBox}>
    <View style={styles.headerRow}>
      <View style={[styles.headerCell, { flex: 0.8 }]}>
        <Text style={{ fontSize: 11 }}>LOGO</Text>
        <Text style={{ fontSize: 12, marginTop: 6 }}>{orgName}</Text>
      </View>
      <View style={[styles.headerCell, { flex: 1.4 }]}>
        <Text style={{ fontSize: 13, fontWeight: "bold", textAlign: "center" }}>
          BG Olay ve Siber Olay Y?netimi Prosed?r?
        </Text>
      </View>
      <View style={[styles.headerCellLast, { flex: 1.2 }]}>
        <Text style={styles.headerMeta}>DOK?MAN NO: PRO-BT-003</Text>
        <Text style={styles.headerMeta}>YAYIN TAR?H?: 10.07.2024</Text>
        <Text style={styles.headerMeta}>REV. TAR?H?: 26.12.2025</Text>
        <Text style={styles.headerMeta}>VERS?YON NO: 2</Text>
      </View>
    </View>
    <View style={{ flexDirection: "row" }}>
      <View style={[styles.headerCell, { flex: 0.8, borderBottomWidth: 0 }]} />
      <View style={[styles.headerCell, { flex: 1.4, borderBottomWidth: 0 }]}>
        <Text style={styles.headerMeta}>Haz?rlayan: Bilgi Guvenligi Sorumlusu</Text>
        <Text style={styles.headerMeta}>Onaylayan: Y?netim Kurulu</Text>
      </View>
      <View style={[styles.headerCellLast, { flex: 1.2, borderBottomWidth: 0 }]}>
        <Text style={styles.headerMeta}>
          SAYFA NO:{" "}
          <Text render={({ pageNumber, totalPages }) => `Sayfa ${pageNumber} / ${totalPages}`} />
        </Text>
      </View>
    </View>
  </View>
);

const renderTocLine = (label: string, page: string) => {
  const dots = ".".repeat(Math.max(3, 70 - label.length));
  return `${label} ${dots} ${page}`;
};

const normalizeForMatch = (text: string) =>
  foldTurkish(text.toUpperCase())
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const stripPreamble = (lines: string[]) => {
  const targets = ["GIRIS", "GENEL BAKIS"];
  const startIndex = lines.findIndex((line) =>
    targets.some((target) => normalizeForMatch(line).startsWith(target)),
  );
  if (startIndex === -1) return lines;
  return lines.slice(startIndex);
};

const getPreviewTokens = (tokens: LineToken[]) => {
  const anchor = "BILGI GUVENLIGI OLAYLARINA ILISKIN KANITLARIN ELDE EDILMESI";
  const startIndex = tokens.findIndex((token) =>
    normalizeForMatch(token.text).includes(anchor),
  );
  if (startIndex === -1) {
    return tokens.slice(0, 20);
  }
  return tokens.slice(startIndex, startIndex + 26);
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
  const lines = await loadBgIncidentParagraphs(companyName);
  const tokens = tokenizeLines(lines);
  const limited = options?.preview ? getPreviewTokens(tokens) : tokens;
  const pageChunks = options?.preview ? [limited] : chunkParagraphs(limited, 34);

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        {renderHeader(orgName)}
        <Text style={styles.tocTitle}>??indekiler</Text>
        {tocItems.map((item) => (
          <Text key={item.label} style={styles.tocLine}>
            {renderTocLine(item.label, item.page)}
          </Text>
        ))}
        {options?.preview && <Text style={styles.previewStamp}>Preview excerpt - full document is delivered after purchase.</Text>}
        <Text style={styles.footer}>Generated for {orgName} | Report ID: {reportToken}</Text>
      </Page>

      {pageChunks.map((chunk, pageIndex) => (
        <Page key={`page-${pageIndex}`} size="A4" style={styles.page}>
          {renderHeader(orgName)}
          {chunk.map((token, idx) => renderToken(token, pageIndex * 1000 + idx))}
          <Text style={styles.footer}>Generated for {orgName} | Report ID: {reportToken}</Text>
        </Page>
      ))}
    </Document>
  );
  const buffer = await pdf(doc).toBuffer();
  await fs.writeFile(filePath, buffer);
  return filePath;
}
