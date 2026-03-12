// ─── Announcement Bar Configuration ──────────────────────────────────────────
//
// Usage:
//   1. Set `enabled: true` to show the bar, `false` to hide it everywhere.
//   2. Set `areas` to control where it appears:
//      - "public"    → Home / Landing page (routes without /dashboard or /chat)
//      - "dashboard" → All dashboard pages (authenticated area)
//      - "chat"      → Chat funnel page
//      Example: ["public", "dashboard"] → shows on home + dashboard, not chat
//   3. Set `style` to control the animation:
//      - "static"  → Centered text, no movement
//      - "marquee" → Scrolling text from right to left (infinite loop)
//   4. Set `theme` to control the background:
//      - "gradient" → Amber-to-orange gradient (eye-catching)
//      - "solid"    → Subtle solid background using accent color
//      - "primary"  → Primary color background
//   5. `messageKey` is an i18n key under the "announcement" namespace.
//      The actual text lives in messages/{en,pt-BR,es}.json → "announcement".
//      Example: messageKey: "newFeature" → reads announcement.newFeature
//   6. Optionally add a `link` with `textKey` (i18n key) + `href`.
//   7. `dismissible` → if true, user can close it (remembered for the session).
//
// i18n setup:
//   Add your messages in each locale file under the "announcement" namespace:
//
//   // messages/en.json
//   "announcement": {
//     "newFeature": "🚀 New: automatic chapter illustrations!",
//     "newFeatureLink": "Learn more →"
//   }
//
//   // messages/pt-BR.json
//   "announcement": {
//     "newFeature": "🚀 Novo: ilustrações automáticas para capítulos!",
//     "newFeatureLink": "Saiba mais →"
//   }
//
// Examples:
//
//   // Simple static announcement on all areas
//   {
//     enabled: true,
//     messageKey: "newFeature",
//     style: "static",
//     areas: ["public", "dashboard", "chat"],
//     theme: "gradient",
//   }
//
//   // Marquee on public pages only, with a link
//   {
//     enabled: true,
//     messageKey: "limitedOffer",
//     style: "marquee",
//     areas: ["public"],
//     theme: "primary",
//     link: { textKey: "limitedOfferLink", href: "/dashboard/wallet/buy-credits" },
//   }
//
//   // Dashboard-only maintenance notice
//   {
//     enabled: true,
//     messageKey: "maintenance",
//     style: "static",
//     areas: ["dashboard"],
//     theme: "solid",
//     dismissible: true,
//   }
//
// ─────────────────────────────────────────────────────────────────────────────

export type AnnouncementArea = "public" | "dashboard" | "chat";
export type AnnouncementStyle = "static" | "marquee";
export type AnnouncementTheme = "gradient" | "solid" | "primary";

export interface AnnouncementConfig {
  enabled: boolean;
  messageKey: string;
  style: AnnouncementStyle;
  areas: AnnouncementArea[];
  theme: AnnouncementTheme;
  link?: { textKey: string; href: string };
  dismissible?: boolean;
}

// ── EDIT THIS to change the announcement ─────────────────────────────────────
export const announcementConfig: AnnouncementConfig = {
  enabled: true,
  messageKey: "kdpEarnings",
  style: "static",
  areas: ["public", "dashboard", "chat"],
  theme: "gradient",
  link: { textKey: "kdpEarningsLink", href: "/dashboard/create" },
  dismissible: true,
};
