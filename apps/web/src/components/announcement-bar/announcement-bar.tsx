"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { announcementConfig, type AnnouncementArea } from "./config";

// ── Usage ────────────────────────────────────────────────────────────────────
//
// Place once in the locale layout ([locale]/layout.tsx):
//
//   import { AnnouncementBar } from "@/components/announcement-bar/announcement-bar";
//
//   // Inside the layout JSX, before {children}:
//   <AnnouncementBar />
//
// The component auto-detects the current area from the pathname:
//   /dashboard/* → "dashboard"
//   /chat/*      → "chat"
//   everything else → "public" (home, LP, share, auth, etc.)
//
// It sets a CSS variable `--announcement-h` on <html> matching the bar's
// actual height. Use this variable in fixed elements to offset their
// `top` position:
//
//   top: var(--announcement-h, 0px)
//
// Messages are resolved via next-intl using the "announcement" namespace.
// Add your messages in messages/{en,pt-BR,es}.json:
//
//   "announcement": {
//     "newFeature": "🚀 New: automatic chapter illustrations!",
//     "newFeatureLink": "Learn more →"
//   }
//
// Configuration lives in ./config.ts — see that file for all options.
// ─────────────────────────────────────────────────────────────────────────────

const themeClasses = {
  gradient: "bg-gradient-to-r from-amber-500 to-orange-500 text-white",
  solid: "bg-accent text-accent-foreground border-b border-border",
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
  const t = useTranslations("announcement");
  const config = announcementConfig;
  const area = detectArea(pathname);
  const visible = config.enabled && config.areas.includes(area) && !dismissed;

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

  const message = t(config.messageKey);
  const linkText = config.link ? t(config.link.textKey) : null;
  const isMarquee = config.style === "marquee";

  return (
    <>
      {/* Fixed bar at the very top — height adapts to content */}
      <div
        ref={barRef}
        className={`fixed top-0 left-0 right-0 z-50 text-sm font-medium overflow-hidden ${themeClasses[config.theme]}`}
      >
        <div className="flex items-center justify-center py-2 px-8 text-center">
          {isMarquee ? (
            <div className="flex whitespace-nowrap animate-marquee">
              {[0, 1].map((i) => (
                <span key={i} className="inline-flex items-center gap-2 mx-16">
                  <span>{message}</span>
                  {config.link && linkText && (
                    <Link
                      href={config.link.href}
                      className="underline underline-offset-2 font-bold hover:opacity-80 transition-opacity"
                    >
                      {linkText}
                    </Link>
                  )}
                </span>
              ))}
            </div>
          ) : (
            <span className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5">
              <span>{message}</span>
              {config.link && linkText && (
                <Link
                  href={config.link.href}
                  className="underline underline-offset-2 font-bold hover:opacity-80 transition-opacity whitespace-nowrap"
                >
                  {linkText}
                </Link>
              )}
            </span>
          )}
        </div>

        {config.dismissible && (
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
