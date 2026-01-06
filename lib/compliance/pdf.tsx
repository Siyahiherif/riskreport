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
        <Text style={styles.h2}>Hazırlık Durumu</Text>
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
  "GİRİŞ",
  "AMAÇ",
  "KAPSAM",
  "İLGİLİ KANUN VE DÜZENLEMELER",
  "TANIMLAMALAR VE KISALTMALAR",
  "GÖREV VE SORUMLULUKLAR",
  "UYGULAMA",
  "BİLGİ GÜVENLİĞİ OLAYLARININ TANIMLANMASI",
  "BİLGİ GÜVENLİĞİ OLAYLARININ TESPIT EDILMESI VE BİLDİRİLMESİ",
  "BİLGİ GÜVENLİĞİ OLAYLARININ ANALİZ EDİLMESİ VE İLETİŞİM",
  "BİLGİ GÜVENLİĞİ OLAYLARINA MUDAHALE EDİLMEŞİ",
  "BİLGİ GÜVENLİĞİ OLAYLARINA İLİŞKİN KANITLARIN ELDE EDİLMESİ",
  "BİLGİ GÜVENLİĞİ OLAYLARININ KAPATILMASI",
  "BİLGİ GÜVENLİĞİ OLAYLARININ RAPORLANMASI VE İZLENMESİ",
  "SİBER OLAY YÖNETİMİ",
  "SIBER OLAYLARIN TESPİT EDİLMESİ",
  "SIBER OLAYLARIN SINIFLANDIRILMASI",
  "SİBER OLAYLARA MUDAHALE SÜRECİ",
  "SİBER OLAY SONRASINDA İZLENECEK ADIMLAR",
  "SİBER OLAYLARIN ANALİZİ VE PAYDAŞLAR İLE İLİŞKİLER",
  "İLGİLİ DOKÜMANLAR",
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
  "KRİTİK",
  "YÜKSEK",
  "ORTA",
  "DÜŞÜK",
  "ANLIK MÜDAHALE",
  "GÜNLÜK MÜDAHALE",
  "3 GÜNLÜK MÜDAHALE",
  "HAFTALIK MÜDAHALE",
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
  { label: "1. GİRİŞ", page: "3" },
  { label: "1.1 AMAÇ", page: "3" },
  { label: "1.2 KAPSAM", page: "3" },
  { label: "1.3 İLGİLİ KANUN VE DÜZENLEMELER", page: "3" },
  { label: "1.4 TANIMLAMALAR VE KISALTMALAR", page: "3" },
  { label: "2. GÖREV VE SORUMLULUKLAR", page: "4" },
  { label: "2.1 BİLGİ GÜVENLİĞİ SORUMLUSU", page: "4" },
  { label: "2.2 BT MÜDÜRÜ", page: "4" },
  { label: "2.3 TEDARİKÇİ FİRMASI", page: "5" },
  { label: "2.4 KURULUS PERSONELİ", page: "5" },
  { label: "3. UYGULAMA", page: "5" },
  { label: "3.1 BİLGİ GÜVENLİĞİ OLAYLARININ TANIMLANMASI", page: "5" },
  { label: "3.2 BİLGİ GÜVENLİĞİ OLAYLARININ TESPİT EDİLMESİ VE BİLDİRİLMESİ", page: "7" },
  { label: "3.3 BİLGİ GÜVENLİĞİ OLAYLARININ ANALİZ EDİLMESİ VE İLETİŞİM", page: "8" },
  { label: "3.4 BİLGİ GÜVENLİĞİ OLAYLARINA MÜDAHALE EDİLMESİ", page: "8" },
  { label: "3.5 BİLGİ GÜVENLİĞİ OLAYLARINA İLİŞKİN KANITLARIN ELDE EDİLMESİ", page: "9" },
  { label: "3.6 BİLGİ GÜVENLİĞİ OLAYLARININ KAPATILMASI", page: "9" },
  { label: "3.7 BİLGİ GÜVENLİĞİ OLAYLARININ RAPORLANMASI VE İZLENMESİ", page: "10" },
  { label: "3.8 SİBER OLAY YÖNETİMİ", page: "10" },
  { label: "3.8.1 SİBER OLAYLARIN TESPİT EDİLMESİ", page: "10" },
  { label: "3.8.2 SİBER OLAYLARIN SINIFLANDIRILMASI", page: "11" },
  { label: "3.8.3 SİBER OLAYLARA MÜDAHALE SÜRECİ", page: "11" },
  { label: "3.8.4 SİBER OLAY SONRASINDA İZLENECEK ADIMLAR", page: "13" },
  { label: "3.8.5 SİBER OLAYLARIN ANALİZİ VE PAYDAŞLAR İLE İLİŞKİLER", page: "13" },
  { label: "4. İLGİLİ DOKÜMANLAR", page: "15" },
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
          BG Olay ve Siber Olay Yönetimi Prosedürü
        </Text>
      </View>
      <View style={[styles.headerCellLast, { flex: 1.2 }]}>
        <Text style={styles.headerMeta}>DOKüMAN NO: </Text>
        <Text style={styles.headerMeta}>YAYIN TARiH: </Text>
        <Text style={styles.headerMeta}>REV. TARiHi: </Text>
        <Text style={styles.headerMeta}>VERSiON NO: </Text>
      </View>
    </View>
    <View style={{ flexDirection: "row" }}>
      <View style={[styles.headerCell, { flex: 0.8, borderBottomWidth: 0 }]} />
      <View style={[styles.headerCell, { flex: 1.4, borderBottomWidth: 0 }]}>
        <Text style={styles.headerMeta}>Hazırlayan: Bilgi Güvenliği Sorumlusu</Text>
        <Text style={styles.headerMeta}>Onaylayan: Yönetim Kurulu</Text>
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
  const targets = ["GİRİŞ", "GENEL BAKIŞ"];
  const startIndex = lines.findIndex((line) =>
    targets.some((target) => normalizeForMatch(line).startsWith(target)),
  );
  if (startIndex === -1) return lines;
  return lines.slice(startIndex);
};

const getPreviewTokens = (tokens: LineToken[]) => {
  const anchor = "BİLGİ GÜVENLİĞİ OLAYLARINA İLİŞKİN KANITLARIN ELDE EDİLMESİ";
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
