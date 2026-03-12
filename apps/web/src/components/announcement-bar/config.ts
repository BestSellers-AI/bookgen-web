// ─── Announcement Bar — Local Fallback Configuration ─────────────────────────
//
// This file is used as a FALLBACK when no remote config exists in the database
// (AppConfig key "ANNOUNCEMENT"). When the admin sets a config via the panel,
// the remote config takes priority over this file.
//
// To manage the announcement from the admin panel:
//   1. Go to Admin → Settings
//   2. Edit the "ANNOUNCEMENT" config key with the JSON structure below
//   3. The bar updates automatically (config is cached for 5 min)
//
// Remote config JSON structure (stored in AppConfig.value):
//   {
//     "enabled": true,
//     "style": "static",              // "static" | "marquee"
//     "areas": ["public","dashboard"], // "public" | "dashboard" | "chat"
//     "theme": "gradient",            // "gradient" | "solid" | "primary"
//     "dismissible": true,
//     "link": { "href": "/dashboard/create" },
//     "messages": {
//       "en":    { "message": "🚀 New feature!", "linkText": "Learn more →" },
//       "pt-BR": { "message": "🚀 Novidade!",   "linkText": "Saiba mais →" },
//       "es":    { "message": "🚀 ¡Novedad!",   "linkText": "Saber más →" }
//     }
//   }
//
// This local fallback is used when:
//   - The DB has no "ANNOUNCEMENT" key yet
//   - The API is unreachable and config-store falls back
//
// To disable the bar entirely when no remote config exists, set enabled: false.
// ─────────────────────────────────────────────────────────────────────────────

export type AnnouncementArea = "public" | "dashboard" | "chat";
export type AnnouncementStyle = "static" | "marquee";
export type AnnouncementTheme = "gradient" | "solid" | "primary";

export interface AnnouncementFallbackConfig {
  enabled: boolean;
  style: AnnouncementStyle;
  areas: AnnouncementArea[];
  theme: AnnouncementTheme;
  dismissible?: boolean;
  link?: { href: string };
  /** Fallback message (not localized — use remote config for i18n) */
  fallbackMessage: string;
  /** Fallback link text */
  fallbackLinkText?: string;
}

// ── LOCAL FALLBACK — used when no remote config exists ───────────────────────
export const announcementConfig: AnnouncementFallbackConfig = {
  enabled: false,
  style: "static",
  areas: ["public", "dashboard"],
  theme: "gradient",
  dismissible: true,
  fallbackMessage: "",
  // link: { href: "/dashboard/create" },
  // fallbackLinkText: "Learn more →",
};
