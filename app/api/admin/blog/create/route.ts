import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { BlogStatus } from "@prisma/client";
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

  const body = await req.json();
  const {
    title,
    slug,
    summary,
    content,
    status,
    publishDate,
    category,
    tags,
    seoTitle,
    canonicalUrl,
    indexable,
    focusKeyword,
  } = body;

  if (!title || !content) {
    return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
  }

  const finalSlug =
    (slug as string | undefined)?.trim() ||
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);

  const words = content.trim().split(/\s+/).length;
  const readMinutes = Math.max(1, Math.round(words / 200));

  const created = await prisma.blogPost.create({
    data: {
      title,
      slug: finalSlug,
      summary: summary || "",
      content,
      status: (status as BlogStatus) || BlogStatus.draft,
      publishDate: publishDate ? new Date(publishDate) : null,
      category: category || "Passive Security",
      tags: Array.isArray(tags)
        ? tags
        : typeof tags === "string"
        ? tags
            .split(",")
            .map((t: string) => t.trim())
            .filter(Boolean)
        : [],
      seoTitle: seoTitle || null,
      canonicalUrl: canonicalUrl || null,
      indexable: indexable !== false,
      focusKeyword: focusKeyword || null,
      wordCount: words,
      readMinutes,
    },
  });

  return NextResponse.json({ ok: true, post: created });
}
