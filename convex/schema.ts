import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Table Users (sudah ada, ditambah beberapa field)
  users: defineTable({
    name: v.string(),
    email: v.string(),
    password: v.string(), // Hashed password
    role: v.union(v.literal("super_admin"), v.literal("manager"), v.literal("staff")),
    staffId: v.optional(v.string()),
    isActive: v.boolean(),
    phone: v.optional(v.string()),
    avatar: v.optional(v.string()),
    targetYearly: v.number(), // Target kunjungan per tahun
    completedThisYear: v.number(), // Jumlah kunjungan yang sudah dilakukan tahun ini
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_role", ["role"])
    .index("by_staffId", ["staffId"])
    .index("by_active", ["isActive"]),

  // Table Roles (untuk dinamis roles di masa depan)
  roles: defineTable({
    roleName: v.string(),
    description: v.optional(v.string()),
    permissions: v.array(v.string()), // Array of permissions
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_roleName", ["roleName"])
    .index("by_active", ["isActive"]),

  // Table Targets/Clients
  targets: defineTable({
    client: v.string(),
    address: v.string(),
    pic: v.id("users"), // Reference to users table (PIC/Staff yang bertanggung jawab)
    scheduleVisit: v.string(), // Format: YYYY-MM-DD
    statusClient: v.union(v.literal("LANJUT"), v.literal("LOSS"), v.literal("SUSPEND")), // Status akhir client
    nilaiKontrak: v.number(), // Nilai kontrak dalam Rupiah
    statusKunjungan: v.union(v.literal("TO_DO"), v.literal("VISITED")), // Status kunjungan saat ini
    contactPerson: v.optional(v.string()), // PIC dari client
    contactPhone: v.optional(v.string()), // Nomor telepon client
    location: v.string(), // Alamat lengkap client
    photoUrl: v.optional(v.string()), // URL foto dokumentasi kunjungan
    salesAmount: v.optional(v.number()), // Jumlah penjualan yang terjadi
    notes: v.optional(v.string()), // Catatan tambahan
    visitTime: v.optional(v.string()), // Waktu kunjungan (HH:MM)
    created_by: v.id("users"), // User yang membuat target
    updated_by: v.optional(v.id("users")), // User yang terakhir update
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_pic", ["pic"])
    .index("by_statusClient", ["statusClient"])
    .index("by_statusKunjungan", ["statusKunjungan"])
    .index("by_scheduleVisit", ["scheduleVisit"])
    .index("by_created_by", ["created_by"])
    .index("by_date_range", ["scheduleVisit", "statusClient"]),

  // Table Visit History (untuk tracking perubahan status)
  visitHistory: defineTable({
    targetId: v.id("targets"), // Reference ke target yang diubah
    oldStatus: v.union(v.literal("TO_DO"), v.literal("VISITED"), v.literal("LANJUT"), v.literal("LOSS"), v.literal("SUSPEND")),
    newStatus: v.union(v.literal("TO_DO"), v.literal("VISITED"), v.literal("LANJUT"), v.literal("LOSS"), v.literal("SUSPEND")),
    notes: v.optional(v.string()),
    changed_by: v.id("users"), // User yang mengubah status
    createdAt: v.number(),
  })
    .index("by_targetId", ["targetId"])
    .index("by_changed_by", ["changed_by"])
    .index("by_date", ["createdAt"]),

  // Table Staff Targets (untuk target per staff per periode)
  staffTargets: defineTable({
    userId: v.id("users"), // Reference ke users table
    year: v.number(),
    month: v.optional(v.number()), // 0-11 (Jan-Dec)
    targetAmount: v.number(), // Target kunjungan untuk periode ini
    actualAmount: v.number(), // Kunjungan yang sudah dilakukan
    bonus: v.optional(v.number()), // Bonus jika target tercapai
    notes: v.optional(v.string()),
    created_by: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_year", ["userId", "year"])
    .index("by_user_year_month", ["userId", "year", "month"])
    .index("by_created_by", ["created_by"]),

  // Table Notifications
  notifications: defineTable({
    title: v.string(),
    message: v.string(),
    type: v.union(v.literal("info"), v.literal("success"), v.literal("warning"), v.literal("error")),
    isRead: v.boolean(),
    userId: v.optional(v.id("users")), // Target user (kosak untuk broadcast)
    targetId: v.optional(v.id("targets")), // Related target (opsional)
    actionUrl: v.optional(v.string()), // URL untuk action button
    createdAt: v.number(),
  })
    .index("by_user_read", ["userId", "isRead"])
    .index("by_type", ["type"])
    .index("by_createdAt", ["createdAt"]),

  // Table Activity Log (untuk tracking aktivitas sistem)
  activityLogs: defineTable({
    action: v.string(), // Tindakan yang dilakukan (create, update, delete, login, etc)
    entity: v.string(), // Entitas yang terpengaruh (users, targets, dll)
    entityId: v.optional(v.string()), // ID entitas (disimpan sebagai string karena bisa dari berbagai tabel)
    entityTableName: v.optional(v.string()), // Nama tabel asal dari entityId
    details: v.optional(v.object({})), // Detail tambahan
    userId: v.id("users"), // User yang melakukan aksi
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_action", ["action"])
    .index("by_entity", ["entity"])
    .index("by_createdAt", ["createdAt"]),

  // Table CRM Targets (diimport dari CSV)
  crmTargets: defineTable({
    // Data dari CSV (sesuai field yang diminta)
    tahun: v.string(), // TAHUN
    bulanExpDate: v.string(), // BULAN EXP DATE
    produk: v.string(), // PRODUK (ISO, ISPO, dll)
    picCrm: v.string(), // PIC CRM (DHA, MRC)
    sales: v.string(), // SALES (NAC, ARH, BSC, dll)
    namaAssociate: v.string(), // NAMA ASSOSIATE
    directOrAssociate: v.optional(v.string()), // DIRECT OR ASSOCIATE
    namaPerusahaan: v.string(), // NAMA PERUSAHAAN
    status: v.string(), // STATUS (WAITING, PROSES, SUSPEND, LOSS, DONE)
    alasan: v.optional(v.string()), // ALASAN
    category: v.optional(v.string()), // CATEGORY (GOLD, SILVER, BRONZE)
    kuadran: v.optional(v.string()), // KUADRAN
    luarKota: v.optional(v.string()), // LUAR KOTA
    provinsi: v.string(), // PROVINSI
    kota: v.string(), // KOTA
    alamat: v.string(), // ALAMAT lengkap
    akreditasi: v.optional(v.string()), // AKREDITASI (KAN, NON AKRE)
    catAkre: v.optional(v.string()), // CAT AKRE
    eaCode: v.optional(v.string()), // EA CODE
    std: v.optional(v.string()), // STD (SMK3, HACCP, dll)
    iaDate: v.optional(v.string()), // IA DATE
    expDate: v.optional(v.string()), // EXP DATE
    tahapAudit: v.optional(v.string()), // TAHAP AUDIT
    hargaKontrak: v.optional(v.number()), // HARGA KONTRAK
    bulanTtdNotif: v.optional(v.string()), // BULAN TTD NOTIF (Format: YYYY-MM-DD)
    hargaTerupdate: v.optional(v.number()), // HARGA TERUPDATE
    trimmingValue: v.optional(v.number()), // TRIMMING VALUE
    lossValue: v.optional(v.number()), // LOSS VALUE
    cashback: v.optional(v.number()), // CASHBACK
    terminPembayaran: v.optional(v.string()), // TERMIN PEMBAYARAN
    statusSertifikat: v.optional(v.string()), // STATUS SERTIFIKAT
    tanggalKunjungan: v.optional(v.string()), // TANGGAL KUNJUNGAN
    statusKunjungan: v.optional(v.string()), // STATUS KUNJUNGAN (VISITED, NOT YET)
    catatanKunjungan: v.optional(v.string()), // CATATAN KUNJUNGAN
    fotoBuktiKunjungan: v.optional(v.string()), // FOTO BUKTI KUNJUNGAN (URL gambar)
    // Audit fields (sesuai request)
    created_by: v.optional(v.id("users")), // CREATED BY - User yang membuat data
    createdAt: v.number(), // CREATED AT - Timestamp pembuatan
    updated_by: v.optional(v.id("users")), // UPDATED BY - User yang terakhir update
    updatedAt: v.number(), // UPDATED AT - Timestamp update terakhir
  })
    .index("by_picCrm", ["picCrm"])
    .index("by_sales", ["sales"])
    .index("by_status", ["status"])
    .index("by_category", ["category"])
    .index("by_provinsi", ["provinsi"])
    .index("by_kota", ["kota"])
    .index("by_tanggalKunjungan", ["tanggalKunjungan"])
    .index("by_created_by", ["created_by"])
    .index("by_createdAt", ["createdAt"]),

  // Table KPI Annual (1 KPI per tahun untuk divisi)
  kpiAnnual: defineTable({
    // Field utama
    year: v.string(), // Tahun KPI (2025, 2026, dll) - 1 record per tahun
    name: v.string(), // Nama KPI (contoh: "KPI Annual 2025")

    // NEW: COMPLETE table state dalam 1 JSON field (preferred format)
    tableState: v.optional(v.string()), // JSON string berisi: { data, mergeCells, cellColors, cellStyles }

    // OLD: Legacy fields (untuk backward compatibility, akan di-migrate)
    data: v.optional(v.array(v.array(v.any()))), // Data 2D array dari Handsontable (DEPRECATED)
    mergeCells: v.optional(v.array(v.object({
      row: v.number(),
      col: v.number(),
      rowspan: v.number(),
      colspan: v.number(),
    }))), // Merge cells configuration (DEPRECATED)
    cellColors: v.optional(v.record(v.string(), v.string())), // key: "row-col", value: hexColor (DEPRECATED)
    cellStyles: v.optional(v.string()), // JSON string of style object (DEPRECATED)

    // Metadata
    description: v.optional(v.string()), // Deskripsi KPI
    division: v.optional(v.string()), // Nama divisi (opsional, untuk dokumentasi)

    // Audit fields
    created_by: v.id("users"), // User yang membuat
    updated_by: v.optional(v.id("users")), // User yang terakhir update
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_year", ["year"]),
});