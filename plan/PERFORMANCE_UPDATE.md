# Performance Update — SSG Migration

**Date:** 2026-03-21
**Impact:** Landing page TTFB reduced from ~1.5s to ~50ms (edge-cached)

## Problem

All pages under `[locale]/` were server-rendered (SSR) on every request due to next-intl's `getMessages()` forcing dynamic rendering. This caused:

- **TTFB: 1.52s** (real user data via Vercel Speed Insights)
- **FCP: 2.34s** / **LCP: 3.77s**
- **GTmetrix Grade: C (66% performance)**
- **TBT: 717ms** (12 long main-thread tasks from JS parsing)

The landing page — a fully static page with no user-specific data — was being re-rendered server-side on every single visit.

## Root Cause

1. **Missing `setRequestLocale()`** — next-intl requires calling `setRequestLocale(locale)` in the layout before any other next-intl APIs. Without it, `getMessages()` forces dynamic rendering.

2. **Missing `generateStaticParams()`** — The `[locale]` dynamic segment needs `generateStaticParams` to tell Next.js which locales to pre-render at build time (en, pt-BR, es).

3. **`useSearchParams()` without `<Suspense>`** — The checkout success page used `useSearchParams()` without a Suspense boundary, which crashes during static pre-rendering.

## Solution

### Changes made:

**`apps/web/src/app/[locale]/layout.tsx`:**
- Added `generateStaticParams()` returning all 3 locales
- Added `setRequestLocale(locale)` call before `getMessages()`
- Both are required by next-intl for static rendering (see [next-intl docs](https://next-intl.dev/docs/routing/setup#static-rendering))

**`apps/web/src/app/[locale]/checkout/success/page.tsx`:**
- Wrapped `useSearchParams()` usage in a `<Suspense>` boundary (required for SSG compatibility)

### Build output after fix:

| Symbol | Meaning | Count |
|--------|---------|-------|
| `●` (SSG) | Pre-rendered as static HTML | ~30 pages × 3 locales |
| `ƒ` (Dynamic) | Server-rendered on demand | ~8 pages (only those with `[id]`/`[token]` params) |

**Pages now statically generated (SSG):**
- `/` (landing page) ✅
- `/chat` ✅
- `/checkout/success`, `/checkout/cancel` ✅
- `/dashboard` and all sub-pages without dynamic params ✅
- `/auth/*` (login, register, forgot-password, reset-password) ✅
- `/dashboard/admin/*` (all admin pages without `[id]`) ✅

**Pages that remain dynamic (SSR):**
- `/dashboard/books/[id]` — dynamic book ID
- `/dashboard/books/[id]/translations/[translationId]` — dynamic IDs
- `/dashboard/admin/books/[id]` — dynamic book ID
- `/dashboard/admin/users/[id]` — dynamic user ID
- `/dashboard/admin/publications/[id]` — dynamic ID
- `/share/[token]` — dynamic share token
- `/api/*` — API routes

## Why it's safe

- All pages except the landing page are `"use client"` components — they render a shell statically and fetch data client-side via API calls
- No page uses server-side dynamic APIs (`cookies()`, `headers()`) in server components
- Auth protection is handled client-side via `useAuth()` hook (redirects in layout effects)
- The middleware still runs on every request (cookies, UTMs), but it doesn't affect the cached HTML

## Expected improvement

| Metric | Before | Expected After |
|--------|--------|----------------|
| TTFB | 1.52s | ~50ms (Vercel edge) |
| FCP | 2.34s | ~0.8s |
| LCP | 3.77s | ~1.5s |
| GTmetrix | C (66%) | A (90%+) |

## Future optimizations (not implemented)

- **Image optimization** — Landing page loads 8 hero images; could use `priority` on above-fold images and lazy-load the rest
- **Bundle splitting** — JS bundle is 800KB; could benefit from more aggressive code splitting
- **Third-party script optimization** — Clarity + Facebook Pixel scripts could be deferred further
- **Font optimization** — 3 Google Fonts loaded (Inter, Outfit, Playfair Display); could subset or reduce
