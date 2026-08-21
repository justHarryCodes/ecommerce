import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { clCard } from "@/lib/cloudinary";
import type { Product } from "@/types";

interface Props {
  product: Product;
}

// Catalog card — browse-only, no cart. Price is shown when set, otherwise
// price_note ("From ₦X" / "Contact for quote") or a generic quote prompt.
export default function ProductCard({ product }: Props) {
  const images = product.images ?? [];
  const imageUrl = images[0] ?? product.image_url ?? null;
  const priceNote = product.price_note ?? product.priceNote;
  const price = product.price;

  return (
    <Link
      href={`/products/${product.slug ?? product.id}`}
      prefetch={false}
      className="group flex flex-col rounded-2xl bg-white dark:bg-surface-900 border border-surface-100 dark:border-surface-800 overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_28px_rgba(0,0,0,0.10)] dark:hover:shadow-[0_8px_28px_rgba(0,0,0,0.35)] hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className="relative aspect-square overflow-hidden bg-surface-50 dark:bg-surface-800">
        {imageUrl ? (
          <img
            src={clCard(imageUrl)}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-surface-200 dark:text-surface-700">
            🛠️
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 p-3.5 pt-3 gap-1.5">
        <p className="text-[13px] font-semibold text-surface-800 dark:text-surface-100 line-clamp-2 leading-snug flex-1">
          {product.name}
        </p>

        <div className="flex items-baseline gap-1.5 mt-0.5">
          <span className="font-black text-[15px]" style={{ color: "var(--accent)" }}>
            {price != null ? formatCurrency(price) : priceNote ?? "Request a quote"}
          </span>
        </div>

        <span className="flex items-center gap-1 text-xs font-semibold text-surface-500 dark:text-surface-400 group-hover:text-surface-900 dark:group-hover:text-white transition-colors">
          View details
          <ArrowUpRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </Link>
  );
}
