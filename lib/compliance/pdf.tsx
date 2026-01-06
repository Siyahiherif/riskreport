import fs from "node:fs/promises";
import path from "node:path";
import type { ReactNode } from "react";
import { Document, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";
import { ComplianceAnswers, ComplianceResult } from "./engine";

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 11, fontFamily: "Helvetica", color: "#0f172a" },
  h1: { fontSize: 18, fontWeight: 700, marginBottom: 6 },
  h2: { fontSize: 13, fontWeight: 700, marginTop: 10, marginBottom: 4 },
  h3: { fontSize: 12, fontWeight: 700, marginTop: 8, marginBottom: 2 },
  muted: { color: "#475569" },
  section: { marginBottom: 8 },
  headerBox: { borderWidth: 1, borderColor: "#0f172a", marginBottom: 14 },
  headerRow: { flexDirection: "row" },
  headerCell: { borderRightWidth: 1, borderBottomWidth: 1, borderColor: "#0f172a", padding: 8, flex: 1 },
  headerCellLast: { borderBottomWidth: 1, borderColor: "#0f172a", padding: 8, flex: 1 },
  headerMeta: { fontSize: 9, lineHeight: 1.4 },
  bullet: { marginLeft: 10 },
  footer: { position: "absolute", bottom: 24, left: 36, right: 36, fontSize: 9, color: "#475569" },
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

export async function generateBgIncidentProcedurePdf(
  reportToken: string,
  companyName: string | undefined,
  sections: { title: string; lines: string[] }[],
) {
  const filePath = path.join(process.cwd(), "reports", "compliance", `${reportToken}-bg-olay-siber-olay-yonetimi.pdf`);
  const orgName = companyName || "Sirket";
  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
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
              <Text style={styles.headerMeta}>SAYFA NO: <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} /></Text>
            </View>
          </View>
        </View>

        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.h2}>{section.title}</Text>
            {section.lines.map((line, idx) => (
              <Text key={`${section.title}-${idx}`} style={line.startsWith("•") ? styles.bullet : undefined}>
                {line}
              </Text>
            ))}
          </View>
        ))}

        <Text style={styles.footer}>
          Generated for {orgName} | Report ID: {reportToken}
        </Text>
      </Page>
    </Document>
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
  const companyLabel = companyName || "Sirket";
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
    bgIncidentProcedure: [
      {
        title: "1. GENEL BAKIS",
        lines: [
          "1.1. Amac",
          `${companyLabel} bilgi sistemleri altyapisinda olusabilecek guvenlik ihlallerinin zamaninda tespit edilmesi,`,
          "olaylara iliskin aksiyon alinmasi, sebeplerinin analiz edilmesi ve kanitlarin toplanmasi,",
          "sistemin en kisa surede en az zarar ile tekrar calisir duruma getirilmesi, olaylarin tekrar etmemesi",
          "konularinda yonetim ve esaslar ile raporlanmasi konusundaki kurallari belirlemek amaciyla yayinlanmistir.",
          "",
          "1.2. Kapsam",
          `Bilgi Guvenligi Olay Yonetimi Proseduru tum ${companyLabel} personeli, sozlesmeli personel,`,
          "gecici personel ve kurulus sistemlerine veya verilerine erisimi olan tedarikci firmalar icin gecerlidir.",
          "Bilgi guvenligi ihlal olayina yol acabilecek olasi durumlar ve siber olaylar bu kapsamda ele alinmistir.",
          "",
          "1.3. Ilgili Kanun ve Duzenlemeler",
          "Odeme ve Elektronik Para Kuruluslarinin bilgi sistemleri ile odeme hizmeti saglayicilarinin odeme hizmetleri",
          "alanindaki veri paylasim servislerine iliskin teblig, Olay yonetimi ve siber olaylar - Madde 7",
          "",
          "1.4. Tanimlamalar ve Kisaltmalar",
          "BT (Bilgi Teknolojileri): Bilgi Teknolojileri",
          "Is Birimleri: Bilgi Teknolojileri birimi disinda kalan tum grup ve birimler",
          `Kurum, Kurulus: ${companyLabel}`,
          "Teblig: Odeme Kuruluslari ve Elektronik Para Kuruluslarinin Bilgi Sistemlerinin Yonetimine ve Denetimine Iliskin Teblig",
          "TCMB: Turkiye Cumhuriyet Merkez Bankasi",
          `Ust Yonetim: ${companyLabel} yonetim kurulu uyeleri ile genel mudur ve genel mudur yardimcilari, ic kontrol`,
          "ve risk yonetimi ve uyum birimlerinin yoneticileri ile gorev ve yetkileri itibariyla ust konumda gorev yapan yoneticiler",
          `Bilgi Guvenligi Olayi: ${companyLabel} bilgi sistemleri altyapisini etkileyen, calismasini engelleyen veya`,
          `${companyLabel} bunyesindeki verilerin butunlugunun, erisilebilirliginin ve gizliliginin olumsuz etkilenmesine sebep olan olaylar`,
          "Bilgi Guvenligi Zayifligi: Sunucu, bilgisayar ve cesitli cihazlarin birbirlerine baglanmasiyla olusan yapilara verilen genel ad",
          "Denetim Izi (Log/Iz Kaydi): Zaman icindeki durumlarin ya da degisikliklerin kayit altina alinmasi sirasinda olusan sistemsel kayitlar",
          "DoS (Denial of Service): Bir hedefe yonelik gerceklestirilen, sistemin hizmet vermesini engelleyen bir siber saldiri turu",
          "DDoS (Distributed Denial of Service): DoS saldirisinin bir kaynaktan yerine birden fazla sayida ve farkli kaynaktan baslatilmasiyla gerceklesen olay",
        ],
      },
      {
        title: "2. GOREV VE SORUMLULUKLAR",
        lines: [
          "2.1. Bilgi Guvenligi Sorumlusu",
          "• Bilgi guvenligi olay yonetimi surecinin prosedure uygun olarak isletildiginin kontrol edilmesi, izlenmesi ve raporlanmasi.",
          "• Guvenlik cihazlarini takip ederek engellenen saldirilarin degerlendirilmesi ve gerek goruldugu durumlarda bilgi guvenligi olay yonetimi surecinin uygulanmasi.",
          "• Tarafina iletilen bilgi guvenligi olaylarinin ivedilikle Ust Yonetim'e bildirilmesi.",
          "• Gerceklesen bilgi guvenligi olayinin etkilerinin azaltilmasi amaciyla aksiyon alinmasi.",
          "• Gerceklesen bilgi guvenligi olayinin yeniden gerceklesmemesi icin alinmasi gereken aksiyonlarin belirlenmesi ve Ust Yonetim'e sunulmasi.",
          "• Ust Yonetim tarafindan onaylanan aksiyonlarin alinmasinin saglanmasi.",
          `• ${companyLabel} bunyesinde yasanan olaylar, ${companyLabel} standartlari ve dunya uzerinde bilgi guvenligi olayi olarak degerlendirilen olaylar dogrultusunda 'EK-1 Bilgi Guvenligi Olaylari Listesi'nin yilda en az bir defa guncellenmesi.`,
          `• Bilgi Guvenligi Olay Yonetimi Proseduru'nun ic gereksinimler, ${companyLabel} standartlari, yasal mevzuat ve uluslararasi standartlar dogrultusunda yilda en az bir defa gozden gecirilerek guncellenmesinin saglanmasi ve uygulanmasinin takip edilmesi.`,
          "• Siber olay oncesinde muhtemel siber saldirilara karsi gerekli onlemlerin alinmasi.",
          "• Zarali yazilimlar, siber olaylar ve sektorde ortaya cikan dolandiricilik yontemleri hakkinda erken mudahalenin saglanmasi ve bilgilendirmelerin yapilmasi.",
          "",
          "2.2. BT Muduru",
          "• Bilgi guvenligi olaylarina mudahale edilmesi, prosedure uyumu engelleyen yetkileri veya bu duruma sebep olan ortamin degistirilmesi.",
          "• Tespit edilen bilgi guvenligi olaylarinin ivedilikle Ust Yonetim'e bildirilmesi.",
          "• Meydana gelen guvenlik olaylarinin Bilgi Guvenligi Sorumlusu'na raporlanmasindan ve siber olaylara mudahale plani kapsaminda belirlenen aksiyonlarin alinmasi ve alinmasinin saglanmasi.",
          "",
          "2.3. Tedarikci Firma",
          "• Bilgi guvenligi olaylarina mudahale edilmesi, prosedure uyumu engelleyen yetkileri veya bu duruma sebep olan ortamin degistirilmesi.",
          "• Tespit edilen bilgi guvenligi olaylarinin ivedilikle BT Muduru'ne bildirilmesi.",
          "",
          "2.4. Kurulus Personeli",
          "• Ornek bilgi guvenligi olaylari dogrultusunda karsilastigi olaylari veya kullanilan bilgi sistemleri altyapisinda karsilastigi supheli olabilecek olaylari ivedilikle BT Muduru'ne bildirmek.",
        ],
      },
      {
        title: "3. UYGULAMA (OZET)",
        lines: [
          "3.1. Bilgi Guvenligi Olaylarinin Tanimlanmasi",
          `Bilgi guvenligi olaylari, ${companyLabel} bilgi sistemleri altyapisini etkileyen, calismasini engelleyen veya`,
          `${companyLabel} bunyesindeki verilerin butunlugu, erisilebilirligi ve gizliliginin olumsuz etkilenmesine sebep olan olaylardir.`,
          "• Bilgi Guvenligi Politikasi'na uyumsuzluk.",
          "• Bilgi sistemleri servislerine yapilan ataklar.",
          "• Hizmetlerde kesintiye sebebiyet verebilecek bilgi sistemleri olaylari.",
          "• Kritik bilgilerin yetkisiz olarak degistirilmesi.",
          "• Kurulus verilerinin kaybolmasi, calinmasi, erisilebilirliginin, gizliliginin veya butunlugunun bozulmasi.",
          "",
          "3.2. Bilgi Guvenligi Olaylarinin Tespit Edilmesi ve Bildirilmesi",
          `Calisanlar ve ${companyLabel} sistemlerine erisimi olan ucuncu taraflar, gerceklesen veya gerceklesmesinden suphe edilen olaylari`,
          "e-posta araciligiyla ivedilikle Bilgi Guvenligi Sorumlusu'na, ulasilamadigi durumlarda BT Muduru'ne bildirir.",
          "",
          "3.3. Bilgi Guvenligi Olaylarinin Analiz Edilmesi ve Iletisim",
          "Tespit edilen olaylar analiz edilir, etki seviyesi belirlenir ve kritik/yuksek olaylarda Ust Yonetim bilgilendirilir.",
          "",
          "3.4. Bilgi Guvenligi Olaylarina Mudahale Edilmesi",
          "Kritik olaylarda anlik, yuksek olaylarda bir is gunu, orta olaylarda 3 is gunu, dusuk olaylarda 5 is gunu icinde mudahale edilir.",
          "",
          "3.5. Bilgi Guvenligi Olaylarina Iliskin Kanitlarin Elde Edilmesi",
          "Kanitlar zaman damgali olarak kayda alinmali, yetkisiz degisikliklere karsi korunmali ve yasal saklama surelerine uygun saklanmalidir.",
          "",
          "3.6. Bilgi Guvenligi Olaylarinin Raporlanmasi ve Izlenmesi",
          "Olay raporu hazirlanir, Ust Yonetim'e sunulur ve aksiyonlar takip edilir.",
          "",
          "3.8. Siber Olay Yonetimi (Ozet)",
          "Siber olaylar tespit edilir, siniflandirilir (kritik, yuksek, orta, dusuk) ve ilgili mudahale sureleri uygulanir.",
          "Kritik ve onemli olaylarda Ust Yonetim aninda bilgilendirilir.",
          "",
          "4. ILGILI DOKUMANLAR",
          "RP-BT-001 Bilgi Guvenligi Olayi Raporu",
        ],
      },
    ],
  };
}
