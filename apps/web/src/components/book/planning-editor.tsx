"use client";

import { useState } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { booksApi } from "@/lib/api/books";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import type { BookPlanning } from "@/lib/api/types";

interface PlanningEditorProps {
  planning: BookPlanning;
  bookId: string;
  onSave: () => void;
  onCancel: () => void;
}

export function PlanningEditor({ planning, bookId, onSave, onCancel }: PlanningEditorProps) {
  const [chapters, setChapters] = useState(
    planning.chapters.map((ch) => ({
      title: ch.title,
      topics: ch.topics.map((t) => ({ title: t.title, content: t.content })),
    })),
  );
  const [saving, setSaving] = useState(false);
  const t = useTranslations("book");
  const tCommon = useTranslations("common");
  const tErr = useTranslations("errors");

  const updateChapterTitle = (idx: number, title: string) => {
    setChapters((prev) => prev.map((ch, i) => (i === idx ? { ...ch, title } : ch)));
  };

  const updateTopicTitle = (chIdx: number, topicIdx: number, value: string) => {
    setChapters((prev) =>
      prev.map((ch, i) =>
        i === chIdx
          ? { ...ch, topics: ch.topics.map((t, j) => (j === topicIdx ? { ...t, title: value } : t)) }
          : ch,
      ),
    );
  };

  const updateTopicContent = (chIdx: number, topicIdx: number, value: string) => {
    setChapters((prev) =>
      prev.map((ch, i) =>
        i === chIdx
          ? { ...ch, topics: ch.topics.map((t, j) => (j === topicIdx ? { ...t, content: value } : t)) }
          : ch,
      ),
    );
  };

  const removeTopic = (chIdx: number, topicIdx: number) => {
    setChapters((prev) =>
      prev.map((ch, i) =>
        i === chIdx ? { ...ch, topics: ch.topics.filter((_, j) => j !== topicIdx) } : ch,
      ),
    );
  };

  const addTopic = (chIdx: number) => {
    setChapters((prev) =>
      prev.map((ch, i) =>
        i === chIdx ? { ...ch, topics: [...ch.topics, { title: "", content: "" }] } : ch,
      ),
    );
  };

  const removeChapter = (idx: number) => {
    if (chapters.length <= 3) return;
    setChapters((prev) => prev.filter((_, i) => i !== idx));
  };

  const addChapter = () => {
    setChapters((prev) => [...prev, { title: "", topics: [{ title: "", content: "" }] }]);
  };

  const handleSave = async () => {
    // Validate
    const valid = chapters.every(
      (ch) => ch.title.trim() && ch.topics.some((t) => t.title.trim()),
    );
    if (!valid) {
      toast.error(t("planningValidationError"));
      return;
    }

    setSaving(true);
    try {
      await booksApi.updatePlanning(bookId, {
        chapters: chapters.map((ch) => ({
          title: ch.title.trim(),
          topics: ch.topics
            .filter((t) => t.title.trim())
            .map((t) => ({ title: t.title.trim(), content: t.content.trim() })),
        })),
      });
      toast.success(t("planningUpdated"));
      onSave();
    } catch {
      toast.error(tErr("generic"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {chapters.map((chapter, chIdx) => (
        <div key={chIdx} className="glass rounded-[2rem] p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center font-heading font-black text-lg text-primary shrink-0">
              {chIdx + 1}
            </div>
            <Input
              value={chapter.title}
              onChange={(e) => updateChapterTitle(chIdx, e.target.value)}
              placeholder={t("chapterTitlePlaceholder")}
              className="h-12 rounded-xl bg-accent/50 border-border text-lg font-bold flex-1"
            />
            {chapters.length > 3 && (
              <Button
                variant="ghost"
                size="icon"
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 shrink-0"
                onClick={() => removeChapter(chIdx)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="pl-13 space-y-3 ml-13">
            {chapter.topics.map((topic, topicIdx) => (
              <div key={topicIdx} className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
                  <Input
                    value={topic.title}
                    onChange={(e) => updateTopicTitle(chIdx, topicIdx, e.target.value)}
                    placeholder={t("topicTitlePlaceholder")}
                    className="h-10 rounded-lg bg-accent/30 border-border text-sm font-semibold flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-red-400 shrink-0"
                    onClick={() => removeTopic(chIdx, topicIdx)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <div className="pl-3.5">
                  <Textarea
                    value={topic.content}
                    onChange={(e) => updateTopicContent(chIdx, topicIdx, e.target.value)}
                    placeholder={t("topicContentPlaceholder")}
                    className="rounded-lg bg-accent/20 border-border text-sm min-h-[60px] resize-none"
                    rows={2}
                  />
                </div>
              </div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-primary"
              onClick={() => addTopic(chIdx)}
            >
              <Plus className="mr-1 h-3 w-3" />
              {t("addTopic")}
            </Button>
          </div>
        </div>
      ))}

      <Button
        variant="outline"
        className="w-full rounded-xl border-dashed border-border text-muted-foreground hover:text-primary hover:border-primary/50"
        onClick={addChapter}
      >
        <Plus className="mr-2 h-4 w-4" />
        {t("addChapter")}
      </Button>

      <div className="flex justify-end gap-3 pt-4">
        <Button variant="ghost" onClick={onCancel}>
          {tCommon("cancel")}
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {tCommon("save")}
            </>
          ) : (
            t("saveStructure")
          )}
        </Button>
      </div>
    </div>
  );
}
