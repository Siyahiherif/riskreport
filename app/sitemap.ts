import { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://cyberfacex.com";
  const now = new Date();
  const staticPaths = ["/", "/pricing", "/refund", "/privacy", "/terms", "/blog"];

  const posts = await prisma.blogPost.findMany({
    where: { status: "published", OR: [{ publishDate: null }, { publishDate: { lte: new Date() } }] },
    select: { slug: true, updatedAt: true, publishDate: true },
  });

  const postPaths = posts.map((p) => ({
    url: `${base}/blog/${p.slug}`,
    lastModified: p.updatedAt || p.publishDate || now,
  }));

  return [
    ...staticPaths.map((path) => ({
      url: `${base}${path}`,
      lastModified: now,
    })),
    ...postPaths,
  ];
}
