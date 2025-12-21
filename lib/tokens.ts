import { randomUUID } from "node:crypto";

export const generateReportToken = () => randomUUID().replace(/-/g, "");
