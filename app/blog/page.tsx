import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function BlogIndexPage() {
  const posts = await prisma.blogPost.findMany({
    where: { status: "published", OR: [{ publishDate: null }, { publishDate: { lte: new Date() } }] },
    orderBy: [{ publishDate: "desc" }, { createdAt: "desc" }],
    take: 20,
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-5xl px-6 py-12 space-y-6">
        <div>
          <p className="text-xs uppercase font-semibold text-slate-500">Blog</p>
          <h1 className="text-3xl font-semibold">Insights on passive IT security</h1>
          <p className="text-sm text-slate-700">Email security, TLS/HTTPS hygiene, web security headers, and executive-ready reporting.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {posts.map((post) => {
            const words = post.content?.trim().split(/\s+/).length || 0;
            const readMinutes = post.readMinutes || Math.max(1, Math.round(words / 200));
            return (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <p className="text-xs font-semibold uppercase text-slate-500">{post.category}</p>
                <h2 className="mt-1 text-xl font-semibold">{post.title}</h2>
                <p className="mt-2 text-sm text-slate-700 line-clamp-3">{post.summary}</p>
                <p className="mt-3 text-xs text-slate-500">
                  <time dateTime={(post.publishDate ?? post.createdAt).toISOString()}>
                    {new Date(post.publishDate ?? post.createdAt).toLocaleDateString()}
                  </time>{" "}• {readMinutes} min read
                </p>
              </Link>
            );
          })}
          {posts.length === 0 && <p className="text-sm text-slate-600">No published posts yet.</p>}
        </div>
      </div>
    </div>
  );
}
