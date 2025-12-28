import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // Paddle webhooks will be sent here. For now we simply acknowledge.
    // You can add signature verification and event handling as needed.
    const body = await req.text();
    console.log("Paddle webhook received", body.slice(0, 500));
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Paddle webhook error", err);
    return NextResponse.json({ error: "webhook processing failed" }, { status: 500 });
  }
}

export async function GET() {
  // Health-check endpoint
  return NextResponse.json({ ok: true, message: "Paddle webhook endpoint" });
}
