"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import type { BlogPost } from "@/types";
import { ImageUpload } from "@/components/ui/ImageUpload";

interface Props {
  post?: BlogPost;
}

const inputClass =
  "w-full px-3.5 py-2.5 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white placeholder-surface-400 text-sm focus:outline-none focus:ring-2 focus:ring-accent-400";
const labelClass = "block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5";

export default function BlogPostForm({ post }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: post?.title ?? "",
    excerpt: post?.excerpt ?? "",
    content: post?.content ?? "",
    coverImage: post?.cover_image ?? post?.coverImage ?? "",
    category: post?.category ?? "",
    author: post?.author ?? "",
    isPublished: post?.is_published ?? post?.isPublished ?? false,
  });

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.title.trim().length < 2) {
      toast.error("Post title is required");
      return;
    }
    setLoading(true);
    try {
      const isEdit = !!post;
      const url = isEdit ? `/api/blog-posts/${post.id}` : "/api/blog-posts";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          excerpt: form.excerpt.trim() || undefined,
          content: form.content,
          coverImage: form.coverImage || undefined,
          category: form.category.trim() || undefined,
          author: form.author.trim() || undefined,
          isPublished: form.isPublished,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Failed to save");

      toast.success(isEdit ? "Post updated!" : "Post created!");
      router.push("/dashboard/blog");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 bg-white dark:bg-surface-900 rounded-2xl border border-surface-100 dark:border-surface-800 p-6"
    >
      <ImageUpload
        label="Cover image"
        value={form.coverImage}
        onChange={(url) => set("coverImage", url)}
      />

      <div>
        <label className={labelClass}>
          Title <span className="text-red-500">*</span>
        </label>
        <input
          className={inputClass}
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Post title"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Category</label>
          <input
            className={inputClass}
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
            placeholder="e.g. Interior Trends"
          />
        </div>
        <div>
          <label className={labelClass}>Author</label>
          <input
            className={inputClass}
            value={form.author}
            onChange={(e) => set("author", e.target.value)}
            placeholder="e.g. BINTED Team"
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Excerpt</label>
        <textarea
          className={inputClass + " resize-none"}
          rows={2}
          value={form.excerpt}
          onChange={(e) => set("excerpt", e.target.value)}
          placeholder="Short summary shown on the blog list"
        />
      </div>

      <div>
        <label className={labelClass}>Content</label>
        <textarea
          className={inputClass + " resize-none font-mono text-xs"}
          rows={16}
          value={form.content}
          onChange={(e) => set("content", e.target.value)}
          placeholder="Full article content…"
        />
        <p className="text-xs text-surface-400 mt-1">Plain text for now — no rich text formatting yet.</p>
      </div>

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={form.isPublished}
          onChange={(e) => set("isPublished", e.target.checked)}
          className="w-4 h-4 rounded accent-amber-400"
        />
        <span className="text-sm text-surface-700 dark:text-surface-300">
          Published (visible to visitors)
        </span>
      </label>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-900 dark:text-white font-semibold py-3 rounded-xl text-sm transition-all"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 bg-accent-400 hover:bg-accent-500 disabled:opacity-60 text-black font-bold py-3 rounded-xl text-sm transition-all"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? "Saving…" : post ? "Update post" : "Create post"}
        </button>
      </div>
    </form>
  );
}
