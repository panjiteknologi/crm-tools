import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;
const SALT_PREFIX = "convex_crm_salt_2024"; // MUST match the original salt!

/**
 * Hash password menggunakan bcrypt (synchronous version for Convex)
 * NOTE: Using sync version because Convex doesn't allow async/bcrypt in mutations
 */
export function hashPassword(password: string): string {
  const salt = bcrypt.genSaltSync(SALT_ROUNDS);
  return bcrypt.hashSync(password, salt);
}

/**
 * Simple hash (LEGACY - for backward compatibility)
 * This must match exactly the original simpleHash function
 */
function simpleHash(password: string): string {
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
 * Check if password is using legacy hash format
 */
function isLegacyHash(hashedPassword: string): boolean {
  // Legacy hashes are exactly 32 characters and don't start with $2a$ or $2b$
  return hashedPassword.length === 32 && !hashedPassword.startsWith('$2');
}

/**
 * Compare password plain text dengan hashed password (synchronous)
 * Supports both legacy hash, bcrypt, and plaintext (for migration)
 */
export function comparePassword(
  plainPassword: string,
  hashedPassword: string
): boolean {
  // Check if it's bcrypt
  if (hashedPassword.startsWith('$2')) {
    return bcrypt.compareSync(plainPassword, hashedPassword);
  }

  // Check if it's legacy hash (exactly 32 characters)
  if (hashedPassword.length === 32) {
    const computedHash = simpleHash(plainPassword);
    return computedHash === hashedPassword;
  }

  // Otherwise assume it's plaintext or another format
  return plainPassword === hashedPassword;
}

/**
 * Async versions - use these in Convex Actions only
 */
export async function hashPasswordAsync(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return await bcrypt.hash(password, salt);
}

/**
 * Async compare - use in Convex Actions only
 */
export async function comparePasswordAsync(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  // Check if it's legacy hash
  if (isLegacyHash(hashedPassword)) {
    // Use legacy verification
    const computedHash = simpleHash(plainPassword);
    return computedHash === hashedPassword;
  }

  // Use bcrypt verification
  return await bcrypt.compare(plainPassword, hashedPassword);
}