"use client";

import { useEffect } from "react";
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
      toggle: (state?: 'open' | 'close') => void;
      reset: () => void;
    };
  }
}

function destroyChatwoot() {
  window.$chatwoot?.reset();

  document.getElementById("chatwoot-sdk")?.remove();
  document.getElementById("cw-widget-holder")?.remove();
  document.getElementById("cw-bubble-holder")?.remove();
  document
    .querySelectorAll('script[src*="chatwoot"]')
    .forEach((el) => el.remove());

  delete window.$chatwoot;
  delete window.chatwootSDK;
}

export function ChatwootWidget() {
  const locale = useLocale();
  const pathname = usePathname();
  const { user } = useAuth();

  const isHidden = HIDDEN_ROUTES.some((route) => pathname.startsWith(route));

  // Load SDK + init widget — re-runs when locale changes
  useEffect(() => {
    if (isHidden) {
      destroyChatwoot();
      return;
    }

    destroyChatwoot();

    const websiteToken = CHATWOOT_TOKENS[locale] ?? CHATWOOT_TOKENS.en;

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

    return () => {
      destroyChatwoot();
    };
  }, [locale, isHidden]);

  // Identify logged-in user; anonymous visitors are tracked by Chatwoot natively
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
