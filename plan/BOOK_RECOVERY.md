# Book Abandonment Recovery

**Date:** 2026-03-22
**Branch:** `feat/book-abandonment-recovery`

## Overview

Sends a recovery email to users who started creating a book but didn't complete the generation process. Targets books stuck in `PREVIEW` or `PREVIEW_COMPLETED` status for 24+ hours.

## Which Statuses Trigger Recovery

| Status | What happened | Recovery email | Conflicts? |
|--------|-------------|----------------|------------|
| `PREVIEW` | Preview/outline was generated, user didn't proceed | Yes — "Your book has a structure ready" | No — only in-app notification exists |
| `PREVIEW_COMPLETED` | Full preview ready, user didn't approve generation | Yes — "Your preview is ready, approve it" | No — only in-app notification exists |
| `DRAFT` | Used internally to instantiate, transitions immediately | No — not user-facing | — |
| `ERROR` | Generation failed | No — already receives error email immediately | Would duplicate |
| `GENERATED` | Book complete | No — already receives "book ready" email | — |
| `QUEUED` / `GENERATING` | In progress | No — system still working | — |

## How It Works

### Cron Job

**Schedule:** Daily at 09:00 UTC (`0 9 * * *`)

1. Queries books where:
   - `status` is `PREVIEW` or `PREVIEW_COMPLETED`
   - `recoveryEmailSentAt IS NULL`
   - `deletedAt IS NULL`
   - `updatedAt` is 24+ hours ago
2. Sends localized recovery email (different copy per status)
3. Marks `recoveryEmailSentAt` on the book to prevent duplicates
4. Maximum 100 emails per run
5. Per-item try/catch (one failure doesn't block others)

### Database

New field on Book model:
```prisma
recoveryEmailSentAt DateTime? @map("recovery_email_sent_at")
```

No new models needed. Existing books have `null` (never sent).

## Email Templates

### PREVIEW status

| Locale | Subject |
|--------|---------|
| EN | Your book "{title}" has a structure ready — BestSellers AI |
| PT-BR | Seu livro "{title}" já tem uma estrutura pronta — BestSellers AI |
| ES | Tu libro "{title}" ya tiene una estructura lista — BestSellers AI |

Body: Tells the user their book outline is ready to review, encourages them to come back.

### PREVIEW_COMPLETED status

| Locale | Subject |
|--------|---------|
| EN | Your preview for "{title}" is ready — BestSellers AI |
| PT-BR | A prévia de "{title}" está pronta — BestSellers AI |
| ES | La vista previa de "{title}" está lista — BestSellers AI |

Body: Tells the user the preview is complete and waiting for approval to generate the full book.

### Shared

- **Button:** "Continue My Book" / "Continuar Meu Livro" / "Continuar Mi Libro"
- **Link:** `/dashboard/books/{bookId}` (goes directly to the book)
- **Template:** Same dark layout as all other emails (gold button, logo, footer)

## Existing Emails (No Conflict)

| Event | Email sent | When |
|-------|-----------|------|
| Preview ready | None (only in-app notification) | Immediately |
| Book generated | `bookGeneratedEmail` | Immediately |
| Generation error | `bookErrorEmail` | Immediately |
| Book recovery | `bookRecoveryEmail` | 24h after abandonment (NEW) |

## Files Changed

| File | Change |
|------|--------|
| `prisma/schema.prisma` | `recoveryEmailSentAt` on Book |
| `prisma/migrations/20260322120000_*` | Migration |
| `email/email-translations.ts` | 6 new keys per locale (subject + body for PREVIEW and PREVIEW_COMPLETED, button) |
| `email/email-templates.ts` | `bookRecoveryEmail()` function |
| `cron/cron.service.ts` | `bookAbandonmentRecovery` daily cron job |

## Recovery Flow

```
User creates book → preview generates → status = PREVIEW or PREVIEW_COMPLETED
  ├─ User approves → status changes → QUEUED → GENERATING → GENERATED (no recovery)
  └─ User abandons → 24h passes → cron runs at 09:00 UTC → recovery email sent
       └─ Email links to /dashboard/books/{bookId}
       └─ recoveryEmailSentAt marked → never sent again for this book
```

## What Does NOT Change

- No new admin pages
- No new endpoints
- No changes to the user-facing book flow
- No changes to existing email templates
- Books that already reached GENERATED/ERROR/CANCELLED are never touched
