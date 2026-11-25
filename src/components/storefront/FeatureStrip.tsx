import { STORE_FEATURES } from "@/lib/site-content";

// Four-up assurance strip: icon + title + caption in soft cards.
export default function FeatureStrip() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {STORE_FEATURES.map(({ title, caption, icon: Icon }) => (
        <div
          key={title}
          className="flex items-center gap-3 sm:gap-4 rounded-2xl border p-4 sm:p-5"
          style={{ borderColor: "var(--border)", background: "var(--bg)" }}
        >
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
            style={{ background: "var(--well)", color: "var(--accent-dark)" }}
          >
            <Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold leading-tight" style={{ color: "var(--text-primary)" }}>{title}</p>
            <p className="mt-0.5 text-xs" style={{ color: "var(--text-secondary)" }}>{caption}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
