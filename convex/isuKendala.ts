import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all isu kendala
export const getIsuKendala = query({
  args: {},
  handler: async (ctx) => {
    const isuKendala = await ctx.db
      .query("isuKendala")
      .order("desc")
      .collect();

    // Fetch user details for created_by and updated_by
    const isuKendalaWithUsers = await Promise.all(
      isuKendala.map(async (isu) => {
        let createdByName = "Unknown";
        if (isu.created_by) {
          const createdBy = await ctx.db.get(isu.created_by);
          createdByName = ((createdBy as any)?.name || (createdBy as any)?.email || (createdBy as any)?.staffId) || "Unknown";
        }

        let updatedByName = null;
        if (isu.updated_by) {
          const updatedBy = await ctx.db.get(isu.updated_by);
          updatedByName = ((updatedBy as any)?.name || (updatedBy as any)?.email || (updatedBy as any)?.staffId) || null;
        }

        return {
          ...isu,
          createdByName,
          updatedByName,
        };
      })
    );

    return isuKendalaWithUsers;
  },
});

// Get isu kendala by year and month
export const getIsuKendalaByMonth = query({
  args: {
    month: v.number(),
    year: v.number(),
  },
  handler: async (ctx, args) => {
    const isuKendala = await ctx.db
      .query("isuKendala")
      .withIndex("by_month_year", (q) =>
        q.eq("month", args.month).eq("year", args.year)
      )
      .collect();

    // Fetch user details for created_by and updated_by
    const isuKendalaWithUsers = await Promise.all(
      isuKendala.map(async (isu) => {
        let createdByName = "Unknown";
        if (isu.created_by) {
          const createdBy = await ctx.db.get(isu.created_by);
          createdByName = ((createdBy as any)?.name || (createdBy as any)?.email || (createdBy as any)?.staffId) || "Unknown";
        }

        let updatedByName = null;
        if (isu.updated_by) {
          const updatedBy = await ctx.db.get(isu.updated_by);
          updatedByName = ((updatedBy as any)?.name || (updatedBy as any)?.email || (updatedBy as any)?.staffId) || null;
        }

        return {
          ...isu,
          createdByName,
          updatedByName,
        };
      })
    );

    return isuKendalaWithUsers;
  },
});

// Get isu kendala by ID
export const getIsuKendalaById = query({
  args: { id: v.id("isuKendala") },
  handler: async (ctx, args) => {
    const isu = await ctx.db.get(args.id);
    if (!isu) {
      throw new Error("Isu Kendala not found");
    }

    return isu;
  },
});

// Create new isu kendala
export const createIsuKendala = mutation({
  args: {
    title: v.string(),
    month: v.number(),
    year: v.number(),
    points: v.array(v.object({
      text: v.string(),
      images: v.optional(v.array(v.string()))
    })),
    status: v.union(v.literal("active"), v.literal("inactive")),
    category: v.union(v.literal("Internal"), v.literal("Eksternal"), v.literal("Operasional"), v.literal("Teknis")),
    priority: v.union(v.literal("Low"), v.literal("Medium"), v.literal("High"), v.literal("Critical")),
    tanggalKejadian: v.optional(v.string()),
    tanggalSelesai: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const isuId = await ctx.db.insert("isuKendala", {
      title: args.title,
      month: args.month,
      year: args.year,
      points: args.points,
      status: args.status,
      category: args.category,
      priority: args.priority,
      tanggalKejadian: args.tanggalKejadian,
      tanggalSelesai: args.tanggalSelesai,
      createdAt: now,
      updatedAt: now,
    });

    return {
      success: true,
      isuId,
      message: "Isu Kendala berhasil dibuat",
    };
  },
});

// Update isu kendala
export const updateIsuKendala = mutation({
  args: {
    id: v.id("isuKendala"),
    title: v.optional(v.string()),
    month: v.optional(v.number()),
    year: v.optional(v.number()),
    points: v.optional(v.array(v.object({
      text: v.string(),
      images: v.optional(v.array(v.string()))
    }))),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
    category: v.optional(v.union(v.literal("Internal"), v.literal("Eksternal"), v.literal("Operasional"), v.literal("Teknis"))),
    priority: v.optional(v.union(v.literal("Low"), v.literal("Medium"), v.literal("High"), v.literal("Critical"))),
    tanggalKejadian: v.optional(v.string()),
    tanggalSelesai: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const isu = await ctx.db.get(args.id);
    if (!isu) {
      throw new Error("Isu Kendala not found");
    }

    const { id, ...updateFields } = args;

    await ctx.db.patch(args.id, {
      ...updateFields,
      updatedAt: Date.now(),
    });

    return {
      success: true,
      message: "Isu Kendala berhasil diupdate",
    };
  },
});

// Delete isu kendala
export const deleteIsuKendala = mutation({
  args: {
    id: v.id("isuKendala"),
  },
  handler: async (ctx, args) => {
    const isu = await ctx.db.get(args.id);
    if (!isu) {
      throw new Error("Isu Kendala not found");
    }

    // Delete the isu kendala document
    await ctx.db.delete(args.id);

    return {
      success: true,
      message: "Isu Kendala berhasil dihapus",
    };
  },
});

// Update isu kendala status
export const updateIsuKendalaStatus = mutation({
  args: {
    id: v.id("isuKendala"),
    status: v.union(v.literal("active"), v.literal("inactive")),
  },
  handler: async (ctx, args) => {
    const isu = await ctx.db.get(args.id);
    if (!isu) {
      throw new Error("Isu Kendala not found");
    }

    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: Date.now(),
    });

    return {
      success: true,
      message: `Isu Kendala berhasil diubah menjadi ${args.status}`,
    };
  },
});
