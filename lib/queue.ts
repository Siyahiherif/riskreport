import { Queue } from "bullmq";
import { runScanAndPersist } from "./scan/service";

const queueName = "passive-scan";
let queue: Queue | null = null;

const getQueue = () => {
  if (!process.env.REDIS_URL) return null;
  if (!queue) {
    queue = new Queue(queueName, {
      connection: { url: process.env.REDIS_URL! },
      defaultJobOptions: { removeOnComplete: true, removeOnFail: true },
    });
  }
  return queue;
};

export const enqueueScan = async (scanId: string, domain: string) => {
  const q = getQueue();
  if (!q) {
    // Fallback: run inline if Redis is not configured.
    await runScanAndPersist(scanId, domain);
    return;
  }

  await q.add("scan", { scanId, domain });
};

// Optional worker helper (not automatically started in Next.js runtime)
export const createWorker = async () => {
  if (!process.env.REDIS_URL) return null;
  const { Worker } = await import("bullmq");
  return new Worker(
    queueName,
    async (job) => {
      const { scanId, domain } = job.data as { scanId: string; domain: string };
      await runScanAndPersist(scanId, domain);
    },
    { connection: { url: process.env.REDIS_URL! } }
  );
};
