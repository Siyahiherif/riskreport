import { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://cyberfacex.com";
  const now = new Date();
  const staticPaths = ["/", "/pricing", "/refund", "/privacy", "/terms", "/blog"];

  let postPaths: MetadataRoute.Sitemap = [];
  try {
    const posts = await prisma.blogPost.findMany({
      where: { status: "published", OR: [{ publishDate: null }, { publishDate: { lte: new Date() } }] },
      select: { slug: true, updatedAt: true, publishDate: true },
    });
    postPaths = posts.map((p) => ({
      url: `${base}/blog/${p.slug}`,
      lastModified: p.updatedAt || p.publishDate || now,
    }));
  } catch (err) {
    // If the blog table does not exist yet, skip posts to avoid build failures.
    postPaths = [];
  }

  return [
    ...staticPaths.map((path) => ({
      url: `${base}${path}`,
      lastModified: now,
    })),
    ...postPaths,
  ];
}
