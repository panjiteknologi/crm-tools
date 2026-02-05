import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============================================
// QUERIES
// ============================================

/**
 * Get KPI by year
 */
export const getByYear = query({
  args: { year: v.string() },
  handler: async (ctx, args) => {
    const kpi = await ctx.db
      .query("kpiAnnual")
      .withIndex("by_year", (q) => q.eq("year", args.year))
      .first();

    return kpi;
  },
});

/**
 * Get current year KPI
 */
export const getCurrentYear = query({
  handler: async (ctx) => {
    const currentYear = new Date().getFullYear().toString();

    const kpi = await ctx.db
      .query("kpiAnnual")
      .withIndex("by_year", (q) => q.eq("year", currentYear))
      .first();

    return kpi;
  },
});

/**
 * Get all KPI years (for dropdown)
 */
export const getAllYears = query({
  handler: async (ctx) => {
    const kpis = await ctx.db.query("kpiAnnual").collect();

    return kpis
      .map((kpi) => ({
        year: kpi.year,
        name: kpi.name,
        createdAt: kpi.createdAt,
      }))
      .sort((a, b) => b.year.localeCompare(a.year)); // Sort descending by year
  },
});

/**
 * Get all KPIs (admin view)
 */
export const getAll = query({
  handler: async (ctx) => {
    const kpis = await ctx.db.query("kpiAnnual").collect();

    return kpis.sort((a, b) => b.year.localeCompare(a.year));
  },
});

// ============================================
// MUTATIONS
// ============================================

/**
 * Create new KPI for a specific year
 * Only 1 KPI per year allowed
 */
export const create = mutation({
  args: {
    year: v.string(),
    name: v.string(),
    data: v.array(v.array(v.any())),
    mergeCells: v.optional(
      v.array(
        v.object({
          row: v.number(),
          col: v.number(),
          rowspan: v.number(),
          colspan: v.number(),
        })
      )
    ),
    cellColors: v.optional(v.record(v.string(), v.string())), // key: "row-col", value: hexColor
    cellStyles: v.optional(v.string()), // JSON string of style object
    description: v.optional(v.string()),
    division: v.optional(v.string()),
    userId: v.id("users"), // Add userId from client
  },
  handler: async (ctx, args) => {
    // Get user from userId (passed from client with localStorage)
    const user = await ctx.db.get(args.userId);

    if (!user) {
      throw new Error("User not found");
    }

    // Check if KPI for this year already exists
    const existing = await ctx.db
      .query("kpiAnnual")
      .withIndex("by_year", (q) => q.eq("year", args.year))
      .first();

    if (existing) {
      throw new Error(`KPI untuk tahun ${args.year} sudah ada!`);
    }

    const kpiId = await ctx.db.insert("kpiAnnual", {
      year: args.year,
      name: args.name,
      data: args.data,
      mergeCells: args.mergeCells,
      cellColors: args.cellColors,
      cellStyles: args.cellStyles,
      description: args.description,
      division: args.division,
      created_by: user._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return kpiId;
  },
});

/**
 * Update existing KPI
 */
export const update = mutation({
  args: {
    year: v.string(), // Use year as identifier
    data: v.array(v.array(v.any())),
    mergeCells: v.optional(
      v.array(
        v.object({
          row: v.number(),
          col: v.number(),
          rowspan: v.number(),
          colspan: v.number(),
        })
      )
    ),
    cellColors: v.optional(v.record(v.string(), v.string())), // key: "row-col", value: hexColor
    cellStyles: v.optional(v.string()), // JSON string of style object
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    division: v.optional(v.string()),
    userId: v.id("users"), // Add userId from client
  },
  handler: async (ctx, args) => {
    // Get user from userId (passed from client with localStorage)
    const user = await ctx.db.get(args.userId);

    if (!user) {
      throw new Error("User not found");
    }

    // Find KPI by year
    const existing = await ctx.db
      .query("kpiAnnual")
      .withIndex("by_year", (q) => q.eq("year", args.year))
      .first();

    if (!existing) {
      throw new Error(`KPI untuk tahun ${args.year} tidak ditemukan!`);
    }

    // Prepare update data
    const updateData: any = {
      data: args.data,
      mergeCells: args.mergeCells,
      cellColors: args.cellColors,
      cellStyles: args.cellStyles,
      updated_by: user._id,
      updatedAt: Date.now(),
    };

    // Add optional fields if provided
    if (args.name !== undefined) updateData.name = args.name;
    if (args.description !== undefined) updateData.description = args.description;
    if (args.division !== undefined) updateData.division = args.division;

    // Update
    await ctx.db.patch(existing._id, updateData);

    return { success: true, id: existing._id };
  },
});

/**
 * Delete KPI by year
 */
export const remove = mutation({
  args: {
    year: v.string(),
    userId: v.id("users"), // Add userId from client
  },
  handler: async (ctx, args) => {
    // Get user from userId (passed from client with localStorage)
    const user = await ctx.db.get(args.userId);

    if (!user) {
      throw new Error("User not found");
    }

    // Find KPI by year
    const existing = await ctx.db
      .query("kpiAnnual")
      .withIndex("by_year", (q) => q.eq("year", args.year))
      .first();

    if (!existing) {
      throw new Error(`KPI untuk tahun ${args.year} tidak ditemukan!`);
    }

    // Delete
    await ctx.db.delete(existing._id);

    return { success: true };
  },
});
