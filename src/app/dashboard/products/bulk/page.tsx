import { verifySession, getUserStore } from "@/lib/auth";
import { queryMany } from "@/lib/db";
import BulkProductForm from "@/components/dashboard/BulkProductForm";
import type { Category } from "@/types";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function BulkAddProductsPage() {
  const user = await verifySession();
  const store = await getUserStore(user!.firebaseUid);

  const categories = await queryMany<Category>(
    `SELECT * FROM categories WHERE store_id = $1 ORDER BY name ASC`,
    [store!.id]
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 pt-4 lg:pt-0">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/products"
          className="p-2 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-800 transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-surface-900 dark:text-white">
            Bulk add products
          </h1>
          <p className="text-sm text-surface-500 dark:text-surface-400">
            Select all your photos at once, group them into products, then fill in the details.
          </p>
        </div>
      </div>

      <BulkProductForm categories={categories} />
    </div>
  );
}
