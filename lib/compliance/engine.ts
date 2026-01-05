export type ComplianceAnswers = Record<string, string | string[]>;

export type ComplianceResult = {
  score: number;
  riskLevel: "Düşük" | "Orta" | "Yüksek";
  readiness: {
    iso27001: "Ready" | "Partially Ready" | "Not Ready" | "N/A";
    kvkk: "Ready" | "Partially Ready" | "Not Ready" | "N/A";
    soc2: "Ready" | "Partially Ready" | "Not Ready" | "N/A";
  };
  missingAreas: string[];
};

const riskWeights: Record<string, { bad: string[]; weight: number; label: string }> = {
  mfa: { bad: ["no"], weight: 10, label: "MFA uygulanmıyor" },
  backups: { bad: ["no", "unsure"], weight: 15, label: "Düzenli yedekleme yok" },
  logging: { bad: ["no", "unsure"], weight: 15, label: "Loglama belirsiz veya yok" },
  incident_owner: { bad: ["none"], weight: 20, label: "Olay müdahale sorumlusu belirlenmemiş" },
  incident_tracking: { bad: ["no", "unsure"], weight: 10, label: "Olay kayıtları tutulmuyor" },
  admin_limits: { bad: ["no", "unsure"], weight: 10, label: "Admin yetkileri sınırlı değil" },
  risk_assessment: { bad: ["no"], weight: 15, label: "Risk değerlendirmesi yapılmıyor" },
  security_training: { bad: ["no"], weight: 10, label: "Güvenlik farkındalık eğitimi yok" },
};

const readinessFromScore = (score: number): "Ready" | "Partially Ready" | "Not Ready" => {
  if (score <= 30) return "Ready";
  if (score <= 60) return "Partially Ready";
  return "Not Ready";
};

export function evaluateCompliance(answers: ComplianceAnswers): ComplianceResult {
  let score = 0;
  const missingAreas: string[] = [];

  Object.entries(riskWeights).forEach(([key, config]) => {
    const answer = answers[key];
    const value = Array.isArray(answer) ? answer.join(",") : answer;
    if (value && config.bad.includes(value)) {
      score += config.weight;
      missingAreas.push(config.label);
    }
  });

  const personalData = answers.personal_data;
  const riskLevel: ComplianceResult["riskLevel"] = score <= 30 ? "Düşük" : score <= 60 ? "Orta" : "Yüksek";

  const iso27001 = readinessFromScore(score);
  const soc2 = readinessFromScore(score);
  const kvkk = personalData === "no" ? "N/A" : readinessFromScore(score);

  return {
    score,
    riskLevel,
    readiness: {
      iso27001,
      kvkk,
      soc2,
    },
    missingAreas,
  };
}
