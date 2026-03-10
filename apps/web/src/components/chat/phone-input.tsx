'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, Send } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  COUNTRIES,
  getDefaultCountry,
  applyMask,
  type CountryPhone,
} from './phone-countries';

interface PhoneInputProps {
  placeholder?: string;
  onSubmit: (e164Phone: string) => void;
  disabled?: boolean;
}

export function PhoneInput({ placeholder, onSubmit, disabled }: PhoneInputProps) {
  const locale = useLocale();
  const t = useTranslations('chat');
  const [country, setCountry] = useState<CountryPhone>(() => getDefaultCountry(locale));
  const [rawDigits, setRawDigits] = useState('');
  const [displayValue, setDisplayValue] = useState('');
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Focus phone input on mount
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 300);
    return () => clearTimeout(timer);
  }, []);

  // Focus search when popover opens
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => searchRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const filtered = useMemo(() => {
    if (!search.trim()) return COUNTRIES;
    const q = search.toLowerCase();
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dial.includes(q) ||
        c.code.toLowerCase().includes(q),
    );
  }, [search]);

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '').slice(0, country.maxDigits);
    setRawDigits(digits);
    setDisplayValue(digits ? applyMask(digits, country.mask) : '');
  }

  function selectCountry(c: CountryPhone) {
    setCountry(c);
    // Reset phone when switching country
    setRawDigits('');
    setDisplayValue('');
    setOpen(false);
    setSearch('');
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  // Validate: at least 7 digits (international minimum)
  const isValid = rawDigits.length >= 7 && rawDigits.length <= country.maxDigits;

  function handleSubmit() {
    if (!isValid) return;
    onSubmit(`${country.dial}${rawDigits}`);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="flex items-center gap-2 max-w-2xl mx-auto w-full">
      {/* Country selector */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className="flex items-center gap-1 h-11 px-3 rounded-xl border border-input bg-background text-sm hover:bg-accent transition-colors flex-shrink-0 disabled:opacity-50"
          >
            <span className="text-lg leading-none">{country.flag}</span>
            <span className="text-muted-foreground text-xs">{country.dial}</span>
            <ChevronDown size={14} className="text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align="start"
          sideOffset={8}
          className="w-64 p-0"
        >
          {/* Search */}
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('phoneSearchCountry')}
                className="h-8 pl-8 text-sm"
              />
            </div>
          </div>

          {/* Country list */}
          <ScrollArea className="max-h-[min(240px,50vh)]">
            <div className="py-1">
              {filtered.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-3">
                  {t('phoneNoResults')}
                </p>
              ) : (
                filtered.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => selectCountry(c)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-accent transition-colors ${
                      c.code === country.code ? 'bg-accent/50' : ''
                    }`}
                  >
                    <span className="text-base leading-none">{c.flag}</span>
                    <span className="flex-1 text-left truncate">{c.name}</span>
                    <span className="text-xs text-muted-foreground">{c.dial}</span>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {/* Phone input */}
      <Input
        ref={inputRef}
        type="tel"
        inputMode="numeric"
        value={displayValue}
        onChange={handlePhoneChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder ?? applyMask('0'.repeat(country.maxDigits), country.mask)}
        disabled={disabled}
        className="flex-1 text-base h-11 rounded-xl"
      />

      {/* Send */}
      <Button
        size="icon"
        onClick={handleSubmit}
        disabled={disabled || !isValid}
        className="h-11 w-11 rounded-xl flex-shrink-0"
      >
        <Send size={18} />
      </Button>
    </div>
  );
}
