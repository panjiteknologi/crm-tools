import { QueryCtx, MutationCtx } from "../_generated/server";

interface RateLimitEntry {
  attempts: number;
  lastAttempt: number;
  blockedUntil?: number;
}

const MAX_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const ATTEMPT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

// In-memory store (Note: In production, use Redis or Convex database)
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Check if IP/email is rate limited
 * Returns true if blocked, false otherwise
 */
export async function checkRateLimit(
  ctx: QueryCtx | MutationCtx,
  identifier: string
): Promise<{ allowed: boolean; remainingAttempts?: number; blockUntil?: number }> {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // If no entry exists, allow
  if (!entry) {
    rateLimitStore.set(identifier, {
      attempts: 1,
      lastAttempt: now,
    });
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS - 1 };
  }

  // Check if currently blocked
  if (entry.blockedUntil && entry.blockedUntil > now) {
    return {
      allowed: false,
      blockUntil: entry.blockedUntil,
    };
  }

  // Check if attempts window has expired
  if (now - entry.lastAttempt > ATTEMPT_WINDOW_MS) {
    // Reset attempts
    rateLimitStore.set(identifier, {
      attempts: 1,
      lastAttempt: now,
    });
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS - 1 };
  }

  // Increment attempts
  entry.attempts++;
  entry.lastAttempt = now;

  // Check if max attempts reached
  if (entry.attempts >= MAX_ATTEMPTS) {
    entry.blockedUntil = now + BLOCK_DURATION_MS;
    rateLimitStore.set(identifier, entry);
    return {
      allowed: false,
      blockUntil: entry.blockedUntil,
    };
  }

  rateLimitStore.set(identifier, entry);
  return {
    allowed: true,
    remainingAttempts: MAX_ATTEMPTS - entry.attempts,
  };
}

/**
 * Clear rate limit for identifier (e.g., after successful login)
 */
export function clearRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier);
}

/**
 * Get remaining block time in minutes
 */
export function getBlockTimeRemaining(blockedUntil: number): number {
  const now = Date.now();
  const remaining = Math.max(0, blockedUntil - now);
  return Math.ceil(remaining / 60000); // Convert to minutes
}
