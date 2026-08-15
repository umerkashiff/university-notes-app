import { Resend } from 'resend';

// Extract all available Resend API keys from environment
// Supports comma-separated list in RESEND_API_KEYS or single key in RESEND_API_KEY
function getApiKeys(): string[] {
  const multiKeys = process.env.RESEND_API_KEYS
    ? process.env.RESEND_API_KEYS.split(',').map(k => k.trim()).filter(Boolean)
    : [];
  
  const singleKey = process.env.RESEND_API_KEY?.trim();

  const allKeys = Array.from(new Set([...multiKeys, ...(singleKey ? [singleKey] : [])]));
  return allKeys;
}

// Track temporary rate limits or quota exhausts in-memory
const rateLimitedKeys = new Map<string, number>();

/**
 * Execute an email operation with automatic multi-key failover and quota pooling.
 * If Key #1 hits rate limits or quota limits (429/403/etc.), it seamlessly falls back to Key #2, #3, etc.
 */
export async function executeWithResendPool<T>(
  operation: (resend: Resend, key: string) => Promise<T>
): Promise<{ data: T | null; error: Error | null }> {
  const keys = getApiKeys();

  if (keys.length === 0) {
    // Development fallback / no keys configured
    console.warn('[ResendPool] No RESEND_API_KEY or RESEND_API_KEYS configured. Email send skipped.');
    return { data: null, error: null };
  }

  const now = Date.now();
  // Filter out keys that were rate-limited in the last 60 seconds
  const eligibleKeys = keys.filter(k => {
    const limitedUntil = rateLimitedKeys.get(k);
    return !limitedUntil || now > limitedUntil;
  });

  const keysToTry = eligibleKeys.length > 0 ? eligibleKeys : keys;

  let lastError: Error | null = null;

  for (let i = 0; i < keysToTry.length; i++) {
    const key = keysToTry[i];
    const client = new Resend(key);

    try {
      const result = await operation(client, key);
      return { data: result, error: null };
    } catch (err: any) {
      lastError = err;
      const errMsg = err?.message || String(err);
      const isRateLimitOrQuota = 
        errMsg.includes('429') || 
        errMsg.toLowerCase().includes('rate limit') || 
        errMsg.toLowerCase().includes('quota') ||
        errMsg.toLowerCase().includes('too many requests') ||
        errMsg.toLowerCase().includes('restricted');

      if (isRateLimitOrQuota) {
        console.warn(`[ResendPool] Key ending in ...${key.slice(-4)} hit quota/rate limit. Failing over to next key...`);
        // Mark key as limited for 2 minutes
        rateLimitedKeys.set(key, now + 120_000);
      } else {
        console.error(`[ResendPool] Error sending via key ...${key.slice(-4)}:`, errMsg);
      }
    }
  }

  return { data: null, error: lastError };
}
