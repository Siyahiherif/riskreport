export type ComplianceAnswers = Record<string, string | string[]>;

export type ComplianceResult = {
  score: number;
  riskLevel: "Dusuk" | "Orta" | "Yuksek";
  readiness: {
    iso27001: "Ready" | "Partially Ready" | "Not Ready" | "N/A";
    kvkk: "Ready" | "Partially Ready" | "Not Ready" | "N/A";
    soc2: "Ready" | "Partially Ready" | "Not Ready" | "N/A";
  };
  missingAreas: string[];
};

const riskWeights: Record<string, { bad: string[]; weight: number; label: string }> = {
  security_training: { bad: ["no"], weight: 10, label: "Guvenlik farkindalik egitimi yok" },
  incident_owner: { bad: ["none"], weight: 20, label: "Olay mudahale sorumlusu belirlenmemis" },
  personal_data: { bad: ["yes"], weight: 10, label: "Kisisel veri isleniyor" },
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
  const riskLevel: ComplianceResult["riskLevel"] = score <= 30 ? "Dusuk" : score <= 60 ? "Orta" : "Yuksek";

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
