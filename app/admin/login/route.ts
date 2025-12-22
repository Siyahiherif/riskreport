import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const token = process.env.ADMIN_TOKEN;
  if (!token) return NextResponse.redirect(new URL("/admin/login", req.url));

  const formData = await req.formData();
  const provided = formData.get("token") as string;
  if (provided !== token) {
    return NextResponse.redirect(new URL("/admin/login?error=1", req.url));
  }

  const res = NextResponse.redirect(new URL("/admin", req.url));
  res.cookies.set("admin_token", token, { httpOnly: true, secure: true, sameSite: "lax", path: "/" });
  return res;
}
