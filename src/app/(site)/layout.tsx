import { getCompany } from "@/lib/auth";
import SiteNav from "@/components/storefront/SiteNav";
import SiteFooter from "@/components/storefront/SiteFooter";
import WhatsAppButton from "@/components/storefront/WhatsAppButton";
import CartProvider from "@/components/storefront/CartProvider";

// Public marketing + catalog route group. Every page under `(site)/`
// automatically gets consistent nav/footer/WhatsApp chrome without
// repeating it — this group segment itself does not affect the URL.
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const company = await getCompany();

  return (
    <CartProvider>
      <div className="storefront flex min-h-screen flex-col">
        <SiteNav company={company} />
        <main className="flex-1">{children}</main>
        <SiteFooter company={company} />
        <WhatsAppButton company={company} />
      </div>
    </CartProvider>
  );
}
