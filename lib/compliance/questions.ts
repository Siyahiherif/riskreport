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
    label: "Q1. Kurulus turu",
    type: "single",
    required: true,
    options: [
      { label: "Fintech", value: "fintech" },
      { label: "SaaS / Yazilim", value: "saas" },
      { label: "E-ticaret", value: "ecommerce" },
      { label: "Danismanlik", value: "consulting" },
      { label: "Diger", value: "other" },
    ],
  },
  {
    id: "personal_data",
    label: "Q2. Kisisel veri isliyor musunuz?",
    type: "single",
    required: true,
    options: [
      { label: "Evet", value: "yes" },
      { label: "Hayir", value: "no" },
    ],
  },
  {
    id: "security_training",
    label: "Q3. Guvenlik farkindalik egitimi veriliyor mu?",
    type: "single",
    required: true,
    options: [
      { label: "Evet", value: "yes" },
      { label: "Hayir", value: "no" },
    ],
  },
  {
    id: "incident_owner",
    label: "Q4. Guvenlik olayi olursa kim mudahale eder?",
    type: "single",
    required: true,
    options: [
      { label: "Ic ekip", value: "internal" },
      { label: "Dis destek", value: "external" },
      { label: "Belirlenmedi", value: "none" },
    ],
  },
];
