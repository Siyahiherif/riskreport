export type Severity = "critical" | "high" | "medium" | "low" | "info";
export type Category = "email_security" | "transport_security" | "web_security" | "hygiene";

export type Finding = {
  id: string;
  category: Category;
  severity: Severity;
  title: string;
  summary: string;
  business_impact: string;
  evidence: string;
  recommendation: string[];
  references?: string[];
  weight: number;
  priority?: "P0" | "P1" | "P2";
  status?: "ok" | "failed" | "skipped";
  error_hint?: string;
};

export type ScoreCard = {
  overall: number;
  label: "Low risk" | "Moderate" | "Elevated" | "High risk";
  categories: Record<Category, number>;
};

export type ScanResult = {
  domain: string;
  analysisVersion: string;
  findings: Finding[];
  score: ScoreCard;
  generatedAt: string;
  topFindings: Finding[];
};
