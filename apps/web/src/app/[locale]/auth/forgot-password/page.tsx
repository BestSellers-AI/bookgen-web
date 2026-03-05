"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "@/lib/validations/auth";
import { authApi } from "@/lib/api/auth";
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
import { Loader2, ChevronLeft, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Link, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export default function ForgotPasswordPage() {
  const [success, setSuccess] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const t = useTranslations("auth");
  const tErr = useTranslations("errors");

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
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

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await authApi.forgotPassword(data.email);
      setSuccess(true);
    } catch (err: any) {
      form.setError("root", {
        message: err.message || tErr("forgotPasswordFailed"),
      });
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-8 text-center"
      >
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <CheckCircle2 size={48} />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-heading font-bold text-foreground">
            {t("checkEmail")}
          </h1>
          <p className="text-muted-foreground font-medium">
            {t("resetEmailSent")}{" "}
            <span className="text-foreground">{form.getValues("email")}</span>
          </p>
        </div>
        <Button
          asChild
          className="h-12 w-full text-md font-semibold bg-primary hover:bg-primary/90 rounded-xl shadow-lg shadow-primary/20 transition-all"
        >
          <Link href="/auth/login">{t("returnToLogin")}</Link>
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-heading font-bold text-gradient">
          {t("forgotTitle")}
        </h1>
        <p className="text-muted-foreground font-medium">
          {t("forgotSubtitle")}
        </p>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid gap-6 p-1 rounded-2xl"
        >
          {form.formState.errors.root && (
            <div className="p-3 text-sm font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-xl">
              {form.formState.errors.root.message}
            </div>
          )}

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
                    placeholder="email@example.com"
                    className="h-12 bg-card/60 border-white/5 focus:border-primary/50 transition-all rounded-xl"
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
            className="h-12 w-full text-md font-semibold bg-primary hover:bg-primary/90 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
          >
            {form.formState.isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              t("sendResetLink")
            )}
          </Button>
        </form>
      </Form>

      <div className="text-center">
        <Link
          href="/auth/login"
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors group"
        >
          <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
          {t("backToLogin")}
        </Link>
      </div>
    </motion.div>
  );
}
