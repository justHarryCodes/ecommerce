import { ANNOUNCEMENTS } from "@/lib/site-content";

// Thin dark strip above the header. Mobile shows the first line only.
export default function AnnouncementBar() {
  if (ANNOUNCEMENTS.length === 0) return null;
  return (
    <div style={{ background: "var(--ink)", color: "var(--ink-foreground)" }}>
      <div className="max-w-7xl mx-auto flex h-9 items-center justify-center gap-8 px-4 text-xs font-medium">
        {ANNOUNCEMENTS.map(({ text, icon: Icon }, i) => (
          <span key={text} className={`${i > 0 ? "hidden md:flex" : "flex"} items-center gap-2`}>
            <Icon className="h-3.5 w-3.5" style={{ color: "var(--accent-light)" }} aria-hidden="true" />
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}
