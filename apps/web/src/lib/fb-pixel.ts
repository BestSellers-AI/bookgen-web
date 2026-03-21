/**
 * Facebook Pixel helper utilities.
 *
 * All tracking functions are safe to call server-side (they no-op).
 * Each function accepts an optional `eventId` for CAPI deduplication.
 */

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export function generateEventId(): string {
  return crypto.randomUUID();
}

function track(
  eventName: string,
  params: Record<string, unknown>,
  eventId?: string,
) {
  if (typeof window === 'undefined' || !window.fbq) return;
  if (eventId) {
    window.fbq('track', eventName, params, { eventID: eventId });
  } else {
    window.fbq('track', eventName, params);
  }
}

// ─── Standard Events ─────────────────────────────────────────────────────────

export function trackPageView(eventId?: string) {
  if (typeof window === 'undefined' || !window.fbq) return;
  if (eventId) {
    window.fbq('track', 'PageView', {}, { eventID: eventId });
  } else {
    window.fbq('track', 'PageView');
  }
}

export function trackViewContent(
  params: {
    content_name: string;
    content_category: string;
    content_ids?: string[];
    content_type?: string;
    value?: number;
    currency?: string;
  },
  eventId?: string,
) {
  track('ViewContent', params, eventId);
}

export function trackInitiateCheckout(
  params: {
    content_ids?: string[];
    content_name: string;
    content_category?: string;
    value: number;
    currency: string;
    num_items?: number;
  },
  eventId?: string,
) {
  track('InitiateCheckout', params, eventId);
}

export function trackPurchase(
  params: {
    content_ids?: string[];
    content_name: string;
    content_type?: string;
    value: number;
    currency: string;
    num_items?: number;
  },
  eventId?: string,
) {
  track('Purchase', params, eventId);
}

// ─── Cookie helpers (for CAPI deduplication) ─────────────────────────────────

export function getFbCookies(): { fbp?: string; fbc?: string } {
  if (typeof document === 'undefined') return {};
  const cookies = document.cookie.split('; ');
  let fbp: string | undefined;
  let fbc: string | undefined;
  for (const c of cookies) {
    if (c.startsWith('_fbp=')) fbp = c.slice(5);
    if (c.startsWith('_fbc=')) fbc = c.slice(5);
  }
  return { fbp, fbc };
}
