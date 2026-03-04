import {
  BookStatus,
  WalletTransactionType,
  SubscriptionPlan,
} from './enums';
import { SUBSCRIPTION_PLANS, QUEUE_PRIORITIES } from './constants';
import type { PlanConfig } from './constants';

export function formatCurrency(
  amountCents: number,
  currency: string = 'USD',
  locale?: string,
): string {
  const amount = amountCents / 100;
  const resolvedLocale =
    locale ??
    (currency === 'BRL' ? 'pt-BR' : currency === 'EUR' ? 'de-DE' : 'en-US');

  return new Intl.NumberFormat(resolvedLocale, {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatDate(date: string | Date, locale: string = 'en-US'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);
}

export function formatDateTime(date: string | Date, locale: string = 'en-US'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function formatRelativeTime(date: string | Date, locale: string = 'en-US'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (diffSecs < 60) return rtf.format(-diffSecs, 'second');
  if (diffMins < 60) return rtf.format(-diffMins, 'minute');
  if (diffHours < 24) return rtf.format(-diffHours, 'hour');
  if (diffDays < 30) return rtf.format(-diffDays, 'day');
  if (diffDays < 365) return rtf.format(-Math.floor(diffDays / 30), 'month');
  return rtf.format(-Math.floor(diffDays / 365), 'year');
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const BOOK_STATUS_LABELS: Record<BookStatus, string> = {
  [BookStatus.DRAFT]: 'Draft',
  [BookStatus.PREVIEW_GENERATING]: 'Generating Preview',
  [BookStatus.PREVIEW]: 'Preview Ready',
  [BookStatus.PREVIEW_APPROVED]: 'Approved',
  [BookStatus.QUEUED]: 'In Queue',
  [BookStatus.GENERATING]: 'Generating',
  [BookStatus.GENERATED]: 'Completed',
  [BookStatus.ERROR]: 'Error',
  [BookStatus.CANCELLED]: 'Cancelled',
};

const BOOK_STATUS_COLORS: Record<BookStatus, string> = {
  [BookStatus.DRAFT]: 'text-gray-500 bg-gray-100',
  [BookStatus.PREVIEW_GENERATING]: 'text-violet-600 bg-violet-100',
  [BookStatus.PREVIEW]: 'text-blue-600 bg-blue-100',
  [BookStatus.PREVIEW_APPROVED]: 'text-indigo-600 bg-indigo-100',
  [BookStatus.QUEUED]: 'text-yellow-600 bg-yellow-100',
  [BookStatus.GENERATING]: 'text-orange-600 bg-orange-100',
  [BookStatus.GENERATED]: 'text-emerald-600 bg-emerald-100',
  [BookStatus.ERROR]: 'text-red-600 bg-red-100',
  [BookStatus.CANCELLED]: 'text-gray-400 bg-gray-100',
};

export function getBookStatusLabel(status: BookStatus): string {
  return BOOK_STATUS_LABELS[status] ?? status;
}

export function getBookStatusColor(status: BookStatus): string {
  return BOOK_STATUS_COLORS[status] ?? 'text-gray-500 bg-gray-100';
}

const TRANSACTION_TYPE_LABELS: Record<WalletTransactionType, string> = {
  [WalletTransactionType.CREDIT_PURCHASE]: 'Credit Purchase',
  [WalletTransactionType.BOOK_GENERATION]: 'Book Generation',
  [WalletTransactionType.ADDON_PURCHASE]: 'Addon Purchase',
  [WalletTransactionType.REFUND]: 'Refund',
  [WalletTransactionType.BONUS]: 'Bonus',
  [WalletTransactionType.ADJUSTMENT]: 'Adjustment',
  [WalletTransactionType.SUBSCRIPTION_CREDIT]: 'Plan Credits',
};

export function getTransactionTypeLabel(type: WalletTransactionType): string {
  return TRANSACTION_TYPE_LABELS[type] ?? type;
}

export function getPlanConfig(plan: SubscriptionPlan): PlanConfig {
  return SUBSCRIPTION_PLANS[plan];
}

export function getPlanQueuePriority(plan: SubscriptionPlan | null): number {
  if (!plan) return QUEUE_PRIORITIES.standard;
  const config = SUBSCRIPTION_PLANS[plan];
  return QUEUE_PRIORITIES[config.queuePriority];
}

export function calculateCreditExpiration(
  plan: SubscriptionPlan,
  periodEnd: Date,
): Date {
  const config = SUBSCRIPTION_PLANS[plan];
  const expiresAt = new Date(periodEnd);
  if (config.creditAccumulationMonths > 0) {
    expiresAt.setMonth(expiresAt.getMonth() + config.creditAccumulationMonths);
  }
  return expiresAt;
}

export function formatCredits(credits: number): string {
  return credits.toLocaleString();
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}
