# Credit System Audit — March 2026

## Overview

The credit system uses a **FIFO ledger** (CreditLedger) as the source of truth, with a cached balance on the Wallet model. Credits are typed (SUBSCRIPTION, PURCHASE, BONUS, REFUND) and may have an optional expiration date.

**Result: Fully implemented and working correctly.**

## Architecture

```
CreditLedger (source of truth)
  ├── Each entry: amount, remaining, type, expiresAt, source, sourceId
  ├── FIFO consumption: expiring soonest → non-expiring last
  └── Serializable isolation for debits (no race conditions)

Wallet (cached balance)
  ├── balance = SUM(remaining) WHERE remaining > 0 AND (expiresAt IS NULL OR expiresAt > NOW())
  └── Synced after every credit/debit/expiration operation

WalletTransaction (audit log)
  └── Records every balance change with type, amount, description
```

## Credit Types & Expiration

| Type | Source | Expires? | Expiration Rule | Removed on Cancel? |
|------|--------|----------|-----------------|-------------------|
| **SUBSCRIPTION** | Invoice paid (monthly) | YES | Period end + `creditAccumulationMonths` | YES (immediately) |
| **PURCHASE** | Credit pack checkout | NO | Never (`expiresAt = null`) | NO |
| **BONUS** | Admin/promo | Configurable | Per-grant | NO |
| **REFUND** | Addon failure/cancel | NO | Never | NO |

## Subscription Credit Expiration by Plan

| Plan | Credits/Month | creditAccumulationMonths | Expiration Example (Period ends Mar 31) |
|------|--------------|--------------------------|----------------------------------------|
| **Aspirante** | 300 | 0 | March 31 (no carryover) |
| **Profissional** | 750 | 1 | April 30 (1 month grace) |
| **BestSeller** | 2000 | 3 | June 30 (3 months grace) |

**`creditAccumulationMonths`** = grace period after the billing period ends. Controls how long subscription credits remain available before auto-expiring.

- **Aspirante (0):** Strict monthly budget — use it or lose it
- **Profissional (1):** One month carryover — smooths variable usage across 2 months
- **BestSeller (3):** Maximum flexibility — credits from up to 3 billing cycles can coexist

## Monthly Lifecycle (Example: Profissional)

```
March 1    — Invoice paid
             CreditLedger: +750 credits, expiresAt = April 30
             Wallet balance: 750

March 1-31 — User spends 300 credits
             CreditLedger: remaining = 450
             Wallet balance: 450

April 1    — New invoice paid
             CreditLedger: +750 new credits, expiresAt = May 31
             Wallet balance: 450 (March) + 750 (April) = 1200

April 24   — Cron 06:00 UTC: creditsExpiringWarning
             Finds 450 credits expiring April 30 (within 7 days)
             Email: "450 credits expiring on April 30"

May 1      — Cron 00:00 UTC: expireCredits
             March credits (450 remaining) → remaining set to 0
             Wallet balance synced: 750 (April only)
             Notification: "Credits expired"
```

## FIFO Debit Logic

Credits are consumed in this order:
1. **Expiring soonest** (`expiresAt ASC`)
2. **Oldest first** within same expiry (`createdAt ASC`)
3. **Never-expiring last** (`expiresAt NULL` = nulls last)

This ensures subscription credits (which expire) are used before purchased credits (which don't).

**Implementation details:**
- Transaction isolation: `Serializable` (prevents concurrent double-spend)
- Pessimistic locking: `SELECT ... FOR UPDATE` on wallet row
- Expired entries excluded: `expiresAt IS NULL OR expiresAt > NOW()`
- Balance always synced from ledger after every operation

## Credit Granting

### Subscription Credits (via `invoice.paid` webhook)

```
Stripe invoice.paid → stripe-webhook.service.ts
  → Deduplication check: CreditLedger WHERE source='invoice' AND sourceId=invoiceId
  → walletService.addCredits(userId, monthlyCredits, SUBSCRIPTION, {
      expiresAt: periodEnd + creditAccumulationMonths,
      source: 'invoice',
      sourceId: invoiceId,
    })
  → Notification + Email sent
```

**Deduplication:** Even if webhook fires multiple times, same `invoiceId` prevents duplicate grants.

**Expiration calculation:** Safe month addition with day clamping (handles Feb 28/29, months with 30/31 days).

### Purchased Credits (via `checkout.session.completed` webhook)

```
Stripe checkout.session.completed → stripe-webhook.service.ts
  → walletService.addCredits(userId, packCredits, PURCHASE, {
      source: 'purchase',
      sourceId: purchaseId,
      // NO expiresAt → null → never expires
    })
  → Notification + Email sent
```

### Refund Credits (via addon error in hooks.service.ts)

```
Addon fails → hooks.service.ts processAddonResult()
  → walletService.addCredits(userId, addonCreditsCost, REFUND, {
      description: 'Refund: addon failed',
      // NO expiresAt → null → never expires
    })
  → Email sent with balance
```

## Expiration Mechanisms

### 1. Daily Cron — Expire Past-Due Credits

- **Schedule:** Daily at 00:00 UTC
- **Query:** `CreditLedger WHERE remaining > 0 AND expiresAt <= NOW()`
- **Action:** Set `remaining = 0`, sync wallet balance
- **Notification:** In-app "Credits expired"

### 2. Daily Cron — Pre-Expiration Warning Email

- **Schedule:** Daily at 06:00 UTC
- **Query:** `CreditLedger WHERE remaining > 0 AND expiresAt BETWEEN NOW() AND NOW()+7days`
- **Action:** Group by wallet, email user with total + earliest expiry date
- **Localized:** Subject + body in user's locale

### 3. Subscription Cancellation — Immediate Expiration

- **Trigger:** Stripe `customer.subscription.deleted` webhook
- **Query:** `CreditLedger WHERE walletId AND remaining > 0 AND type = SUBSCRIPTION`
- **Action:** Set `remaining = 0` for ALL subscription credits, sync balance
- **Does NOT affect:** PURCHASE, BONUS, REFUND credits
- **Notification:** "Subscription cancelled. X unused subscription credits have expired."

### 4. Implicit Expiration — Debit Query Filter

Even without the cron, expired credits are never consumed because the debit query excludes them:
```sql
WHERE remaining > 0 AND (expires_at IS NULL OR expires_at > NOW())
```

The cron just cleans up the `remaining` field for accuracy.

## Wallet Balance

`Wallet.balance` is a **cached value**, always recalculated from the ledger:

```sql
SELECT COALESCE(SUM(remaining), 0)
FROM credit_ledger
WHERE wallet_id = ? AND remaining > 0
  AND (expires_at IS NULL OR expires_at > NOW())
```

**Synced after:** every addCredits, debitCredits, expireCredits, and via daily cron (syncWalletBalances at 03:00 UTC).

## Key Files

| File | Purpose |
|------|---------|
| `apps/api/prisma/schema.prisma` | CreditLedger, Wallet, WalletTransaction models |
| `apps/api/src/wallet/credit-ledger.service.ts` | FIFO debit, addCredits, expireCredits, syncBalance |
| `apps/api/src/wallet/wallet.service.ts` | High-level addCredits/debitCredits with WalletTransaction |
| `apps/api/src/webhooks/stripe-webhook.service.ts` | Subscription + pack credit granting |
| `apps/api/src/cron/cron.service.ts` | Daily expiration + warning + balance sync |
| `packages/shared/src/constants.ts` | Plan configs (monthlyCredits, creditAccumulationMonths) |

## Known Limitations

1. **Expired ledger entries accumulate** — entries with `remaining=0` stay forever. Could add periodic cleanup (archive after 90 days).

2. **No email on cancellation credit expiration** — only in-app notification when subscription is deleted and credits expire. Could add email trigger.

3. **`creditAccumulationMonths` naming** — actually means "grace period after period end", not "accumulation across months". Consider renaming to `creditGracePeriodMonths`.

4. **No maximum credit cap** — BestSeller with 3-month grace could accumulate up to 6000 credits. No enforcement of a ceiling.

5. **Pre-expiration email fires daily** — users within the 7-day window get the same email every day. Could add deduplication (track last warning sent).
