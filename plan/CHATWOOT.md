# Chatwoot Integration

Live chat widget powered by a self-hosted Chatwoot instance at `https://chatwoot.bestsellers.digital`.

## Overview

- Widget appears on **all pages** except `/chat` (chat funnel — would conflict)
- **3 inboxes** — one per locale, same Chatwoot instance
- **Dashboard**: logged-in users are identified via `$chatwoot.setUser()` (id, email, name, avatar)
- **Landing page / auth pages**: anonymous visitors tracked natively by Chatwoot
- Footer "Support" and "Contact" links open the chat widget instead of `mailto:`

## Inbox Tokens

| Locale | Website Token |
|--------|--------------|
| EN | `Jukm3K8TF8cKJTReGM4ZURB9` |
| PT-BR | `CtE9mi1MMCGisE9xpMZFKs3j` |
| ES | `417uNEwsY2QSFzLfUBg6ZV6D` |

The widget automatically loads the correct inbox based on the app locale. When the user switches language, the widget is destroyed and re-initialized with the new token.

## Architecture

```
[locale]/layout.tsx
  └── <ChatwootWidget />          # Rendered globally
        ├── Loads Chatwoot SDK script
        ├── Selects token by locale
        ├── Calls setUser() if logged in
        └── Hides on /chat route
```

### Locale Change Handling

The Chatwoot SDK doesn't support hot-swapping the `websiteToken`. When locale changes:

1. `destroyChatwoot()` cleans up: calls `$chatwoot.reset()`, removes DOM elements (`#chatwoot-sdk`, `#cw-widget-holder`, `#cw-bubble-holder`), deletes globals
2. SDK script is re-injected with the new token
3. User is re-identified via `chatwoot:ready` event

### User Identification

- **Logged in** (dashboard, settings, etc.): `$chatwoot.setUser(userId, { email, name, avatar_url })`
- **Anonymous** (landing, auth pages): no `setUser()` call — Chatwoot assigns a visitor ID internally

### Footer Integration

The landing page footer links "Support" and "Contact" call `window.$chatwoot.toggle('open')` instead of opening a `mailto:` link.

## Key Files

| File | Purpose |
|------|---------|
| `apps/web/src/components/dashboard/chatwoot-widget.tsx` | Widget component + global type declarations |
| `apps/web/src/app/[locale]/layout.tsx` | Mounts `<ChatwootWidget />` globally |
| `apps/web/src/components/landing/Footer.tsx` | Support/Contact links open chat |

## Hidden Routes

Routes where the widget is hidden (defined in `HIDDEN_ROUTES` array):

- `/chat` — chat funnel has its own conversational UI

To hide on additional routes, add the path prefix to the `HIDDEN_ROUTES` array in `chatwoot-widget.tsx`.

## Chatwoot Configuration

- **Widget color**: `#f59e0b` (primary amber — configured in Chatwoot inbox settings)
- **Branding**: hide via `DISPLAY_BRANDING=false` env var on the Chatwoot instance (CSS cannot reach inside the iframe)
- **Greeting messages**: configured per inbox in Chatwoot panel (one inbox per language, so each has its own greeting)

## Instance

- **URL**: `https://chatwoot.bestsellers.digital`
- **Type**: Self-hosted
