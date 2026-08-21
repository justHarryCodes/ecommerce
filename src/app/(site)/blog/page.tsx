import Link from "next/link";
import { Newspaper } from "lucide-react";
import { getCompany } from "@/lib/auth";
import { query } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { clCard } from "@/lib/cloudinary";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import type { BlogPost } from "@/types";

export const metadata = { title: "Blog" };

export default async function BlogPage() {
  const company = await getCompany();
  const posts = company
    ? await query<BlogPost>(
        `SELECT * FROM blog_posts WHERE store_id = $1 AND is_published = true ORDER BY published_at DESC`,
        [company.id]
      )
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10 max-w-2xl">
        <h1 className="text-3xl sm:text-4xl font-black" style={{ color: "var(--text-primary)" }}>
          Blog
        </h1>
        <p className="mt-2 text-base" style={{ color: "var(--text-secondary)" }}>
          Tips, trends, and stories from our workshop and job sites.
        </p>
      </div>

      {posts.length === 0 ? (
        <EmptyState icon={Newspaper} title="No posts yet" description="Please check back shortly." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => {
            const cover = post.cover_image ?? post.coverImage;
            const publishedAt = post.published_at ?? post.publishedAt;
            return (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group flex flex-col rounded-2xl overflow-hidden border transition-all hover:-translate-y-0.5 hover:shadow-lg"
                style={{ borderColor: "var(--border)", background: "var(--bg)" }}
              >
                <div className="aspect-[16/10] overflow-hidden" style={{ background: "var(--bg-tertiary)" }}>
                  {cover ? (
                    <img
                      src={clCard(cover)}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">📰</div>
                  )}
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {post.category && <Badge variant="outline">{post.category}</Badge>}
                    {publishedAt && (
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {formatDate(publishedAt)}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold leading-snug" style={{ color: "var(--text-primary)" }}>
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="mt-2 text-sm leading-relaxed line-clamp-3 flex-1" style={{ color: "var(--text-secondary)" }}>
                      {post.excerpt}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
