"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterFormData } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { GoogleOAuthButton } from "@/components/auth/google-oauth-button";

export default function RegisterPage() {
  const { signup, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const t = useTranslations("auth");
  const tErr = useTranslations("errors");

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await signup({ name: data.name, email: data.email, password: data.password });
    } catch (err: any) {
      form.setError("root", {
        message: err.message || tErr("signupFailed"),
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-heading font-bold text-gradient">
          {t("registerTitle")}
        </h1>
        <p className="text-muted-foreground font-medium">
          {t("registerSubtitle")}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          {form.formState.errors.root && (
            <div className="p-3 text-sm font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-xl">
              {form.formState.errors.root.message}
            </div>
          )}

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
                  {t("fullName")}
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="John Doe"
                    className="h-11 bg-card/60 border-white/5 focus:border-primary/50 transition-all rounded-xl"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
                  {t("email")}
                </FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="m@example.com"
                    className="h-11 bg-card/60 border-white/5 focus:border-primary/50 transition-all rounded-xl"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
                  {t("password")}
                </FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    className="h-11 bg-card/60 border-white/5 focus:border-primary/50 transition-all rounded-xl"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
                  {t("confirmPassword")}
                </FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    className="h-11 bg-card/60 border-white/5 focus:border-primary/50 transition-all rounded-xl"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="h-12 w-full mt-2 text-md font-semibold bg-primary hover:bg-primary/90 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
          >
            {form.formState.isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              t("getStartedFree")
            )}
          </Button>
        </form>
      </Form>

      <div className="relative flex items-center gap-4">
        <div className="flex-1 border-t border-border" />
        <span className="text-xs font-medium text-muted-foreground">
          {t("orContinueWith")}
        </span>
        <div className="flex-1 border-t border-border" />
      </div>

      <GoogleOAuthButton />

      <div className="text-center text-sm font-medium text-muted-foreground">
        {t("alreadyHaveAccount")}{" "}
        <Link
          href="/auth/login"
          className="text-primary hover:text-primary/80 transition-colors underline-offset-4 hover:underline"
        >
          {t("signInLink")}
        </Link>
      </div>
    </motion.div>
  );
}
