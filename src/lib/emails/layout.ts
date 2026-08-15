/**
 * Shared HTML email layout wrapper matching Semstack design aesthetics.
 * Built with bulletproof table-based inline CSS compatible across Apple Mail, Gmail, Outlook, and mobile clients.
 */

export function wrapEmailLayout(options: {
  previewText: string;
  title: string;
  badge?: { text: string; bg: string; color: string };
  contentHtml: string;
  ctaButton?: { text: string; url: string };
  secondaryInfoHtml?: string;
}): string {
  const { previewText, title, badge, contentHtml, ctaButton, secondaryInfoHtml } = options;

  const appUrl = process.env.APP_URL || 'https://university-notes-app.vercel.app';
  const ctaUrl = ctaButton?.url?.startsWith('http') ? ctaButton.url : `${appUrl}${ctaButton?.url || ''}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td { font-family: Arial, Helvetica, sans-serif !important; }
  </style>
  <![endif]-->
  <style type="text/css">
    @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');
    body {
      margin: 0;
      padding: 0;
      width: 100% !important;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
      background-color: #f7f5f2;
      font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    img {
      border: 0;
      outline: none;
      text-decoration: none;
    }
    table {
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    .email-card {
      background-color: #ffffff;
      border-radius: 24px;
      border: 1px solid #e8e4de;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);
    }
    .cta-btn:hover {
      opacity: 0.92 !important;
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f7f5f2; color: #252629; font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <!-- Preview Text Hidden Snippet -->
  <div style="display: none; font-size: 1px; color: #f7f5f2; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    ${previewText}
  </div>

  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f7f5f2; width: 100%;">
    <tr>
      <td align="center" style="padding: 40px 16px 48px 16px;">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 540px; width: 100%;">
          
          <!-- Top Header / Brand Logo -->
          <tr>
            <td align="center" style="padding-bottom: 28px;">
              <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="vertical-align: middle;">
                    <!-- Badge Header -->
                    <div style="display: inline-block; background-color: #252629; color: #ffffff; font-weight: 800; font-size: 13px; letter-spacing: 0.5px; border-radius: 9999px; padding: 6px 14px 6px 14px; text-transform: uppercase;">
                      SEMSTACK
                    </div>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 6px;">
                    <span style="font-size: 12px; font-weight: 600; color: #787a80; letter-spacing: 0.2px;">
                      Department of Computer Engineering
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main White Card -->
          <tr>
            <td class="email-card" style="background-color: #ffffff; border-radius: 24px; border: 1px solid #e8e4de; padding: 36px 32px 36px 32px; box-shadow: 0 4px 16px rgba(0,0,0,0.03);">
              
              <!-- Badge (optional) -->
              ${badge ? `
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 16px;">
                <tr>
                  <td style="background-color: ${badge.bg}; color: ${badge.color}; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.4px;">
                    ${badge.text}
                  </td>
                </tr>
              </table>
              ` : ''}

              <!-- Title -->
              <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; color: #252629; line-height: 1.35; letter-spacing: -0.3px;">
                ${title}
              </h1>

              <!-- Body HTML Content -->
              <div style="font-size: 14px; line-height: 1.65; color: #43454b;">
                ${contentHtml}
              </div>

              <!-- Secondary Highlight Box (if any) -->
              ${secondaryInfoHtml ? `
              <div style="margin-top: 24px; padding: 16px 20px; background-color: #f7f5f2; border-radius: 16px; border: 1px solid #eae6df; font-size: 13px; line-height: 1.6; color: #43454b;">
                ${secondaryInfoHtml}
              </div>
              ` : ''}

              <!-- Primary CTA Button -->
              ${ctaButton ? `
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin-top: 28px; width: 100%;">
                <tr>
                  <td align="left">
                    <a href="${ctaUrl}" target="_blank" style="display: inline-block; background-color: #252629; color: #f7f5f2; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 28px; border-radius: 9999px; text-align: center; box-shadow: 0 2px 8px rgba(37,38,41,0.15);">
                      ${ctaButton.text} &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              ` : ''}

            </td>
          </tr>

          <!-- Footer Area -->
          <tr>
            <td align="center" style="padding-top: 28px; font-size: 12px; color: #8c8e94; line-height: 1.6;">
              <p style="margin: 0 0 6px 0; font-weight: 600; color: #5a5c62;">
                Semstack — Your Academic Study Companion
              </p>
              <p style="margin: 0;">
                University of Engineering and Technology · Lahore
              </p>
              <p style="margin: 8px 0 0 0; font-size: 11px; color: #a4a6ac;">
                You received this notification because your account is registered on Semstack.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
