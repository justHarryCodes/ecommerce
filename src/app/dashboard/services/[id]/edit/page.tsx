import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { verifySession, getUserStore } from "@/lib/auth";
import { queryOne, queryMany } from "@/lib/db";
import type { Service, Product } from "@/types";
import ServiceForm from "@/components/dashboard/ServiceForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditServicePage({ params }: Props) {
  const { id } = await params;

  const user = await verifySession();
  if (!user) redirect("/auth/login");

  const store = await getUserStore(user.firebaseUid);
  if (!store) redirect("/onboarding");

  const [service, products] = await Promise.all([
    queryOne<Service>("SELECT * FROM services WHERE id = $1 AND store_id = $2", [id, store.id]),
    queryMany<Product>(`SELECT id, name FROM products WHERE store_id = $1 ORDER BY name ASC`, [store.id]),
  ]);
  if (!service) notFound();

  return (
    <div className="max-w-2xl mx-auto space-y-6 pt-4 lg:pt-0">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/services"
          className="p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors text-surface-500"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-surface-900 dark:text-white">Edit service</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5 truncate max-w-xs">
            {service.name}
          </p>
        </div>
      </div>

      <ServiceForm service={service} products={products} />
    </div>
  );
}
