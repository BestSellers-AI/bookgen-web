"use client";

import { useEffect, useRef } from "react";
import { useLocale } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { useAuth } from "@/hooks/use-auth";

const CHATWOOT_BASE_URL = "https://chatwoot.bestsellers.digital";
const CHATWOOT_TOKENS: Record<string, string> = {
  en: "Jukm3K8TF8cKJTReGM4ZURB9",
  "pt-BR": "CtE9mi1MMCGisE9xpMZFKs3j",
  es: "417uNEwsY2QSFzLfUBg6ZV6D",
};

const HIDDEN_ROUTES = ["/chat"];
const HIDDEN_EXACT_ROUTES = ["/"];

declare global {
  interface Window {
    chatwootSDK?: {
      run: (config: {
        websiteToken: string;
        baseUrl: string;
        locale?: string;
      }) => void;
    };
    $chatwoot?: {
      setUser: (
        identifier: string,
        userData: {
          email?: string;
          name?: string;
          avatar_url?: string;
        },
      ) => void;
      setLocale: (locale: string) => void;
      toggle: (state?: "open" | "close") => void;
      reset: () => void;
    };
  }
}

function removeChatwootDOM() {
  document.getElementById("cw-widget-holder")?.remove();
  document.getElementById("cw-bubble-holder")?.remove();
}

export function ChatwootWidget() {
  const locale = useLocale();
  const pathname = usePathname();
  const { user } = useAuth();
  const loadedTokenRef = useRef<string | null>(null);

  const isHidden = HIDDEN_ROUTES.some((route) => pathname.startsWith(route)) || HIDDEN_EXACT_ROUTES.includes(pathname);
  const websiteToken = CHATWOOT_TOKENS[locale] ?? CHATWOOT_TOKENS.en;

  // Load / reload widget
  useEffect(() => {
    // Hidden route — hide the bubble if it exists
    if (isHidden) {
      removeChatwootDOM();
      return;
    }

    // Already loaded with correct token
    if (loadedTokenRef.current === websiteToken) return;

    // Locale changed — need to reload with new token
    // Remove old widget DOM but keep the SDK script (it's cached)
    if (loadedTokenRef.current) {
      try { window.$chatwoot?.reset(); } catch { /* noop */ }
      removeChatwootDOM();
      delete window.$chatwoot;
      delete window.chatwootSDK;
      // Remove old script so we get a fresh onload
      document.getElementById("chatwoot-sdk")?.remove();
    }

    loadedTokenRef.current = websiteToken;

    // Check if SDK script already exists (Strict Mode re-mount)
    if (document.getElementById("chatwoot-sdk")) return;

    const script = document.createElement("script");
    script.id = "chatwoot-sdk";
    script.src = `${CHATWOOT_BASE_URL}/packs/js/sdk.js`;
    script.async = true;
    script.onload = () => {
      window.chatwootSDK?.run({
        websiteToken,
        baseUrl: CHATWOOT_BASE_URL,
        locale,
      });
    };
    document.body.appendChild(script);
    // No cleanup — widget persists across route changes
  }, [locale, isHidden, websiteToken]);

  // Identify logged-in user
  useEffect(() => {
    if (!user || isHidden) return;

    const identify = () => {
      window.$chatwoot?.setUser(user.id, {
        email: user.email,
        name: user.name ?? undefined,
        avatar_url: user.avatarUrl ?? undefined,
      });
    };

    if (window.$chatwoot) {
      identify();
    } else {
      window.addEventListener("chatwoot:ready", identify, { once: true });
      return () => window.removeEventListener("chatwoot:ready", identify);
    }
  }, [user, locale, isHidden]);

  return null;
}
