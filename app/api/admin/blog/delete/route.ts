import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";

const ADMIN_COOKIE = "admin_token";

export async function POST(req: NextRequest) {
  const token = process.env.ADMIN_TOKEN;
  const user = process.env.ADMIN_USER;
  const pass = process.env.ADMIN_PASS;
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(ADMIN_COOKIE)?.value;
  const allowed = [token, user && pass ? `${user}:${pass}` : null].filter(Boolean) as string[];
  if (!allowed.length || !cookieToken || !allowed.includes(cookieToken)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const id = formData.get("id") as string | null;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  try {
    await prisma.blogPost.delete({ where: { id } });
  } catch (err) {
    console.error("Failed to delete blog post", err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }

  return NextResponse.redirect(new URL("/admin/blog", req.url));
}
