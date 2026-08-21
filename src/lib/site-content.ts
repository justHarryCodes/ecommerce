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
