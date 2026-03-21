'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useTranslations } from 'next-intl';
import { PhoneInput } from './phone-input';

interface ChatInputProps {
  mode: 'text' | 'textarea' | 'email' | 'phone' | 'hidden';
  placeholder?: string;
  minLength?: number;
  onSubmit: (value: string) => void;
  disabled?: boolean;
}

export function ChatInput({
  mode,
  placeholder,
  minLength = 0,
  onSubmit,
  disabled,
}: ChatInputProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const t = useTranslations('chat');

  useEffect(() => {
    if (mode !== 'hidden' && mode !== 'phone') {
      // Small delay to let animations finish before focusing
      const timer = setTimeout(() => inputRef.current?.focus(), 300);
      return () => clearTimeout(timer);
    }
  }, [mode]);

  if (mode === 'hidden') return null;

  if (mode === 'phone') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-t border-border/50 bg-background px-4 py-3 pb-safe"
      >
        <PhoneInput
          placeholder={placeholder}
          onSubmit={onSubmit}
          disabled={disabled}
        />
      </motion.div>
    );
  }

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || trimmed.length < minLength) return;

    if (mode === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmed)) return;
    }

    onSubmit(trimmed);
    setValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isValid =
    value.trim().length >= minLength &&
    (mode !== 'email' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-t border-border/50 bg-background px-4 py-3 pb-safe"
    >
      <div className="flex items-end gap-2 max-w-2xl mx-auto">
        {mode === 'textarea' ? (
          <Textarea
            ref={inputRef as React.Ref<HTMLTextAreaElement>}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={3}
            className="flex-1 resize-none text-base rounded-xl border-border/80"
          />
        ) : (
          <Input
            ref={inputRef as React.Ref<HTMLInputElement>}
            type={mode === 'email' ? 'email' : 'text'}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="flex-1 text-base h-11 rounded-xl border-border/80"
          />
        )}
        <Button
          size="icon"
          onClick={handleSubmit}
          disabled={disabled || !isValid}
          className="h-11 w-11 rounded-xl flex-shrink-0"
        >
          <Send size={18} />
        </Button>
      </div>
      {minLength > 0 && value.trim().length > 0 && value.trim().length < minLength && (
        <p className="text-xs text-muted-foreground mt-1 text-center">
          {t('minChars', { count: minLength })}
        </p>
      )}
    </motion.div>
  );
}
