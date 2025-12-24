import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type Props = { params: { slug: string } };

export default async function BlogPostPage({ params }: Props) {
  let post = null;
  try {
    post = await prisma.blogPost.findUnique({ where: { slug: params.slug } });
    if (!post) {
      post = await prisma.blogPost.findFirst({ where: { slug: { equals: params.slug, mode: "insensitive" } } });
    }
  } catch (err) {
    return notFound();
  }
  if (!post) {
    notFound();
  }

  const metaTitle = post.seoTitle || post.title;
  const metaDesc = post.summary || post.focusKeyword || "";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-3xl px-6 py-12 space-y-6">
        <div className="text-sm text-slate-600">
          <Link href="/">Home</Link> &gt; <Link href="/blog">Blog</Link> &gt; <Link href={`/blog?cat=${encodeURIComponent(post.category)}`}>{post.category}</Link> &gt;{" "}
          <span className="text-slate-900">{post.title}</span>
        </div>
        <article className="prose prose-slate max-w-none bg-white p-6 rounded-2xl border border-slate-200 shadow">
          <p className="text-xs font-semibold uppercase text-slate-500">{post.category}</p>
          <h1 className="text-3xl font-semibold">{post.title}</h1>
          <p className="text-sm text-slate-600 mt-1">
            <time dateTime={(post.publishDate ?? post.createdAt).toISOString()}>
              {new Date(post.publishDate ?? post.createdAt).toLocaleDateString()}
            </time>{" "}
            · {post.readMinutes || Math.max(1, Math.round((post.content?.trim().split(/\s+/).length || 0) / 200))} min read
          </p>
          <p className="text-sm text-slate-700 mt-2">{post.summary}</p>
          <div className="mt-6 text-slate-900 whitespace-pre-line leading-relaxed text-[15px]">{post.content}</div>
          {(post.tags || []).length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-600">
              {(post.tags || []).map((t) => (
                <span key={t} className="rounded-full bg-slate-100 px-3 py-1">
                  #{t}
                </span>
              ))}
            </div>
          )}
        </article>
        {post.focusKeyword && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow">
            <p className="text-sm font-semibold text-slate-900">Focus keyword</p>
            <p className="text-sm text-slate-700">{post.focusKeyword}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: Props) {
  let post = null;
  try {
    post = await prisma.blogPost.findUnique({ where: { slug: params.slug } });
  } catch {
    return {};
  }
  if (!post) return {};
  const title = post.seoTitle || post.title;
  const description = post.summary || post.focusKeyword || "";
  const canonical = post.canonicalUrl || `https://cyberfacex.com/blog/${post.slug}`;
  return {
    title,
    description,
    alternates: { canonical },
    robots: post.indexable ? "index,follow" : "noindex,nofollow",
    openGraph: {
      title,
      description,
      url: canonical,
      type: "article",
    },
  };
}
