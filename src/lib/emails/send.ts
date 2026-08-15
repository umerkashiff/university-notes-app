import { executeWithResendPool } from '@/lib/resend';

const DEFAULT_FROM = process.env.RESEND_FROM || 'Semstack <onboarding@resend.dev>';

/**
 * Send an email to one or multiple recipients with automatic Resend API key pool failover.
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

    // For 1-3 recipients, use standard send
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

    // For larger audience (e.g. Department announcements, batch semester advancements),
    // use batch sending in chunks of 50 to 100 with small pacing
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

      // Small 250ms spacing between chunks to respect rate limits
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
