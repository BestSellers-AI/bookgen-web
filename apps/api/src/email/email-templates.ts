const baseLayout = (content: string) => `
<!DOCTYPE html>
<html lang="en">
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
              &copy; ${new Date().getFullYear()} BestSellers AI. All rights reserved.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

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
}): string {
  const greeting = params.userName ? `Hi ${params.userName},` : 'Hi,';
  return baseLayout(`
    <p style="margin:0 0 16px;font-size:16px;color:#18181b;">${greeting}</p>
    <p style="margin:0 0 16px;font-size:16px;color:#3f3f46;">
      We received a request to reset your password. Click the button below to choose a new password.
    </p>
    ${button(params.resetUrl, 'Reset Password')}
    <p style="margin:0 0 8px;font-size:14px;color:#71717a;">
      This link will expire in <strong>1 hour</strong>.
    </p>
    <p style="margin:0;font-size:14px;color:#71717a;">
      If you didn't request a password reset, you can safely ignore this email.
    </p>
  `);
}

export function welcomeEmail(params: {
  userName: string;
  loginUrl: string;
}): string {
  return baseLayout(`
    <p style="margin:0 0 16px;font-size:16px;color:#18181b;">Hi ${params.userName},</p>
    <p style="margin:0 0 16px;font-size:16px;color:#3f3f46;">
      Welcome to <strong>BestSellers AI</strong>! Your account has been created and you're all set to start generating amazing books with AI.
    </p>
    ${button(params.loginUrl, 'Go to Dashboard')}
    <p style="margin:0;font-size:14px;color:#71717a;">
      If you have any questions, feel free to reach out to our support team.
    </p>
  `);
}

export function bookGeneratedEmail(params: {
  userName: string;
  bookTitle: string;
  bookUrl: string;
}): string {
  return baseLayout(`
    <p style="margin:0 0 16px;font-size:16px;color:#18181b;">Hi ${params.userName},</p>
    <p style="margin:0 0 16px;font-size:16px;color:#3f3f46;">
      Great news! Your book <strong>"${params.bookTitle}"</strong> has been fully generated and is ready for you to review.
    </p>
    ${button(params.bookUrl, 'View Your Book')}
    <p style="margin:0;font-size:14px;color:#71717a;">
      You can access all your books from your dashboard at any time.
    </p>
  `);
}
