"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { locales, type Locale } from "@/i18n/config";
import { useAuthStore } from "@/stores/auth-store";
import { authApi } from "@/lib/api/auth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const localeLabels: Record<Locale, string> = {
  en: "English",
  "pt-BR": "Portugues",
  es: "Espanol",
};

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { user, setUser } = useAuthStore();

  const handleChange = async (value: string) => {
    router.replace(pathname, { locale: value as Locale });
    if (user && value !== user.locale) {
      try {
        const updated = await authApi.updateProfile({ locale: value });
        setUser(updated);
      } catch {
        // URL already changed — silently ignore DB sync failure
      }
    }
  };

  return (
    <Select value={locale} onValueChange={handleChange}>
      <SelectTrigger className="w-[130px] h-9 rounded-xl text-xs font-medium">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {locales.map((loc) => (
          <SelectItem key={loc} value={loc} className="text-xs">
            {localeLabels[loc]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
