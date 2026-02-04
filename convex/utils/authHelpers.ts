import { QueryCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { v } from "convex/values";

/**
 * Get current user from authentication context
 * Returns null if not authenticated
 *
 * NOTE: This is a simplified version for development
 * For production, implement proper Convex Auth or JWT tokens
 */
export async function getCurrentUser(ctx: QueryCtx): Promise<any | null> {
  // For now, we'll skip authentication on server-side
  // The frontend handles auth via localStorage
  // THIS IS NOT SECURE FOR PRODUCTION - only for development

  // TODO: Implement proper token-based authentication
  // 1. Configure Convex Auth (https://docs.convex.dev/auth)
  // 2. Or implement JWT token validation
  // 3. Pass token from frontend and validate here

  return null; // Disabled for now - frontend handles auth
}

/**
 * Assert that user is authenticated
 * Throws error if not authenticated
 *
 * NOTE: Currently disabled - will be enabled when Convex Auth is configured
 */
export async function requireUser(ctx: QueryCtx): Promise<any> {
  // const user = await getCurrentUser(ctx);
  // if (!user) {
  //   throw new Error("Unauthorized: Please login to continue");
  // }
  // return user;

  // For now, just return a mock object to allow operations
  // THIS IS NOT SECURE - only for development!
  return null;
}

/**
 * Check if user has required role
 */
export function hasRole(
  user: { role: string },
  allowedRoles: string[]
): boolean {
  return allowedRoles.includes(user.role);
}

/**
 * Assert that user has required role
 * Throws error if not authorized
 */
export async function requireRole(
  ctx: QueryCtx,
  allowedRoles: string[]
) {
  const user = await requireUser(ctx);
  if (!hasRole(user, allowedRoles)) {
    throw new Error(
      `Forbidden: Required role: ${allowedRoles.join(" or ")}`
    );
  }
  return user;
}

/**
 * Check if user can access target data
 */
export async function canAccessTarget(
  ctx: QueryCtx,
  targetId: Id<"targets">
): Promise<boolean> {
  const user = await getCurrentUser(ctx);
  if (!user) {
    return false;
  }

  // Super admin and manager can access all targets
  if (user.role === "super_admin" || user.role === "manager") {
    return true;
  }

  // Staff can only access their own targets
  const target = await ctx.db.get(targetId);
  if (!target) {
    return false;
  }

  return target.pic === user._id || target.created_by === user._id;
}

/**
 * Check if user can access CRM target data
 */
export async function canAccessCrmTarget(
  ctx: QueryCtx,
  picCrm: string
): Promise<boolean> {
  const user = await getCurrentUser(ctx);
  if (!user) {
    return false;
  }

  // Super admin and manager can access all CRM targets
  if (user.role === "super_admin" || user.role === "manager") {
    return true;
  }

  // Staff can only access CRM targets assigned to them
  return picCrm === user.email || picCrm === user.name;
}
