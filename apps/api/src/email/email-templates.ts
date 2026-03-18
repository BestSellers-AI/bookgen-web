import { getTranslations } from './email-translations';

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
          <!-- Header / Logo -->
          <tr>
            <td style="padding:32px 40px 24px;text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="vertical-align:middle;padding-right:12px;">
                    <!-- Book icon recreation -->
                    <table role="presentation" cellpadding="0" cellspacing="0" style="width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#131627,#0D0F1C);">
                      <tr>
                        <td align="center" style="font-size:20px;">📖</td>
                      </tr>
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

          <!-- Content Card -->
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

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#71717a;">
                &copy; ${new Date().getFullYear()} BestSellers AI. ${t.footer}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
};

const button = (url: string, label: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 8px;">
    <tr>
      <td style="border-radius:10px;background-color:#F59E0B;">
        <a href="${url}" target="_blank" style="display:inline-block;padding:14px 36px;font-size:15px;font-weight:700;color:#0D0F1C;text-decoration:none;border-radius:10px;letter-spacing:0.2px;">${label}</a>
      </td>
    </tr>
  </table>`;

const divider = () =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr>
      <td style="height:1px;background:linear-gradient(to right,transparent,rgba(245,158,11,0.2),transparent);"></td>
    </tr>
  </table>`;

export function passwordResetEmail(params: {
  resetUrl: string;
  userName?: string;
  locale?: string;
}): { subject: string; html: string } {
  const locale = params.locale ?? 'en';
  const t = getTranslations(locale);
  const greeting = t.greeting(params.userName);
  const html = baseLayout(`
    <p style="margin:0 0 16px;font-size:17px;font-weight:600;color:#EDE5D4;">${greeting}</p>
    <p style="margin:0 0 8px;font-size:15px;color:#A1A1AA;line-height:1.6;">
      ${t.resetBody}
    </p>
    ${button(params.resetUrl, t.resetButton)}
    ${divider()}
    <p style="margin:0 0 8px;font-size:13px;color:#71717a;line-height:1.5;">
      ${t.resetExpiry}
    </p>
    <p style="margin:0;font-size:13px;color:#71717a;line-height:1.5;">
      ${t.resetIgnore}
    </p>
  `, locale);
  return { subject: t.resetSubject, html };
}

export function welcomeEmail(params: {
  userName: string;
  loginUrl: string;
  locale?: string;
}): { subject: string; html: string } {
  const locale = params.locale ?? 'en';
  const t = getTranslations(locale);
  const html = baseLayout(`
    <p style="margin:0 0 16px;font-size:17px;font-weight:600;color:#EDE5D4;">${t.greeting(params.userName)}</p>
    <p style="margin:0 0 8px;font-size:15px;color:#A1A1AA;line-height:1.6;">
      ${t.welcomeBody(params.userName)}
    </p>
    ${button(params.loginUrl, t.welcomeButton)}
    ${divider()}
    <p style="margin:0;font-size:13px;color:#71717a;line-height:1.5;">
      ${t.welcomeHelp}
    </p>
  `, locale);
  return { subject: t.welcomeSubject, html };
}

export function welcomeSetPasswordEmail(params: {
  userName: string;
  resetUrl: string;
  locale?: string;
}): { subject: string; html: string } {
  const locale = params.locale ?? 'en';
  const t = getTranslations(locale);
  const html = baseLayout(`
    <p style="margin:0 0 16px;font-size:17px;font-weight:600;color:#EDE5D4;">${t.greeting(params.userName)}</p>
    <p style="margin:0 0 8px;font-size:15px;color:#A1A1AA;line-height:1.6;">
      ${t.welcomeSetPasswordBody}
    </p>
    ${button(params.resetUrl, t.welcomeSetPasswordButton)}
    ${divider()}
    <p style="margin:0 0 8px;font-size:13px;color:#71717a;line-height:1.5;">
      ${t.welcomeSetPasswordExpiry}
    </p>
    <p style="margin:0;font-size:13px;color:#71717a;line-height:1.5;">
      ${t.welcomeHelp}
    </p>
  `, locale);
  return { subject: t.welcomeSetPasswordSubject, html };
}

export function bookGeneratedEmail(params: {
  userName: string;
  bookTitle: string;
  bookUrl: string;
  locale?: string;
}): { subject: string; html: string } {
  const locale = params.locale ?? 'en';
  const t = getTranslations(locale);
  const html = baseLayout(`
    <p style="margin:0 0 16px;font-size:17px;font-weight:600;color:#EDE5D4;">${t.greeting(params.userName)}</p>
    <p style="margin:0 0 8px;font-size:15px;color:#A1A1AA;line-height:1.6;">
      ${t.bookBody(params.bookTitle)}
    </p>
    <p style="margin:16px 0 0;padding:16px 20px;border-radius:10px;background-color:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.15);font-size:16px;font-weight:700;color:#F59E0B;text-align:center;">
      📖 ${params.bookTitle}
    </p>
    ${button(params.bookUrl, t.bookButton)}
    ${divider()}
    <p style="margin:0;font-size:13px;color:#71717a;line-height:1.5;">
      ${t.bookHelp}
    </p>
  `, locale);
  return { subject: t.bookSubject(params.bookTitle), html };
}
