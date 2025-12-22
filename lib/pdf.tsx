import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
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
  footer: {
    position: "absolute",
    bottom: 24,
    left: 32,
    right: 32,
    fontSize: 8,
    color: "#475569",
    borderTop: "1pt solid #e2e8f0",
    paddingTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },
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

const DonutScore = ({ score, label }: { score: number; label: string }) => {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(Math.max(score, 0), 100) / 100;
  const offset = circumference * (1 - pct);
  return (
    <View style={{ alignItems: "center" }}>
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
      </Svg>
      <View style={{ position: "absolute", top: 40, alignItems: "center" }}>
        <Text style={{ fontSize: 20, fontWeight: 700, color: "#0f172a" }}>{score}</Text>
        <Text style={{ fontSize: 9, color: "#475569" }}>/100</Text>
        <Text style={{ fontSize: 10, fontWeight: 700, marginTop: 2 }}>{label}</Text>
      </View>
    </View>
  );
};

const ScoreBreakdown = ({ result }: { result: ScanResult }) => {
  const categories = categoryScoreEntries(result.score);
  return (
    <View style={{ marginTop: 8 }}>
      {categories.map((c) => {
        const status = c.value >= 80 ? "Good" : c.value >= 60 ? "Acceptable" : "Needs attention";
        return (
          <View key={c.key} style={{ marginBottom: 8 }}>
            <View style={styles.row}>
              <Text style={{ fontSize: 11, fontWeight: 700 }}>{c.label}</Text>
              <Text style={{ fontSize: 11, fontWeight: 700 }}>{c.value}</Text>
            </View>
            <View style={styles.barBg}>
              <View style={{ height: 8, borderRadius: 4, backgroundColor: scoreColor(c.value), width: `${c.value}%` }} />
            </View>
            <Text style={{ fontSize: 9, color: "#475569", marginTop: 2 }}>{status}</Text>
          </View>
        );
      })}
    </View>
  );
};

const TopRisks = ({ findings }: { findings: Finding[] }) => (
  <View>
    {findings.map((f) => (
      <View key={f.id} style={styles.card}>
        <View style={[styles.row, { alignItems: "flex-start" }]}>
          <Text style={{ fontSize: 11, fontWeight: 700, flex: 1, marginRight: 8 }}>{f.title}</Text>
          <Text style={[styles.pill, { backgroundColor: severityColor(f.severity), color: "#fff", flexShrink: 0 }]}>{f.severity.toUpperCase()}</Text>
        </View>
        <Text style={[styles.muted, { marginTop: 4 }]}>{f.summary}</Text>
        <Text style={{ fontSize: 10, marginTop: 4 }}>
          Evidence: <Text style={{ fontWeight: 700 }}>{f.evidence}</Text>
        </Text>
        <Text style={{ fontSize: 10, marginTop: 2 }}>
          Business impact: <Text style={{ fontWeight: 700 }}>{f.business_impact}</Text>
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
        <Text style={[styles.cell, { color: severityColor(f.severity) }]}>
          {f.severity === "critical" ? "!!" : f.severity === "high" ? "!" : f.severity === "medium" ? "~" : "-"} {f.severity.toUpperCase()}
        </Text>
        <Text style={[styles.cell, { flex: 2 }]}>{f.title}</Text>
        <Text style={[styles.cell, { flex: 2 }]}>{f.category}</Text>
        <Text style={[styles.cell, { flex: 2 }]}>{f.evidence}</Text>
      </View>
    ))}
  </View>
);

const ComplianceMapping = ({ findings }: { findings: Finding[] }) => {
  const mappings = [
    { match: "HSTS", framework: "PCI DSS 4.0 (A.6), OWASP ASVS", label: "HSTS missing" },
    { match: "CSP", framework: "OWASP ASVS 14.4", label: "CSP missing" },
    { match: "HTTPS", framework: "ISO 27001 A.13", label: "HTTPS not enforced" },
    { match: "DMARC", framework: "Email Security Best Practices", label: "DMARC missing/p=none" },
  ];
  const found = mappings.filter((m) => findings.some((f) => f.title.toUpperCase().includes(m.match.toUpperCase())));
  if (!found.length) return null;
  return (
    <View style={{ marginTop: 8 }}>
      <Text style={styles.h3}>Compliance mapping</Text>
      <Text style={[styles.muted, { fontSize: 10, marginBottom: 6 }]}>
        This report helps identify gaps against common security frameworks.
      </Text>
      {found.map((m, idx) => (
        <View key={idx} style={[styles.row, { marginBottom: 6 }]}>
          <Text style={{ flex: 2, fontSize: 10, fontWeight: 700 }}>{m.label}</Text>
          <Text style={{ flex: 3, fontSize: 10 }}>{m.framework}</Text>
        </View>
      ))}
    </View>
  );
};

const DetailedFindings = ({ findings }: { findings: Finding[] }) => {
  const ownerByCategory: Record<string, string> = {
    email_security: "Email / IT",
    transport_security: "IT",
    web_security: "Web / IT",
    hygiene: "IT",
  };
  const effortBySeverity = (severity: Finding["severity"]) => {
    if (severity === "critical" || severity === "high") return "High";
    if (severity === "medium") return "Medium";
    return "Low";
  };

  return (
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
          <Text style={{ fontSize: 10, marginTop: 6 }}>
            Estimated effort: {effortBySeverity(f.severity)} | Owner: {ownerByCategory[f.category] || "IT"}
          </Text>
        </View>
      ))}
    </View>
  );
};

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
  const hash = crypto.createHash("sha256").update(JSON.stringify(result)).digest("hex");

  const Footer = () => (
    <View style={styles.footer} fixed>
      <Text>Generated by CyberFaceX Passive IT Risk Intelligence</Text>
      <Text>Report ID: {reportToken}</Text>
      <Text>
        Generated at: {new Date(result.generatedAt).toLocaleDateString()} | Integrity hash: SHA256 {hash.slice(0, 16)}…
      </Text>
    </View>
  );

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
            <DonutScore score={result.score.overall} label={result.score.label} />
            <Text style={{ fontSize: 10, color: "#475569", marginTop: 8 }}>Legend: Green (Low) • Orange (Moderate) • Red (High)</Text>
            <View style={{ marginTop: 10, alignItems: "center", paddingHorizontal: 12 }}>
              <Text style={{ fontSize: 11, fontWeight: 700, marginBottom: 4 }}>What {result.score.label} means</Text>
              <Text style={{ fontSize: 10, color: "#475569", textAlign: "center", lineHeight: 1.3 }}>
                This score indicates increased exposure to common web-based attacks. No breach detected, but preventive controls are missing.
              </Text>
            </View>
          </View>
          <View style={[styles.card, { flex: 1 }]}>
            <Text style={styles.h3}>At a glance</Text>
            <Text style={[styles.muted, { marginTop: 4 }]}>Top risks identified:</Text>
            <TopRisks findings={topRisks.slice(0, 3)} />
          </View>
        </View>
        <Footer />
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.h2}>Executive Summary</Text>
        <View style={[styles.card, { borderColor: "#cbd5e1" }]}>
          <Text style={{ fontSize: 11, fontWeight: 700 }}>What this means for your business</Text>
          <Text style={[styles.muted, { marginTop: 4 }]}>
            Email spoofing, missing web security headers, and weak TLS hygiene increase the risk of invoice fraud, browser-based attacks,
            and data interception.
          </Text>
          <View style={{ marginTop: 6, marginLeft: 6 }}>
            <Text>- Increased likelihood of invoice fraud</Text>
            <Text>- Higher exposure to browser-based attacks</Text>
            <Text>- Elevated risk during TLS renewal periods</Text>
          </View>
        </View>
        <Text style={styles.h3}>Top risks</Text>
        <TopRisks findings={topRisks} />
        <Text style={styles.h3}>30-day action plan</Text>
        <View style={styles.card}>
          <Text style={{ fontSize: 10, color: "#475569", marginBottom: 6 }}>
            Addressing P0 and P1 items within 30 days will significantly reduce your overall risk score.
          </Text>
          {defaultActionPlan.map((item, idx) => (
            <View key={idx} style={[styles.row, { marginBottom: 6 }]}>
              <Text style={[styles.pill, { backgroundColor: "#e2e8f0", fontWeight: 700 }]}>{item.priority}</Text>
              <Text style={{ flex: 2, fontSize: 10, marginLeft: 6 }}>{item.action}</Text>
              <Text style={{ flex: 2, fontSize: 10, color: "#475569" }}>{item.impact}</Text>
            </View>
          ))}
        </View>
        <Footer />
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.h2}>Risk Score Breakdown</Text>
        <View style={[styles.card, { marginTop: 8 }]}>
          <ScoreBreakdown result={result} />
        </View>
        <Text style={styles.h3}>Top risks with evidence</Text>
        <TopRisks findings={topRisks} />
        <Footer />
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.h2}>Findings Overview</Text>
        <FindingsOverview findings={result.findings.slice(0, 15)} />
        <ComplianceMapping findings={result.findings} />
        <Footer />
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.h2}>Detailed Findings</Text>
        <DetailedFindings findings={result.findings.slice(0, detailLimit)} />
        <Footer />
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
        <View style={[styles.card, { marginTop: 8, backgroundColor: "#f8fafc" }]}>
          <Text style={{ fontSize: 10, fontWeight: 700 }}>Trust note</Text>
          <Text style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>
            This report is based solely on publicly observable signals and does not require authorization.
          </Text>
        </View>
        <Footer />
      </Page>
    </Document>
  );

  const instance = pdf(doc);
  const buffer = await instance.toBuffer();
  await fs.writeFile(filePath, buffer);
  return filePath;
};
