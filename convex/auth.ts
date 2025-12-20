import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { simpleHash, simpleVerify } from "./utils/simpleHash";

// Fungsi login dengan password hashing
export const login = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const { email, password } = args;

    // Cari user berdasarkan email
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    // Jika user tidak ditemukan
    if (!user) {
      throw new Error("Email atau password salah");
    }

    // Compare password dengan hashed password
    const isPasswordValid = simpleVerify(password, user.password);
    if (!isPasswordValid) {
      throw new Error("Email atau password salah");
    }

    // Cek apakah user aktif
    if (!user.isActive) {
      throw new Error("Akun tidak aktif");
    }

    // Return user data tanpa password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },
});

// Fungsi untuk membuat user dengan password hashing
export const createUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.string(),
    role: v.union(v.literal("super_admin"), v.literal("manager"), v.literal("staff")),
    staffId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { name, email, password, role, staffId } = args;

    // Cek apakah user sudah ada
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (existingUser) {
      throw new Error("User dengan email ini sudah ada");
    }

    // Hash password sebelum menyimpan
    const hashedPassword = simpleHash(password);

    const now = Date.now();
    const userId = await ctx.db.insert("users", {
      name,
      email,
      password: hashedPassword,
      role,
      staffId,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return userId;
  },
});

// Fungsi untuk mendapatkan user berdasarkan ID
export const getUserById = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return null;
    }

    // Return user data tanpa password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },
});

// Fungsi untuk cek apakah ada user di database
export const hasUsers = query({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").take(1);
    return users.length > 0;
  },
});