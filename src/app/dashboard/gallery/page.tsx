import { verifySession, getUserStore } from "@/lib/auth";
import { queryMany } from "@/lib/db";
import GalleryManager from "@/components/dashboard/GalleryManager";
import type { GalleryItem } from "@/types";

export default async function GalleryPage() {
  const user = await verifySession();
  const store = await getUserStore(user!.firebaseUid);

  const items = await queryMany<GalleryItem>(
    `SELECT * FROM gallery_items WHERE store_id = $1 ORDER BY sort_order ASC, created_at DESC`,
    [store!.id]
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 pt-4 lg:pt-0">
      <div>
        <h1 className="text-xl font-bold text-surface-900 dark:text-white">Gallery</h1>
        <p className="text-sm text-surface-500 dark:text-surface-400">
          Photos and videos shown in the filterable work gallery
        </p>
      </div>

      <GalleryManager items={items} />
    </div>
  );
}
