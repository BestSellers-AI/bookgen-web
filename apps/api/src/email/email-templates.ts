import { getTranslations } from './email-translations';

// ─── Shared components ─────────────────────────────────────────────────────

const baseLayout = (content: string, locale: string) => {
  const t = getTranslations(locale);
  return `
<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BestSellers AI</title>
</head>
<body style="margin:0;padding:0;background-color:#0D0F1C;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0D0F1C;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
          <tr>
            <td style="padding:32px 40px 24px;text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="vertical-align:middle;padding-right:12px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" style="width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#131627,#0D0F1C);">
                      <tr><td align="center" style="font-size:20px;">📖</td></tr>
                    </table>
                  </td>
                  <td style="vertical-align:middle;">
                    <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:700;color:#EDE5D4;letter-spacing:-0.3px;">Best Sellers</p>
                    <p style="margin:0;font-size:10px;font-weight:600;color:#F59E0B;letter-spacing:2px;text-transform:uppercase;">AI Platform</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1A1D2E;border-radius:16px;border:1px solid rgba(255,255,255,0.07);overflow:hidden;">
                <tr>
                  <td style="padding:36px 40px 40px;">
                    ${content}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#71717a;">&copy; ${new Date().getFullYear()} BestSellers AI. ${t.footer}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

const btn = (url: string, label: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 8px;">
    <tr>
      <td style="border-radius:10px;background-color:#F59E0B;">
        <a href="${url}" target="_blank" style="display:inline-block;padding:14px 36px;font-size:15px;font-weight:700;color:#0D0F1C;text-decoration:none;border-radius:10px;">${label}</a>
      </td>
    </tr>
  </table>`;

const btnOutline = (url: string, label: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:16px 0 8px;">
    <tr>
      <td style="border-radius:10px;border:2px solid rgba(245,158,11,0.4);">
        <a href="${url}" target="_blank" style="display:inline-block;padding:12px 32px;font-size:14px;font-weight:700;color:#F59E0B;text-decoration:none;border-radius:10px;">${label}</a>
      </td>
    </tr>
  </table>`;

const divider = () =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr><td style="height:1px;background:linear-gradient(to right,transparent,rgba(245,158,11,0.2),transparent);"></td></tr>
  </table>`;

const infoBox = (content: string) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
    <tr>
      <td style="padding:16px 20px;border-radius:10px;background-color:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.15);font-size:14px;color:#F59E0B;line-height:1.5;">
        ${content}
      </td>
    </tr>
  </table>`;

const text = (s: string) => `<p style="margin:0 0 8px;font-size:15px;color:#A1A1AA;line-height:1.6;">${s}</p>`;
const heading = (s: string) => `<p style="margin:0 0 16px;font-size:17px;font-weight:600;color:#EDE5D4;">${s}</p>`;
const muted = (s: string) => `<p style="margin:0 0 8px;font-size:13px;color:#71717a;line-height:1.5;">${s}</p>`;

// ─── 1. Password Reset ─────────────────────────────────────────────────────

export function passwordResetEmail(params: { resetUrl: string; userName?: string; locale?: string }) {
  const locale = params.locale ?? 'en';
  const t = getTranslations(locale);
  const html = baseLayout(`
    ${heading(t.greeting(params.userName))}
    ${text(t.resetBody)}
    ${btn(params.resetUrl, t.resetButton)}
    ${divider()}
    ${muted(t.resetExpiry)}
    ${muted(t.resetIgnore)}
  `, locale);
  return { subject: t.resetSubject, html };
}

// ─── 2. Welcome ─────────────────────────────────────────────────────────────

export function welcomeEmail(params: { userName: string; loginUrl: string; locale?: string }) {
  const locale = params.locale ?? 'en';
  const t = getTranslations(locale);
  const html = baseLayout(`
    ${heading(t.greeting(params.userName))}
    ${text(t.welcomeBody(params.userName))}
    ${btn(params.loginUrl, t.welcomeButton)}
    ${divider()}
    ${muted(t.welcomeHelp)}
  `, locale);
  return { subject: t.welcomeSubject, html };
}

// ─── 3. Welcome + Set Password ──────────────────────────────────────────────

export function welcomeSetPasswordEmail(params: { userName: string; resetUrl: string; locale?: string }) {
  const locale = params.locale ?? 'en';
  const t = getTranslations(locale);
  const html = baseLayout(`
    ${heading(t.greeting(params.userName))}
    ${text(t.welcomeSetPasswordBody)}
    ${btn(params.resetUrl, t.welcomeSetPasswordButton)}
    ${divider()}
    ${muted(t.welcomeSetPasswordExpiry)}
    ${muted(t.welcomeHelp)}
  `, locale);
  return { subject: t.welcomeSetPasswordSubject, html };
}

// ─── 4. Book Generated + Upsell ─────────────────────────────────────────────

export function bookGeneratedEmail(params: { userName: string; bookTitle: string; bookUrl: string; locale?: string }) {
  const locale = params.locale ?? 'en';
  const t = getTranslations(locale);
  const upsellItems = [t.bookUpsellCover, t.bookUpsellImages, t.bookUpsellTranslation, t.bookUpsellAudiobook]
    .map((item) => `<tr><td style="padding:6px 0;font-size:14px;color:#A1A1AA;line-height:1.5;">${item}</td></tr>`)
    .join('');
  const html = baseLayout(`
    ${heading(t.greeting(params.userName))}
    ${text(t.bookBody(params.bookTitle))}
    ${infoBox(`📖 <strong style="font-size:16px;">${params.bookTitle}</strong>`)}
    ${btn(params.bookUrl, t.bookButton)}
    ${divider()}
    <p style="margin:0 0 12px;font-size:15px;font-weight:600;color:#EDE5D4;">${t.bookNextSteps}</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">${upsellItems}</table>
    ${infoBox(`${t.bookUpsellPublish}<br><span style="font-size:13px;color:#A1A1AA;">${t.bookUpsellPublishDesc}</span>`)}
    ${btnOutline(params.bookUrl, t.bookPublishButton)}
    ${divider()}
    ${muted(t.bookHelp)}
  `, locale);
  return { subject: t.bookSubject(params.bookTitle), html };
}

// ─── 5. Book Error ──────────────────────────────────────────────────────────

export function bookErrorEmail(params: { userName: string; bookTitle: string; dashboardUrl: string; locale?: string }) {
  const locale = params.locale ?? 'en';
  const t = getTranslations(locale);
  const html = baseLayout(`
    ${heading(t.greeting(params.userName))}
    ${text(t.bookErrorBody(params.bookTitle))}
    ${infoBox(t.bookErrorRetry)}
    ${btn(params.dashboardUrl, t.bookErrorButton)}
  `, locale);
  return { subject: t.bookErrorSubject(params.bookTitle), html };
}

// ─── 6. New Subscription ────────────────────────────────────────────────────

export function subscriptionEmail(params: { userName: string; planName: string; credits: number; dashboardUrl: string; locale?: string }) {
  const locale = params.locale ?? 'en';
  const t = getTranslations(locale);
  const html = baseLayout(`
    ${heading(t.greeting(params.userName))}
    ${text(t.subscriptionBody(params.planName))}
    ${infoBox(t.subscriptionCredits(params.credits))}
    ${btn(params.dashboardUrl, t.subscriptionButton)}
  `, locale);
  return { subject: t.subscriptionSubject(params.planName), html };
}

// ─── 7. Subscription Updated ────────────────────────────────────────────────

export function subscriptionUpdateEmail(params: {
  userName: string;
  type: 'upgrade' | 'downgrade' | 'cancel' | 'renew';
  oldPlan?: string;
  newPlan?: string;
  endDate?: string;
  settingsUrl: string;
  locale?: string;
}) {
  const locale = params.locale ?? 'en';
  const t = getTranslations(locale);
  let body = '';
  switch (params.type) {
    case 'upgrade': body = t.subscriptionUpgradeBody(params.oldPlan ?? '', params.newPlan ?? ''); break;
    case 'downgrade': body = t.subscriptionDowngradeBody(params.oldPlan ?? '', params.newPlan ?? ''); break;
    case 'cancel': body = t.subscriptionCancelBody(params.oldPlan ?? '', params.endDate ?? ''); break;
    case 'renew': body = t.subscriptionRenewBody(params.oldPlan ?? ''); break;
  }
  const html = baseLayout(`
    ${heading(t.greeting(params.userName))}
    ${text(body)}
    ${btn(params.settingsUrl, t.subscriptionButton2)}
  `, locale);
  return { subject: t.subscriptionUpdateSubject, html };
}

// ─── 8. Credit Purchase ─────────────────────────────────────────────────────

export function creditPurchaseEmail(params: { userName: string; credits: number; packName: string; balance: number; dashboardUrl: string; locale?: string }) {
  const locale = params.locale ?? 'en';
  const t = getTranslations(locale);
  const html = baseLayout(`
    ${heading(t.greeting(params.userName))}
    ${text(t.creditPurchaseBody(params.credits, params.packName))}
    ${infoBox(t.creditPurchaseBalance(params.balance))}
    ${btn(params.dashboardUrl, t.creditPurchaseButton)}
  `, locale);
  return { subject: t.creditPurchaseSubject(params.credits), html };
}

// ─── 9. Addon Purchased ─────────────────────────────────────────────────────

export function addonPurchaseEmail(params: { userName: string; addonKind: string; bookTitle: string; bookUrl: string; locale?: string }) {
  const locale = params.locale ?? 'en';
  const t = getTranslations(locale);
  const addonName = t.addonName(params.addonKind);
  const html = baseLayout(`
    ${heading(t.greeting(params.userName))}
    ${text(t.addonPurchaseBody(addonName, params.bookTitle))}
    ${btn(params.bookUrl, t.addonPurchaseButton)}
  `, locale);
  return { subject: t.addonPurchaseSubject(addonName), html };
}

// ─── 10. Refund ─────────────────────────────────────────────────────────────

export function refundEmail(params: { userName: string; credits: number; reason: string; balance: number; locale?: string }) {
  const locale = params.locale ?? 'en';
  const t = getTranslations(locale);
  const html = baseLayout(`
    ${heading(t.greeting(params.userName))}
    ${text(t.refundBody(params.credits, params.reason))}
    ${infoBox(t.refundBalance(params.balance))}
  `, locale);
  return { subject: t.refundSubject, html };
}

// ─── 11. Addon Completed ────────────────────────────────────────────────────

export function addonCompleteEmail(params: { userName: string; addonKind: string; bookTitle: string; bookUrl: string; locale?: string }) {
  const locale = params.locale ?? 'en';
  const t = getTranslations(locale);
  const addonName = t.addonName(params.addonKind);
  const html = baseLayout(`
    ${heading(t.greeting(params.userName))}
    ${text(t.addonCompleteBody(addonName, params.bookTitle))}
    ${btn(params.bookUrl, t.addonCompleteButton)}
  `, locale);
  return { subject: t.addonCompleteSubject(addonName), html };
}

// ─── 12. Publishing Update ──────────────────────────────────────────────────

export function publishingUpdateEmail(params: { userName: string; bookTitle: string; status: string; bookUrl: string; locale?: string }) {
  const locale = params.locale ?? 'en';
  const t = getTranslations(locale);
  const statusLabel = t.publishingStatuses[params.status] ?? params.status;
  const html = baseLayout(`
    ${heading(t.greeting(params.userName))}
    ${text(t.publishingUpdateBody(params.bookTitle, statusLabel))}
    ${btn(params.bookUrl, t.publishingUpdateButton)}
  `, locale);
  return { subject: t.publishingUpdateSubject(statusLabel), html };
}

// ─── 13. Publishing Completed ───────────────────────────────────────────────

export function publishingCompleteEmail(params: { userName: string; bookTitle: string; publishedUrl?: string; bookUrl: string; locale?: string }) {
  const locale = params.locale ?? 'en';
  const t = getTranslations(locale);
  const html = baseLayout(`
    ${heading(t.greeting(params.userName))}
    ${text(t.publishingCompleteBody(params.bookTitle))}
    ${infoBox(`🎉 <strong style="font-size:16px;">${t.publishingCompleteCongrats}</strong>`)}
    ${params.publishedUrl ? btn(params.publishedUrl, t.publishingCompleteButton) : btn(params.bookUrl, t.publishingUpdateButton)}
  `, locale);
  return { subject: t.publishingCompleteSubject(params.bookTitle), html };
}

// ─── 14. Credits Expiring ───────────────────────────────────────────────────

export function creditsExpiringEmail(params: { userName: string; credits: number; expiryDate: string; dashboardUrl: string; locale?: string }) {
  const locale = params.locale ?? 'en';
  const t = getTranslations(locale);
  const html = baseLayout(`
    ${heading(t.greeting(params.userName))}
    ${text(t.creditsExpiringBody(params.credits, params.expiryDate))}
    ${btn(params.dashboardUrl, t.creditsExpiringButton)}
  `, locale);
  return { subject: t.creditsExpiringSubject(params.credits), html };
}

// ─── 15. Monthly Summary ────────────────────────────────────────────────────

export function monthlySummaryEmail(params: {
  userName: string;
  month: string;
  booksCreated: number;
  creditsUsed: number;
  creditsRemaining: number;
  dashboardUrl: string;
  locale?: string;
}) {
  const locale = params.locale ?? 'en';
  const t = getTranslations(locale);
  const html = baseLayout(`
    ${heading(t.greeting(params.userName))}
    ${text(t.monthlySummaryBody(params.month))}
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:16px 0;">
      <tr><td style="padding:8px 0;font-size:15px;color:#A1A1AA;line-height:1.6;">${t.monthlySummaryBooks(params.booksCreated)}</td></tr>
      <tr><td style="padding:8px 0;font-size:15px;color:#A1A1AA;line-height:1.6;">${t.monthlySummaryCreditsUsed(params.creditsUsed)}</td></tr>
      <tr><td style="padding:8px 0;font-size:15px;color:#A1A1AA;line-height:1.6;">${t.monthlySummaryCreditsRemaining(params.creditsRemaining)}</td></tr>
    </table>
    ${btn(params.dashboardUrl, t.monthlySummaryButton)}
  `, locale);
  return { subject: t.monthlySummarySubject(params.month), html };
}

// ─── 16. Purchase Recovery ──────────────────────────────────────────────────

export function purchaseRecoveryEmail(params: {
  userName: string;
  type: 'subscription' | 'credit_pack';
  productName: string;
  pricingUrl: string;
  locale?: string;
}) {
  const locale = params.locale ?? 'en';
  const t = getTranslations(locale);
  const isSubscription = params.type === 'subscription';
  const body = isSubscription
    ? t.recoverySubscriptionBody(params.productName)
    : t.recoveryCreditBody(params.productName);
  const subject = isSubscription
    ? t.recoverySubscriptionSubject
    : t.recoveryCreditSubject;

  const html = baseLayout(`
    ${heading(t.greeting(params.userName))}
    ${text(body)}
    ${btn(params.pricingUrl, t.recoveryButton)}
    ${text(`<span style="font-size:13px;color:#71717A;">${t.recoveryExpiry}</span>`)}
  `, locale);

  return { subject, html };
}

// ─── 17. Book Recovery ──────────────────────────────────────────────────────

export function bookRecoveryEmail(params: {
  userName: string;
  bookTitle: string;
  bookUrl: string;
  status: 'PREVIEW' | 'PREVIEW_COMPLETED';
  locale?: string;
}) {
  const locale = params.locale ?? 'en';
  const t = getTranslations(locale);
  const isPreview = params.status === 'PREVIEW';
  const body = isPreview
    ? t.bookRecoveryPreviewBody(params.bookTitle)
    : t.bookRecoveryPreviewCompletedBody(params.bookTitle);
  const subject = isPreview
    ? t.bookRecoveryPreviewSubject(params.bookTitle)
    : t.bookRecoveryPreviewCompletedSubject(params.bookTitle);

  const html = baseLayout(`
    ${heading(t.greeting(params.userName))}
    ${text(body)}
    ${btn(params.bookUrl, t.bookRecoveryButton)}
  `, locale);

  return { subject, html };
}
