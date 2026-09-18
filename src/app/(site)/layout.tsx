import { getCompany, verifySession, isAdminEmail } from "@/lib/auth";
import { query } from "@/lib/db";
import SiteNav from "@/components/storefront/SiteNav";
import SiteFooter from "@/components/storefront/SiteFooter";
import WhatsAppButton from "@/components/storefront/WhatsAppButton";
import CartProvider from "@/components/storefront/CartProvider";
import SessionSync from "@/components/storefront/SessionSync";
import type { Viewer } from "@/components/storefront/AccountMenu";
import type { Category } from "@/types";

// Public marketing + catalog route group. Every page under `(site)/`
// automatically gets consistent nav/footer/WhatsApp chrome without
// repeating it — this group segment itself does not affect the URL.
//
// Reading the session cookie makes this layout dynamic, which is what we
// want: the header must reflect who is signed in on every request.
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [company, session] = await Promise.all([getCompany(), verifySession()]);
  const categories = company
    ? await query<Category>(
        `SELECT * FROM categories WHERE store_id = $1 AND parent_id IS NULL ORDER BY sort_order, name`,
        [company.id]
      )
    : [];

  const viewer: Viewer | null = session
    ? {
        name: session.displayName || session.email.split("@")[0] || "Account",
        email: session.email,
        isAdmin: isAdminEmail(session.email),
      }
    : null;

  return (
    <CartProvider>
      <div className="storefront flex min-h-screen flex-col">
        <SiteNav company={company} categories={categories} viewer={viewer} />
        <main className="flex-1">{children}</main>
        <SiteFooter company={company} />
        <WhatsAppButton company={company} />
      </div>
      <SessionSync hasSession={!!session} />
    </CartProvider>
  );
}
