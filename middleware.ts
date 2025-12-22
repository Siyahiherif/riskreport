import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_COOKIE = "admin_token";

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  const isAdminPath = path.startsWith("/admin") || path.startsWith("/api/admin");
  const isLoginPath = path.startsWith("/admin/login") || path.startsWith("/api/admin/login");
  if (!isAdminPath || isLoginPath) return NextResponse.next();

  const token = process.env.ADMIN_TOKEN;
  const user = process.env.ADMIN_USER;
  const pass = process.env.ADMIN_PASS;
  const allowed = [token, user && pass ? `${user}:${pass}` : null].filter(Boolean) as string[];

  if (!allowed.length) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const cookie = req.cookies.get(ADMIN_COOKIE)?.value;
  if (cookie && allowed.includes(cookie)) return NextResponse.next();

  return NextResponse.redirect(new URL("/admin/login", req.url));
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
