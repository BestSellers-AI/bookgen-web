# Author Journey — Gamified Publishing Track

## Overview

The Author Journey is a gamified component that replaced the original addon cards on the book detail page. It presents the publishing process as a progression track — a vertical stepper that guides the user from manuscript to published author on Amazon — with aggressive, motivational copy designed to maximize conversion.

**Location in UI**: Book detail page (`/dashboard/books/[id]`), between the book stats and the embedded PDF viewer.

**Component**: `apps/web/src/components/book/author-journey.tsx`

## Design Philosophy

- **Gamification over catalog**: Instead of listing addons as flat cards, the user sees a clear path with progress bar and step completion indicators
- **Aggressive copy**: "You're X steps away from becoming a global bestseller" — not passive, drives urgency
- **Mobile-first**: Collapsible card, bottom sheet for extras, touch-friendly CTAs
- **Visual hierarchy**: Publishing track (core path) is prominent; extras (nice-to-have) are tucked in a bottom sheet

## Component Structure

### Publishing Track (Main Card)

A collapsible card with gradient background and animated glow blobs.

**Header** (always visible, tappable to expand/collapse):
- Rocket icon (pulsing) or Crown icon (if all done)
- Headline: "You're {N} steps away from becoming a global bestseller" or "You're a published author!"
- Progress bar with step count (e.g. 2/4)
- When collapsed: next step hint with Zap icon

**Stepper** (expanded):

4 steps in a vertical stepper with connecting lines:

| # | Step | Addon Kind(s) | Icon | Color |
|---|------|---------------|------|-------|
| 1 | Book Generated | — (always complete) | BookCheck | emerald |
| 2 | Professional Cover | `ADDON_COVER` | Palette | pink |
| 3 | Chapter Illustrations | `ADDON_IMAGES` | ImageIcon | indigo |
| 4 | Publish on Amazon | `ADDON_AMAZON_STANDARD` or `ADDON_AMAZON_PREMIUM` | Package | orange |

Each step shows:
- Status icon: CheckCircle2 (done), Loader2+spin (processing), XCircle (error), or the step icon (available)
- Step name + description
- CTA button (StepCTA) when available/error

The Amazon step shows two options: Standard and Premium (with Crown icon, amber gradient).

**Bundle Card** (below stepper, full width):
- Premium Publishing Bundle (Cover + Images + Amazon Premium) at 15% off
- Separated by "or" divider from individual step CTAs
- See `plan/BUNDLES.md` for details

### Extras (Bottom Sheet)

Triggered by a button at the bottom of the main card: "Boost your book → View options"

Opens a `Sheet` (bottom drawer) containing:

1. **Global Launch Bundle** (at top, if available) — Translation + Cover Translation + Publishing at 50% off
2. "or" divider
3. Individual extras:

| Addon | Icon | Color | Has Language Param |
|-------|------|-------|--------------------|
| Book Translation | Globe | blue | Yes |
| Cover Translation | Globe | cyan | Yes |
| Audiobook | Headphones | emerald | No |

Each extra shows: icon, name, description, and action button (cost / processing badge / retry / view result).

### Request Dialog

Shared `AlertDialog` for individual addon requests:
- Shows addon name, cost, and current balance
- Language selector (for translation addons)
- Insufficient credits warning with link to buy credits
- Confirm button triggers `addonsApi.create()`

### Bundle Dialog

Shared `AlertDialog` for bundle requests:
- Shows bundle-specific title, description, costs
- Confirm button triggers `addonsApi.createBundle()`
- See `plan/BUNDLES.md`

## Step Status Logic

```typescript
type StepStatus = "completed" | "processing" | "available" | "locked" | "error";

function getStepStatus(stepKinds, addons):
  - No kinds (book step) → always "completed"
  - No matching addons → "available"
  - Any addon COMPLETED → "completed"
  - Any addon ERROR → "error"
  - Any addon PENDING/QUEUED/PROCESSING → "processing"
  - Otherwise → "available"
```

Progress bar = `completedSteps / totalSteps * 100`

`nextStep` = first step that is "available" or "error" (used for collapsed hint and CTA highlighting).

## Sub-components

| Component | Purpose |
|-----------|---------|
| `StepCTA` | Eye-catching button for publishing steps. Gradient bg, shimmer animation, arrow icon. Premium variant has amber/orange gradient + Crown icon. |
| `BundleCard` | Reusable bundle card with shake animation, shimmer, badges, crossed-out price. Accepts `BundleConfig`. |
| `ExtraAddonAction` | Compact action button for extras sheet (cost / processing / retry / view result). |
| `CheckBadge` | Small emerald checkmark circle for completed steps. |

## CSS Animations

Defined in `apps/web/src/app/globals.css` (Tailwind v4 CSS variables):

| Animation | CSS Variable | Duration | Usage |
|-----------|-------------|----------|-------|
| Shimmer | `--animate-shimmer` | 3s infinite | Gradient sweep on CTA buttons and bundle cards |
| Shake | `--animate-shake` | 0.6s | Bundle card periodic shake (4s interval) + hover |
| Pulse | native `animate-pulse` | — | Glow blobs, processing indicators, rocket icon |

**Important**: Tailwind v4 requires animations registered via `--animate-*` CSS variables + `@keyframes` in `globals.css`. The `tailwind.config.ts` `keyframes`/`animation` config alone does NOT work.

## Data Flow

1. Component receives `book: BookDetail` (includes `book.addons`)
2. On mount: fetches fresh addons via `addonsApi.list()` + wallet balance via `walletApi.get()`
3. Computes step statuses from addon data
4. On addon request: calls API → shows toast → refetches addons + wallet → calls `onRefetch()` to update parent

## i18n

Namespace: `authorJourney` in `messages/{en,pt-BR,es}.json`

Key categories:
- `headline` / `headlineComplete` — main title with ICU plural
- `step_*` / `stepDesc_*` — step names and descriptions (4 each)
- `amazonStandard` / `amazonPremium` — Amazon option labels
- `bundle*` — bundle-specific keys (see `plan/BUNDLES.md`)
- `extrasTitle` / `extrasSubtitle` / `viewExtras` — extras section
- `nextAction` / `done` — misc

Addon-specific keys use the `addons` namespace (shared with original addon system):
- `kind_*` / `kindDesc_*` — addon names and descriptions
- `request`, `processing`, `done`, `retry`, `viewResult` — action labels
- `requestConfirm`, `confirmRequest` — dialog copy
- `requestSuccess`, `requestError`, `insufficientCredits` — toasts
- `notEnoughCredits`, `buyCredits`, `selectLanguage` — dialog extras

## Props

```typescript
interface AuthorJourneyProps {
  book: BookDetail;    // Book data with addons array
  onRefetch: () => void; // Callback to refresh parent book data
}
```

## File Dependencies

| File | Role |
|------|------|
| `components/book/author-journey.tsx` | Main component |
| `lib/api/addons.ts` | `addonsApi.create()`, `addonsApi.createBundle()` |
| `lib/api/wallet.ts` | `walletApi.get()` for balance |
| `stores/wallet-store.ts` | `fetchWallet()` to sync global wallet state |
| `@bestsellers/shared` | `ProductKind`, `AddonStatus`, `CREDITS_COST`, `BUNDLE_*`, `BundleConfig` |
| `components/ui/*` | Button, Badge, Progress, Sheet, AlertDialog, Select |
| `globals.css` | shimmer + shake keyframes |

## Previously: AddonSection

The Author Journey replaced the original `AddonSection` component which rendered individual addon cards in a flat grid. The old component (`components/book/addon-section.tsx`) may still exist in the codebase but is no longer imported. The book viewer (`components/book/book-viewer.tsx`) now imports `AuthorJourney` instead.
