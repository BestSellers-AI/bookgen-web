"use client";

import { User, Settings, LogOut, Moon, Sun, Monitor, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { Link, usePathname } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useRouter } from "@/i18n/navigation";
import { locales, type Locale } from "@/i18n/config";
import { useAuthStore } from "@/stores/auth-store";
import { authApi } from "@/lib/api/auth";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useState } from "react";

const localeLabels: Record<Locale, string> = {
  en: "English",
  "pt-BR": "Portugues",
  es: "Espanol",
};

export function UserMenu() {
  const { user, logout } = useAuth();
  const t = useTranslations("nav");
  const tTheme = useTranslations("theme");
  const { setTheme } = useTheme();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const { setUser } = useAuthStore();

  const handleLocaleChange = async (newLocale: Locale) => {
    router.replace(pathname, { locale: newLocale });
    if (user && newLocale !== user.locale) {
      try {
        const updated = await authApi.updateProfile({ locale: newLocale });
        setUser(updated);
      } catch {
        // URL already changed — silently ignore DB sync failure
      }
    }
  };

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Avatar className="w-8 h-8 border border-primary/20">
              <AvatarImage src={user?.avatarUrl ?? ""} />
              <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                {user?.name ? getInitials(user.name) : "??"}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">{user?.name || "User"}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/dashboard/settings" className="cursor-pointer">
              <User className="w-4 h-4 mr-2" />
              {t("profileSettings")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Sun className="w-4 h-4 mr-2" />
              {tTheme("toggle")}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => setTheme("light")}>
                <Sun className="w-4 h-4 mr-2" />
                {tTheme("light")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                <Moon className="w-4 h-4 mr-2" />
                {tTheme("dark")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                <Monitor className="w-4 h-4 mr-2" />
                {tTheme("system")}
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Globe className="w-4 h-4 mr-2" />
              {localeLabels[locale as Locale]}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {locales.map((loc) => (
                <DropdownMenuItem
                  key={loc}
                  onClick={() => handleLocaleChange(loc)}
                  className={locale === loc ? "bg-accent" : ""}
                >
                  {localeLabels[loc]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-400 focus:text-red-300 cursor-pointer"
            onClick={() => setShowLogoutConfirm(true)}
          >
            <LogOut className="w-4 h-4 mr-2" />
            {t("logout")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={showLogoutConfirm}
        onOpenChange={setShowLogoutConfirm}
        title={t("logout")}
        description={t("logoutConfirm")}
        confirmLabel={t("logout")}
        onConfirm={() => logout()}
        variant="destructive"
      />
    </>
  );
}
