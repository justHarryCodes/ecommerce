// Static marketing copy shared across the public site (home + about pages).
// Not DB-backed — edit here directly until/unless these move into the CMS.
import type { LucideIcon } from "lucide-react";
import {
  ClipboardList,
  Search,
  PenTool,
  Factory,
  HardHat,
  BadgeCheck,
  LifeBuoy,
  Gem,
  Sparkles,
  Users,
  Clock,
  Wrench,
  ShieldCheck,
  Ruler,
  Hammer,
  Sofa,
  Building2,
  Hotel,
  Home,
  UtensilsCrossed,
  Layers,
  DoorOpen,
  PanelsTopLeft,
  TreePine,
  Armchair,
  Truck,
  Lock,
} from "lucide-react";

export interface ProcessStep {
  title: string;
  description: string;
  icon: LucideIcon;
}

export const PROCESS_STEPS: ProcessStep[] = [
  { title: "Consultation", description: "We start by understanding your needs, space, and budget.", icon: ClipboardList },
  { title: "Site Inspection", description: "Our team visits your site to take measurements and assess requirements.", icon: Search },
  { title: "Design & Quotation", description: "We put together a design concept and a detailed quote.", icon: PenTool },
  { title: "Manufacturing", description: "Your pieces are fabricated in our workshop to spec.", icon: Factory },
  { title: "Installation", description: "Our installation crew delivers and fits everything on site.", icon: HardHat },
  { title: "Quality Inspection", description: "We walk through the finished work with you to confirm every detail.", icon: BadgeCheck },
  { title: "After-Sales Support", description: "Ongoing maintenance and support long after handover.", icon: LifeBuoy },
];

export interface WhyChooseUsItem {
  title: string;
  icon: LucideIcon;
}

export const WHY_CHOOSE_US: WhyChooseUsItem[] = [
  { title: "High-quality materials", icon: Gem },
  { title: "Modern designs", icon: Sparkles },
  { title: "Skilled craftsmen", icon: Users },
  { title: "Timely delivery", icon: Clock },
  { title: "Professional installation", icon: Wrench },
  { title: "Warranty support", icon: ShieldCheck },
];

// ─── Storefront banners & promos ─────────────────────────────────────────────
// Text-only promotional banners (no photos — decorated with icons). Edit the
// copy here; product banners are pulled from the database automatically
// (products flagged Sponsored / Featured in the dashboard).
//
// Keep claims truthful — only promise what the business actually offers.

export type PromoTone = "ink" | "copper" | "sand";

export interface PromoBanner {
  eyebrow: string;
  title: string;
  caption: string;
  cta: { label: string; href: string };
  /** 3–4 icons drawn as decorative art on the banner. */
  icons: LucideIcon[];
  tone: PromoTone;
}

/** Promo slides mixed in between product slides in the homepage hero. */
export const HERO_PROMOS: PromoBanner[] = [
  {
    eyebrow: "Made to measure",
    title: "Built for your space, not off the shelf",
    caption: "Furniture, metalwork and fittings designed to your measurements and finished in our own workshop.",
    cta: { label: "Get a free quote", href: "/contact" },
    icons: [Ruler, Hammer, Sofa, PenTool],
    tone: "ink",
  },
  {
    eyebrow: "Complete fit-outs",
    title: "Homes, offices, hotels & restaurants",
    caption: "One team from consultation and design to fabrication and installation.",
    cta: { label: "See our projects", href: "/projects" },
    icons: [Building2, Hotel, Home, UtensilsCrossed],
    tone: "copper",
  },
];

/** Three promo tiles shown mid-page on the homepage. */
export const PROMO_TILES: PromoBanner[] = [
  {
    eyebrow: "Metalwork",
    title: "Gates, rails & steel furniture",
    caption: "Fabricated to spec, finished to last.",
    cta: { label: "Shop metal", href: "/products?category=metal-products" },
    icons: [Hammer, Factory, Wrench],
    tone: "ink",
  },
  {
    eyebrow: "Aluminium & glass",
    title: "Windows, doors & partitions",
    caption: "Clean lines for modern homes and offices.",
    cta: { label: "Shop aluminium", href: "/products?category=aluminum-glass" },
    icons: [Layers, DoorOpen, PanelsTopLeft],
    tone: "copper",
  },
  {
    eyebrow: "Woodwork",
    title: "Joinery & custom furniture",
    caption: "Wardrobes, kitchens and statement pieces.",
    cta: { label: "Shop wood", href: "/products?category=wood-products" },
    icons: [TreePine, Sofa, Armchair],
    tone: "sand",
  },
];

/** Fallback for the wide spotlight banner when no product qualifies. */
export const SPOTLIGHT_FALLBACK: PromoBanner = {
  eyebrow: "Have a project in mind?",
  title: "Tell us what you need — we'll design and build it",
  caption: "Free, no-obligation quotes for residential and commercial work.",
  cta: { label: "Request a quote", href: "/contact" },
  icons: [ClipboardList, PenTool, Factory, HardHat],
  tone: "ink",
};

/** Thin bar above the header. Keep each line short. */
export const ANNOUNCEMENTS: { text: string; icon: LucideIcon }[] = [
  { text: "Nationwide delivery available", icon: Truck },
  { text: "Free quotes on custom projects", icon: PenTool },
  { text: "Professional installation", icon: Wrench },
];

/** Four-up assurance strip (homepage bottom + product pages). */
export const STORE_FEATURES: { title: string; caption: string; icon: LucideIcon }[] = [
  { title: "Delivery & installation", caption: "We deliver and fit on site", icon: Truck },
  { title: "Made to measure", caption: "Built to your exact specs", icon: Ruler },
  { title: "Warranty support", caption: "Backed after handover", icon: ShieldCheck },
  { title: "Secure payments", caption: "Safe, protected checkout", icon: Lock },
];
