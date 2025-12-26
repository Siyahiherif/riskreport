import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const dynamicParams = true;
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const runtime = "nodejs";

type Props = { params: { slug: string } };

type LookupResult = { post: any | null; error: string | null };

async function lookupPost(rawSlug: string): Promise<LookupResult> {
  const slug = (rawSlug || "").trim();
  if (!slug) return { post: null, error: "empty slug" };
  try {
    const exact = await prisma.blogPost.findFirst({ where: { slug: { equals: slug, mode: "insensitive" } } });
    if (exact) return { post: exact, error: null };
    const lowered = slug.toLowerCase();
    const fallback = await prisma.blogPost.findFirst({ where: { slug: { equals: lowered, mode: "insensitive" } } });
    return { post: fallback, error: null };
  } catch (err: any) {
    console.error("getPost error", err);
    return { post: null, error: err?.message ?? "unknown error" };
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { post, error } = await lookupPost(params.slug);

  if (!post) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <div className="mx-auto max-w-3xl px-6 py-12 space-y-4">
          <p className="text-sm text-slate-600">Home &gt; Blog</p>
          <h1 className="text-2xl font-semibold">Post not found</h1>
          <p className="text-sm text-slate-700">Slug: {params.slug}</p>
          {error && <p className="text-sm text-red-600">Error: {error}</p>}
          <p className="text-sm text-slate-700">Record not found in the database. Please verify the URL or try again later.</p>
        </div>
      </div>
    );
  }

  const words = post.content?.trim().split(/\s+/).length || 0;
  const readMinutes = post.readMinutes || Math.max(1, Math.round(words / 200));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-3xl px-6 py-12 space-y-6">
        <div className="text-sm text-slate-600">
          <Link href="/">Home</Link> &gt; <Link href="/blog">Blog</Link> &gt; <Link href={`/blog?cat=${encodeURIComponent(post.category)}`}>{post.category}</Link> &gt; {post.title}
        </div>
        <article className="prose prose-slate max-w-none bg-white p-6 rounded-2xl border border-slate-200 shadow">
          <p className="text-xs font-semibold uppercase text-slate-500">{post.category}</p>
          <h1 className="text-3xl font-semibold">{post.title}</h1>
          <p className="text-sm text-slate-600 mt-1">
            <time dateTime={(post.publishDate ?? post.createdAt).toISOString()}>
              {new Date(post.publishDate ?? post.createdAt).toLocaleDateString()}
            </time> • {readMinutes} min read
          </p>
          <p className="text-sm text-slate-700 mt-2">{post.summary}</p>
          <div className="mt-6 text-slate-900 whitespace-pre-line leading-relaxed text-[15px]">{post.content}</div>
          {(post.tags || []).length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-600">
              {(post.tags || []).map((t: string) => (
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
  const { post } = await lookupPost(params.slug);
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
