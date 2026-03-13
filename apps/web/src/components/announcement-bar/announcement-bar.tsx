"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { useConfigStore } from "@/stores/config-store";
import { announcementConfig } from "./config";
import type { AnnouncementArea } from "./config";

// ── Usage ────────────────────────────────────────────────────────────────────
//
// Place once in the locale layout ([locale]/layout.tsx):
//
//   import { AnnouncementBar } from "@/components/announcement-bar/announcement-bar";
//
//   // Inside the layout JSX, before {children}:
//   <AnnouncementBar />
//
// The component reads config from two sources (in priority order):
//   1. Remote: AppConfig key "ANNOUNCEMENT" via config-store (set in admin panel)
//   2. Fallback: static config from ./config.ts (for when DB has no entry)
//
// Remote config is a JSON with messages per locale:
//   {
//     "enabled": true, "style": "static", "areas": ["public","dashboard"],
//     "theme": "gradient", "dismissible": true,
//     "link": { "href": "/dashboard/create" },
//     "messages": {
//       "en":    { "message": "...", "linkText": "..." },
//       "pt-BR": { "message": "...", "linkText": "..." },
//       "es":    { "message": "...", "linkText": "..." }
//     }
//   }
//
// It auto-detects the current area from the pathname:
//   /dashboard/* → "dashboard"
//   /chat/*      → "chat"
//   everything else → "public"
//
// It sets a CSS variable `--announcement-h` on <html> matching the bar's
// actual height, so fixed elements can offset via top: var(--announcement-h, 0px).
//
// Configuration: see ./config.ts for local fallback, or manage via admin panel.
// ─────────────────────────────────────────────────────────────────────────────

const themeClasses = {
  gradient: "bg-gradient-to-r from-amber-500 to-orange-500 text-white",
  solid: "bg-muted text-accent-foreground border-b border-border backdrop-blur-sm",
  primary: "bg-primary text-primary-foreground",
} as const;

function detectArea(pathname: string): AnnouncementArea {
  if (pathname.startsWith("/dashboard")) return "dashboard";
  if (pathname.startsWith("/chat")) return "chat";
  return "public";
}

export function AnnouncementBar() {
  const [dismissed, setDismissed] = useState(false);
  const [barHeight, setBarHeight] = useState(0);
  const barRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const locale = useLocale() as "en" | "pt-BR" | "es";
  const remoteConfig = useConfigStore((s) => s.getAnnouncement());

  // Resolve config: remote (admin) takes priority, then static fallback
  const config = remoteConfig ?? null;
  const fallback = announcementConfig;

  const enabled = config?.enabled ?? fallback.enabled;
  const style = config?.style ?? fallback.style;
  const areas = config?.areas ?? fallback.areas;
  const theme = config?.theme ?? fallback.theme;
  const dismissible = config?.dismissible ?? fallback.dismissible ?? false;
  const linkHref = config?.link?.href ?? (fallback.link ? fallback.link.href : undefined);

  // Resolve localized messages
  const message = config?.messages?.[locale]?.message
    ?? config?.messages?.en?.message
    ?? fallback.fallbackMessage ?? "";
  const linkText = config?.messages?.[locale]?.linkText
    ?? config?.messages?.en?.linkText
    ?? fallback.fallbackLinkText;

  const area = detectArea(pathname);
  const visible = enabled && areas.includes(area) && !dismissed && message.length > 0;

  // Measure the bar's actual height and sync to CSS variable
  const syncHeight = useCallback(() => {
    const h = barRef.current?.offsetHeight ?? 0;
    setBarHeight(h);
    document.documentElement.style.setProperty("--announcement-h", `${h}px`);
  }, []);

  useEffect(() => {
    if (!visible) {
      document.documentElement.style.setProperty("--announcement-h", "0px");
      return;
    }
    syncHeight();
    window.addEventListener("resize", syncHeight);
    return () => {
      window.removeEventListener("resize", syncHeight);
      document.documentElement.style.setProperty("--announcement-h", "0px");
    };
  }, [visible, syncHeight]);

  if (!visible) return null;

  const isMarquee = style === "marquee";

  return (
    <>
      {/* Fixed bar at the very top — height adapts to content */}
      <div
        ref={barRef}
        className={`fixed top-0 left-0 right-0 z-50 text-sm font-medium overflow-hidden ${themeClasses[theme]}`}
      >
        {isMarquee ? (
          <div className="overflow-hidden py-2">
            <div className="flex whitespace-nowrap animate-marquee w-max">
              {[0, 1].map((i) => (
                <span key={i} className="inline-flex min-w-[100vw] items-center justify-around gap-4 px-8">
                  {[0, 1, 2].map((j) => (
                    <span key={j} className="inline-flex items-center gap-2">
                      <span>{message}</span>
                      {linkHref && linkText && (
                        <Link
                          href={linkHref}
                          className="underline underline-offset-2 font-bold hover:opacity-80 transition-opacity"
                        >
                          {linkText}
                        </Link>
                      )}
                    </span>
                  ))}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-2 px-8 text-center">
            <span className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5">
              <span>{message}</span>
              {linkHref && linkText && (
                <Link
                  href={linkHref}
                  className="underline underline-offset-2 font-bold hover:opacity-80 transition-opacity whitespace-nowrap"
                >
                  {linkText}
                </Link>
              )}
            </span>
          </div>
        )}

        {dismissible && (
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-black/10 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Spacer to push content below the fixed bar */}
      <div style={{ height: barHeight }} />
    </>
  );
}
