import fs from "node:fs/promises";
import path from "node:path";
import type { ReactNode } from "react";
import { Document, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";
import { ComplianceAnswers, ComplianceResult } from "./engine";

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 11, fontFamily: "Helvetica", color: "#0f172a" },
  h1: { fontSize: 18, fontWeight: 700, marginBottom: 6 },
  h2: { fontSize: 13, fontWeight: 700, marginTop: 10, marginBottom: 4 },
  muted: { color: "#475569" },
  section: { marginBottom: 8 },
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
        <Text>{result.score} / 100 - {result.riskLevel} Risk</Text>
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

export async function generatePolicyPdf(
  reportToken: string,
  slug: string,
  title: string,
  sections: { title: string; lines: string[] }[],
) {
  const filePath = path.join(process.cwd(), "reports", "compliance", `${reportToken}-${slug}.pdf`);
  const doc = (
    <DocShell title={title}>
      {sections.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.h2}>{section.title}</Text>
          {section.lines.map((line, idx) => (
            <Text key={`${section.title}-${idx}`}>{line}</Text>
          ))}
        </View>
      ))}
    </DocShell>
  );
  const buffer = await pdf(doc).toBuffer();
  await fs.writeFile(filePath, buffer);
  return filePath;
}

const value = (answers: ComplianceAnswers, key: string, fallback = "Belirtilmedi") => {
  const v = answers[key];
  if (Array.isArray(v)) return v.length ? v.join(", ") : fallback;
  return v || fallback;
};

export function buildPolicySections(answers: ComplianceAnswers, companyName?: string) {
  const dataTypes = value(answers, "data_types");
  const hosting = value(answers, "hosting");
  const logRetention = value(answers, "log_retention");
  const mfa = value(answers, "mfa");
  const adminLimits = value(answers, "admin_limits");
  const incidentOwner = value(answers, "incident_owner");

  return {
    infoSecurity: [
      { title: "Amac ve Kapsam", lines: ["Bu politika, bilgi varliklarinin korunmasi ve surekliligin saglanmasi amaciyla hazirlanmistir."] },
      { title: "Bilgi Guvenligi Ilkeleri", lines: ["Yetkilendirme, gizlilik, butunluk ve erisilebilirlik ilkeleri esas alinmistir."] },
      { title: "Roller ve Sorumluluklar", lines: [`Sorumlu birim: ${companyName || "Belirtilmedi"}`] },
      { title: "Bilgi Varliklarinin Korunmasi", lines: [`Islenen veri turleri: ${dataTypes}`, `Altyapi tipi: ${hosting}`] },
      { title: "Politika Yururluk Tarihi", lines: [formatDate(new Date())] },
    ],
    accessControl: [
      { title: "Erisim Yetkilendirme Prensipleri", lines: ["Minimum yetki prensibi uygulanir."] },
      { title: "Kullanici ve Admin Ayrimi", lines: [`Admin yetkileri sinirli: ${adminLimits}`] },
      { title: "MFA Gereksinimleri", lines: [`MFA kullanimi: ${mfa}`] },
      { title: "Yetki Verme / Alma Sureci", lines: ["Erisim talepleri onay sureci ile kayit altina alinir."] },
    ],
    loggingMonitoring: [
      { title: "Loglanan Sistemler", lines: ["Kritik sistem olaylari ve erisim loglari kaydedilir."] },
      { title: "Log Saklama Suresi", lines: [`Saklama suresi: ${logRetention}`] },
      { title: "Loglara Erisim Yetkileri", lines: ["Loglara erisim sinirli ve izlenebilirdir."] },
      { title: "Log Butunlugu", lines: ["Loglarin degistirilemezligi icin kontrol mekanizmalari uygulanir."] },
    ],
    incidentResponse: [
      { title: "Olay Tanimi", lines: ["Bilgi guvenligini tehdit eden olaylar bu prosedur kapsamindadir."] },
      { title: "MudahaIe Adimlari", lines: ["Bildirim, izolasyon, inceleme ve kapatma adimlari takip edilir."] },
      { title: "Bildirim Sureleri", lines: ["Kritik olaylarda 24 saat icinde bildirim yapilir."] },
      { title: "Sorumlu Ekipler", lines: [`Mudahale sorumlusu: ${incidentOwner}`] },
    ],
    riskSummary: [
      { title: "Ana Riskler", lines: ["Yedekleme, MFA, loglama ve olay yonetimi alanlari kritik risklerdir."] },
      { title: "Etki ve Olasilik", lines: ["Riskler orta-yuksek etki olasiligina sahiptir."] },
      { title: "Onerilen Aksiyonlar", lines: ["MFA etkinlestirme, log saklama surelerini netlestirme, yedekleme surecini standartlastirma."] },
    ],
  };
}
