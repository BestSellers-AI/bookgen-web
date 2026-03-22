# Book Abandonment Recovery — 3-Email Sequence

**Date:** 2026-03-22
**Branch:** `feat/book-abandonment-recovery`

## Overview

Sends a sequence of up to 3 recovery emails to users who started creating a book but didn't complete the generation process. Targets books stuck in `PREVIEW` or `PREVIEW_COMPLETED` status with escalating urgency.

## Email Sequence

| # | When | Tone | Subject (PT-BR) | Button |
|---|------|------|-----------------|--------|
| 1 | 24h after abandonment | Gentle reminder | "Seu livro está esperando por você" | Continuar Meu Livro |
| 2 | 3 days after abandonment | Light urgency | "Não desista de {title}" | Finalizar Meu Livro |
| 3 | 7 days after abandonment | Last chance | "Último lembrete: {title} precisa da sua atenção" | Gerar Meu Livro Agora |

After email 3, no more emails are sent for that book.

## Which Statuses Trigger Recovery

| Status | What happened | Recovery? | Conflicts with existing emails? |
|--------|-------------|-----------|--------------------------------|
| `PREVIEW` | Preview/outline generated, user didn't proceed | Yes | No — only in-app notification |
| `PREVIEW_COMPLETED` | Full preview ready, user didn't approve | Yes | No — only in-app notification |
| `DRAFT` | Internal state, transitions immediately | No | — |
| `ERROR` | Generation failed | No | Yes — `bookErrorEmail` already sent |
| `GENERATED` | Complete | No | Yes — `bookGeneratedEmail` already sent |
| `QUEUED` / `GENERATING` | In progress | No | — |

## Database Fields

On the Book model:
```prisma
recoveryEmailsSent     Int       @default(0)  // 0, 1, 2, or 3
lastRecoveryEmailAt    DateTime?              // when last recovery email was sent
```

## How It Works

### Cron Job

**Schedule:** Daily at 09:00 UTC (`0 9 * * *`)

**Sequence logic:**

| Email # | Condition | Time check |
|---------|-----------|------------|
| 1 | `recoveryEmailsSent = 0` | `updatedAt` ≤ 24h ago |
| 2 | `recoveryEmailsSent = 1` | `lastRecoveryEmailAt` ≤ 2 days ago |
| 3 | `recoveryEmailsSent = 2` | `lastRecoveryEmailAt` ≤ 2 days ago |

**Why `updatedAt` for email 1:** It's the best proxy for "when the book entered this status". If the user comes back and modifies the book, `updatedAt` resets — which is correct because the book isn't abandoned anymore.

**Why `lastRecoveryEmailAt` for emails 2-3:** The interval between emails should be consistent (minimum 2 days), regardless of when the book was created.

**Safety:**
- Only books in `PREVIEW` or `PREVIEW_COMPLETED` (not deleted)
- Max 50 books per sequence step per run
- Per-book try/catch (one failure doesn't block others)
- `recoveryEmailsSent >= 3` → never sends again

## Email Content (All 3 Locales)

### Email 1 — Gentle Reminder

| Locale | Subject |
|--------|---------|
| EN | Your book "{title}" is waiting for you |
| PT-BR | Seu livro "{title}" está esperando por você |
| ES | Tu libro "{title}" te está esperando |

### Email 2 — Light Urgency

| Locale | Subject |
|--------|---------|
| EN | Don't give up on "{title}" |
| PT-BR | Não desista de "{title}" |
| ES | No te rindas con "{title}" |

### Email 3 — Last Reminder

| Locale | Subject |
|--------|---------|
| EN | Last reminder: "{title}" needs your attention |
| PT-BR | Último lembrete: "{title}" precisa da sua atenção |
| ES | Último recordatorio: "{title}" necesita tu atención |

All emails use the same dark template (gold button, logo, footer). Button links directly to `/dashboard/books/{bookId}`.

## Files Changed

| File | Change |
|------|--------|
| `prisma/schema.prisma` | `recoveryEmailsSent` (Int) + `lastRecoveryEmailAt` (DateTime?) on Book |
| `prisma/migrations/20260322120000_*` | Migration |
| `email/email-translations.ts` | 9 keys per locale (subject + body + button × 3 emails) |
| `email/email-templates.ts` | `bookRecoveryEmail()` with `sequenceNumber` param |
| `cron/cron.service.ts` | `bookAbandonmentRecovery` daily cron with 3-step loop |

## Recovery Flow

```
User creates book → preview generates → status = PREVIEW or PREVIEW_COMPLETED
  ├─ User approves → status changes → no recovery emails
  └─ User abandons:
       ├─ 24h later → Email 1: "Your book is waiting" (recoveryEmailsSent = 1)
       ├─ 3 days later → Email 2: "Don't give up" (recoveryEmailsSent = 2)
       ├─ 7 days later → Email 3: "Last reminder" (recoveryEmailsSent = 3)
       └─ After email 3 → no more emails for this book
```

If the user comes back and modifies the book at any point, `updatedAt` resets — delaying email 1. If they approve/generate, the status changes and the book exits the recovery pool entirely.

## What Does NOT Change

- No new admin pages or endpoints
- No changes to the user-facing book flow
- No changes to existing email templates (bookGeneratedEmail, bookErrorEmail)
- No impact on books already in GENERATED/ERROR/CANCELLED status
