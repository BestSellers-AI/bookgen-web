# Publishing Addon (ADDON_AMAZON_STANDARD & ADDON_AMAZON_PREMIUM)

## Overview

The publishing addons provide a **manual publishing workflow** managed by admins. Unlike other addons (covers, images, audiobook, translation), publishing addons are **not automated** — they do not dispatch BullMQ jobs. Instead, they short-circuit in `AddonService` to create a `PublishingRequest` record inline, which admins then manage through the admin panel.

- **ADDON_AMAZON_STANDARD**: Standard Amazon KDP publishing (40 credits)
- **ADDON_AMAZON_PREMIUM**: Premium Amazon KDP publishing (80 credits)
- Works for both original and translated books (via `translationId` param)

---

## Status Flow

### PublishingStatus Enum

```
PREPARING → REVIEW → READY → SUBMITTED → PUBLISHED
                   ↘ REJECTED
                   ↘ CANCELLED
```

### User-Visible Stages

The raw statuses are grouped for user display:

| User Label | Statuses | Meaning |
|-----------|----------|---------|
| Requested | `PREPARING`, `READY` | Request submitted, awaiting admin action |
| In Progress | `REVIEW`, `SUBMITTED` | Admin is reviewing or has submitted to Amazon |
| Completed | `PUBLISHED` | Book is live on Amazon |
| Rejected | `REJECTED` | Admin rejected the request |
| Cancelled | `CANCELLED` | Request was cancelled |

---

## Request Flow

### How It Works

Publishing addons **short-circuit** in `addon.service.ts` — no BullMQ dispatch occurs:

1. User requests addon via `POST /api/books/:bookId/addons` with `kind: ADDON_AMAZON_STANDARD` or `ADDON_AMAZON_PREMIUM`
2. `AddonService.request()`:
   - Validates book ownership + status (GENERATED)
   - Debits credits
   - Creates `BookAddon` record (status: `PENDING`)
   - **Detects publishing kind** -> skips BullMQ dispatch
   - Updates `BookAddon` to `PROCESSING` directly
   - Creates `PublishingRequest` (status: `PREPARING`) with:
     - `bookId`, `addonId`, `userId`
     - `translationId` (if for a translated book)
     - `platform`: `amazon_kdp` or `amazon_kdp_premium`
   - Creates notification for the user
   - Returns immediately

### Bundle Flow

In `requestBundle()`, publishing addons within a bundle are also handled inline:
- Publishing addon records are created with status `PROCESSING` (not `PENDING`)
- `PublishingRequest` + notification created inline
- Non-publishing addons in the same bundle are dispatched to BullMQ as normal

---

## Database

### PublishingRequest Model

```
PublishingRequest (publishing_requests)
├── id (CUID)
├── bookId → Book
├── addonId → BookAddon
├── userId → User
├── translationId? → BookTranslation (nullable)
├── platform: "amazon_kdp" | "amazon_kdp_premium"
├── status: PublishingStatus (default: PREPARING)
├── metadata: Json? (flexible extra data)
├── submittedAt: DateTime?
├── publishedUrl: String? (Amazon product page URL)
├── amazonAsin: String? (Amazon ASIN identifier)
├── kdpUrl: String? (KDP dashboard URL)
├── publishedAt: DateTime?
├── adminNotes: String?
├── error: String?
├── createdAt, updatedAt
```

Indexes: `bookId`, `addonId`, `userId`, `status`

---

## Admin Workflow

### Publishing Module

- `apps/api/src/publishing/publishing.service.ts` — Core service
- `apps/api/src/publishing/publishing.controller.ts` — User + Admin controllers
- `apps/api/src/publishing/publishing.module.ts` — Module registration
- `apps/api/src/publishing/dto/index.ts` — Query/update/complete DTOs

### API Endpoints

#### User Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/books/:bookId/publishing` | List all publishing requests for a book |
| `GET` | `/books/:bookId/publishing/:id` | Get specific publishing request detail |

Both verify book ownership (returns 404 for other users' books).

#### Admin Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/admin/publishing` | Paginated list with filters (status, search by title/email) |
| `GET` | `/admin/publishing/:id` | Full detail with book assets (files, images, chapters, audiobooks, translations) |
| `PATCH` | `/admin/publishing/:id/status` | Update status (creates notification to user) |
| `POST` | `/admin/publishing/:id/complete` | Mark as PUBLISHED with full details |

### Admin List (`GET /admin/publishing`)

- Paginated (`page`, `perPage`)
- Filterable by `status` (PublishingStatus enum)
- Searchable by book title or user email
- Includes related book, user, addon, and translation data

### Admin Detail (`GET /admin/publishing/:id`)

Returns full publishing request with:
- Book (including files, images, chapters, audiobooks, translations) — all assets needed for publishing
- Addon (kind, status, credits cost)
- Translation (if applicable)
- User info

### Status Update (`PATCH /admin/publishing/:id/status`)

- Updates `PublishingRequest.status`
- If status = `PUBLISHED`: also marks parent `BookAddon` as `COMPLETED`
- Creates notification to user with status update

### Complete (`POST /admin/publishing/:id/complete`)

Completes the publishing process:
- Sets status to `PUBLISHED`
- Fills: `publishedUrl`, `amazonAsin`, `kdpUrl`, `adminNotes`, `publishedAt` (auto-set to now)
- Marks parent `BookAddon` as `COMPLETED`
- Creates notification: "Book Published!" with published URL and ASIN

---

## Admin Pages

### Publications List (`/admin/publications`)

- Paginated table of all publishing requests
- Filters: status dropdown, search by title/email
- Columns: book title, author, user, platform, status, created date
- Click row to navigate to detail page

### Publication Detail (`/admin/publications/[id]`)

- Full view of the publishing request
- All book assets available for download (covers, chapter images, audiobooks)
- Status management controls
- Complete form (publishedUrl, amazonAsin, kdpUrl, adminNotes)

---

## Frontend

### Author Journey (`author-journey.tsx`)

- Amazon publishing step shows current publishing status
- Displays editor contact message while in progress
- `PublishingResultSheet`: bottom sheet showing publication details when status is `PUBLISHED` (URL, ASIN, KDP link)
- Publishing status displayed for both original and translated book views

### Mutual Exclusion

When one publishing type (Standard or Premium) has an active request (not cancelled/error), the other type disappears from the addon UI. This prevents users from purchasing both simultaneously.

---

## Credit Usage Report

Admin can view credit usage across the platform:

- **Endpoint**: `GET /admin/credit-usage`
- Supports filters: type, date range, search
- Provides aggregated view of credit spending by addon type

---

## Key Files

| File | Purpose |
|------|---------|
| `apps/api/src/addons/addon.service.ts` | Short-circuit logic for publishing addons (inline PublishingRequest creation) |
| `apps/api/src/publishing/publishing.service.ts` | Publishing CRUD, status updates, completion |
| `apps/api/src/publishing/publishing.controller.ts` | User + Admin REST endpoints |
| `apps/api/src/publishing/publishing.module.ts` | Module registration |
| `apps/api/src/publishing/dto/index.ts` | PublishingQueryDto, UpdatePublishingStatusDto, CompletePublishingDto |
| `apps/api/prisma/schema.prisma` | PublishingRequest model, PublishingStatus enum |
| `apps/api/src/admin/admin.controller.ts` | `GET /admin/credit-usage` endpoint |
| `apps/web/src/app/[locale]/dashboard/admin/publications/page.tsx` | Admin publications list page |
| `apps/web/src/app/[locale]/dashboard/admin/publications/[id]/page.tsx` | Admin publication detail page |
| `apps/web/src/components/book/author-journey.tsx` | Publishing step UI, status display, result sheet |
| `apps/web/messages/{en,pt-BR,es}.json` | Publishing-related i18n keys |
| `apps/api/prisma/migrations/20260317000000_publishing_request_enhancements/` | userId, translationId, amazonAsin, etc. migration |
