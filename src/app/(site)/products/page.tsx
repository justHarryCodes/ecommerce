import Link from "next/link";
import { PackageSearch } from "lucide-react";
import { getCompany } from "@/lib/auth";
import { query } from "@/lib/db";
import { cn } from "@/lib/utils";
import ProductCard from "@/components/storefront/ProductCard";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Product, Category } from "@/types";

export const metadata = { title: "Products" };

async function getProducts(storeId: string, categorySlug?: string, subSlug?: string) {
  let sql = `
    SELECT p.*, c.name AS category_name, c.slug AS category_slug
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.store_id = $1 AND p.is_active = true
  `;
  const params: unknown[] = [storeId];
  let idx = 2;
  if (subSlug) {
    sql += ` AND EXISTS (SELECT 1 FROM categories sc WHERE sc.id = p.subcategory_id AND sc.slug = $${idx++})`;
    params.push(subSlug);
  } else if (categorySlug) {
    sql += ` AND EXISTS (SELECT 1 FROM categories cc WHERE cc.id = p.category_id AND cc.slug = $${idx++})`;
    params.push(categorySlug);
  }
  sql += " ORDER BY p.sort_order, p.created_at DESC";
  return query<Product>(sql, params);
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sub?: string }>;
}) {
  const { category, sub } = await searchParams;
  const company = await getCompany();

  if (!company) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24">
        <EmptyState icon={PackageSearch} title="Catalog unavailable" description="Please check back shortly." />
      </div>
    );
  }

  const allCategories = await query<Category>(
    `SELECT * FROM categories WHERE store_id = $1 ORDER BY sort_order, name`,
    [company.id]
  );
  const topCategories = allCategories.filter((c) => !c.parent_id);
  const activeCategory = topCategories.find((c) => c.slug === category);
  const subcategories = activeCategory ? allCategories.filter((c) => c.parent_id === activeCategory.id) : [];

  const products = await getProducts(company.id, category, sub);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-black" style={{ color: "var(--text-primary)" }}>
          Our Products
        </h1>
        <p className="mt-2 text-base" style={{ color: "var(--text-secondary)" }}>
          Browse our catalog of fabricated pieces — every item can be customized to your specifications.
        </p>
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Link
          href="/products"
          className={cn(
            "px-4 py-2 rounded-full text-sm font-semibold transition-colors border",
            !activeCategory ? "text-white" : "hover:opacity-80"
          )}
          style={
            !activeCategory
              ? { background: "var(--accent)", borderColor: "var(--accent)" }
              : { borderColor: "var(--border)", color: "var(--text-secondary)" }
          }
        >
          All
        </Link>
        {topCategories.map((cat) => (
          <Link
            key={cat.id}
            href={`/products?category=${cat.slug}`}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-semibold transition-colors border",
              activeCategory?.id === cat.id ? "text-white" : "hover:opacity-80"
            )}
            style={
              activeCategory?.id === cat.id
                ? { background: "var(--accent)", borderColor: "var(--accent)" }
                : { borderColor: "var(--border)", color: "var(--text-secondary)" }
            }
          >
            {cat.name}
          </Link>
        ))}
      </div>

      {/* Subcategory pills */}
      {activeCategory && subcategories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <Link
            href={`/products?category=${activeCategory.slug}`}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border",
              !sub ? "" : "hover:opacity-80"
            )}
            style={
              !sub
                ? { background: "var(--accent-light)", borderColor: "var(--accent-light)", color: "var(--accent-dark)" }
                : { borderColor: "var(--border)", color: "var(--text-secondary)" }
            }
          >
            All {activeCategory.name}
          </Link>
          {subcategories.map((s) => (
            <Link
              key={s.id}
              href={`/products?category=${activeCategory.slug}&sub=${s.slug}`}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border",
                sub === s.slug ? "" : "hover:opacity-80"
              )}
              style={
                sub === s.slug
                  ? { background: "var(--accent-light)", borderColor: "var(--accent-light)", color: "var(--accent-dark)" }
                  : { borderColor: "var(--border)", color: "var(--text-secondary)" }
              }
            >
              {s.name}
            </Link>
          ))}
        </div>
      )}

      {products.length === 0 ? (
        <EmptyState
          icon={PackageSearch}
          title="No products found"
          description="Try a different category, or get in touch for a custom quote."
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
