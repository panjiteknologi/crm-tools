// Simple password hashing utility untuk Convex (tanpa bcrypt)
import { v } from "convex/values";

const SALT_PREFIX = "convex_crm_salt_2024";

/**
 * Simple hash function tanpa setTimeout
 * Ini adalah placeholder - untuk production gunakan bcrypt di client side
 */
export function simpleHash(password: string): string {
  // Simple hash - combine password dengan salt
  const combined = password + SALT_PREFIX;

  // Buat simple hash menggunakan built-in crypto
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  return btoa(hash.toString()).replace(/[/+=]/g, '').substring(0, 32);
}

/**
 * Simple password verification
 */
export function simpleVerify(password: string, hashedPassword: string): boolean {
  const computedHash = simpleHash(password);
  return computedHash === hashedPassword;
}