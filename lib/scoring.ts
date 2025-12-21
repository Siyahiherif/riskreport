import { categoryLabels, findingWeights } from "./constants";
import { Category, Finding, ScoreCard } from "./types";

const clampScore = (value: number) => Math.max(0, Math.min(100, value));

const scoreLabel = (score: number): ScoreCard["label"] => {
  if (score >= 90) return "Low risk";
  if (score >= 70) return "Moderate";
  if (score >= 50) return "Elevated";
  return "High risk";
};

export const computeCategoryScores = (findings: Finding[]): Record<Category, number> => {
  const base: Record<Category, number> = {
    email_security: 100,
    transport_security: 100,
    web_security: 100,
    hygiene: 100,
  };

  findings.forEach((finding) => {
    const weight = finding.weight ?? findingWeights[finding.id] ?? 0;
    base[finding.category] = clampScore(base[finding.category] - weight);
  });

  return base;
};

export const computeOverallScore = (findings: Finding[]): ScoreCard => {
  const categories = computeCategoryScores(findings);
  const totalWeight = findings.reduce(
    (acc, curr) => acc + (curr.weight ?? findingWeights[curr.id] ?? 0),
    0
  );
  const overall = clampScore(100 - totalWeight);
  return {
    overall,
    label: scoreLabel(overall),
    categories,
  };
};

export const selectTopFindings = (findings: Finding[], limit = 3): Finding[] => {
  const severityOrder: Record<Finding["severity"], number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
    info: 0,
  };

  return [...findings]
    .sort((a, b) => {
      const sevDiff = severityOrder[b.severity] - severityOrder[a.severity];
      if (sevDiff !== 0) return sevDiff;
      return (b.weight ?? 0) - (a.weight ?? 0);
    })
    .slice(0, limit);
};

export const categoryScoreEntries = (score: ScoreCard) =>
  Object.entries(score.categories).map(([key, value]) => ({
    key: key as Category,
    label: categoryLabels[key as Category],
    value,
  }));
