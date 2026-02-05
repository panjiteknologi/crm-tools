import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// CREATE - Add visit history entry (usually called automatically when target status changes)
export const addVisitHistory = mutation({
  args: {
    targetId: v.id("targets"),
    oldStatus: v.union(v.literal("TO_DO"), v.literal("VISITED"), v.literal("LANJUT"), v.literal("LOSS"), v.literal("SUSPEND")),
    newStatus: v.union(v.literal("TO_DO"), v.literal("VISITED"), v.literal("LANJUT"), v.literal("LOSS"), v.literal("SUSPEND")),
    notes: v.optional(v.string()),
    changed_by: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const historyId = await ctx.db.insert("visitHistory", {
      ...args,
      createdAt: now,
    });

    // Log activity
    await ctx.db.insert("activityLogs", {
      action: "create",
      entity: "visitHistory",
      entityId: historyId,
      userId: args.changed_by,
      createdAt: now,
    });

    return historyId;
  },
});

// READ - Get visit history for a specific target
export const getTargetVisitHistory = query({
  args: {
    targetId: v.id("targets"),
    userId: v.optional(v.id("users")), // For role-based access control
  },
  handler: async (ctx, args) => {
    // Check user permissions if userId is provided
    if (args.userId) {
      const user = await ctx.db.get(args.userId);
      if (!user) {
        return [];
      }
    }

    const history = await ctx.db
      .query("visitHistory")
      .withIndex("by_targetId", (q) => q.eq("targetId", args.targetId))
      .order("desc")
      .collect();

    // Fetch user details for each history entry
    const historyWithUserDetails = await Promise.all(
      history.map(async (entry) => {
        const user = await ctx.db.get(entry.changed_by);
        return {
          ...entry,
          changedByUser: user ? {
            name: user.name,
            email: user.email,
            role: user.role,
          } : null,
        };
      })
    );

    return historyWithUserDetails;
  },
});

// READ - Get all visit history (for managers/admins)
export const getAllVisitHistory = query({
  args: {
    userId: v.id("users"),
    dateFrom: v.optional(v.string()),
    dateTo: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return [];
    }

    // Only allow managers and super admins to view all history
    if (user.role !== "manager" && user.role !== "super_admin") {
      throw new Error("Access denied");
    }

    let query = ctx.db.query("visitHistory");

    // Get all history and apply date filters
    const allHistory = await ctx.db.query("visitHistory").collect();
    let filteredHistory = allHistory;

    if (args.dateFrom || args.dateTo) {
      const fromDate = args.dateFrom ? new Date(args.dateFrom).getTime() : 0;
      const toDate = args.dateTo ? new Date(args.dateTo!).getTime() : Date.now();
      filteredHistory = allHistory.filter(entry =>
        entry.createdAt >= fromDate && entry.createdAt <= toDate
      );
    }

    const history = filteredHistory
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, args.limit || 100);

    // Fetch user and target details
    const enrichedHistory = await Promise.all(
      history.map(async (entry) => {
        const [user, target] = await Promise.all([
          ctx.db.get(entry.changed_by),
          ctx.db.get(entry.targetId),
        ]);

        return {
          ...entry,
          changedByUser: user ? {
            name: user.name,
            email: user.email,
            role: user.role,
          } : null,
          targetDetails: target ? {
            client: target.client,
            pic: target.pic,
          } : null,
        };
      })
    );

    return enrichedHistory;
  },
});

// READ - Get visit statistics
export const getVisitStats = query({
  args: {
    userId: v.optional(v.id("users")),
    year: v.optional(v.number()),
    month: v.optional(v.number()), // 1-12 for monthly stats
  },
  handler: async (ctx, args) => {
    const currentYear = args.year || new Date().getFullYear();
    const startDate = new Date(currentYear, args.month ? args.month - 1 : 0, 1);
    const endDate = new Date(currentYear, args.month ? args.month : 12, 0);

    // Get all visit history and filter by date
    const allHistory = await ctx.db.query("visitHistory").collect();
    const history = allHistory.filter(entry =>
      entry.createdAt >= startDate.getTime() && entry.createdAt <= endDate.getTime()
    );

    // Filter by user if specified and role is staff
    let filteredHistory = history;
    if (args.userId) {
      const user = await ctx.db.get(args.userId);
      if (user && user.role === "staff") {
        filteredHistory = history.filter(entry => entry.changed_by === args.userId);
      }
    }

    // Calculate statistics
    const totalChanges = filteredHistory.length;
    const statusChanges: Record<string, number> = {};
    const userActivity: Record<string, number> = {};

    filteredHistory.forEach(entry => {
      // Count status changes
      const key = `${entry.oldStatus}_to_${entry.newStatus}`;
      statusChanges[key] = (statusChanges[key] || 0) + 1;

      // Count user activity
      const userId = entry.changed_by.toString();
      userActivity[userId] = (userActivity[userId] || 0) + 1;
    });

    // Get user details for activity stats
    const enrichedUserActivity = await Promise.all(
      Object.entries(userActivity).map(async ([userId, count]) => {
        const user = await ctx.db.get(userId as any);
        // Type guard to check if it's a user document
        const isUser = user &&
          'email' in user &&
          'password' in user &&
          'role' in user;

        return {
          userId,
          count,
          userDetails: isUser ? {
            name: user.name,
            email: user.email,
            role: user.role,
          } : null,
        };
      })
    );

    return {
      totalChanges,
      period: {
        year: currentYear,
        month: args.month || null,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      statusChanges,
      userActivity: enrichedUserActivity.sort((a, b) => b.count - a.count),
    };
  },
});

// DELETE - Delete visit history entry (admin only)
export const deleteVisitHistory = mutation({
  args: {
    historyId: v.id("visitHistory"),
    deleted_by: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.deleted_by);
    if (!user || (user.role !== "manager" && user.role !== "super_admin")) {
      throw new Error("Access denied");
    }

    const history = await ctx.db.get(args.historyId);
    if (!history) {
      throw new Error("Visit history not found");
    }

    await ctx.db.delete(args.historyId);

    // Log activity
    await ctx.db.insert("activityLogs", {
      action: "delete",
      entity: "visitHistory",
      entityId: args.historyId,
      entityTableName: "visitHistory",
      details: { deletedHistoryFor: history.targetId },
      userId: args.deleted_by,
      createdAt: Date.now(),
    });

    return "Visit history deleted successfully";
  },
});