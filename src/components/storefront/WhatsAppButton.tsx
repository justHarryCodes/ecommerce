import { MessageCircle } from "lucide-react";
import { waLink } from "@/lib/utils";
import type { Store } from "@/types";

interface Props {
  company: Store | null;
}

// Floating bottom-right WhatsApp button — renders only when the company has
// a WhatsApp number configured.
export default function WhatsAppButton({ company }: Props) {
  const whatsapp = company?.whatsapp;
  if (!whatsapp) return null;

  return (
    <a
      href={waLink(whatsapp, "Hi, I'd like to know more about your services.")}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-110 active:scale-95"
      style={{ background: "#25D366" }}
    >
      <MessageCircle className="h-7 w-7 text-white" fill="white" />
    </a>
  );
}
