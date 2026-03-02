import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// === QUERIES ===

// Get all new clients
export const getAllNewClients = query({
  args: {},
  handler: async (ctx) => {
    const newClients = await ctx.db.query("crmNewClient").order("desc").collect();
    return newClients;
  },
});

// Get paginated new clients
export const getNewClientsPaginated = query({
  args: {
    paginationOpts: v.object({
      numItems: v.number(),
      cursor: v.union(v.string(), v.null()),
    }),
  },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("crmNewClient")
      .order("desc")
      .paginate(args.paginationOpts);

    return {
      page: results.page,
      continueCursor: results.continueCursor,
    };
  },
});

// Get new client by ID
export const getNewClient = query({
  args: { id: v.id("crmNewClient") },
  handler: async (ctx, args) => {
    const newClient = await ctx.db.get(args.id);
    return newClient;
  },
});

// Get new clients by month and year
export const getNewClientsByMonthYear = query({
  args: {
    month: v.number(),
    year: v.number(),
  },
  handler: async (ctx, args) => {
    const newClients = await ctx.db
      .query("crmNewClient")
      .withIndex("by_month_year", (q) =>
        q.eq("month", args.month).eq("year", args.year)
      )
      .collect();
    return newClients;
  },
});

// Get new clients by year
export const getNewClientsByYear = query({
  args: { year: v.number() },
  handler: async (ctx, args) => {
    const newClients = await ctx.db
      .query("crmNewClient")
      .withIndex("by_year", (q) => q.eq("year", args.year))
      .collect();
    return newClients;
  },
});

// === MUTATIONS ===

// Create new client
export const createCrmNewClient = mutation({
  args: {
    namaClient: v.string(),
    namaPicClient: v.string(),
    noHp: v.string(),
    picTsi: v.string(),
    tglKunjungan: v.string(),
    month: v.number(),
    year: v.number(),
    catatan: v.optional(v.string()),
    tindakLanjut: v.optional(v.string()),
    fotoBukti: v.optional(v.string()),
    created_by: v.optional(v.id("users")),
    createdByName: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const newClientId = await ctx.db.insert("crmNewClient", {
      ...args,
      createdAt: now,
      updatedAt: now,
      updated_by: args.created_by,
    });

    return newClientId;
  },
});

// Update new client
export const updateCrmNewClient = mutation({
  args: {
    id: v.id("crmNewClient"),
    namaClient: v.optional(v.string()),
    namaPicClient: v.optional(v.string()),
    noHp: v.optional(v.string()),
    picTsi: v.optional(v.string()),
    tglKunjungan: v.optional(v.string()),
    month: v.optional(v.number()),
    year: v.optional(v.number()),
    catatan: v.optional(v.string()),
    tindakLanjut: v.optional(v.string()),
    fotoBukti: v.optional(v.string()),
    updated_by: v.optional(v.id("users")),
    updatedByName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, updated_by, updatedByName, ...rest } = args;

    // Get existing data
    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error("New Client not found");
    }

    // Build updates object
    const updates: any = { updatedAt: Date.now() };

    // Process each field
    for (const [key, value] of Object.entries(rest)) {
      // Skip undefined fields (don't update)
      if (value === undefined) {
        continue;
      }
      // Include all other values
      updates[key] = value;
    }

    if (updated_by) {
      updates.updated_by = updated_by;
    }
    if (updatedByName) {
      updates.updatedByName = updatedByName;
    }

    await ctx.db.patch(id, updates);

    return id;
  },
});

// Delete new client
export const deleteCrmNewClient = mutation({
  args: { id: v.id("crmNewClient") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});
