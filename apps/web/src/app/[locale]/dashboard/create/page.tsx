"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  PenTool,
  Sparkles,
  Settings,
  Loader2,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { booksApi } from "@/lib/api/books";
import type { CreateBookInput } from "@/lib/api/books";
import { useAuth } from "@/hooks/use-auth";
import { useConfigStore } from "@/stores/config-store";
import { useBookEvents } from "@/hooks/use-book-events";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { motion, AnimatePresence } from "motion/react";
import { useTranslations, useLocale } from "next-intl";
import {
  BOOK_TONES,
  SUPPORTED_LANGUAGES,
  PAGE_TARGETS,
  CHAPTER_COUNTS,
  BRIEFING_MAX_LENGTH,
} from "@bestsellers/shared";
import {
  createSimpleBookSchema,
  createGuidedBookSchema,
  createAdvancedBookSchema,
  type SimpleBookFormData,
  type GuidedBookFormData,
  type AdvancedBookFormData,
} from "@/lib/validations/book";

type CreationMode = "simple" | "guided" | "advanced";

export default function CreateBookPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<CreationMode | null>(null);
  const [loading, setLoading] = useState(false);
  const [bookId, setBookId] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const locale = useLocale();
  const t = useTranslations("create");
  const tCommon = useTranslations("common");
  const tErr = useTranslations("errors");
  const autoApproveEnabled = useConfigStore((s) => s.config?.autoApprovePreview ?? false);

  const validationMsgs = {
    titleMin: t("validation.titleRequired"),
    subtitleMin: t("validation.subtitleRequired"),
    authorMin: t("validation.authorRequired"),
    briefingMin: t("validation.briefingMin"),
    briefingMax: t("validation.briefingMax"),
    targetAudienceMin: t("validation.targetAudienceRequired"),
    languageMin: t("validation.languageRequired"),
  };

  const simpleForm = useForm<SimpleBookFormData>({
    resolver: zodResolver(createSimpleBookSchema(validationMsgs)),
    defaultValues: { title: "", subtitle: "", author: "", language: locale, briefing: "" },
  });

  const guidedForm = useForm<GuidedBookFormData>({
    resolver: zodResolver(createGuidedBookSchema(validationMsgs)),
    defaultValues: { author: "", language: locale, briefing: "" },
  });

  const advancedForm = useForm<AdvancedBookFormData>({
    resolver: zodResolver(createAdvancedBookSchema(validationMsgs)),
    defaultValues: {
      title: "",
      subtitle: "",
      author: "",
      briefing: "",
      settings: {
        tone: "professional",
        targetAudience: "",
        language: locale,
        pageTarget: 200,
        chapterCount: 10,
        writingStyle: "",
        includeExamples: false,
        includeCaseStudies: false,
        customInstructions: "",
        editableStructure: false,
      },
    },
  });

  const handleModeSelect = (m: CreationMode) => {
    setMode(m);
    setStep(1);
  };

  // SSE for preview progress
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sseConnectedRef = useRef(false);
  const sseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSSEEvent = useCallback(
    (type: string, data: Record<string, unknown>) => {
      sseConnectedRef.current = true;
      if (sseTimeoutRef.current) {
        clearTimeout(sseTimeoutRef.current);
        sseTimeoutRef.current = null;
      }
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }

      if (type === "preview_progress") {
        if (data.status === "ready") {
          router.push(`/dashboard/books/${bookId}`);
        } else if (data.status === "error") {
          setPreviewError(
            (data.error as string) || tErr("generateFailed"),
          );
        }
      }
    },
    [bookId, router, tErr],
  );

  useBookEvents(step === 2 ? bookId : null, handleSSEEvent);

  // Fallback polling if SSE doesn't connect in 5s
  useEffect(() => {
    if (step !== 2 || !bookId) return;

    sseConnectedRef.current = false;

    sseTimeoutRef.current = setTimeout(() => {
      if (!sseConnectedRef.current && !pollRef.current) {
        pollRef.current = setInterval(async () => {
          try {
            const res = await booksApi.getPreviewStatus(bookId);
            if (res.status === "PREVIEW") {
              if (pollRef.current) clearInterval(pollRef.current);
              router.push(`/dashboard/books/${bookId}`);
            } else if (res.status === "ERROR") {
              if (pollRef.current) clearInterval(pollRef.current);
              setPreviewError(tErr("generateFailed"));
            }
          } catch {
            // ignore polling errors
          }
        }, 3000);
      }
    }, 5000);

    return () => {
      if (sseTimeoutRef.current) clearTimeout(sseTimeoutRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [step, bookId, router, tErr]);

  const doCreateAndPreview = async (input: CreateBookInput) => {
    setLoading(true);
    setPreviewError(null);

    try {
      const book = await booksApi.create(input);
      setBookId(book.id);
      await booksApi.generatePreview(book.id);
      setStep(2);
    } catch (error: any) {
      console.error("Failed to create book:", error);
      if (error?.response?.status === 403) {
        setPreviewError(tErr("previewLimitReached"));
      } else {
        setPreviewError(tErr("generateFailed"));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSimpleSubmit = (data: SimpleBookFormData) => {
    doCreateAndPreview({
      mode: "SIMPLE" as any,
      briefing: data.briefing,
      author: data.author || user?.name || "Author",
      title: data.title || undefined,
      subtitle: data.subtitle || undefined,
      settings: {
        tone: "professional",
        targetAudience: "general",
        language: data.language,
        pageTarget: 150,
        chapterCount: 10,
        includeExamples: true,
        includeCaseStudies: false,
      },
    });
  };

  const handleGuidedSubmit = (data: GuidedBookFormData) => {
    doCreateAndPreview({
      mode: "GUIDED" as any,
      briefing: data.briefing,
      author: data.author || user?.name || "Author",
      settings: {
        tone: "professional",
        targetAudience: "general",
        language: data.language,
        pageTarget: 150,
        chapterCount: 10,
        includeExamples: true,
        includeCaseStudies: false,
      },
    });
  };

  const handleAdvancedSubmit = (data: AdvancedBookFormData) => {
    doCreateAndPreview({
      mode: "ADVANCED" as any,
      briefing: data.briefing,
      author: data.author || user?.name || "Author",
      title: data.title || undefined,
      subtitle: data.subtitle || undefined,
      settings: data.settings,
    });
  };

  const handleTryAgain = () => {
    setPreviewError(null);
    setBookId(null);
    setStep(1);
  };

  const simpleBriefing = simpleForm.watch("briefing");
  const guidedBriefing = guidedForm.watch("briefing");
  const advancedBriefing = advancedForm.watch("briefing");
  const briefingValue =
    mode === "advanced"
      ? advancedBriefing
      : mode === "simple"
        ? simpleBriefing
        : guidedBriefing;

  const inputClass =
    "h-12 md:h-14 rounded-xl md:rounded-2xl bg-accent/50 border-border focus:border-primary/50 transition-all text-base md:text-lg";
  const labelClass = "text-xs md:text-sm font-bold text-muted-foreground ml-1";

  return (
    <div className="max-w-5xl mx-auto py-6 md:py-12 px-4">
      <AnimatePresence mode="wait">
        {/* Step 0: Mode Selection */}
        {step === 0 && (
          <motion.div
            key="step0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8 md:space-y-12 text-center"
          >
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-heading font-black tracking-tight text-foreground">
                {t("modeTitle")}
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                {t("modeSubtitle")}
              </p>
            </div>
            {/* GRID 3 MODES || 2 MODES */}
            {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-xauto"> */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-w-5xl mx-auto">
              <button
                onClick={() => handleModeSelect("simple")}
                className="group relative p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] bg-accent/50 border border-border hover:border-blue-500/50 transition-all text-left overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[60px] -mr-16 -mt-16 group-hover:bg-blue-500/20 transition-colors" />
                <div className="relative space-y-4 md:space-y-6">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                    <PenTool className="w-6 h-6 md:w-7 md:h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-bold text-foreground mb-1 md:mb-2">
                      {t("simpleMode")}
                    </h3>
                    <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                      {t("simpleModeDesc")}
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleModeSelect("guided")}
                className="group relative p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] bg-accent/50 border border-border hover:border-blue-500/50 transition-all text-left overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[60px] -mr-16 -mt-16 group-hover:bg-blue-500/20 transition-colors" />
                <div className="relative space-y-4 md:space-y-6">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                    <Sparkles className="w-6 h-6 md:w-7 md:h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-bold text-foreground mb-1 md:mb-2">
                      {t("aiGuided")}
                    </h3>
                    <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                      {t("aiGuidedDesc")}
                    </p>
                  </div>
                </div>
              </button>

              {/* MODO ADVANCED DESATIVADO */}
              <button
                onClick={() => handleModeSelect("advanced")}
                className="group relative p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] bg-accent/50 border border-border hover:border-amber-500/50 transition-all text-left overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-[60px] -mr-16 -mt-16 group-hover:bg-amber-500/20 transition-colors" />
                <div className="relative space-y-4 md:space-y-6">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                    <Settings className="w-6 h-6 md:w-7 md:h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-bold text-foreground mb-1 md:mb-2">
                      {t("advancedMode")}
                    </h3>
                    <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                      {t("advancedModeDesc")}
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 1: Form */}
        {step === 1 && mode && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-3xl mx-auto"
          >
            <div className="glass rounded-[2rem] md:rounded-[3rem] p-6 md:p-12 space-y-6 md:space-y-10 border border-border">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground h-8 px-2"
                  onClick={() => setStep(0)}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" /> {tCommon("back")}
                </Button>
                <div
                  className={`px-3 py-1 rounded-full border text-[10px] md:text-xs font-bold uppercase tracking-widest ${
                    mode === "simple"
                      ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                      : mode === "guided"
                        ? "bg-primary/10 border-primary/20 text-primary"
                        : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                  }`}
                >
                  {mode === "simple"
                    ? t("simpleMode")
                    : mode === "guided"
                      ? t("aiGuidedMode")
                      : t("advancedMode")}
                </div>
              </div>

              {/* Simple Form */}
              {mode === "simple" && (
                <Form {...simpleForm}>
                  <form
                    onSubmit={simpleForm.handleSubmit(handleSimpleSubmit)}
                    className="space-y-6 md:space-y-8"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      <FormField
                        control={simpleForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={labelClass}>{t("bookTitle")}</FormLabel>
                            <FormControl>
                              <Input placeholder={t("titlePlaceholder")} className={inputClass} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={simpleForm.control}
                        name="subtitle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={labelClass}>{t("subtitle")}</FormLabel>
                            <FormControl>
                              <Input placeholder={t("subtitlePlaceholder")} className={inputClass} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={simpleForm.control}
                        name="author"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={labelClass}>{t("authorName")}</FormLabel>
                            <FormControl>
                              <Input placeholder={t("authorPlaceholder")} className={inputClass} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={simpleForm.control}
                        name="language"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={labelClass}>{t("language")}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className={inputClass}>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {SUPPORTED_LANGUAGES.map((lang) => (
                                  <SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <BriefingField
                      control={simpleForm.control}
                      label={t("detailedBriefing")}
                      placeholder={t("briefingPlaceholder")}
                      charLabel={t("charCount", { count: briefingValue?.length ?? 0 })}
                    />

                    <SubmitButton loading={loading} label={t("generatePreview")} processingLabel={t("processing")} />
                  </form>
                </Form>
              )}

              {/* Guided Form */}
              {mode === "guided" && (
                <Form {...guidedForm}>
                  <form
                    onSubmit={guidedForm.handleSubmit(handleGuidedSubmit)}
                    className="space-y-6 md:space-y-8"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      <FormField
                        control={guidedForm.control}
                        name="author"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={labelClass}>{t("authorName")}</FormLabel>
                            <FormControl>
                              <Input placeholder={t("authorPlaceholder")} className={inputClass} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={guidedForm.control}
                        name="language"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={labelClass}>{t("language")}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className={inputClass}>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {SUPPORTED_LANGUAGES.map((lang) => (
                                  <SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <BriefingField
                      control={guidedForm.control}
                      label={t("whatIsBookAbout")}
                      placeholder={t("ideaPlaceholder")}
                      charLabel={t("charCount", { count: briefingValue?.length ?? 0 })}
                    />

                    <SubmitButton loading={loading} label={t("generatePreview")} processingLabel={t("processing")} />
                  </form>
                </Form>
              )}

              {/* Advanced Form */}
              {mode === "advanced" && (
                <Form {...advancedForm}>
                  <form
                    onSubmit={advancedForm.handleSubmit(handleAdvancedSubmit)}
                    className="space-y-6 md:space-y-8"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      <FormField
                        control={advancedForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={labelClass}>{t("bookTitle")}</FormLabel>
                            <FormControl>
                              <Input placeholder={t("titlePlaceholder")} className={inputClass} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={advancedForm.control}
                        name="author"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={labelClass}>{t("authorName")}</FormLabel>
                            <FormControl>
                              <Input placeholder={t("authorPlaceholder")} className={inputClass} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={advancedForm.control}
                        name="subtitle"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel className={labelClass}>{t("subtitle")}</FormLabel>
                            <FormControl>
                              <Input placeholder={t("subtitlePlaceholder")} className={inputClass} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <BriefingField
                      control={advancedForm.control}
                      label={t("detailedBriefing")}
                      placeholder={t("briefingPlaceholder")}
                      charLabel={t("charCount", { count: briefingValue?.length ?? 0 })}
                    />

                    {/* Advanced Settings Collapsible */}
                    <div className="space-y-4">
                      <button
                        type="button"
                        onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                        className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showAdvancedSettings ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        {t("advancedSettings")}
                      </button>

                      {showAdvancedSettings && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="space-y-4 p-6 rounded-2xl bg-accent/30 border border-border"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={advancedForm.control}
                              name="settings.tone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs font-bold text-muted-foreground">{t("tone")}</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger className="h-12 rounded-xl bg-accent/50 border-border">
                                        <SelectValue />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {BOOK_TONES.map((tone) => (
                                        <SelectItem key={tone} value={tone}>
                                          {t(`tone${tone.charAt(0).toUpperCase()}${tone.slice(1)}` as any)}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={advancedForm.control}
                              name="settings.targetAudience"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs font-bold text-muted-foreground">{t("targetAudience")}</FormLabel>
                                  <FormControl>
                                    <Input placeholder={t("targetAudience")} className="h-12 rounded-xl bg-accent/50 border-border" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={advancedForm.control}
                              name="settings.language"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs font-bold text-muted-foreground">{t("language")}</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger className="h-12 rounded-xl bg-accent/50 border-border">
                                        <SelectValue />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {SUPPORTED_LANGUAGES.map((lang) => (
                                        <SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={advancedForm.control}
                              name="settings.pageTarget"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs font-bold text-muted-foreground">{t("pageTarget")}</FormLabel>
                                  <Select onValueChange={(v) => field.onChange(Number(v))} value={String(field.value)}>
                                    <FormControl>
                                      <SelectTrigger className="h-12 rounded-xl bg-accent/50 border-border">
                                        <SelectValue />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {PAGE_TARGETS.map((p) => (
                                        <SelectItem key={p} value={String(p)}>{p} pages</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={advancedForm.control}
                              name="settings.chapterCount"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs font-bold text-muted-foreground">{t("chapterCount")}</FormLabel>
                                  <Select onValueChange={(v) => field.onChange(Number(v))} value={String(field.value)}>
                                    <FormControl>
                                      <SelectTrigger className="h-12 rounded-xl bg-accent/50 border-border">
                                        <SelectValue />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {CHAPTER_COUNTS.map((c) => (
                                        <SelectItem key={c} value={String(c)}>{c} chapters</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={advancedForm.control}
                            name="settings.writingStyle"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-bold text-muted-foreground">{t("writingStyle")}</FormLabel>
                                <FormControl>
                                  <Textarea placeholder={t("writingStyle")} className="min-h-[80px] rounded-xl bg-accent/50 border-border resize-none" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="flex flex-col gap-4">
                            <FormField
                              control={advancedForm.control}
                              name="settings.includeExamples"
                              render={({ field }) => (
                                <FormItem className="flex items-center justify-between">
                                  <FormLabel className="text-sm font-medium">{t("includeExamples")}</FormLabel>
                                  <FormControl>
                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={advancedForm.control}
                              name="settings.includeCaseStudies"
                              render={({ field }) => (
                                <FormItem className="flex items-center justify-between">
                                  <FormLabel className="text-sm font-medium">{t("includeCaseStudies")}</FormLabel>
                                  <FormControl>
                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={advancedForm.control}
                            name="settings.customInstructions"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-bold text-muted-foreground">{t("customInstructions")}</FormLabel>
                                <FormControl>
                                  <Textarea placeholder={t("customInstructions")} className="min-h-[80px] rounded-xl bg-accent/50 border-border resize-none" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {autoApproveEnabled && (
                            <FormField
                              control={advancedForm.control}
                              name="settings.editableStructure"
                              render={({ field }) => (
                                <FormItem className="flex items-center justify-between p-4 rounded-xl bg-accent/30 border border-border">
                                  <div className="space-y-0.5">
                                    <FormLabel className="text-sm font-medium">{t("editableStructure")}</FormLabel>
                                    <p className="text-xs text-muted-foreground">{t("editableStructureDesc")}</p>
                                  </div>
                                  <FormControl>
                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          )}
                        </motion.div>
                      )}
                    </div>

                    <SubmitButton loading={loading} label={t("generatePreview")} processingLabel={t("processing")} />
                  </form>
                </Form>
              )}
            </div>
          </motion.div>
        )}

        {/* Step 2: Preview Generating (SSE) */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-xl"
          >
            {previewError ? (
              <div className="space-y-6 text-center px-6">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-red-500/20 flex items-center justify-center">
                  <AlertCircle className="w-10 h-10 text-red-400" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-heading font-bold text-foreground">
                    {t("previewError")}
                  </h2>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    {previewError}
                  </p>
                </div>
                <Button onClick={handleTryAgain} variant="outline" size="lg">
                  {t("tryAgain")}
                </Button>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full animate-pulse" />
                <div className="relative space-y-8 text-center px-6">
                  <div className="flex justify-center">
                    <div className="relative w-24 h-24">
                      <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                      <div className="absolute inset-0 border-4 border-t-primary rounded-full animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="w-10 h-10 text-primary animate-pulse" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h2 className="text-4xl md:text-5xl font-heading font-black tracking-tight text-foreground">
                      {t("generatingPreview")}
                    </h2>
                    <p className="text-xl text-muted-foreground font-medium max-w-md mx-auto">
                      {t("loadingDescription")}
                    </p>
                  </div>
                  <div className="flex justify-center gap-2">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        animate={{
                          scale: [1, 1.5, 1],
                          opacity: [0.3, 1, 0.3],
                        }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          delay: i * 0.2,
                        }}
                        className="w-2 h-2 rounded-full bg-primary"
                      />
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="lg"
                    className="mt-4 rounded-xl"
                    onClick={() => router.push("/dashboard")}
                  >
                    {tCommon("goToDashboard")}
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Shared sub-components ---

function BriefingField({
  control,
  label,
  placeholder,
  charLabel,
}: {
  control: any;
  label: string;
  placeholder: string;
  charLabel: string;
}) {
  return (
    <div className="space-y-3 md:space-y-4">
      <div className="flex items-center justify-between px-1">
        <Label className="text-base md:text-lg font-bold text-foreground">{label}</Label>
        <span className="text-[10px] md:text-xs text-muted-foreground font-medium">{charLabel}</span>
      </div>
      <FormField
        control={control}
        name="briefing"
        render={({ field }: any) => (
          <FormItem>
            <FormControl>
              <Textarea
                placeholder={placeholder}
                className="min-h-[180px] md:min-h-[250px] rounded-2xl md:rounded-[2rem] bg-accent/50 border-border focus:border-primary/50 transition-all text-base md:text-lg p-4 md:p-8 leading-relaxed resize-none"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

function SubmitButton({
  loading,
  label,
  processingLabel,
}: {
  loading: boolean;
  label: string;
  processingLabel: string;
}) {
  return (
    <Button
      type="submit"
      size="lg"
      className="w-full h-16 md:h-20 rounded-2xl md:rounded-[2rem] bg-primary hover:bg-primary/90 text-lg md:text-xl font-black shadow-2xl shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
      disabled={loading}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 md:mr-3 h-5 w-5 md:h-6 md:w-6 animate-spin" />
          {processingLabel}
        </>
      ) : (
        <>
          <Sparkles className="mr-2 md:mr-3 h-5 w-5 md:h-6 md:w-6" />
          {label}
        </>
      )}
    </Button>
  );
}
