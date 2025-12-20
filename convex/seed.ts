import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const seedUsers = mutation({
  handler: async (ctx) => {
    // Cek apakah sudah ada user
    const existingUsers = await ctx.db.query("users").take(1);
    if (existingUsers.length > 0) {
      return "Users already exist";
    }

    const now = Date.now();

    // Create super admin
    await ctx.db.insert("users", {
      name: "Super Admin",
      email: "admin@tsicertification.co.id",
      password: "password", // Dalam production, gunakan hash password
      role: "super_admin",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    // Create manager
    await ctx.db.insert("users", {
      name: "Diara",
      email: "diara@tsicertification.co.id",
      password: "password",
      role: "manager",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    // Create staff members
    await ctx.db.insert("users", {
      name: "Mercy",
      email: "mercy@tsicertification.co.id",
      password: "password",
      role: "staff",
      staffId: "1",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("users", {
      name: "Dhea",
      email: "dhea@tsicertification.co.id",
      password: "password",
      role: "staff",
      staffId: "2",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return "Sample users created successfully";
  },
});