import crypto from "crypto";
import { headers } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function timingSafeEqual(a: string, b: string) {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

type PaddleHeaderParts = { ts?: string; h1?: string; [key: string]: string | undefined };

function parseSignatureHeader(sig: string | null): PaddleHeaderParts {
  if (!sig) return {};
  return Object.fromEntries(
    sig.split(";").map((p) => {
      const [k, v] = p.trim().split("=");
      return [k, v];
    }),
  );
}

async function verifySignature(rawBody: string, sigHeader: string | null): Promise<boolean> {
  const parts = parseSignatureHeader(sigHeader);
  const ts = parts.ts;
  const h1 = parts.h1;
  if (!ts || !h1) return false;

  const secret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!secret) throw new Error("Missing PADDLE_WEBHOOK_SECRET");

  const signedPayload = `${ts}:${rawBody}`;
  const expected = crypto.createHmac("sha256", secret).update(signedPayload, "utf8").digest("hex");
  return timingSafeEqual(expected, h1);
}

export async function POST(req: Request) {
  try {
    const hdrs = await headers();
    const sigHeader = hdrs.get("paddle-signature");
    const rawBody = await req.text(); // raw body is critical

    const valid = await verifySignature(rawBody, sigHeader);
    if (!valid) {
      return new Response("Invalid signature", { status: 401 });
    }

    const event = JSON.parse(rawBody);
    await handlePaddleEvent(event);

    return Response.json({ ok: true });
  } catch (err) {
    console.error("Paddle webhook error", err);
    return new Response("Webhook error", { status: 500 });
  }
}

export async function GET() {
  return Response.json({ ok: true, message: "Paddle webhook endpoint" });
}

async function handlePaddleEvent(event: any) {
  const type = event?.event_type;

  if (type === "transaction.completed") {
    const transactionId = event?.data?.id;
    const email = event?.data?.customer?.email || event?.data?.billing_details?.email || null;
    console.log("Paddle paid", { transactionId, email });
    // TODO: idempotency + persist transaction/order + mark paid
  }

  if (type === "transaction.payment_failed") {
    console.log("Paddle payment_failed");
  }

  if (type === "transaction.canceled") {
    console.log("Paddle canceled");
  }

  if (type === "adjustment.created") {
    console.log("Paddle adjustment (refund/chargeback)");
  }
}
