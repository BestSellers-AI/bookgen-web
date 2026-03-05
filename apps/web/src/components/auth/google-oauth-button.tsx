"use client";

import { useState, useCallback } from "react";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { useAuth } from "@/hooks/use-auth";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

export function GoogleOAuthButton() {
  const [loading, setLoading] = useState(false);
  const { loginWithGoogle } = useAuth();
  const tErr = useTranslations("errors");

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
    <div className="w-full [&>div]:w-full [&_iframe]:!w-full" data-loading={loading}>
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => toast.error(tErr("loginFailed"))}
        size="large"
        width="100%"
        shape="rectangular"
        theme="outline"
        text="continue_with"
      />
    </div>
  );
}
