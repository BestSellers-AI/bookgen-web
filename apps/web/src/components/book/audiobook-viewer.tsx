"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Headphones,
  Play,
  Pause,
  Download,
  ChevronLeft,
  ChevronRight,
  Volume2,
  Music,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslations } from "next-intl";
import type { BookAddonSummary } from "@/lib/api/types";

// ─── Types ─────────────────────────────────────────────────

interface AudiobookChapterData {
  chapterId: string | null;
  sectionType: string | null;
  sequence: number;
  title: string;
  audioUrl: string;
  durationSecs: number;
}

interface AudiobookResultData {
  voiceId?: string;
  voiceName?: string;
  totalDuration?: number;
  fullAudioUrl?: string;
  fullAudioSize?: number;
  chapters?: AudiobookChapterData[];
}

interface AudiobookViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  addon: BookAddonSummary;
  onRegenerate?: () => void;
}

// ─── Helpers ───────────────────────────────────────────────

function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatDurationLong(secs: number, t: ReturnType<typeof useTranslations>): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return t("duration", { minutes: m, seconds: s });
}

// ─── Component ─────────────────────────────────────────────

export function AudiobookViewer({ open, onOpenChange, addon, onRegenerate }: AudiobookViewerProps) {
  const t = useTranslations("audiobook");
  const tSections = useTranslations("book");
  const resultData = (addon.resultData ?? {}) as AudiobookResultData;
  const chapters = resultData.chapters ?? [];
  const fullAudioUrl = resultData.fullAudioUrl;
  const voiceName = resultData.voiceName;
  const totalDuration = resultData.totalDuration ?? 0;

  // Player state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeTab, setActiveTab] = useState<"chapters" | "full">("chapters");

  // Chapter sequence player
  const [currentChapterIndex, setCurrentChapterIndex] = useState(-1);
  const [playingFull, setPlayingFull] = useState(false);

  // Clean up audio on close
  useEffect(() => {
    if (!open && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      setPlaying(false);
      setCurrentChapterIndex(-1);
      setPlayingFull(false);
      setCurrentTime(0);
      setDuration(0);
    }
  }, [open]);

  const playAudio = useCallback((url: string) => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.addEventListener("timeupdate", () => {
        setCurrentTime(audioRef.current?.currentTime ?? 0);
      });
      audioRef.current.addEventListener("loadedmetadata", () => {
        setDuration(audioRef.current?.duration ?? 0);
      });
      audioRef.current.addEventListener("ended", () => {
        setPlaying(false);
      });
    }

    audioRef.current.src = url;
    audioRef.current.play();
    setPlaying(true);
    setCurrentTime(0);
  }, []);

  const togglePlayPause = useCallback(() => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  }, [playing]);

  // Chapter sequence: auto-advance to next chapter
  useEffect(() => {
    if (!audioRef.current || playingFull) return;

    const handleEnded = () => {
      if (currentChapterIndex >= 0 && currentChapterIndex < chapters.length - 1) {
        const nextIndex = currentChapterIndex + 1;
        setCurrentChapterIndex(nextIndex);
        playAudio(chapters[nextIndex].audioUrl);
      } else {
        setPlaying(false);
        setCurrentChapterIndex(-1);
      }
    };

    const audio = audioRef.current;
    audio.addEventListener("ended", handleEnded);
    return () => audio.removeEventListener("ended", handleEnded);
  }, [currentChapterIndex, chapters, playingFull, playAudio]);

  const playChapter = (index: number) => {
    setPlayingFull(false);
    setCurrentChapterIndex(index);
    playAudio(chapters[index].audioUrl);
  };

  const playFullAudiobook = () => {
    if (!fullAudioUrl) return;
    setPlayingFull(true);
    setCurrentChapterIndex(-1);
    playAudio(fullAudioUrl);
  };

  const playPrevChapter = () => {
    if (currentChapterIndex > 0) {
      playChapter(currentChapterIndex - 1);
    }
  };

  const playNextChapter = () => {
    if (currentChapterIndex < chapters.length - 1) {
      playChapter(currentChapterIndex + 1);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = ratio * duration;
  };

  const isChapterActive = (index: number) =>
    !playingFull && currentChapterIndex === index && playing;

  const nowPlayingLabel = playingFull
    ? t("fullAudiobook")
    : currentChapterIndex >= 0
      ? chapters[currentChapterIndex]?.title
      : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-[2rem] max-h-[85vh] overflow-y-auto"
      >
        <SheetHeader className="text-left pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Headphones className="w-5 h-5 text-emerald-500" />
            {t("title")}
          </SheetTitle>
          <SheetDescription asChild>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs">
                {voiceName && (
                  <span className="flex items-center gap-1">
                    <Volume2 className="w-3 h-3" />
                    {t("voice")}: {voiceName}
                  </span>
                )}
                {totalDuration > 0 && (
                  <span>
                    {t("totalDuration")}: {formatDurationLong(totalDuration, t)}
                  </span>
                )}
              </div>
              {onRegenerate && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-xl text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                  onClick={onRegenerate}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  {t("regenerate")}
                </Button>
              )}
            </div>
          </SheetDescription>
        </SheetHeader>

        {/* ─── Player Bar ─── */}
        {(playing || nowPlayingLabel) && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30"
                onClick={togglePlayPause}
              >
                {playing ? (
                  <Pause className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Play className="w-4 h-4 text-emerald-400" />
                )}
              </Button>

              {!playingFull && currentChapterIndex >= 0 && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={playPrevChapter}
                    disabled={currentChapterIndex <= 0}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={playNextChapter}
                    disabled={currentChapterIndex >= chapters.length - 1}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-emerald-400 truncate">
                  {t("nowPlaying")}: {nowPlayingLabel}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {formatDuration(Math.floor(currentTime))} / {formatDuration(Math.floor(duration))}
                </p>
              </div>
            </div>

            {/* Seekbar */}
            <div
              className="h-1.5 rounded-full bg-emerald-500/20 cursor-pointer"
              onClick={handleSeek}
            >
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}

        {/* ─── Tabs ─── */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "chapters" | "full")}>
          <TabsList className="w-full mb-4">
            <TabsTrigger value="chapters" className="flex-1 text-xs">
              <Music className="w-3.5 h-3.5 mr-1.5" />
              {t("chapters")} ({chapters.length})
            </TabsTrigger>
            <TabsTrigger value="full" className="flex-1 text-xs">
              <Headphones className="w-3.5 h-3.5 mr-1.5" />
              {t("fullAudiobook")}
            </TabsTrigger>
          </TabsList>

          {/* ─── Chapter List ─── */}
          <TabsContent value="chapters" className="space-y-2">
            <p className="text-xs text-muted-foreground mb-3">{t("listenChapters")}</p>
            {chapters.map((ch, index) => (
              <div
                key={ch.chapterId || ch.sectionType || index}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                  isChapterActive(index)
                    ? "bg-emerald-500/10 border-emerald-500/30"
                    : "bg-accent/30 border-border hover:bg-accent/50"
                }`}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20"
                  onClick={() =>
                    isChapterActive(index) ? togglePlayPause() : playChapter(index)
                  }
                >
                  {isChapterActive(index) ? (
                    <Pause className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Play className="w-4 h-4 text-emerald-500" />
                  )}
                </Button>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{ch.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {ch.sectionType
                      ? tSections(ch.sectionType)
                      : t("chapter", { number: ch.sequence })}{" "}
                    &middot; {formatDuration(ch.durationSecs)}
                  </p>
                </div>

                {isChapterActive(index) && (
                  <Badge className="bg-emerald-500/10 text-emerald-400 text-[9px] shrink-0 animate-pulse">
                    <Volume2 className="w-3 h-3 mr-1" />
                    {t("nowPlaying")}
                  </Badge>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  asChild
                >
                  <a href={ch.audioUrl} download={`${ch.sectionType || `chapter-${ch.sequence}`}.mp3`}>
                    <Download className="w-4 h-4 text-muted-foreground" />
                  </a>
                </Button>
              </div>
            ))}
          </TabsContent>

          {/* ─── Full Audiobook ─── */}
          <TabsContent value="full" className="space-y-4">
            <p className="text-xs text-muted-foreground">{t("listenFull")}</p>

            {fullAudioUrl ? (
              <div className="p-4 rounded-xl bg-accent/30 border border-border space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Headphones className="w-7 h-7 text-emerald-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold">{t("fullAudiobook")}</p>
                    <p className="text-xs text-muted-foreground">
                      {chapters.length} {t("chapters").toLowerCase()} &middot;{" "}
                      {formatDurationLong(totalDuration, t)}
                    </p>
                    {voiceName && (
                      <p className="text-xs text-muted-foreground">
                        {t("voice")}: {voiceName}
                      </p>
                    )}
                  </div>
                </div>

                {playingFull && (
                  <Progress
                    value={duration ? (currentTime / duration) * 100 : 0}
                    className="h-1.5"
                  />
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl flex-1 gap-2"
                    onClick={() =>
                      playingFull && playing ? togglePlayPause() : playFullAudiobook()
                    }
                  >
                    {playingFull && playing ? (
                      <>
                        <Pause className="w-4 h-4" />
                        {t("pause")}
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        {t("play")}
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl flex-1 gap-2"
                    asChild
                  >
                    <a href={fullAudioUrl} download="audiobook-full.mp3">
                      <Download className="w-4 h-4" />
                      {t("download")}
                    </a>
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t("noAudiobook")}</p>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
