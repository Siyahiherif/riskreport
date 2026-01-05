export type QuestionOption = { label: string; value: string };
export type Question = {
  id: string;
  label: string;
  type: "single" | "multi" | "text";
  options?: QuestionOption[];
  required?: boolean;
};

export const COMPLIANCE_QUESTIONS: Question[] = [
  { id: "company_name", label: "Q1. Şirketinizin adı nedir? (opsiyonel)", type: "text" },
  {
    id: "industry",
    label: "Q2. Faaliyet alanınızı seçiniz",
    type: "single",
    required: true,
    options: [
      { label: "Yazılım / SaaS", value: "saas" },
      { label: "Fintech", value: "fintech" },
      { label: "E-ticaret", value: "ecommerce" },
      { label: "Danışmanlık", value: "consulting" },
      { label: "Diğer", value: "other" },
    ],
  },
  {
    id: "business_model",
    label: "Q3. İş modeliniz nedir?",
    type: "single",
    required: true,
    options: [
      { label: "B2B", value: "b2b" },
      { label: "B2C", value: "b2c" },
      { label: "B2B + B2C", value: "b2b_b2c" },
    ],
  },
  {
    id: "employee_count",
    label: "Q4. Yaklaşık çalışan sayısı",
    type: "single",
    required: true,
    options: [
      { label: "1–5", value: "1-5" },
      { label: "6–20", value: "6-20" },
      { label: "21–50", value: "21-50" },
      { label: "50+", value: "50+" },
    ],
  },
  {
    id: "personal_data",
    label: "Q5. Kişisel veri işliyor musunuz?",
    type: "single",
    required: true,
    options: [
      { label: "Evet", value: "yes" },
      { label: "Hayır", value: "no" },
    ],
  },
  {
    id: "personal_data_subjects",
    label: "Q6. Kişisel veriler kimlere ait?",
    type: "single",
    required: true,
    options: [
      { label: "Müşteriler", value: "customers" },
      { label: "Çalışanlar", value: "employees" },
      { label: "Her ikisi", value: "both" },
      { label: "İşlemiyoruz", value: "none" },
    ],
  },
  {
    id: "data_types",
    label: "Q7. Aşağıdaki veri türlerinden hangileri işleniyor?",
    type: "multi",
    required: true,
    options: [
      { label: "Kimlik bilgileri", value: "identity" },
      { label: "İletişim bilgileri", value: "contact" },
      { label: "Finansal veriler", value: "financial" },
      { label: "Özel nitelikli veri", value: "sensitive" },
      { label: "Hiçbiri", value: "none" },
    ],
  },
  {
    id: "hosting",
    label: "Q8. Altyapınız nerede barındırılıyor?",
    type: "single",
    required: true,
    options: [
      { label: "Cloud", value: "cloud" },
      { label: "On-Prem", value: "onprem" },
      { label: "Hibrit", value: "hybrid" },
    ],
  },
  {
    id: "cloud_provider",
    label: "Q9. Cloud kullanıyorsanız hangisi?",
    type: "single",
    required: true,
    options: [
      { label: "AWS", value: "aws" },
      { label: "GCP", value: "gcp" },
      { label: "Azure", value: "azure" },
      { label: "Diğer", value: "other" },
      { label: "Cloud kullanmıyoruz", value: "none" },
    ],
  },
  {
    id: "backups",
    label: "Q10. Düzenli yedekleme yapılıyor mu?",
    type: "single",
    required: true,
    options: [
      { label: "Evet", value: "yes" },
      { label: "Hayır", value: "no" },
      { label: "Emin değilim", value: "unsure" },
    ],
  },
  {
    id: "auth_method",
    label: "Q11. Sistemlere erişim nasıl sağlanıyor?",
    type: "single",
    required: true,
    options: [
      { label: "Kullanıcı adı / şifre", value: "password" },
      { label: "SSO", value: "sso" },
      { label: "Her ikisi", value: "both" },
    ],
  },
  {
    id: "mfa",
    label: "Q12. MFA (çok faktörlü doğrulama) kullanılıyor mu?",
    type: "single",
    required: true,
    options: [
      { label: "Evet", value: "yes" },
      { label: "Hayır", value: "no" },
    ],
  },
  {
    id: "admin_limits",
    label: "Q13. Admin yetkileri sınırlı mı?",
    type: "single",
    required: true,
    options: [
      { label: "Evet", value: "yes" },
      { label: "Hayır", value: "no" },
      { label: "Emin değilim", value: "unsure" },
    ],
  },
  {
    id: "logging",
    label: "Q14. Sistem logları tutuluyor mu?",
    type: "single",
    required: true,
    options: [
      { label: "Evet", value: "yes" },
      { label: "Hayır", value: "no" },
      { label: "Emin değilim", value: "unsure" },
    ],
  },
  {
    id: "log_retention",
    label: "Q15. Log saklama süresi nedir?",
    type: "single",
    required: true,
    options: [
      { label: "30 gün", value: "30" },
      { label: "90 gün", value: "90" },
      { label: "1 yıl", value: "365" },
      { label: "Emin değilim", value: "unsure" },
    ],
  },
  {
    id: "incidents",
    label: "Q16. Daha önce güvenlik olayı yaşadınız mı?",
    type: "single",
    required: true,
    options: [
      { label: "Evet", value: "yes" },
      { label: "Hayır", value: "no" },
    ],
  },
  {
    id: "incident_owner",
    label: "Q17. Güvenlik olayı olursa kim müdahale eder?",
    type: "single",
    required: true,
    options: [
      { label: "İç ekip", value: "internal" },
      { label: "Dış destek", value: "external" },
      { label: "Belirlenmedi", value: "none" },
    ],
  },
  {
    id: "incident_tracking",
    label: "Q18. Olaylar kayıt altına alınıyor mu?",
    type: "single",
    required: true,
    options: [
      { label: "Evet", value: "yes" },
      { label: "Hayır", value: "no" },
      { label: "Emin değilim", value: "unsure" },
    ],
  },
  {
    id: "risk_assessment",
    label: "Q19. Güvenlik riskleri düzenli değerlendirilir mi?",
    type: "single",
    required: true,
    options: [
      { label: "Evet", value: "yes" },
      { label: "Hayır", value: "no" },
    ],
  },
  {
    id: "security_training",
    label: "Q20. Çalışanlara güvenlik farkındalık eğitimi veriliyor mu?",
    type: "single",
    required: true,
    options: [
      { label: "Evet", value: "yes" },
      { label: "Hayır", value: "no" },
    ],
  },
  {
    id: "client_requests",
    label: "Q21. Daha önce müşteri veya banka güvenlik talebi oldu mu?",
    type: "single",
    required: true,
    options: [
      { label: "Evet", value: "yes" },
      { label: "Hayır", value: "no" },
    ],
  },
  {
    id: "external_audit",
    label: "Q22. Harici denetim (ISO, KVKK vb.) planlanıyor mu?",
    type: "single",
    required: true,
    options: [
      { label: "Evet", value: "yes" },
      { label: "Hayır", value: "no" },
    ],
  },
];
