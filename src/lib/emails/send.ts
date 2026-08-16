import nodemailer from 'nodemailer';
import { executeWithResendPool } from '@/lib/resend';

function getSmtpTransporter() {
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.replace(/\s+/g, '').trim();
  if (!user || !pass) return null;

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
}

const DEFAULT_FROM =
  process.env.SMTP_FROM ||
  (process.env.SMTP_USER ? `Semstack <${process.env.SMTP_USER}>` : null) ||
  process.env.RESEND_FROM ||
  'Semstack <onboarding@resend.dev>';

/**
 * Send an email to one or multiple recipients with SMTP support and Resend failover pool.
 * Never throws an unhandled error so email operations never disrupt critical DB mutations.
 */
export async function sendEmail(
  to: string | string[],
  subject: string,
  html: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const recipients = Array.isArray(to)
      ? Array.from(new Set(to.map(e => e.trim().toLowerCase()).filter(Boolean)))
      : [to.trim().toLowerCase()].filter(Boolean);

    if (recipients.length === 0) {
      return { success: false, error: 'No recipient email specified' };
    }

    const smtpTransporter = getSmtpTransporter();

    // 1. Try sending via Gmail SMTP if configured (Works with ANY recipient worldwide)
    if (smtpTransporter) {
      try {
        const fromAddress = DEFAULT_FROM;

        for (const recipient of recipients) {
          await smtpTransporter.sendMail({
            from: fromAddress,
            to: recipient,
            subject,
            html,
          });
        }

        return { success: true };
      } catch (smtpErr: any) {
        console.warn('[sendEmail] SMTP dispatch failed, falling back to Resend:', smtpErr?.message || smtpErr);
      }
    }

    // 2. Fallback to Resend API pool
    if (recipients.length <= 3) {
      for (const recipient of recipients) {
        const { error } = await executeWithResendPool(async (resend) => {
          return await resend.emails.send({
            from: DEFAULT_FROM,
            to: recipient,
            subject,
            html,
          });
        });

        if (error) {
          console.error(`[sendEmail] Failed to send email to ${recipient}:`, error.message);
        }
      }

      return { success: true };
    }

    // Batch sending for larger audience via Resend
    const CHUNK_SIZE = 50;
    for (let i = 0; i < recipients.length; i += CHUNK_SIZE) {
      const chunk = recipients.slice(i, i + CHUNK_SIZE);
      const batchPayload = chunk.map(r => ({
        from: DEFAULT_FROM,
        to: r,
        subject,
        html,
      }));

      const { error } = await executeWithResendPool(async (resend) => {
        return await resend.batch.send(batchPayload);
      });

      if (error) {
        console.error(`[sendEmail] Batch send error for chunk ${i / CHUNK_SIZE + 1}:`, error.message);
      }

      if (i + CHUNK_SIZE < recipients.length) {
        await new Promise(res => setTimeout(res, 250));
      }
    }

    return { success: true };
  } catch (err: any) {
    console.error('[sendEmail] Unexpected exception during email dispatch:', err?.message || err);
    return { success: false, error: err?.message };
  }
}
