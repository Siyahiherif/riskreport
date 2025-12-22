import fs from "node:fs/promises";
import path from "node:path";
import { Document, Page, StyleSheet, Text, View, pdf, Svg, Circle } from "@react-pdf/renderer";
import { categoryScoreEntries } from "./scoring";
import { Finding, ScanResult } from "./types";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 11, fontFamily: "Helvetica", color: "#0f172a" },
  muted: { color: "#475569" },
  h1: { fontSize: 22, fontWeight: 700, marginBottom: 6 },
  h2: { fontSize: 16, fontWeight: 700, marginBottom: 6, marginTop: 12 },
  h3: { fontSize: 13, fontWeight: 700, marginBottom: 4, marginTop: 8 },
  card: { backgroundColor: "#ffffff", borderRadius: 8, padding: 12, border: "1pt solid #e2e8f0", marginBottom: 10 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  pill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, fontSize: 9, color: "#0f172a" },
  tableHeader: { flexDirection: "row", fontWeight: 700, fontSize: 10, marginBottom: 6 },
  cell: { fontSize: 10, flex: 1 },
  barBg: { height: 8, borderRadius: 4, backgroundColor: "#e2e8f0", width: "100%" },
  list: { marginLeft: 10, marginTop: 4 },
});

const severityColor = (severity: Finding["severity"]) => {
  switch (severity) {
    case "critical":
      return "#b91c1c";
    case "high":
      return "#dc2626";
    case "medium":
      return "#d97706";
    case "low":
      return "#0f766e";
    default:
      return "#475569";
  }
};

const scoreColor = (score: number) => {
  if (score >= 80) return "#16a34a";
  if (score >= 60) return "#f59e0b";
  return "#dc2626";
};

const DonutScore = ({ score }: { score: number }) => {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(Math.max(score, 0), 100) / 100;
  const offset = circumference * (1 - pct);
  return (
    <Svg width={120} height={120}>
      <Circle cx={60} cy={60} r={radius} stroke="#e2e8f0" strokeWidth={12} fill="none" />
      <Circle
        cx={60}
        cy={60}
        r={radius}
        stroke={scoreColor(score)}
        strokeWidth={12}
        fill="none"
        strokeDasharray={`${circumference} ${circumference}`}
        // @ts-expect-error react-pdf types miss strokeDashoffset
        strokeDashoffset={offset}
        transform="rotate(-90 60 60)"
      />
      <Text
        style={{
          position: "absolute",
          top: 45,
          left: 36,
          fontSize: 22,
          fontWeight: 700,
          color: "#0f172a",
        }}
      >
        {score}
      </Text>
    </Svg>
  );
};

const ScoreBreakdown = ({ result }: { result: ScanResult }) => {
  const categories = categoryScoreEntries(result.score);
  return (
    <View style={{ marginTop: 8 }}>
      {categories.map((c) => (
        <View key={c.key} style={{ marginBottom: 8 }}>
          <View style={styles.row}>
            <Text style={{ fontSize: 11, fontWeight: 700 }}>{c.label}</Text>
            <Text style={{ fontSize: 11, fontWeight: 700 }}>{c.value}</Text>
          </View>
          <View style={styles.barBg}>
            <View style={{ height: 8, borderRadius: 4, backgroundColor: scoreColor(c.value), width: `${c.value}%` }} />
          </View>
        </View>
      ))}
    </View>
  );
};

const TopRisks = ({ findings }: { findings: Finding[] }) => (
  <View>
    {findings.map((f) => (
      <View key={f.id} style={styles.card}>
        <View style={styles.row}>
          <Text style={{ fontSize: 11, fontWeight: 700 }}>{f.title}</Text>
          <Text style={[styles.pill, { backgroundColor: severityColor(f.severity), color: "#fff" }]}>{f.severity.toUpperCase()}</Text>
        </View>
        <Text style={[styles.muted, { marginTop: 4 }]}>{f.summary}</Text>
        <Text style={{ fontSize: 10, marginTop: 4 }}>
          Evidence: <Text style={{ fontWeight: 700 }}>{f.evidence}</Text>
        </Text>
      </View>
    ))}
  </View>
);

const FindingsOverview = ({ findings }: { findings: Finding[] }) => (
  <View>
    <View style={[styles.tableHeader, { backgroundColor: "#e2e8f0", padding: 6, borderRadius: 6 }]}>
      <Text style={[styles.cell, { flex: 1 }]}>Severity</Text>
      <Text style={[styles.cell, { flex: 2 }]}>Finding</Text>
      <Text style={[styles.cell, { flex: 2 }]}>Category</Text>
      <Text style={[styles.cell, { flex: 2 }]}>Evidence</Text>
    </View>
    {findings.map((f, idx) => (
      <View key={`${f.id}-${idx}`} style={{ flexDirection: "row", marginBottom: 6 }}>
        <Text style={[styles.cell, { color: severityColor(f.severity) }]}>{f.severity.toUpperCase()}</Text>
        <Text style={[styles.cell, { flex: 2 }]}>{f.title}</Text>
        <Text style={[styles.cell, { flex: 2 }]}>{f.category}</Text>
        <Text style={[styles.cell, { flex: 2 }]}>{f.evidence}</Text>
      </View>
    ))}
  </View>
);

const DetailedFindings = ({ findings }: { findings: Finding[] }) => (
  <View>
    {findings.map((f, idx) => (
      <View key={`${f.id}-${idx}`} style={styles.card}>
        <View style={styles.row}>
          <Text style={{ fontSize: 12, fontWeight: 700 }}>{f.title}</Text>
          <Text style={[styles.pill, { backgroundColor: severityColor(f.severity), color: "#fff" }]}>{f.severity.toUpperCase()}</Text>
        </View>
        <Text style={styles.muted}>{f.summary}</Text>
        <Text style={styles.h3}>What we observed</Text>
        <Text>{f.evidence}</Text>
        <Text style={styles.h3}>Business impact</Text>
        <Text>{f.business_impact}</Text>
        <Text style={styles.h3}>Recommended actions</Text>
        <View style={styles.list}>
          {f.recommendation.map((r, i) => (
            <Text key={i}>- {r}</Text>
          ))}
        </View>
      </View>
    ))}
  </View>
);

const methodologyLines = [
  "Passive-only signals: DNS, TLS handshake, HTTP response headers, redirect checks.",
  "No port scanning, no authentication, no intrusive probes.",
  "Findings reflect best-practice configuration from public signals.",
];

const defaultActionPlan = [
  { priority: "P0", action: "Publish DMARC with p=quarantine/reject; align SPF/DKIM", impact: "Prevent invoice fraud and spoofing" },
  { priority: "P1", action: "Enforce HTTPS and enable HSTS (preload-ready)", impact: "Prevent downgrade and session hijacking" },
  { priority: "P1", action: "Add CSP, X-Frame-Options, Referrer-Policy", impact: "Reduce XSS, clickjacking, data leakage" },
  { priority: "P2", action: "Automate TLS renewal and monitor expiry", impact: "Reduce outage and trust erosion" },
  { priority: "P2", action: "Track owners and deadlines for remediation", impact: "Ensure fixes land within 30 days" },
];

export const generatePdfReport = async ({
  result,
  productType,
  reportToken,
}: {
  result: ScanResult;
  productType: "pro" | "executive";
  reportToken: string;
}) => {
  const reportDir = path.join(process.cwd(), "reports");
  await fs.mkdir(reportDir, { recursive: true });
  const filePath = path.join(reportDir, `${reportToken}.pdf`);

  const topRisks = (result.topFindings?.length ? result.topFindings : result.findings).slice(0, 5);
  const detailLimit = productType === "executive" ? 20 : 12;

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={[styles.card, { backgroundColor: "#0f172a", color: "#fff", borderColor: "#0f172a" }]}>
          <Text style={{ fontSize: 18, fontWeight: 700 }}>Passive IT Risk Report</Text>
          <Text style={{ fontSize: 12, marginTop: 4 }}>{result.domain}</Text>
          <Text style={{ fontSize: 10, marginTop: 2 }}>Report date: {new Date(result.generatedAt).toLocaleDateString()}</Text>
        </View>
        <View style={{ flexDirection: "row", gap: 16, marginTop: 12 }}>
          <View style={[styles.card, { flex: 1, alignItems: "center" }]}>
            <Text style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>Overall Risk Score</Text>
            <DonutScore score={result.score.overall} />
            <Text style={{ fontSize: 12, fontWeight: 700, marginTop: 6 }}>{result.score.label}</Text>
          </View>
          <View style={[styles.card, { flex: 1 }]}>
            <Text style={styles.h3}>At a glance</Text>
            <Text style={[styles.muted, { marginTop: 4 }]}>Top risks identified:</Text>
            <TopRisks findings={topRisks.slice(0, 3)} />
          </View>
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.h2}>Executive Summary</Text>
        <View style={[styles.card, { borderColor: "#cbd5e1" }]}>
          <Text style={{ fontSize: 11, fontWeight: 700 }}>What this means for your business</Text>
          <Text style={[styles.muted, { marginTop: 4 }]}>
            Email spoofing, missing web security headers, and weak TLS hygiene increase the risk of invoice fraud, browser-based attacks,
            and data interception.
          </Text>
        </View>
        <Text style={styles.h3}>Top risks</Text>
        <TopRisks findings={topRisks} />
        <Text style={styles.h3}>30-day action plan</Text>
        <View style={styles.card}>
          {defaultActionPlan.map((item, idx) => (
            <View key={idx} style={[styles.row, { marginBottom: 6 }]}>
              <Text style={[styles.pill, { backgroundColor: "#e2e8f0", fontWeight: 700 }]}>{item.priority}</Text>
              <Text style={{ flex: 2, fontSize: 10, marginLeft: 6 }}>{item.action}</Text>
              <Text style={{ flex: 2, fontSize: 10, color: "#475569" }}>{item.impact}</Text>
            </View>
          ))}
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.h2}>Risk Score Breakdown</Text>
        <View style={[styles.card, { marginTop: 8 }]}>
          <ScoreBreakdown result={result} />
        </View>
        <Text style={styles.h3}>Top risks with evidence</Text>
        <TopRisks findings={topRisks} />
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.h2}>Findings Overview</Text>
        <FindingsOverview findings={result.findings.slice(0, 15)} />
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.h2}>Detailed Findings</Text>
        <DetailedFindings findings={result.findings.slice(0, detailLimit)} />
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.h2}>Methodology</Text>
        <View style={styles.card}>
          {methodologyLines.map((line, idx) => (
            <Text key={idx} style={{ fontSize: 11, marginBottom: 4 }}>
              - {line}
            </Text>
          ))}
        </View>
        <Text style={[styles.muted, { marginTop: 8 }]}>Passive analysis only — no intrusive scanning performed.</Text>
      </Page>
    </Document>
  );

  const instance = pdf(doc);
  const buffer = await instance.toBuffer();
  await fs.writeFile(filePath, buffer);
  return filePath;
};
