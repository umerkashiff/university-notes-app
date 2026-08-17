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

  const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL 
    || process.env.APP_URL 
    || 'https://semstack.vercel.app';
  
  const appUrl = rawAppUrl.replace(/\/+$/, '');
  const logoUrl = 'cid:semstack-logo';
  const ctaUrl = ctaButton?.url?.startsWith('http') ? ctaButton.url : `${appUrl}${ctaButton?.url?.startsWith('/') ? ctaButton.url : `/${ctaButton?.url || ''}`}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td { font-family: Arial, Helvetica, sans-serif !important; }
  </style>
  <![endif]-->
  <style type="text/css">
    body {
      margin: 0;
      padding: 0;
      width: 100% !important;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
      background-color: #f7f5f2;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    img {
      border: 0;
      outline: none;
      text-decoration: none;
    }
    table {
      border-collapse: separate;
      border-spacing: 0;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    .email-card {
      border-collapse: separate !important;
      border-spacing: 0 !important;
      background-color: #ffffff;
      border-radius: 24px;
      border: 1px solid #e8e4de;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);
      overflow: hidden;
    }
    .cta-btn:hover {
      opacity: 0.92 !important;
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f7f5f2; color: #252629; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">

  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse: separate; border-spacing: 0; background-color: #f7f5f2; width: 100%;">
    <tr>
      <td align="center" style="padding: 40px 16px 48px 16px; border: 0;">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse: separate; border-spacing: 0; max-width: 540px; width: 100%;">
          
          <!-- Top Header / Brand Logo -->
          <tr>
            <td align="center" style="padding-bottom: 28px; border: 0;">
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="border-collapse: separate; border-spacing: 0;">
                <tr>
                  <td align="center" style="vertical-align: middle; border: 0;">
                    <!-- Brand Pill with Logo -->
                    <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="border-collapse: separate; border-spacing: 0; background-color: #000000; border-radius: 9999px; padding: 4px 14px 4px 5px;">
                      <tr>
                        <td align="center" valign="middle" style="vertical-align: middle; padding: 0; line-height: 0; font-size: 0; border: 0;">
                          <img src="${logoUrl}" width="28" height="28" alt="Semstack Logo" style="display: block; width: 28px; height: 28px; border-radius: 50%; background-color: #000000; border: 0;" />
                        </td>
                        <td align="left" valign="middle" style="vertical-align: middle; padding-left: 8px; padding-right: 2px; border: 0; line-height: 1;">
                          <span style="color: #ffffff; font-weight: 800; font-size: 13px; letter-spacing: 0.8px; text-transform: uppercase; line-height: 1; font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: inline-block; vertical-align: middle; padding-top: 1px;">
                            SEMSTACK
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 8px; border: 0;">
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
            <td align="center" style="padding: 0; border: 0;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" class="email-card" style="border-collapse: separate; border-spacing: 0; background-color: #ffffff; border-radius: 24px; border: 1px solid #e8e4de; box-shadow: 0 4px 16px rgba(0,0,0,0.03); overflow: hidden;">
                <tr>
                  <td style="padding: 36px 32px 36px 32px; background-color: #ffffff; border-radius: 24px; border: 0;">
                    
                    <!-- Badge (optional) -->
                    ${badge ? `
                    <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="border-collapse: separate; border-spacing: 0; margin-bottom: 16px;">
                      <tr>
                        <td style="background-color: ${badge.bg}; color: ${badge.color}; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.4px; border: 0;">
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
                    <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="border-collapse: separate; border-spacing: 0; margin-top: 28px; width: 100%;">
                      <tr>
                        <td align="left" style="border: 0;">
                          <a href="${ctaUrl}" target="_blank" style="display: inline-block; background-color: #252629; color: #f7f5f2; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 28px; border-radius: 9999px; text-align: center; box-shadow: 0 2px 8px rgba(37,38,41,0.15);">
                            ${ctaButton.text} &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>
                    ` : ''}

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer Area -->
          <tr>
            <td align="center" style="padding-top: 28px; font-size: 12px; color: #8c8e94; line-height: 1.6; border: 0;">
              <p style="margin: 0 0 6px 0; font-weight: 600; color: #5a5c62;">
                Semstack — Your Academic Study Companion
              </p>
              <p style="margin: 0;">
                University of Engineering and Technology · Lahore
              </p>
              <p style="margin: 8px 0 0 0; font-size: 11px; color: #a4a6ac;">
                You received this notification because your account is registered on Semstack. &middot; <a href="${appUrl}" target="_blank" style="color: #b3b5bb; text-decoration: underline; text-underline-offset: 2px;">Stop receiving these emails</a>
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
