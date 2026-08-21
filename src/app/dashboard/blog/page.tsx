import { verifySession, getUserStore } from "@/lib/auth";
import { queryMany } from "@/lib/db";
import Link from "next/link";
import { Plus, Newspaper, Pencil } from "lucide-react";
import { formatDate } from "@/lib/utils";
import DeleteEntityButton from "@/components/dashboard/DeleteEntityButton";
import type { BlogPost } from "@/types";

export default async function BlogPage() {
  const user = await verifySession();
  const store = await getUserStore(user!.firebaseUid);

  const posts = await queryMany<BlogPost>(
    `SELECT * FROM blog_posts WHERE store_id = $1 ORDER BY created_at DESC`,
    [store!.id]
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 pt-4 lg:pt-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-surface-900 dark:text-white">Blog</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400">
            {posts.length} post{posts.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/dashboard/blog/new"
          className="flex items-center gap-2 bg-accent-400 hover:bg-accent-500 text-black font-semibold px-4 py-2.5 rounded-xl text-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          New post
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-100 dark:border-surface-800 p-16 text-center">
          <Newspaper className="w-12 h-12 text-surface-200 dark:text-surface-700 mx-auto mb-4" />
          <h3 className="font-semibold text-surface-900 dark:text-white mb-2">
            No blog posts yet
          </h3>
          <p className="text-sm text-surface-400 mb-6">
            Publish articles and updates for your visitors.
          </p>
          <Link
            href="/dashboard/blog/new"
            className="inline-flex items-center gap-2 bg-accent-400 hover:bg-accent-500 text-black font-semibold px-5 py-2.5 rounded-xl text-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Write first post
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-100 dark:border-surface-800 divide-y divide-surface-50 dark:divide-surface-800">
          {posts.map((post) => (
            <div key={post.id} className="p-4 flex items-center gap-3">
              {post.cover_image ? (
                <img
                  src={post.cover_image}
                  alt={post.title}
                  className="w-12 h-12 rounded-xl object-cover border border-surface-100 dark:border-surface-700 shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-surface-100 dark:bg-surface-700 flex items-center justify-center shrink-0">
                  <Newspaper className="w-5 h-5 text-surface-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-surface-900 dark:text-white truncate">
                  {post.title}
                </div>
                <div className="text-xs text-surface-400 truncate">
                  {post.category ? `${post.category} · ` : ""}
                  {post.published_at ? formatDate(post.published_at) : "Not published"}
                </div>
              </div>
              <span
                className={`shrink-0 inline-flex items-center text-xs px-2 py-1 rounded-full font-medium ${
                  post.is_published
                    ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                    : "bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-400"
                }`}
              >
                {post.is_published ? "Published" : "Draft"}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <Link
                  href={`/dashboard/blog/${post.id}/edit`}
                  className="p-1.5 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-800 transition-all"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Link>
                <DeleteEntityButton apiPath={`/api/blog-posts/${post.id}`} label="Post" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
