import { revalidatePath } from 'next/cache'

// The public `(site)` pages are statically pre-rendered by Next.js and
// served from its Full Route Cache. Without this, a dashboard edit (bank
// details, a new service, a product, etc.) is written to Postgres but the
// storefront keeps serving the old HTML until the next deploy.
//
// Call this after any successful admin write that affects public content.
// It purges every page under the root layout; the next visitor triggers a
// fresh render. The site is small, so per-path precision isn't worth it.
export function revalidateSite(): void {
  try {
    revalidatePath('/', 'layout')
  } catch (err) {
    console.error('[revalidateSite]', err)
  }
}
