# Book Upsell — Post-Generation Publishing Offer

**Date:** 2026-03-22
**Branch:** `feat/book-abandonment-recovery`

## Overview

After a book is generated (status `GENERATED`), sends a sequence of up to 3 emails offering Amazon publishing if the user hasn't purchased a publishing addon. Also sends 1 email per translated book (`TRANSLATED` status) without publishing.

## Condition

- **Original book**: `status = GENERATED` AND no `BookAddon` with `kind IN (ADDON_AMAZON_STANDARD, ADDON_AMAZON_PREMIUM)` where `translationId IS NULL`
- **Translation**: `status = TRANSLATED` AND no `BookAddon` with `kind IN (ADDON_AMAZON_STANDARD, ADDON_AMAZON_PREMIUM)` where `translationId = translation.id`

If the user buys a publishing addon between emails, the next email is skipped (checked at send time).

## Email Sequence — Original Book

| # | When | Tom | Subject (PT-BR) | Button |
|---|------|-----|-----------------|--------|
| 1 | 1 day after GENERATED | Informativo | "{title}" está pronto — publique na Amazon! | Ver Opções de Publicação |
| 2 | 3 days after GENERATED | Incentivo | Milhares de autores já publicaram — "{title}" é o próximo | Publicar Meu Livro |
| 3 | 7 days after GENERATED | Último lembrete | Última chance de publicar "{title}" com facilidade | Publicar Agora |

Content mentions: Amazon publishing as main CTA + cover, illustrations, audiobook as extras.

## Email — Translation (1 email)

| When | Subject (PT-BR) | Button |
|------|-----------------|--------|
| 2 days after TRANSLATED | Publique "{title}" em {language} na Amazon | Publicar Tradução |

Content: specific to the translated version, mentions the target language.

## Database Fields

### Book model
```prisma
upsellEmailsSent    Int       @default(0)  // 0, 1, 2, or 3
lastUpsellEmailAt   DateTime?
```

### BookTranslation model
```prisma
upsellEmailsSent    Int       @default(0)  // 0 or 1
lastUpsellEmailAt   DateTime?
```

Separate from `recoveryEmailsSent` / `lastRecoveryEmailAt` — different flows, different counters.

## Cron Job

**Schedule:** Daily at 10:00 UTC (`0 10 * * *`) — 1 hour after book recovery (09:00 UTC)

### Original book logic

| Email # | Condition | Time check |
|---------|-----------|------------|
| 1 | `upsellEmailsSent = 0` + no publishing addon | `generationCompletedAt` ≤ 1 day ago |
| 2 | `upsellEmailsSent = 1` + no publishing addon | `lastUpsellEmailAt` ≤ 2 days ago |
| 3 | `upsellEmailsSent = 2` + no publishing addon | `lastUpsellEmailAt` ≤ 2 days ago |

Uses `generationCompletedAt` for email 1 (exact timestamp of when generation finished).

### Translation logic

| Condition | Time check |
|-----------|------------|
| `upsellEmailsSent = 0` + no publishing addon for this translation | `updatedAt` ≤ 2 days ago |

Only 1 email per translation. Language name resolved via `SUPPORTED_LANGUAGES`.

### Safety

- Publishing addon check at query time (books) and at send time (translations)
- Max 50 books + 50 translations per run
- Per-item try/catch
- `upsellEmailsSent >= 3` (books) or `>= 1` (translations) → never sends again

## No Conflict With Existing Emails

| Existing email | When | Conflict? |
|----------------|------|-----------|
| `bookGeneratedEmail` | Immediately on GENERATED | No — upsell starts 1 day later |
| `bookRecoveryEmail` | For PREVIEW/PREVIEW_COMPLETED only | No — different status |
| `bookErrorEmail` | On ERROR | No — different status |

## Email Content Summary (3 Locales)

### Book upsell subjects

| # | EN | PT-BR | ES |
|---|-----|-------|-----|
| 1 | "{title}" is ready — publish it on Amazon! | "{title}" está pronto — publique na Amazon! | "{title}" está listo — ¡publícalo en Amazon! |
| 2 | Thousands of authors have published — "{title}" is next | Milhares de autores já publicaram — "{title}" é o próximo | Miles de autores ya publicaron — "{title}" es el siguiente |
| 3 | Last chance to publish "{title}" easily | Última chance de publicar "{title}" com facilidade | Última oportunidad de publicar "{title}" fácilmente |

### Translation upsell subject

| EN | PT-BR | ES |
|-----|-------|-----|
| Publish "{title}" in {lang} on Amazon | Publique "{title}" em {lang} na Amazon | Publica "{title}" en {lang} en Amazon |

## Files Changed

| File | Change |
|------|--------|
| `prisma/schema.prisma` | `upsellEmailsSent` + `lastUpsellEmailAt` on Book and BookTranslation |
| `prisma/migrations/20260322130000_*` | Migration |
| `email/email-translations.ts` | 13 keys per locale (3 × subject/body/button for book + 1 × subject/body/button for translation) |
| `email/email-templates.ts` | `bookUpsellEmail()` + `translationUpsellEmail()` |
| `cron/cron.service.ts` | `bookUpsellEmails` daily cron at 10:00 UTC |

## Upsell Flow

```
Book generated → status = GENERATED
  ├─ User buys publishing addon → no upsell emails
  └─ User doesn't buy:
       ├─ 1 day later → Email 1: "Publish on Amazon!" (upsellEmailsSent = 1)
       ├─ 3 days later → Email 2: "Thousands of authors" (upsellEmailsSent = 2)
       ├─ 7 days later → Email 3: "Last chance" (upsellEmailsSent = 3)
       └─ After email 3 → no more emails

Translation completed → status = TRANSLATED
  ├─ User buys publishing addon for translation → no upsell email
  └─ User doesn't buy:
       ├─ 2 days later → Email: "Publish in {language}" (upsellEmailsSent = 1)
       └─ After → no more emails
```
