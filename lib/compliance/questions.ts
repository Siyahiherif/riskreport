export type QuestionOption = { label: string; value: string };
export type Question = {
  id: string;
  label: string;
  type: "single" | "multi" | "text";
  options?: QuestionOption[];
  required?: boolean;
};

export const COMPLIANCE_QUESTIONS: Question[] = [
  {
    id: "org_type",
    label: "Q1. Kuruluş Türü",
    type: "single",
    required: true,
    options: [
      { label: "Fintech", value: "fintech" },
      { label: "SaaS / Yazılım", value: "saas" },
      { label: "E-Ticaret", value: "ecommerce" },
      { label: "Danışmanlık", value: "consulting" },
      { label: "Diğer", value: "other" },
    ],
  },
  {
    id: "personal_data",
    label: "Q2. Kişisel veri işliyor musunuz?",
    type: "single",
    required: true,
    options: [
      { label: "Evet", value: "yes" },
      { label: "Hayır", value: "no" },
    ],
  },
  {
    id: "security_training",
    label: "Q3. Güvenlik farkındalık eğitimi veriliyor mu?",
    type: "single",
    required: true,
    options: [
      { label: "Evet", value: "yes" },
      { label: "Hayır", value: "no" },
    ],
  },
  {
    id: "incident_owner",
    label: "Q4. Güvenlik olayı olursa kim müdahale eder?",
    type: "single",
    required: true,
    options: [
      { label: "İç Ekip", value: "internal" },
      { label: "Dış Destek", value: "external" },
      { label: "Belirlenmedi", value: "none" },
    ],
  },
];
