import fs from "node:fs/promises";
import path from "node:path";
import { Document, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";
import { categoryScoreEntries } from "./scoring";
import { Finding, ScanResult } from "./types";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 11, fontFamily: "Helvetica" },
  h1: { fontSize: 20, marginBottom: 8, fontWeight: 700 },
  h2: { fontSize: 16, marginVertical: 6, fontWeight: 700 },
  h3: { fontSize: 13, marginVertical: 4, fontWeight: 700 },
  muted: { color: "#555", marginBottom: 12 },
  chip: { fontSize: 10, padding: 4, borderRadius: 4 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  card: { border: 1, borderColor: "#ddd", padding: 10, borderRadius: 6, marginBottom: 8 },
  tableHeader: { flexDirection: "row", fontWeight: 700, marginBottom: 6 },
  tableCell: { flex: 1, fontSize: 10 },
  list: { marginLeft: 12, marginTop: 4 },
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
      return "#2563eb";
    default:
      return "#374151";
  }
};

const ScoreCardView = ({ result }: { result: ScanResult }) => {
  const categories = categoryScoreEntries(result.score);
  return (
    <View style={{ marginBottom: 12 }}>
      <Text>
        Overall score: {result.score.overall} ({result.score.label})
      </Text>
      {categories.map((c) => (
        <Text key={c.key}>
          {c.label}: {c.value}
        </Text>
      ))}
    </View>
  );
};

const TopFindings = ({ findings }: { findings: Finding[] }) => (
  <View>
    <Text style={styles.h3}>Top Risks</Text>
    {findings.map((f) => (
      <View key={f.id} style={styles.card}>
        <Text>
          {f.title} ({f.severity.toUpperCase()})
        </Text>
        <Text style={styles.muted}>{f.business_impact}</Text>
      </View>
    ))}
  </View>
);

const actionPlan = [
  "P0: Publish DMARC with p=quarantine/reject and align SPF/DKIM.",
  "P0: Enforce HTTP→HTTPS redirects and add HSTS preload-ready policy.",
  "P1: Deploy baseline browser headers: CSP, X-Frame-Options, Referrer-Policy.",
  "P1: Automate TLS certificate renewal and monitor expiry alerts.",
  "P2: Track remediation owners and deadlines for the top findings.",
];

const FindingsOverview = ({ findings }: { findings: Finding[] }) => (
  <View>
    <Text style={styles.h3}>Findings Overview</Text>
    <View style={styles.tableHeader}>
      <Text style={[styles.tableCell, { flex: 1 }]}>Severity</Text>
      <Text style={[styles.tableCell, { flex: 2 }]}>Finding</Text>
      <Text style={[styles.tableCell, { flex: 2 }]}>Category</Text>
    </View>
    {findings
      .sort((a, b) => (a.severity > b.severity ? -1 : 1))
      .map((f) => (
        <View key={f.id} style={{ flexDirection: "row", marginBottom: 4 }}>
          <Text style={[styles.tableCell, { color: severityColor(f.severity) }]}>{f.severity.toUpperCase()}</Text>
          <Text style={[styles.tableCell, { flex: 2 }]}>{f.title}</Text>
          <Text style={[styles.tableCell, { flex: 2 }]}>{f.category}</Text>
        </View>
      ))}
  </View>
);

const DetailedFindings = ({ findings }: { findings: Finding[] }) => (
  <View>
    <Text style={styles.h2}>Detailed Findings</Text>
    {findings.map((f, idx) => (
      <View key={`${f.id}-${idx}`} style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.h3}>{f.title}</Text>
          <Text style={[styles.chip, { backgroundColor: severityColor(f.severity), color: "#fff" }]}>
            {f.severity.toUpperCase()}
          </Text>
        </View>
        <Text style={styles.muted}>{f.summary}</Text>
        <Text style={styles.h3}>What we observed</Text>
        <Text>{f.evidence}</Text>
        <Text style={styles.h3}>Why it matters</Text>
        <Text>{f.business_impact}</Text>
        <Text style={styles.h3}>How to fix</Text>
        <View style={styles.list}>
          {f.recommendation.map((r, i) => (
            <Text key={i}>• {r}</Text>
          ))}
        </View>
      </View>
    ))}
  </View>
);

const Methodology = () => (
  <View>
    <Text style={styles.h2}>Methodology</Text>
    <Text style={styles.muted}>
      Passive signals only: DNS records, HTTPS/TLS handshake, HTTP response headers, and redirect checks. No port scanning,
      no vulnerability exploitation, no intrusive probes.
    </Text>
  </View>
);

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

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>IT Risk Assessment Report</Text>
        <Text>Domain: {result.domain}</Text>
        <Text>Report date: {new Date(result.generatedAt).toLocaleString()}</Text>
        <Text style={styles.muted}>Passive analysis only — no intrusive scanning performed.</Text>
        <ScoreCardView result={result} />
        <TopFindings findings={result.topFindings} />
      </Page>
      <Page size="A4" style={styles.page}>
        <Text style={styles.h2}>Executive Summary</Text>
        <ScoreCardView result={result} />
        <Text style={styles.h3}>Business Impact</Text>
        <Text style={styles.muted}>
          Email spoofing, missing web security headers, and weak TLS hygiene increase the risk of invoice fraud,
          browser-based attacks, and data interception.
        </Text>
        <Text style={styles.h3}>Next 30 Days Action Plan</Text>
        <View style={styles.list}>
          {actionPlan.map((item, idx) => (
            <Text key={idx}>• {item}</Text>
          ))}
        </View>
        <Text style={styles.h3}>Top 3 Risks</Text>
        <TopFindings findings={result.topFindings.slice(0, 3)} />
      </Page>
      <Page size="A4" style={styles.page}>
        <FindingsOverview findings={result.findings} />
      </Page>
      <Page size="A4" style={styles.page}>
        <DetailedFindings findings={result.findings.slice(0, productType === "executive" ? 20 : 12)} />
        <Methodology />
      </Page>
    </Document>
  );

  const instance = pdf(doc);
  const buffer = await instance.toBuffer();
  await fs.writeFile(filePath, buffer);
  return filePath;
};
