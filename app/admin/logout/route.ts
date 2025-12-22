import { NextRequest, NextResponse } from "next/server";

const ADMIN_COOKIE = "admin_token";

export async function GET(req: NextRequest) {
  const res = NextResponse.redirect(new URL("/admin/login", req.url));
  res.cookies.set(ADMIN_COOKIE, "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 });
  return res;
}
