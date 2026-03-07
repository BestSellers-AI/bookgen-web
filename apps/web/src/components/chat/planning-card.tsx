'use client';

import { motion } from 'framer-motion';
import { BookOpen, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

interface PlanningCardProps {
  title: string;
  subtitle?: string;
  chapters: Array<{ title: string }>;
  onContinue: () => void;
}

export function PlanningCard({
  title,
  subtitle,
  chapters,
  onContinue,
}: PlanningCardProps) {
  const t = useTranslations('chat');

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="mx-4 max-w-md"
    >
      <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-5 py-4 border-b border-border/30">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={18} className="text-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              {t('previewReady')}
            </span>
          </div>
          <h3 className="text-lg font-heading font-bold">{title}</h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>

        <div className="px-5 py-4 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {t('chapters')} ({chapters.length})
          </p>
          {chapters.map((ch, i) => (
            <div
              key={i}
              className="flex items-center gap-3 text-sm py-1.5"
            >
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                {i + 1}
              </span>
              <span className="text-foreground/90">{ch.title}</span>
            </div>
          ))}
        </div>

        <div className="px-5 py-4 border-t border-border/30">
          <Button onClick={onContinue} className="w-full min-h-[48px] rounded-xl text-base font-semibold">
            {t('viewMyBook')}
            <ChevronRight size={18} className="ml-1" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
