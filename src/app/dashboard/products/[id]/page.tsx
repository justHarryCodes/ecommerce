import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { verifySession, getUserStore } from "@/lib/auth";
import { queryOne, queryMany } from "@/lib/db";
import ProductForm from "@/components/dashboard/ProductForm";
import type { Product, Category } from "@/types";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;

  const user = await verifySession();
  if (!user) redirect("/auth/login");

  const store = await getUserStore(user.firebaseUid);
  if (!store) redirect("/onboarding");

  const [product, categories] = await Promise.all([
    queryOne<Product>(
      "SELECT * FROM products WHERE id = $1 AND store_id = $2",
      [id, store.id]
    ),
    queryMany<Category>(
      "SELECT * FROM categories WHERE store_id = $1 AND parent_id IS NULL ORDER BY name ASC",
      [store.id]
    ),
  ]);

  if (!product) notFound();

  const subcategoriesRaw = await queryMany<Category>(
    "SELECT * FROM categories WHERE store_id = $1 AND parent_id IS NOT NULL ORDER BY name ASC",
    [store.id]
  );

  const categoriesWithSubs = categories.map((cat) => ({
    ...cat,
    subcategories: subcategoriesRaw.filter((s) => s.parent_id === cat.id),
  }));

  return (
    <div className="max-w-2xl mx-auto space-y-6 pt-4 lg:pt-0">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/products"
          className="p-2 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-800 transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-surface-900 dark:text-white">Edit product</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400">{product.name}</p>
        </div>
      </div>
      <ProductForm product={product} categories={categoriesWithSubs} />
    </div>
  );
}
