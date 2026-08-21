import Link from "next/link";
import { PackageSearch, ShoppingBag, MessageCircle } from "lucide-react";
import { getCompany } from "@/lib/auth";
import { query } from "@/lib/db";
import { cn } from "@/lib/utils";
import ProductCard from "@/components/storefront/ProductCard";
import { EmptyState } from "@/components/ui/EmptyState";
import PageHero from "@/components/storefront/PageHero";
import type { Product, Category } from "@/types";

export const metadata = { title: "Products" };

type Sort = "newest" | "price_asc" | "price_desc";

async function getProducts(
  storeId: string,
  categorySlug?: string,
  subSlug?: string,
  mode?: string,
  sort: Sort = "newest"
) {
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
  if (mode === "buy") sql += ` AND p.is_purchasable = true`;
  if (mode === "quote") sql += ` AND p.is_purchasable = false`;

  sql +=
    sort === "price_asc"
      ? " ORDER BY p.price ASC NULLS LAST, p.sort_order"
      : sort === "price_desc"
      ? " ORDER BY p.price DESC NULLS LAST, p.sort_order"
      : " ORDER BY p.sort_order, p.created_at DESC";

  return query<Product>(sql, params);
}

const SORTS: { value: Sort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sub?: string; mode?: string; sort?: string }>;
}) {
  const { category, sub, mode, sort } = await searchParams;
  const activeSort: Sort = sort === "price_asc" || sort === "price_desc" ? sort : "newest";
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

  const products = await getProducts(company.id, category, sub, mode, activeSort);

  // Preserve category/sub filters when switching mode/sort
  const baseParams = new URLSearchParams();
  if (category) baseParams.set("category", category);
  if (sub) baseParams.set("sub", sub);

  function withParam(key: string, value?: string) {
    const p = new URLSearchParams(baseParams);
    if (value) p.set(key, value);
    else p.delete(key);
    if (key !== "mode" && mode) p.set("mode", mode);
    if (key !== "sort" && sort) p.set("sort", sort);
    const qs = p.toString();
    return `/products${qs ? `?${qs}` : ""}`;
  }

  return (
    <div>
      <PageHero
        eyebrow="Catalog"
        title="Shop the Catalog"
        subtitle="Standard pieces ship straight from stock — everything else is built to your exact specifications. Add stock items to your cart, or request a quote for custom work."
        stats={[
          { label: "Products", value: products.length },
          { label: "Categories", value: topCategories.length },
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid lg:grid-cols-[240px_1fr] gap-8">
        {/* ── Sidebar (desktop) ── */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-6">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
                Buying mode
              </h3>
              <div className="flex flex-col gap-1.5">
                {[
                  { value: undefined, label: "All products", icon: PackageSearch },
                  { value: "buy", label: "Add to cart", icon: ShoppingBag },
                  { value: "quote", label: "Request a quote", icon: MessageCircle },
                ].map((m) => (
                  <Link
                    key={m.label}
                    href={withParam("mode", m.value)}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      (mode ?? undefined) === m.value ? "text-white" : "hover:bg-black/5 dark:hover:bg-white/5"
                    )}
                    style={
                      (mode ?? undefined) === m.value
                        ? { background: "var(--accent)" }
                        : { color: "var(--text-secondary)" }
                    }
                  >
                    <m.icon className="w-4 h-4 shrink-0" />
                    {m.label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
                Category
              </h3>
              <div className="flex flex-col gap-1">
                <Link
                  href={withParam("category")}
                  className="px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                  style={{ color: !activeCategory ? "var(--accent)" : "var(--text-secondary)", fontWeight: !activeCategory ? 700 : 500 }}
                >
                  All categories
                </Link>
                {topCategories.map((cat) => (
                  <div key={cat.id}>
                    <Link
                      href={`/products?category=${cat.slug}${mode ? `&mode=${mode}` : ""}${sort ? `&sort=${sort}` : ""}`}
                      className="px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5 block"
                      style={{
                        color: activeCategory?.id === cat.id ? "var(--accent)" : "var(--text-secondary)",
                        fontWeight: activeCategory?.id === cat.id ? 700 : 500,
                      }}
                    >
                      {cat.name}
                    </Link>
                    {activeCategory?.id === cat.id && subcategories.length > 0 && (
                      <div className="ml-3 mt-1 flex flex-col gap-0.5 border-l pl-3" style={{ borderColor: "var(--border)" }}>
                        {subcategories.map((s) => (
                          <Link
                            key={s.id}
                            href={`/products?category=${cat.slug}&sub=${s.slug}${mode ? `&mode=${mode}` : ""}${sort ? `&sort=${sort}` : ""}`}
                            className="px-2 py-1.5 rounded-lg text-[13px] transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                            style={{ color: sub === s.slug ? "var(--accent)" : "var(--text-muted)", fontWeight: sub === s.slug ? 600 : 400 }}
                          >
                            {s.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* ── Main ── */}
        <div className="min-w-0">
          {/* Mobile filter pills */}
          <div className="lg:hidden -mx-4 px-4 mb-4 flex gap-2 overflow-x-auto pb-1">
            <Link
              href={withParam("category")}
              className={cn("shrink-0 px-4 py-2 rounded-full text-sm font-semibold border transition-colors", !activeCategory ? "text-white" : "")}
              style={!activeCategory ? { background: "var(--accent)", borderColor: "var(--accent)" } : { borderColor: "var(--border)", color: "var(--text-secondary)" }}
            >
              All
            </Link>
            {topCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`/products?category=${cat.slug}${mode ? `&mode=${mode}` : ""}`}
                className={cn("shrink-0 px-4 py-2 rounded-full text-sm font-semibold border transition-colors", activeCategory?.id === cat.id ? "text-white" : "")}
                style={activeCategory?.id === cat.id ? { background: "var(--accent)", borderColor: "var(--accent)" } : { borderColor: "var(--border)", color: "var(--text-secondary)" }}
              >
                {cat.name}
              </Link>
            ))}
          </div>
          {activeCategory && subcategories.length > 0 && (
            <div className="lg:hidden -mx-4 px-4 mb-6 flex gap-2 overflow-x-auto pb-1">
              <Link
                href={`/products?category=${activeCategory.slug}${mode ? `&mode=${mode}` : ""}`}
                className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border"
                style={!sub ? { background: "var(--accent-light)", borderColor: "var(--accent-light)", color: "var(--accent-dark)" } : { borderColor: "var(--border)", color: "var(--text-secondary)" }}
              >
                All {activeCategory.name}
              </Link>
              {subcategories.map((s) => (
                <Link
                  key={s.id}
                  href={`/products?category=${activeCategory.slug}&sub=${s.slug}${mode ? `&mode=${mode}` : ""}`}
                  className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border"
                  style={sub === s.slug ? { background: "var(--accent-light)", borderColor: "var(--accent-light)", color: "var(--accent-dark)" } : { borderColor: "var(--border)", color: "var(--text-secondary)" }}
                >
                  {s.name}
                </Link>
              ))}
            </div>
          )}

          {/* Result count + sort */}
          <div className="flex items-center justify-between mb-5 gap-3">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {products.length} product{products.length !== 1 ? "s" : ""}
            </p>
            <div className="flex items-center gap-1 rounded-lg border p-1" style={{ borderColor: "var(--border)" }}>
              {SORTS.map((s) => (
                <Link
                  key={s.value}
                  href={withParam("sort", s.value === "newest" ? undefined : s.value)}
                  className={cn("px-2.5 py-1 rounded-md text-xs font-semibold transition-colors whitespace-nowrap", activeSort === s.value ? "text-white" : "hover:bg-black/5 dark:hover:bg-white/5")}
                  style={activeSort === s.value ? { background: "var(--accent)" } : { color: "var(--text-secondary)" }}
                >
                  {s.label}
                </Link>
              ))}
            </div>
          </div>

          {products.length === 0 ? (
            <EmptyState
              icon={PackageSearch}
              title="No products found"
              description="Try a different category or filter, or get in touch for a custom quote."
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
