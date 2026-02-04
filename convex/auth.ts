import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { comparePassword, hashPassword } from "./utils/password";
import { checkRateLimit, clearRateLimit, getBlockTimeRemaining } from "./utils/rateLimiter";

// Fungsi login dengan password hashing yang aman dan rate limiting
export const login = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const { email, password } = args;

    // Check rate limiting by email
    const rateLimitResult = await checkRateLimit(ctx, email);
    if (!rateLimitResult.allowed) {
      const blockTimeRemaining = getBlockTimeRemaining(rateLimitResult.blockUntil!);
      throw new Error(
        `Terlalu banyak percobaan login gagal. Akun diblokir sementara selama ${blockTimeRemaining} menit. Silakan coba lagi nanti.`
      );
    }

    // Cari user berdasarkan email
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    // Jika user tidak ditemukan
    if (!user) {
      throw new Error("Email atau password salah");
    }

    // Compare password dengan hashed password menggunakan bcrypt (synchronous)
    const isPasswordValid = comparePassword(password, user.password);

    if (!isPasswordValid) {
      throw new Error("Email atau password salah");
    }

    // Cek apakah user aktif
    if (!user.isActive) {
      throw new Error("Akun tidak aktif");
    }

    // Login successful - clear rate limit
    clearRateLimit(email);

    // Log activity
    await ctx.db.insert("activityLogs", {
      action: "login",
      entity: "users",
      entityId: user._id.toString(),
      entityTableName: "users",
      userId: user._id,
      createdAt: Date.now(),
    });

    // Return user data tanpa password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },
});

// Fungsi untuk membuat user dengan password hashing yang aman
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

    // Hash password sebelum menyimpan menggunakan bcrypt (synchronous)
    const hashedPassword = hashPassword(password);

    const now = Date.now();
    const userId = await ctx.db.insert("users", {
      name,
      email,
      password: hashedPassword,
      role,
      staffId,
      isActive: true,
      targetYearly: 100, // Default target untuk staff
      completedThisYear: 0, // Default completed kunjungan
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

// Fungsi untuk mendapatkan semua user
export const getAllUsers = query({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    // Return user data tanpa password
    return users.map(user => {
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  },
});

// Fungsi untuk update user
export const updateUser = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    password: v.optional(v.string()),
    role: v.optional(v.union(v.literal("super_admin"), v.literal("manager"), v.literal("staff"))),
    staffId: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    phone: v.optional(v.string()),
    avatar: v.optional(v.string()),
    targetYearly: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId, ...updateData } = args;

    // Cek apakah user ada
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User tidak ditemukan");
    }

    // Cek email uniqueness jika email diubah
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", updateData.email!))
        .first();

      if (existingUser && existingUser._id !== userId) {
        throw new Error("Email sudah digunakan oleh user lain");
      }
    }

    // Hash password jika password diubah menggunakan bcrypt (synchronous)
    if (updateData.password) {
      updateData.password = hashPassword(updateData.password);
    }

    // Update user
    await ctx.db.patch(userId, {
      ...updateData,
      updatedAt: Date.now(),
    });

    // Ambil user yang sudah diupdate
    const updatedUser = await ctx.db.get(userId);
    if (!updatedUser) {
      throw new Error("Gagal mengambil user yang diupdate");
    }

    // Return user data tanpa password
    const { password: _, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  },
});

// Fungsi untuk delete user
export const deleteUser = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { userId } = args;

    // Cek apakah user ada
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User tidak ditemukan");
    }

    // Hapus user (soft delete by setting isActive to false)
    await ctx.db.patch(userId, {
      isActive: false,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Fungsi untuk activate/deactivate user
export const toggleUserStatus = mutation({
  args: {
    userId: v.id("users"),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { userId, isActive } = args;

    // Cek apakah user ada
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User tidak ditemukan");
    }

    // Update user status
    await ctx.db.patch(userId, {
      isActive,
      updatedAt: Date.now(),
    });

    // Ambil user yang sudah diupdate
    const updatedUser = await ctx.db.get(userId);
    if (!updatedUser) {
      throw new Error("Gagal mengambil user yang diupdate");
    }

    // Return user data tanpa password
    const { password: _, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  },
});

// Fungsi untuk reset password admin (TEMPORARY - remove after use)
export const resetAdminPassword = mutation({
  args: {
    email: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const { email, newPassword } = args;

    // Cari user berdasarkan email
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (!user) {
      throw new Error("User tidak ditemukan");
    }

    // Hash password baru menggunakan bcrypt
    const hashedPassword = hashPassword(newPassword);

    // Update password
    await ctx.db.patch(user._id, {
      password: hashedPassword,
      updatedAt: Date.now(),
    });

    console.log("[PASSWORD RESET] Password reset for user:", email);
    console.log("[PASSWORD RESET] New password hash length:", hashedPassword.length);
    console.log("[PASSWORD RESET] New password hash starts with:", hashedPassword.substring(0, 10));

    return { success: true, message: "Password berhasil direset" };
  },
});
