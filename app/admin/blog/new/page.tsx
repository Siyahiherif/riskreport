import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { BlogStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const categories = ["Email Security", "TLS & HTTPS", "Web Security Headers", "Passive Security", "Executive / Risk Management"];

export default async function AdminBlogNewPage() {
  const token = process.env.ADMIN_TOKEN;
  const user = process.env.ADMIN_USER;
  const pass = process.env.ADMIN_PASS;
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get("admin_token")?.value;
  const allowed = [token, user && pass ? `${user}:${pass}` : null].filter(Boolean) as string[];
  if (!allowed.length || !cookieToken || !allowed.includes(cookieToken)) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-4xl px-6 py-10 space-y-4">
        <h1 className="text-2xl font-semibold">New Blog Post</h1>
        <form
          className="space-y-3"
          action={async (formData) => {
            "use server";
            const token = process.env.ADMIN_TOKEN;
            const user = process.env.ADMIN_USER;
            const pass = process.env.ADMIN_PASS;
            const cookieStore = cookies();
            const cookieToken = (await cookieStore).get("admin_token")?.value;
            const allowed = [token, user && pass ? `${user}:${pass}` : null].filter(Boolean) as string[];
            if (!allowed.length || !cookieToken || !allowed.includes(cookieToken)) {
              redirect("/admin/login");
            }
            const title = (formData.get("title") as string)?.trim();
            const slugInput = (formData.get("slug") as string)?.trim();
            const summary = (formData.get("summary") as string)?.trim() || "";
            const content = (formData.get("content") as string)?.trim();
            const status = (formData.get("status") as BlogStatus) || "draft";
            const publishDate = formData.get("publishDate") as string;
            const category = (formData.get("category") as string) || "Passive Security";
            const tagsRaw = formData.get("tags") as string;
            const seoTitle = (formData.get("seoTitle") as string) || null;
            const canonicalUrl = (formData.get("canonicalUrl") as string) || null;
            const indexable = formData.get("indexable") === "on";
            const focusKeyword = (formData.get("focusKeyword") as string) || null;

            if (!title || !content) {
              redirect("/admin/blog?error=missing_fields");
            }

            const makeSlug = (text: string) =>
              text
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, "")
                .slice(0, 80);

            let finalSlug = slugInput || makeSlug(title);
            const words = content.trim().split(/\s+/).length;
            const readMinutes = Math.max(1, Math.round(words / 200));
            const tags =
              tagsRaw && typeof tagsRaw === "string"
                ? tagsRaw
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean)
                : [];

            const data = {
              title,
              slug: finalSlug,
              summary,
              content,
              status,
              publishDate: publishDate ? new Date(publishDate) : null,
              category,
              tags,
              seoTitle,
              canonicalUrl,
              indexable,
              focusKeyword,
              wordCount: words,
              readMinutes,
            };

            try {
              await prisma.blogPost.create({ data });
            } catch (err: any) {
              if (err.code === "P2002") {
                finalSlug = `${finalSlug}-${Date.now()}`;
                await prisma.blogPost.create({ data: { ...data, slug: finalSlug } });
              } else {
                throw err;
              }
            }

            redirect("/admin/blog");
          }}
        >
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow space-y-3">
            <input name="title" required placeholder="Title" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            <input name="slug" placeholder="Slug (optional)" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            <textarea name="summary" placeholder="Summary / meta description (155 chars)" maxLength={200} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            <textarea
              name="content"
              required
              placeholder="Main content (Markdown/plain text)"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              rows={10}
            />
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-sm text-slate-700">
                Status
                <select name="status" defaultValue="published" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                </select>
              </label>
              <label className="text-sm text-slate-700">
                Publish date (for scheduled)
                <input type="datetime-local" name="publishDate" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </label>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-sm text-slate-700">
                Category
                <select name="category" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-slate-700">
                Tags (comma separated)
                <input name="tags" placeholder="dmarc, tls, executive" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </label>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow space-y-3">
            <p className="text-sm font-semibold text-slate-900">SEO options</p>
            <input name="seoTitle" placeholder="SEO title (optional)" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            <input name="canonicalUrl" placeholder="Canonical URL (optional)" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" name="indexable" defaultChecked className="h-4 w-4" />
              Allow indexing
            </label>
            <input name="focusKeyword" placeholder="Focus keyword (optional)" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </div>

          <div className="flex justify-end gap-2">
            <Link href="/admin/blog" className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800">
              Cancel
            </Link>
            <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow">
              Save post
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
