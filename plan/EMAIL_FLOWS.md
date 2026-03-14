# Email Flows

All transactional emails are sent via **Resend** (`EmailService`). If `RESEND_API_KEY` is not configured, emails are silently skipped with a debug log.

Templates live in `apps/api/src/email/email-templates.ts` with translations in `email-translations.ts` (EN, PT-BR, ES). All share a common `baseLayout` (dark header + footer).

---

## 1. Welcome

| | |
|---|---|
| **Template** | `welcomeEmail` |
| **Subject** | "Welcome to BestSellers AI!" |
| **Trigger** | Normal registration via `/auth/register` (no `source` flag) |
| **Content** | Greeting + welcome message + "Go to Dashboard" button |
| **Called from** | `AuthService.register()` |

---

## 2. Welcome + Set Password

| | |
|---|---|
| **Template** | `welcomeSetPasswordEmail` |
| **Subject** | "Welcome to BestSellers AI — Set your password" |
| **Trigger** | Account auto-created with random password (chat funnel or Stripe guest checkout) |
| **Content** | Greeting + "Your account has been created, set your password" + button linking to `/auth/reset-password?token=...` (1h expiry) |
| **Called from** | `AuthService.sendWelcomeSetPasswordEmail()` |

### When it fires

- **Chat funnel** (`/chat`): Frontend passes `source: 'chat'` in the register call. `AuthService.register()` detects the source, generates a password reset token, and sends this email instead of the plain welcome.
- **Stripe guest checkout**: `StripeWebhookService.handleCheckoutSessionCompleted()` auto-creates a user when no account exists for the guest email. After creation, calls `AuthService.sendWelcomeSetPasswordEmail()`.

### Why it exists

Both flows generate a random 16-char password (`crypto.randomUUID().slice(0, 16)`) that is never shown to the user. Without this email, the user would need to go through "Forgot Password" to ever log in again. This email proactively gives them a link to set their own password.

### Password reset token

Reuses the same `generatePasswordResetUrl()` mechanism as "Forgot Password":
- Generates a 32-byte random token
- Stores SHA-256 hash in `VerificationToken` table (1h expiry)
- Links to `/auth/reset-password?token=<raw>` — same page used for forgot-password resets

---

## 3. Password Reset

| | |
|---|---|
| **Template** | `passwordResetEmail` |
| **Subject** | "Reset your password — BestSellers AI" |
| **Trigger** | User submits email to `POST /auth/forgot-password` |
| **Content** | "We received a request to reset your password" + reset button (1h expiry) + "ignore if you didn't request" |
| **Called from** | `AuthService.forgotPassword()` |

Always returns 200 regardless of whether email exists (prevents enumeration).

---

## 4. Book Generated

| | |
|---|---|
| **Template** | `bookGeneratedEmail` |
| **Subject** | `Your book "{title}" is ready! — BestSellers AI` |
| **Trigger** | Book generation completes successfully |
| **Content** | "Your book has been fully generated and is ready for review" + "View Your Book" button |
| **Called from** | Generation pipeline (on completion) |

---

## Key Files

| File | Purpose |
|------|---------|
| `apps/api/src/email/email.service.ts` | Resend API client, `send()` method |
| `apps/api/src/email/email.module.ts` | NestJS module (exports `EmailService`) |
| `apps/api/src/email/email-templates.ts` | All 4 HTML email templates |
| `apps/api/src/email/email-translations.ts` | i18n strings for all templates (EN, PT-BR, ES) |
| `apps/api/src/auth/auth.service.ts` | `register()`, `forgotPassword()`, `sendWelcomeSetPasswordEmail()`, `generatePasswordResetUrl()` |
| `apps/api/src/webhooks/stripe-webhook.service.ts` | Guest checkout auto-create → set-password email |

## RegisterDto `source` Field

The `RegisterDto` accepts an optional `source` field (`'chat' | 'guest'`) that controls which welcome email is sent:

| `source` | Email sent |
|----------|-----------|
| _(not set)_ | Welcome |
| `'chat'` | Welcome + Set Password |
| `'guest'` | Welcome + Set Password |
