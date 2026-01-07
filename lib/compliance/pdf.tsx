import fs from "node:fs/promises";
import path from "node:path";
import type { ReactNode } from "react";
import { Document, Font, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";
import { ComplianceResult } from "./engine";

const fontPath = path.join(process.cwd(), "CALIBRI.ttf");
Font.register({ family: "Calibri", src: fontPath });
Font.register({ family: "Calibri", src: fontPath, fontWeight: "bold" });

const CM_TO_PT = 28.35;
const PAGE_PADDING = 2.5 * CM_TO_PT;
const BULLET_INDENT = 0.63 * CM_TO_PT;

const styles = StyleSheet.create({
  page: {
    paddingTop: PAGE_PADDING,
    paddingBottom: PAGE_PADDING,
    paddingLeft: PAGE_PADDING,
    paddingRight: PAGE_PADDING,
    fontSize: 12,
    fontFamily: "Calibri",
    color: "#111827",
    textAlign: "left",
  },
  heading1: { fontSize: 13, fontWeight: "bold", marginTop: 18, marginBottom: 8 },
  heading2: { fontSize: 12.5, fontWeight: "bold", marginTop: 14, marginBottom: 6 },
  heading3: { fontSize: 12, fontWeight: "bold", marginTop: 10, marginBottom: 4 },
  paragraph: { marginBottom: 6, lineHeight: 1.15 },
  listRow: { flexDirection: "row", marginBottom: 6 },
  listBullet: { width: BULLET_INDENT, fontSize: 12, lineHeight: 1.15 },
  listText: { flex: 1, fontSize: 12, lineHeight: 1.15 },
  headerBox: { borderWidth: 1, borderColor: "#111827", marginBottom: 14 },
  headerRow: { flexDirection: "row" },
  headerCell: { borderRightWidth: 1, borderBottomWidth: 1, borderColor: "#111827", padding: 8, flex: 1 },
  headerCellLast: { borderBottomWidth: 1, borderColor: "#111827", padding: 8, flex: 1 },
  headerMeta: { fontSize: 9, lineHeight: 1.3 },
  tocTitle: { fontSize: 13, fontWeight: "bold", marginBottom: 8 },
  tocLine: { fontSize: 12, marginBottom: 4 },
  table: { borderWidth: 0.5, borderColor: "#111827", marginTop: 6, marginBottom: 12 },
  tableRow: { flexDirection: "row" },
  tableHeaderCell: {
    flex: 1,
    borderRightWidth: 0.5,
    borderColor: "#111827",
    backgroundColor: "#f2f2f2",
    padding: 6,
    fontSize: 11.5,
    fontWeight: "bold",
  },
  tableCell: { flex: 1, borderRightWidth: 0.5, borderColor: "#111827", padding: 6, fontSize: 11 },
  footer: {
    position: "absolute",
    left: PAGE_PADDING,
    right: PAGE_PADDING,
    bottom: PAGE_PADDING - 12,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 9,
    color: "#666666",
  },
  previewStamp: { fontSize: 10, color: "#475569", marginTop: 12 },
});

type TemplateItem =
  | { type: "heading"; level: number; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; level: number; text: string }
  | { type: "table"; rows: string[][] };

type TemplateDoc = {
  metaTable: string[][];
  versionTable: string[][];
  toc: { label: string; page: string }[];
  body: TemplateItem[];
};

type ProcedureKey = "bg" | "denetim";

const templateMap: Record<ProcedureKey, string> = {
  bg: path.join(process.cwd(), "lib", "compliance", "templates", "bg-incident-procedure.json"),
  denetim: path.join(process.cwd(), "lib", "compliance", "templates", "denetim-procedure.json"),
};

const procedureConfig: Record<ProcedureKey, { title: string; docNo: string }> = {
  bg: {
    title: "BG Olay ve Siber Olay Yönetimi Prosedürü",
    docNo: "PRO-BT-003",
  },
  denetim: {
    title: "Denetim İzleri Yönetimi Prosedürü",
    docNo: "PRO-BT-004",
  },
};

const previewAnchors: Record<ProcedureKey, string> = {
  bg: "Bilgi Güvenliği Olaylarına İlişkin Kanıtların Elde Edilmesi",
  denetim: "Denetim İzlerinin Gözden Geçirilmesi ve Raporlanması",
};

const formatDate = (date: Date) => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

const normalizeCompanyName = (companyName?: string) => companyName?.trim() || "Şirket";

const fixEncoding = (text: string) => {
  const decoded = Buffer.from(text, "latin1").toString("utf8");
  return decoded
    .replace(/ƒ\?o/g, "\"")
    .replace(/ƒ\?\?/g, "\"")
    .replace(/�/g, "");
};

const replaceCompany = (text: string, companyName: string) => {
  const cleaned = fixEncoding(text);
  return cleaned
    .replace(/Moneyout/gi, companyName)
    .replace(/Örnek Şirket/gi, companyName)
    .replace(/\{\{COMPANY\}\}/g, companyName);
};

const loadTemplate = async (key: ProcedureKey): Promise<TemplateDoc> => {
  const raw = await fs.readFile(templateMap[key], "utf-8");
  return JSON.parse(raw) as TemplateDoc;
};

const applyCompany = (doc: TemplateDoc, companyName: string): TemplateDoc => ({
  metaTable: doc.metaTable.map((row) => row.map((cell) => replaceCompany(cell, companyName))),
  versionTable: doc.versionTable.map((row) => row.map((cell) => replaceCompany(cell, companyName))),
  toc: doc.toc.map((item) => ({
    label: replaceCompany(item.label, companyName),
    page: item.page,
  })),
  body: doc.body.map((item) => {
    if (item.type === "table") {
      return { ...item, rows: item.rows.map((row) => row.map((cell) => replaceCompany(cell, companyName))) };
    }
    return { ...item, text: replaceCompany(item.text, companyName) } as TemplateItem;
  }),
});

const numberHeadings = (items: TemplateItem[]) => {
  const counters = [0, 0, 0];
  return items.map((item) => {
    if (item.type !== "heading") return item;
    const level = Math.min(Math.max(item.level, 1), 3);
    if (level === 1) {
      counters[0] += 1;
      counters[1] = 0;
      counters[2] = 0;
    } else if (level === 2) {
      counters[1] += 1;
      counters[2] = 0;
    } else {
      counters[2] += 1;
    }
    const prefix =
      level === 1
        ? `${counters[0]}.`
        : level === 2
        ? `${counters[0]}.${counters[1]}`
        : `${counters[0]}.${counters[1]}.${counters[2]}`;
    if (/^\d+(\.\d+)*\s*/.test(item.text)) {
      return item;
    }
    return { ...item, text: `${prefix} ${item.text}` } as TemplateItem;
  });
};

const renderHeader = (orgName: string, key: ProcedureKey) => {
  const config = procedureConfig[key];
  return (
    <View style={styles.headerBox}>
      <View style={styles.headerRow}>
        <View style={[styles.headerCell, { flex: 0.9 }]}>
          <Text style={{ fontSize: 10 }}>LOGO</Text>
          <Text style={{ fontSize: 11, marginTop: 6 }}>{orgName}</Text>
        </View>
        <View style={[styles.headerCell, { flex: 1.5 }]}>
          <Text style={{ fontSize: 12, fontWeight: "bold", textAlign: "center" }}>{config.title}</Text>
        </View>
        <View style={[styles.headerCellLast, { flex: 1.2 }]}>
          <Text style={styles.headerMeta}>DOKÜMAN NO : {config.docNo}</Text>
          <Text style={styles.headerMeta}>YAYIN TARİHİ : {formatDate(new Date())}</Text>
          <Text style={styles.headerMeta}>REV. TARİHİ : {formatDate(new Date())}</Text>
          <Text style={styles.headerMeta}>VERSİYON NO : 1</Text>
        </View>
      </View>
      <View style={{ flexDirection: "row" }}>
        <View style={[styles.headerCell, { flex: 0.9, borderBottomWidth: 0 }]} />
        <View style={[styles.headerCell, { flex: 1.5, borderBottomWidth: 0 }]}>
          <Text style={styles.headerMeta}>Hazırlayan : Bilgi Teknolojileri Birimi</Text>
          <Text style={styles.headerMeta}>Onaylayan : Yönetim Kurulu</Text>
        </View>
        <View style={[styles.headerCellLast, { flex: 1.2, borderBottomWidth: 0 }]}>
          <Text style={styles.headerMeta}>
            SAYFA NO :{" "}
            <Text render={({ pageNumber, totalPages }) => `Sayfa ${pageNumber} / ${totalPages}`} />
          </Text>
        </View>
      </View>
    </View>
  );
};

const renderFooter = (orgName: string) => (
  <View style={styles.footer}>
    <Text>Gizlidir - İzinsiz çoğaltılamaz</Text>
    <Text>{orgName}</Text>
    <Text render={({ pageNumber, totalPages }) => `Sayfa ${pageNumber} / ${totalPages}`} />
  </View>
);

const renderMetaTable = (rows: string[][]) => (
  <View style={styles.table}>
    {rows.map((row, idx) => (
      <View key={`meta-${idx}`} style={styles.tableRow}>
        <Text style={[styles.tableCell, { flex: 1, fontWeight: "bold" }]}>{fixEncoding(row[0])}</Text>
        <Text style={[styles.tableCell, { flex: 2 }]}>{fixEncoding(row[1])}</Text>
      </View>
    ))}
  </View>
);

const renderTable = (rows: string[][]) => {
  if (!rows.length) return null;
  const header = rows[0];
  const bodyRows = rows.slice(1).filter((row) => row.some((cell) => cell));
  return (
    <View style={styles.table}>
      <View style={styles.tableRow}>
        {header.map((cell, idx) => (
          <Text
            key={`th-${idx}`}
            style={[
              styles.tableHeaderCell,
              idx === header.length - 1 ? { borderRightWidth: 0 } : {},
            ]}
          >
            {fixEncoding(cell)}
          </Text>
        ))}
      </View>
      {bodyRows.map((row, ridx) => (
        <View key={`tr-${ridx}`} style={styles.tableRow}>
          {row.map((cell, cidx) => (
            <Text
              key={`td-${ridx}-${cidx}`}
              style={[
                styles.tableCell,
                cidx === row.length - 1 ? { borderRightWidth: 0 } : {},
              ]}
            >
              {fixEncoding(cell)}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
};

const renderTocLine = (label: string, page: string) => {
  const clean = fixEncoding(label)
    .replace(/\s+/g, " ")
    .replace(/(\d)\.(?=\S)/g, "$1. ")
    .replace(/(\d)([A-Za-zÇĞİÖŞÜçğıöşü])/g, "$1 $2")
    .trim();
  const dots = ".".repeat(Math.max(3, 80 - clean.length));
  return `${clean} ${dots} ${page}`;
};

const renderItem = (item: TemplateItem, idx: number) => {
  if (item.type === "heading") {
    if (item.level === 1) return <Text key={`h1-${idx}`} style={styles.heading1}>{fixEncoding(item.text)}</Text>;
    if (item.level === 2) return <Text key={`h2-${idx}`} style={styles.heading2}>{fixEncoding(item.text)}</Text>;
    return <Text key={`h3-${idx}`} style={styles.heading3}>{fixEncoding(item.text)}</Text>;
  }
  if (item.type === "list") {
    const indent = BULLET_INDENT * (item.level + 1);
    const bulletSymbol = item.level > 0 ? "–" : "•";
    return (
      <View key={`li-${idx}`} style={[styles.listRow, { marginLeft: indent - BULLET_INDENT }]}>
        <Text style={styles.listBullet}>{bulletSymbol}</Text>
        <Text style={styles.listText}>{fixEncoding(item.text)}</Text>
      </View>
    );
  }
  if (item.type === "table") {
    return <View key={`tbl-${idx}`}>{renderTable(item.rows)}</View>;
  }
  return (
    <Text key={`p-${idx}`} style={styles.paragraph}>
      {fixEncoding(item.text)}
    </Text>
  );
};

const getPreviewItems = (items: TemplateItem[], key: ProcedureKey) => {
  const anchor = previewAnchors[key];
  const normalize = (text: string) =>
    fixEncoding(text).toUpperCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
  const startIndex = items.findIndex(
    (item) => item.type === "heading" && normalize(item.text).includes(normalize(anchor)),
  );
  if (startIndex === -1) return items.slice(0, 20);
  return items.slice(startIndex, startIndex + 26);
};

const chunkItems = (items: TemplateItem[], size: number) => {
  const chunks: TemplateItem[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

const DocShell = ({ title, children }: { title: string; children: ReactNode }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.heading1}>{title}</Text>
      {children}
    </Page>
  </Document>
);

const buildInfoLines = (companyName?: string) => {
  const name = companyName || "Belirtilmedi";
  return [`Şirket: ${name}`, `Tarih: ${formatDate(new Date())}`, "Versiyon: v1.0"];
};

export async function generateComplianceSummaryPdf(
  reportToken: string,
  companyName: string | undefined,
  result: ComplianceResult,
  missingAreas: string[],
) {
  const filePath = path.join(process.cwd(), "reports", "compliance", `${reportToken}-summary.pdf`);
  const doc = (
    <DocShell title="Compliance Readiness Özeti">
      <View style={{ marginBottom: 8 }}>
        {buildInfoLines(companyName).map((line) => (
          <Text key={line}>{line}</Text>
        ))}
      </View>
      <View style={{ marginBottom: 8 }}>
        <Text style={styles.heading2}>Risk Skoru</Text>
        <Text>
          {result.score} / 100 - {result.riskLevel} Risk
        </Text>
      </View>
      <View style={{ marginBottom: 8 }}>
        <Text style={styles.heading2}>Hazırlık Durumu</Text>
        <Text>ISO 27001: {result.readiness.iso27001}</Text>
        <Text>KVKK: {result.readiness.kvkk}</Text>
        <Text>SOC2 (Security): {result.readiness.soc2}</Text>
      </View>
      <View style={{ marginBottom: 8 }}>
        <Text style={styles.heading2}>Eksik Alanlar</Text>
        {missingAreas.length ? missingAreas.map((item) => <Text key={item}>- {item}</Text>) : <Text>Belirgin eksik alan yok</Text>}
      </View>
    </DocShell>
  );
  const buffer = await pdf(doc).toBuffer();
  await fs.writeFile(filePath, buffer);
  return filePath;
}

async function generateProcedurePdf(
  key: ProcedureKey,
  reportToken: string,
  companyName: string | undefined,
  options?: { preview?: boolean },
) {
  const reportDir = path.join(process.cwd(), "reports", "compliance");
  await fs.mkdir(reportDir, { recursive: true });
  const fileSlug = key === "bg" ? "bg-olay-siber-olay-yonetimi" : "denetim-izleri-yonetimi";
  const filePath = path.join(reportDir, `${reportToken}-${fileSlug}.pdf`);
  const orgName = normalizeCompanyName(companyName);
  const template = applyCompany(await loadTemplate(key), orgName);
  const numberedBody = numberHeadings(template.body);
  const previewItems = options?.preview ? getPreviewItems(numberedBody, key) : numberedBody;
  const pageChunks = options?.preview ? [previewItems] : chunkItems(previewItems, 28);

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        {renderHeader(orgName, key)}
        {renderMetaTable(template.metaTable)}
        {renderTable(template.versionTable)}
        <Text style={styles.tocTitle}>İçindekiler</Text>
        {template.toc.map((item) => (
          <Text key={item.label} style={styles.tocLine}>
            {renderTocLine(item.label, item.page)}
          </Text>
        ))}
        {options?.preview && (
          <Text style={styles.previewStamp}>
            Önizleme, dokümanın kısaltılmış bir bölümüdür. Tam doküman ödeme sonrası teslim edilir.
          </Text>
        )}
        {renderFooter(orgName)}
      </Page>

      {pageChunks.map((chunk, pageIndex) => (
        <Page key={`page-${pageIndex}`} size="A4" style={styles.page}>
          {renderHeader(orgName, key)}
          {chunk.map((item, idx) => renderItem(item, pageIndex * 1000 + idx))}
          {renderFooter(orgName)}
        </Page>
      ))}
    </Document>
  );

  const buffer = await pdf(doc).toBuffer();
  await fs.writeFile(filePath, buffer);
  return filePath;
}

export async function generateBgIncidentProcedurePdf(
  reportToken: string,
  companyName: string | undefined,
  options?: { preview?: boolean },
) {
  return generateProcedurePdf("bg", reportToken, companyName, options);
}

export async function generateDenetimProcedurePdf(
  reportToken: string,
  companyName: string | undefined,
  options?: { preview?: boolean },
) {
  return generateProcedurePdf("denetim", reportToken, companyName, options);
}
