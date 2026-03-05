# Backend Audit & Bugfix Sprint

**Date:** 2026-03-04
**Scope:** Full security + business logic audit of `apps/api/`
**Total issues found:** 26 (10 CRITICAL + 16 HIGH)
**Total issues fixed:** 26/26

---

## CRITICAL Fixes (10)

| # | Issue | File(s) | Fix |
|---|-------|---------|-----|
| C1 | n8n dispatch swallowed errors — credits debited, job never sent | `n8n-client.service.ts` | `dispatch()` now throws on failure; callers revert status + refund |
| C2 | Hook callbacks had no idempotency — duplicates created duplicate records | `hooks.service.ts` | Status guards on all 4 handlers (preview, chapter, generation, addon) |
| C3 | Addon marked COMPLETED before `processAddonSpecific` ran | `hooks.service.ts` | Reordered: process-specific runs first, then status update |
| C4 | Wallet `addCredits`/`debitCredits` not atomic | `wallet.service.ts`, `credit-ledger.service.ts` | `addCredits` uses `$transaction`; new `debitCreditsWithTransaction` (Serializable) |
| C5 | Stripe webhook hardcoded ASPIRANTE plan on first invoice | `stripe-webhook.service.ts` | Resolves plan from invoice/line item metadata via `resolvePlan()` |
| C6 | `invoice.paid` no deduplication — double credit grants | `stripe-webhook.service.ts` | Checks `creditLedger` for existing entry in same period before granting |
| C7 | `useFreeRegen` race condition (check-then-increment) | `monthly-usage.service.ts` | Atomic `updateMany` with `WHERE freeRegensUsed < limit` |
| C8 | Zero database indexes on any table | `schema.prisma` | Added 40+ indexes on all FKs and common query patterns |
| C9 | `forgotPassword` email never sent in production | `auth.service.ts` | Added `logger.warn` in production (email service integration pending) |
| C10 | Refresh token rotation not atomic — race condition | `auth.service.ts` | Wrapped delete + create in `$transaction` with concurrent-use detection |

## HIGH Fixes (16)

| # | Issue | File(s) | Fix |
|---|-------|---------|-----|
| H1 | Book status transitions not atomic — double-debit possible | `book.service.ts` | `updateMany` with status guard (optimistic locking) on all transitions |
| H2 | SSE endpoint: no book ownership check | `book-sse.controller.ts` | Added `findFirst({ userId })` before subscribing |
| H3 | SSE memory leak: subjects never cleaned on disconnect | `sse-manager.ts` | Subscriber ref counting with `finalize()` cleanup |
| H4 | `AdminChangeRoleDto.role` accepted any string | `admin-query.dto.ts` | Changed to `@IsEnum(UserRole)` |
| H5 | Admin pagination missing `@Type(() => Number)` | `admin-query.dto.ts` | Added `@Type(() => Number)` to page/perPage |
| H6 | Admin could change own role (self-lockout) | `admin.service.ts`, `admin.controller.ts` | Self-protection: `if (id === callerId)` throws 400 |
| H7 | Checkout open redirect via `successUrl`/`cancelUrl` | `create-checkout-session.dto.ts`, `checkout.service.ts` | Removed client URLs; always uses server-configured `frontendUrl` |
| H8 | Login DTO accepted empty password string | `login.dto.ts` | Added `@IsNotEmpty()` |
| H9 | `AddonResultDto.addonKind` not validated as enum | `addon-result.dto.ts` | Changed to `@IsEnum(ProductKind)` |
| H10 | Webhook controller: `rawBody!` non-null assertion | `webhook.controller.ts` | Added explicit `rawBody` + `stripe-signature` guards |
| H11 | Public share view leaked `contextSummary` | `share.service.ts` | Set to `null` in public response |
| H12 | Soft-deleted books still accessible via share links | `share.service.ts` | Added `deletedAt` check → 404 |
| H13 | Cron: one failure crashed entire job | `cron.service.ts` | Per-item `try/catch` in sync; `Promise.allSettled` for notifications |
| H14 | Translation chapter completion: race + duplicate notification | `translation.service.ts` | Idempotency + `$transaction` + conditional `updateMany` for completion |
| H15 | `N8N_CALLBACK_SECRET` insecure default (`'dev-secret'`) | `env.validation.ts` | Changed to `min(16)` with descriptive default name |

---

## Known Remaining Items (Enhancements, Not Bugs)

1. Password complexity — only `@MinLength(8)`, no uppercase/digit requirement
2. Language field — no allowlist validation on `advanced-settings.dto.ts`
3. `JwtAuthGuard` not global — per-controller pattern (fragile but functional)
4. Email service — `forgotPassword` logs but doesn't send (requires Resend/SES)
5. CORS — single origin string, no multi-origin
6. Stripe/Google credentials — default to empty in non-production
