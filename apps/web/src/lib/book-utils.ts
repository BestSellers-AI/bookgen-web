import type { BookStatus } from '@bestsellers/shared';

export const BOOK_STATUS_BADGE_CLASSES: Record<string, string> = {
  DRAFT: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  PREVIEW_GENERATING: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  PREVIEW: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  PREVIEW_COMPLETING: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  PREVIEW_COMPLETED: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  PREVIEW_APPROVED: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  QUEUED: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  GENERATING: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  GENERATED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  ERROR: 'bg-red-500/10 text-red-400 border-red-500/20',
  CANCELLED: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

export const DASHBOARD_TAB_STATUSES: Record<string, string[]> = {
  preview: ['DRAFT', 'PREVIEW', 'PREVIEW_GENERATING', 'PREVIEW_COMPLETING', 'PREVIEW_COMPLETED', 'PREVIEW_APPROVED'],
  generating: ['QUEUED', 'GENERATING'],
  ready: ['GENERATED'],
};

export function getStatusBadgeClass(status: string): string {
  return BOOK_STATUS_BADGE_CLASSES[status] || 'bg-gray-500/10 text-gray-400 border-gray-500/20';
}

export function getBookTabForStatus(status: string): string {
  for (const [tab, statuses] of Object.entries(DASHBOARD_TAB_STATUSES)) {
    if (statuses.includes(status)) return tab;
  }
  return 'preview';
}
