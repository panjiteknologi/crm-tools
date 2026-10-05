import { v } from "convex/values";
import { paginationOptsValidator, PaginationResult } from "convex/server";
import { action, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { Doc } from "./_generated/dataModel";

// Batch size for operations that must page through the whole crmTargets
// table, since a single query/mutation execution is capped at 16MB read.
const BATCH_SIZE = 500;

// === QUERIES ===

// Get paginated CRM targets (more efficient than loading all)
export const getCrmTargetsPaginated = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("crmTargets")
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

// Get all CRM targets (alias for getCrmTargets)
export const list = query({
  args: {},
  handler: async (ctx) => {
    const crmTargets = await ctx.db.query("crmTargets").collect();
    return crmTargets;
  },
});

// Get all CRM targets (optimized with lean data)
export const getCrmTargets = query({
  args: {},
  handler: async (ctx) => {
    const crmTargets = await ctx.db.query("crmTargets").collect();
    // Return data immediately without processing
    return crmTargets;
  },
});

// Get CRM target by ID
export const getCrmTarget = query({
  args: { id: v.id("crmTargets") },
  handler: async (ctx, args) => {
    const crmTarget = await ctx.db.get(args.id);
    return crmTarget;
  },
});

// Get CRM targets by PIC CRM
export const getCrmTargetsByPicCrm = query({
  args: { picCrm: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (!args.picCrm) {
      return [];
    }
    const crmTargets = await ctx.db
      .query("crmTargets")
      .withIndex("by_picCrm", (q) => q.eq("picCrm", args.picCrm!))
      .collect();
    return crmTargets;
  },
});

// Get CRM targets by Sales
export const getCrmTargetsBySales = query({
  args: { sales: v.string() },
  handler: async (ctx, args) => {
    const crmTargets = await ctx.db
      .query("crmTargets")
      .withIndex("by_sales", (q) => q.eq("sales", args.sales))
      .collect();
    return crmTargets;
  },
});

// Get CRM targets by Status
export const getCrmTargetsByStatus = query({
  args: { status: v.string() },
  handler: async (ctx, args) => {
    const crmTargets = await ctx.db
      .query("crmTargets")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .collect();
    return crmTargets;
  },
});

// Get CRM targets by Provinsi
export const getCrmTargetsByProvinsi = query({
  args: { provinsi: v.string() },
  handler: async (ctx, args) => {
    const crmTargets = await ctx.db
      .query("crmTargets")
      .withIndex("by_provinsi", (q) => q.eq("provinsi", args.provinsi))
      .collect();
    return crmTargets;
  },
});

// Get CRM targets by Date Range (tanggalKunjungan)
// Implemented as an action that pages through getCrmTargetsPaginated so no
// single execution reads the whole table (same filtering logic as before).
export const getCrmTargetsByDateRange = action({
  args: {
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args): Promise<Doc<"crmTargets">[]> => {
    const startDate = new Date(args.startDate);
    const endDate = new Date(args.endDate);
    const matches: Doc<"crmTargets">[] = [];

    let cursor: string | null = null;
    let isDone = false;
    while (!isDone) {
      const result: PaginationResult<Doc<"crmTargets">> = await ctx.runQuery(
        api.crmTargets.getCrmTargetsPaginated,
        { paginationOpts: { numItems: BATCH_SIZE, cursor } }
      );
      for (const target of result.page) {
        if (!target.tanggalKunjungan) continue;
        const targetDate = new Date(target.tanggalKunjungan);
        if (targetDate >= startDate && targetDate <= endDate) {
          matches.push(target);
        }
      }
      cursor = result.continueCursor;
      isDone = result.isDone;
    }

    return matches;
  },
});

// Get CRM targets statistics
// Implemented as an action that pages through getCrmTargetsPaginated so no
// single execution reads the whole table (same aggregation logic as before).
interface CrmTargetsStats {
  total: number;
  byStatus: Record<string, number>;
  byPicCrm: Record<string, number>;
  bySales: Record<string, number>;
  byProvinsi: Record<string, number>;
  byCategory: Record<string, number>;
  visitedCount: number;
  notYetVisitedCount: number;
  totalHargaKontrak: number;
}

export const getCrmTargetsStats = action({
  args: {},
  handler: async (ctx): Promise<CrmTargetsStats> => {
    const stats: CrmTargetsStats = {
      total: 0,
      byStatus: {},
      byPicCrm: {},
      bySales: {},
      byProvinsi: {},
      byCategory: {},
      visitedCount: 0,
      notYetVisitedCount: 0,
      totalHargaKontrak: 0,
    };

    let cursor: string | null = null;
    let isDone = false;
    while (!isDone) {
      const result: PaginationResult<Doc<"crmTargets">> = await ctx.runQuery(
        api.crmTargets.getCrmTargetsPaginated,
        { paginationOpts: { numItems: BATCH_SIZE, cursor } }
      );

      result.page.forEach((target) => {
        stats.total++;

        // By Status
        stats.byStatus[target.status] = (stats.byStatus[target.status] || 0) + 1;

        // By PIC CRM
        stats.byPicCrm[target.picCrm] = (stats.byPicCrm[target.picCrm] || 0) + 1;

        // By Sales
        stats.bySales[target.sales] = (stats.bySales[target.sales] || 0) + 1;

        // By Provinsi
        stats.byProvinsi[target.provinsi] = (stats.byProvinsi[target.provinsi] || 0) + 1;

        // By Category
        if (target.category) {
          stats.byCategory[target.category] = (stats.byCategory[target.category] || 0) + 1;
        }

        // By Kunjungan Status
        if (target.tanggalKunjungan) {
          stats.visitedCount++;
        } else {
          stats.notYetVisitedCount++;
        }

        // Total Harga Kontrak
        if (target.hargaKontrak) {
          stats.totalHargaKontrak += target.hargaKontrak;
        }
      });

      cursor = result.continueCursor;
      isDone = result.isDone;
    }

    return stats;
  },
});

// === MUTATIONS ===

// Create CRM target
export const createCrmTarget = mutation({
  args: {
    tahun: v.string(),
    bulanExpDate: v.string(),
    produk: v.string(),
    picCrm: v.string(),
    sales: v.string(),
    namaAssociate: v.string(),
    directOrAssociate: v.optional(v.string()),
    grup: v.optional(v.string()),
    namaPerusahaan: v.string(),
    status: v.string(),
    alasan: v.optional(v.string()),
    category: v.optional(v.string()),
    kuadran: v.optional(v.string()),
    luarKota: v.optional(v.string()),
    provinsi: v.string(),
    kota: v.string(),
    alamat: v.string(),
    akreditasi: v.optional(v.string()),
    catAkre: v.optional(v.string()),
    eaCode: v.optional(v.string()),
    std: v.optional(v.string()),
    iaDate: v.optional(v.string()),
    expDate: v.optional(v.string()),
    tahapAudit: v.optional(v.string()),
    hargaKontrak: v.optional(v.number()),
    bulanTtdNotif: v.optional(v.string()),
    hargaTerupdate: v.optional(v.number()),
    trimmingValue: v.optional(v.number()),
    lossValue: v.optional(v.number()),
    cashback: v.optional(v.number()),
    terminPembayaran: v.optional(v.string()),
    statusSertifikat: v.optional(v.string()),
    nomorSertifikat: v.optional(v.string()),
    tanggalKunjungan: v.optional(v.string()),
    statusKunjungan: v.optional(v.string()),
    catatanKunjungan: v.optional(v.string()),
    fotoBuktiKunjungan: v.optional(v.string()),
    bulanAuditSebelumnyaSustain: v.optional(v.string()),
    bulanAudit: v.optional(v.string()),
    statusInvoice: v.optional(v.union(v.literal("Terbit"), v.literal("Belum Terbit"), v.null())),
    statusPembayaran: v.optional(v.union(v.literal("Lunas"), v.literal("Belum Lunas"), v.literal("Sudah DP"), v.null())),
    statusKomisi: v.optional(v.union(v.literal("Sudah Diajukan"), v.literal("Belum Diajukan"), v.literal("Tidak Ada"), v.null())),
    // Contact fields (new)
    noTelp: v.optional(v.string()),
    email: v.optional(v.string()),
    namaKonsultan: v.optional(v.string()),
    noTelpKonsultan: v.optional(v.string()),
    emailKonsultan: v.optional(v.string()),
    picDirect: v.optional(v.string()),
    created_by: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Filter out null values before insert (schema doesn't accept null)
    const { created_by, statusInvoice, statusPembayaran, statusKomisi, ...rest } = args;
    const data: any = {
      ...rest,
      createdAt: now,
      updatedAt: now,
      updated_by: created_by,
    };

    // Only add these fields if they're not null
    if (statusInvoice !== null && statusInvoice !== undefined) {
      data.statusInvoice = statusInvoice;
    }
    if (statusPembayaran !== null && statusPembayaran !== undefined) {
      data.statusPembayaran = statusPembayaran;
    }
    if (statusKomisi !== null && statusKomisi !== undefined) {
      data.statusKomisi = statusKomisi;
    }

    const crmTargetId = await ctx.db.insert("crmTargets", data);

    return crmTargetId;
  },
});

// Update CRM target
export const updateCrmTarget = mutation({
  args: {
    id: v.id("crmTargets"),
    tahun: v.optional(v.union(v.string(), v.null())),
    bulanExpDate: v.optional(v.union(v.string(), v.null())),
    produk: v.optional(v.union(v.string(), v.null())),
    picCrm: v.optional(v.union(v.string(), v.null())),
    sales: v.optional(v.union(v.string(), v.null())),
    namaAssociate: v.optional(v.union(v.string(), v.null())),
    directOrAssociate: v.optional(v.union(v.string(), v.null())),
    grup: v.optional(v.union(v.string(), v.null())),
    namaPerusahaan: v.optional(v.union(v.string(), v.null())),
    status: v.optional(v.union(v.string(), v.null())),
    alasan: v.optional(v.union(v.string(), v.null())),
    category: v.optional(v.union(v.string(), v.null())),
    kuadran: v.optional(v.union(v.string(), v.null())),
    luarKota: v.optional(v.union(v.string(), v.null())),
    provinsi: v.optional(v.union(v.string(), v.null())),
    kota: v.optional(v.union(v.string(), v.null())),
    alamat: v.optional(v.union(v.string(), v.null())),
    akreditasi: v.optional(v.union(v.string(), v.null())),
    catAkre: v.optional(v.union(v.string(), v.null())),
    eaCode: v.optional(v.union(v.string(), v.null())),
    std: v.optional(v.union(v.string(), v.null())),
    iaDate: v.optional(v.union(v.string(), v.null())),
    expDate: v.optional(v.union(v.string(), v.null())),
    tahapAudit: v.optional(v.union(v.string(), v.null())),
    hargaKontrak: v.optional(v.union(v.number(), v.null())),
    bulanTtdNotif: v.optional(v.union(v.string(), v.null())),
    hargaTerupdate: v.optional(v.union(v.number(), v.null())),
    trimmingValue: v.optional(v.union(v.number(), v.null())),
    lossValue: v.optional(v.union(v.number(), v.null())),
    cashback: v.optional(v.union(v.number(), v.null())),
    terminPembayaran: v.optional(v.union(v.string(), v.null())),
    statusSertifikat: v.optional(v.union(v.string(), v.null())),
    nomorSertifikat: v.optional(v.union(v.string(), v.null())),
    tanggalKunjungan: v.optional(v.union(v.string(), v.null())),
    statusKunjungan: v.optional(v.union(v.string(), v.null())),
    catatanKunjungan: v.optional(v.union(v.string(), v.null())),
    fotoBuktiKunjungan: v.optional(v.union(v.string(), v.null())),
    bulanAuditSebelumnyaSustain: v.optional(v.union(v.string(), v.null())),
    bulanAudit: v.optional(v.union(v.string(), v.null())),
    statusInvoice: v.optional(v.union(v.string(), v.null())),
    statusPembayaran: v.optional(v.union(v.string(), v.null())),
    statusKomisi: v.optional(v.union(v.string(), v.null())),
    // Contact fields (new)
    noTelp: v.optional(v.union(v.string(), v.null())),
    email: v.optional(v.union(v.string(), v.null())),
    namaKonsultan: v.optional(v.union(v.string(), v.null())),
    noTelpKonsultan: v.optional(v.union(v.string(), v.null())),
    emailKonsultan: v.optional(v.union(v.string(), v.null())),
    picDirect: v.optional(v.union(v.string(), v.null())),
    updated_by: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const { id, updated_by, ...rest } = args;

    // Get existing data
    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error("CRM Target not found");
    }

    // Build updates object
    const updates: any = { updatedAt: Date.now() };

    // Process each field
    for (const [key, value] of Object.entries(rest)) {
      // Skip undefined fields (don't update)
      if (value === undefined) {
        continue;
      }
      // Include null fields and all other values
      updates[key] = value;
    }

    if (updated_by) {
      updates.updated_by = updated_by;
    }

    // Check if we need to unset any fields (fields with null value)
    const hasNullFields = Object.entries(rest).some(([key, value]) => value === null);

    if (hasNullFields) {
      // Use replace to fully replace the document (this will remove fields with null)
      const merged = { ...existing, ...updates };
      // Remove fields that are null in updates
      for (const [key, value] of Object.entries(rest)) {
        if (value === null) {
          delete merged[key];
        }
      }
      await ctx.db.replace(id, merged);
    } else {
      // Use patch for normal updates
      await ctx.db.patch(id, updates);
    }

    return id;
  },
});

// Delete CRM target
export const deleteCrmTarget = mutation({
  args: { id: v.id("crmTargets") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// Bulk insert CRM targets (for Excel import)
export const bulkInsertCrmTargets = mutation({
  args: {
    targets: v.array(
      v.object({
        tahun: v.string(),
        bulanExpDate: v.string(),
        produk: v.string(),
        picCrm: v.string(),
        sales: v.string(),
        namaAssociate: v.string(),
        directOrAssociate: v.optional(v.string()),
        grup: v.optional(v.string()),
        namaPerusahaan: v.string(),
        status: v.string(),
        alasan: v.optional(v.string()),
        category: v.optional(v.string()),
        kuadran: v.optional(v.string()),
        luarKota: v.optional(v.string()),
        provinsi: v.string(),
        kota: v.string(),
        alamat: v.string(),
        akreditasi: v.optional(v.string()),
        catAkre: v.optional(v.string()),
        eaCode: v.optional(v.string()),
        std: v.optional(v.string()),
        iaDate: v.optional(v.string()),
        expDate: v.optional(v.string()),
        tahapAudit: v.optional(v.string()),
        hargaKontrak: v.optional(v.number()),
        bulanTtdNotif: v.optional(v.string()),
        hargaTerupdate: v.optional(v.number()),
        trimmingValue: v.optional(v.number()),
        lossValue: v.optional(v.number()),
        cashback: v.optional(v.number()),
        terminPembayaran: v.optional(v.string()),
        statusSertifikat: v.optional(v.string()),
        nomorSertifikat: v.optional(v.string()),
        tanggalKunjungan: v.optional(v.string()),
        statusKunjungan: v.optional(v.string()),
        catatanKunjungan: v.optional(v.string()),
        fotoBuktiKunjungan: v.optional(v.string()),
        bulanAuditSebelumnyaSustain: v.optional(v.string()),
        bulanAudit: v.optional(v.string()),
        statusInvoice: v.optional(v.union(v.literal("Terbit"), v.literal("Belum Terbit"))),
        statusPembayaran: v.optional(v.union(v.literal("Lunas"), v.literal("Belum Lunas"), v.literal("Sudah DP"))),
        statusKomisi: v.optional(v.union(v.literal("Sudah Diajukan"), v.literal("Belum Diajukan"), v.literal("Tidak Ada"))),
        // Contact fields (new)
        noTelp: v.optional(v.string()),
        email: v.optional(v.string()),
        namaKonsultan: v.optional(v.string()),
        noTelpKonsultan: v.optional(v.string()),
        emailKonsultan: v.optional(v.string()),
        created_by: v.optional(v.id("users")),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const insertedIds = [];

    for (const target of args.targets) {
      const id = await ctx.db.insert("crmTargets", {
        ...target,
        createdAt: now,
        updatedAt: now,
        updated_by: target.created_by,
      });
      insertedIds.push(id);
    }

    return {
      insertedCount: insertedIds.length,
      ids: insertedIds,
    };
  },
});

// Fix typo in directOrAssociate field (Assosiate -> Associate)
// Processes one batch per call, then reschedules itself for the next page,
// so no single execution reads/writes more than BATCH_SIZE rows at once.
export const fixDirectOrAssociateTypo = mutation({
  args: { cursor: v.optional(v.union(v.string(), v.null())) },
  handler: async (ctx, args): Promise<{ fixedCount: number; done: boolean }> => {
    const result: PaginationResult<Doc<"crmTargets">> = await ctx.db
      .query("crmTargets")
      .paginate({ numItems: BATCH_SIZE, cursor: args.cursor ?? null });

    let fixedCount = 0;
    for (const target of result.page) {
      // Check if directOrAssociate has typo variations
      if (target.directOrAssociate) {
        const normalized = target.directOrAssociate.toLowerCase();
        let correctedValue = target.directOrAssociate;

        // Fix common typos
        if (normalized === 'assosiate' || normalized === 'assosiates') {
          correctedValue = 'Associate';
        } else if (normalized === 'direct' || normalized === 'directs') {
          correctedValue = 'Direct';
        }

        // Update if value changed
        if (correctedValue !== target.directOrAssociate) {
          await ctx.db.patch(target._id, {
            directOrAssociate: correctedValue,
            updatedAt: Date.now(),
          });
          fixedCount++;
        }
      }
    }

    if (!result.isDone) {
      await ctx.scheduler.runAfter(0, api.crmTargets.fixDirectOrAssociateTypo, {
        cursor: result.continueCursor,
      });
    }

    return { fixedCount, done: result.isDone };
  },
});

// Delete all CRM targets (useful for re-import)
// Deletes one batch per call, then reschedules itself until the table is
// empty, so no single execution reads/deletes more than BATCH_SIZE rows.
export const deleteAllCrmTargets = mutation({
  args: {},
  handler: async (ctx): Promise<{ deletedCount: number; done: boolean }> => {
    const batch: Doc<"crmTargets">[] = await ctx.db.query("crmTargets").take(BATCH_SIZE);
    for (const target of batch) {
      await ctx.db.delete(target._id);
    }

    const done = batch.length < BATCH_SIZE;
    if (!done) {
      await ctx.scheduler.runAfter(0, api.crmTargets.deleteAllCrmTargets, {});
    }

    return { deletedCount: batch.length, done };
  },
});

// Get visited CRM targets (for Laporan Kunjungan)
// Implemented as an action that pages through getCrmTargetsPaginated so no
// single execution reads the whole table (same filtering logic as before).
export const getVisitedTargets = action({
  args: {},
  handler: async (ctx): Promise<Doc<"crmTargets">[]> => {
    const matches: Doc<"crmTargets">[] = [];

    let cursor: string | null = null;
    let isDone = false;
    while (!isDone) {
      const result: PaginationResult<Doc<"crmTargets">> = await ctx.runQuery(
        api.crmTargets.getCrmTargetsPaginated,
        { paginationOpts: { numItems: BATCH_SIZE, cursor } }
      );
      for (const target of result.page) {
        if (target.statusKunjungan === "VISITED" && target.tanggalKunjungan) {
          matches.push(target);
        }
      }
      cursor = result.continueCursor;
      isDone = result.isDone;
    }

    return matches;
  },
});

const shiftYear = (date: string | undefined, diff: number) =>
  date && /^\d{4}-\d{2}-\d{2}$/.test(date)
    ? `${Number(date.slice(0, 4)) + diff}${date.slice(4)}`
    : date;

// Regenerate data: salin data tahun `fromYear` berstatus DONE menjadi data
// tahun `toYear` berstatus WAITING. Satu halaman per panggilan (dipanggil
// berulang dari client). Data yang sudah pernah di-regenerate dilewati.
export const regenerateCrmTargets = mutation({
  args: {
    fromYear: v.string(),
    toYear: v.string(),
    cursor: v.union(v.string(), v.null()),
    dryRun: v.optional(v.boolean()),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const diff = Number(args.toYear) - Number(args.fromYear);
    const page = await ctx.db
      .query("crmTargets")
      .withIndex("by_tahun_status", (q) => q.eq("tahun", args.fromYear).eq("status", "DONE"))
      .paginate({ numItems: 50, cursor: args.cursor });

    let created = 0;
    let skipped = 0;
    const now = Date.now();
    for (const src of page.page) {
      const existing = await ctx.db
        .query("crmTargets")
        .withIndex("by_regeneratedFrom", (q) => q.eq("regeneratedFrom", src._id))
        .first();
      if (existing && existing.tahun === args.toYear) {
        skipped++;
        continue;
      }
      created++;
      if (args.dryRun) continue;

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _id, _creationTime, ...rest } = src;
      await ctx.db.insert("crmTargets", {
        ...rest,
        tahun: args.toYear,
        status: "WAITING",
        expDate: shiftYear(src.expDate, diff),
        bulanAudit: shiftYear(src.bulanAudit, diff),
        bulanAuditSebelumnyaSustain: src.bulanAudit,
        // reset field proses
        alasan: undefined,
        tanggalKunjungan: undefined,
        statusKunjungan: undefined,
        catatanKunjungan: undefined,
        fotoBuktiKunjungan: undefined,
        statusInvoice: undefined,
        statusPembayaran: undefined,
        statusKomisi: undefined,
        nomorSertifikat: undefined,
        lossValue: undefined,
        regeneratedFrom: src._id,
        created_by: args.userId,
        updated_by: args.userId,
        createdAt: now,
        updatedAt: now,
      });
    }
    return { created, skipped, isDone: page.isDone, continueCursor: page.continueCursor };
  },
});
