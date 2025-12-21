import { Category, Severity } from "./types";

export const ANALYSIS_VERSION = process.env.ANALYSIS_VERSION ?? "v1";
export const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export const severityWeights: Record<Severity, number> = {
  critical: 30,
  high: 22,
  medium: 12,
  low: 5,
  info: 0,
};

export const findingWeights: Record<string, number> = {
  DMARC_MISSING: 25,
  DMARC_POLICY_NONE: 15,
  SPF_MISSING: 15,
  HTTPS_NOT_ENFORCED: 15,
  HSTS_MISSING: 10,
  CSP_MISSING: 8,
  SSL_EXPIRING_SOON: 10,
  XFO_MISSING: 5,
  XCTO_MISSING: 5,
  REFERRER_POLICY_MISSING: 3,
};

export const categoryLabels: Record<Category, string> = {
  email_security: "Email Security",
  transport_security: "Transport Security",
  web_security: "Web Security",
  hygiene: "Redirect & Hygiene",
};
