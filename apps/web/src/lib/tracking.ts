/**
 * Read tracking data from cookies set by middleware.
 * Used during registration to associate UTMs + visitor/device info with the user.
 */

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

export function getVisitorId(): string | undefined {
  return getCookie('bsid') ?? undefined;
}

export function getUtmParams(): {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
} {
  const raw = getCookie('bs_utm');
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw);
    return {
      utmSource: parsed.utm_source ?? undefined,
      utmMedium: parsed.utm_medium ?? undefined,
      utmCampaign: parsed.utm_campaign ?? undefined,
      utmContent: parsed.utm_content ?? undefined,
      utmTerm: parsed.utm_term ?? undefined,
    };
  } catch {
    return {};
  }
}

export function getDeviceInfo(): {
  deviceType?: string;
  browserLanguage?: string;
  geoCountry?: string;
  geoCity?: string;
} {
  const raw = getCookie('bs_device');
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw);
    return {
      deviceType: parsed.deviceType ?? undefined,
      browserLanguage: parsed.browserLanguage ?? undefined,
      geoCountry: parsed.geoCountry ?? undefined,
      geoCity: parsed.geoCity ?? undefined,
    };
  } catch {
    return {};
  }
}

function getTimezone(): string | undefined {
  if (typeof Intl === 'undefined') return undefined;
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return undefined;
  }
}

export function getTrackingData() {
  return {
    visitorId: getVisitorId(),
    referrer: typeof document !== 'undefined' ? document.referrer || undefined : undefined,
    timezone: getTimezone(),
    ...getUtmParams(),
    ...getDeviceInfo(),
  };
}
