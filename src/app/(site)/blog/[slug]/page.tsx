import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { getCompany } from "@/lib/auth";
import { queryOne } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { clBanner } from "@/lib/cloudinary";
import { Badge } from "@/components/ui/Badge";
import type { BlogPost } from "@/types";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const company = await getCompany();
  if (!company) return {};
  const post = await queryOne<BlogPost>(
    `SELECT * FROM blog_posts WHERE store_id = $1 AND slug = $2 AND is_published = true`,
    [company.id, slug]
  );
  return { title: post?.title ?? "Blog post" };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const company = await getCompany();
  if (!company) notFound();

  const post = await queryOne<BlogPost>(
    `SELECT * FROM blog_posts WHERE store_id = $1 AND slug = $2 AND is_published = true`,
    [company.id, slug]
  );
  if (!post) notFound();

  const cover = post.cover_image ?? post.coverImage;
  const publishedAt = post.published_at ?? post.publishedAt;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <nav className="flex items-center gap-1.5 text-sm mb-8" style={{ color: "var(--text-secondary)" }}>
        <Link href="/blog" className="hover:opacity-70">Blog</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span style={{ color: "var(--text-primary)" }}>{post.title}</span>
      </nav>

      {cover && (
        <div className="rounded-2xl overflow-hidden mb-8 aspect-[16/9]" style={{ background: "var(--bg-tertiary)" }}>
          <img src={clBanner(cover)} alt={post.title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="flex items-center gap-3 mb-3">
        {post.category && <Badge variant="outline">{post.category}</Badge>}
      </div>

      <h1 className="text-2xl sm:text-3xl font-black mb-3" style={{ color: "var(--text-primary)" }}>
        {post.title}
      </h1>

      <div className="flex items-center gap-2 text-sm mb-8" style={{ color: "var(--text-secondary)" }}>
        {post.author && <span>{post.author}</span>}
        {post.author && publishedAt && <span>&middot;</span>}
        {publishedAt && <span>{formatDate(publishedAt)}</span>}
      </div>

      <div className="whitespace-pre-wrap text-base leading-relaxed" style={{ color: "var(--text-primary)" }}>
        {post.content}
      </div>
    </div>
  );
}
