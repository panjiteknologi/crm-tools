import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Mutation untuk insert satu CRM target (sesuai schema baru)
export const insertCrmTarget = mutation({
  args: {
    tahun: v.string(),
    bulanExpDate: v.string(),
    produk: v.string(),
    picCrm: v.string(),
    sales: v.string(),
    namaAssociate: v.string(),
    namaPerusahaan: v.string(),
    status: v.string(),
    alasan: v.optional(v.string()),
    category: v.optional(v.string()),
    luarKota: v.optional(v.string()),
    provinsi: v.string(),
    kota: v.string(),
    alamat: v.string(),
    akreditasi: v.optional(v.string()),
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
    tanggalKunjungan: v.optional(v.string()),
    created_by: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const crmTargetId = await ctx.db.insert("crmTargets", {
      ...args,
      createdAt: now,
      updatedAt: now,
      updated_by: args.created_by,
    });
    return crmTargetId;
  },
});

// Query untuk cek apakah data sudah ada
export const checkExistingData = query({
  args: {},
  handler: async (ctx) => {
    const crmTargets = await ctx.db.query("crmTargets").collect();
    return { count: crmTargets.length };
  },
});
