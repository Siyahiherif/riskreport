import { NextRequest, NextResponse } from "next/server";

const cookieName = "admin_token";

export async function POST(req: NextRequest) {
  const token = process.env.ADMIN_TOKEN;
  const user = process.env.ADMIN_USER;
  const pass = process.env.ADMIN_PASS;

  const formData = await req.formData();
  const providedToken = formData.get("token") as string | null;
  const providedUser = formData.get("username") as string | null;
  const providedPass = formData.get("password") as string | null;

  const tokenOk = token && providedToken === token;
  const userOk = user && pass && providedUser === user && providedPass === pass;

  if (!tokenOk && !userOk) {
    return NextResponse.redirect(new URL("/admin/login?error=1", req.url));
  }

  const res = NextResponse.redirect(new URL("/admin", req.url));
  res.cookies.set(cookieName, token || `${user}:${pass}`, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    domain: req.nextUrl.hostname.includes("localhost") ? undefined : req.nextUrl.hostname,
  });
  return res;
}
