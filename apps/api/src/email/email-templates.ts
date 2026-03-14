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
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding:32px 40px 24px;text-align:center;background-color:#18181b;">
              <h1 style="margin:0;font-size:24px;font-weight:700;color:#ffffff;">BestSellers AI</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px 40px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px;text-align:center;border-top:1px solid #e4e4e7;color:#a1a1aa;font-size:12px;">
              &copy; ${new Date().getFullYear()} BestSellers AI. ${t.footer}
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
  `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto;">
    <tr>
      <td style="border-radius:8px;background-color:#18181b;">
        <a href="${url}" target="_blank" style="display:inline-block;padding:12px 32px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">${label}</a>
      </td>
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
    <p style="margin:0 0 16px;font-size:16px;color:#18181b;">${greeting}</p>
    <p style="margin:0 0 16px;font-size:16px;color:#3f3f46;">
      ${t.resetBody}
    </p>
    ${button(params.resetUrl, t.resetButton)}
    <p style="margin:0 0 8px;font-size:14px;color:#71717a;">
      ${t.resetExpiry}
    </p>
    <p style="margin:0;font-size:14px;color:#71717a;">
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
    <p style="margin:0 0 16px;font-size:16px;color:#18181b;">${t.greeting(params.userName)}</p>
    <p style="margin:0 0 16px;font-size:16px;color:#3f3f46;">
      ${t.welcomeBody(params.userName)}
    </p>
    ${button(params.loginUrl, t.welcomeButton)}
    <p style="margin:0;font-size:14px;color:#71717a;">
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
    <p style="margin:0 0 16px;font-size:16px;color:#18181b;">${t.greeting(params.userName)}</p>
    <p style="margin:0 0 16px;font-size:16px;color:#3f3f46;">
      ${t.welcomeSetPasswordBody}
    </p>
    ${button(params.resetUrl, t.welcomeSetPasswordButton)}
    <p style="margin:0 0 8px;font-size:14px;color:#71717a;">
      ${t.welcomeSetPasswordExpiry}
    </p>
    <p style="margin:0;font-size:14px;color:#71717a;">
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
    <p style="margin:0 0 16px;font-size:16px;color:#18181b;">${t.greeting(params.userName)}</p>
    <p style="margin:0 0 16px;font-size:16px;color:#3f3f46;">
      ${t.bookBody(params.bookTitle)}
    </p>
    ${button(params.bookUrl, t.bookButton)}
    <p style="margin:0;font-size:14px;color:#71717a;">
      ${t.bookHelp}
    </p>
  `, locale);
  return { subject: t.bookSubject(params.bookTitle), html };
}
