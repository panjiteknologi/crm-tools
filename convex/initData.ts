import { mutation } from "./_generated/server";
import { simpleHash } from "./utils/simpleHash";

export const initializeData = mutation({
  handler: async (ctx) => {
    try {
      // Hash password untuk semua users
      const hashedPassword = simpleHash("password");
      const now = Date.now();

      // Create super admin
      await ctx.db.insert("users", {
        name: "Super Admin",
        email: "admin@tsicertification.co.id",
        password: hashedPassword,
        role: "super_admin",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });

      // Create manager
      await ctx.db.insert("users", {
        name: "Diara",
        email: "diara@tsicertification.co.id",
        password: hashedPassword,
        role: "manager",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });

      // Create staff members
      await ctx.db.insert("users", {
        name: "Mercy",
        email: "mercy@tsicertification.co.id",
        password: hashedPassword,
        role: "staff",
        staffId: "1",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });

      await ctx.db.insert("users", {
        name: "Dhea",
        email: "dhea@tsicertification.co.id",
        password: hashedPassword,
        role: "staff",
        staffId: "2",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });

      return "Users initialized successfully with simple hash passwords";
    } catch (error: any) {
      if (error.message?.includes("Uniqueness constraint")) {
        return "Sample users already exist in database";
      }
      throw error;
    }
  },
});