"use client";

import { useState, useCallback } from "react";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { useAuth } from "@/hooks/use-auth";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function GoogleOAuthButton() {
  const [loading, setLoading] = useState(false);
  const { loginWithGoogle } = useAuth();
  const tErr = useTranslations("errors");
  const t = useTranslations("auth");

  const handleSuccess = useCallback(
    async (response: CredentialResponse) => {
      if (!response.credential) {
        toast.error(tErr("loginFailed"));
        return;
      }
      setLoading(true);
      try {
        await loginWithGoogle(response.credential);
      } catch {
        toast.error(tErr("loginFailed"));
      } finally {
        setLoading(false);
      }
    },
    [loginWithGoogle, tErr],
  );

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) return null;

  return (
    <div className="relative w-full h-12 rounded-xl overflow-hidden">
      {/* Visual button — our styled version (behind the iframe) */}
      <div className="absolute inset-0 flex items-center justify-center gap-3 rounded-xl border border-border bg-card/60 text-sm font-semibold text-foreground transition-colors hover:bg-card/80 pointer-events-none select-none">
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <GoogleIcon />
            {t("googleLogin")}
          </>
        )}
      </div>

      {/* Real Google button — invisible overlay, captures clicks */}
      <div className="absolute inset-0 opacity-0 cursor-pointer [&>div]:!w-full [&>div]:!h-full [&_iframe]:!w-full [&_iframe]:!h-12">
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={() => toast.error(tErr("loginFailed"))}
          size="large"
          width="400"
          shape="rectangular"
          theme="outline"
          text="continue_with"
        />
      </div>
    </div>
  );
}
