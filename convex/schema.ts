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
    grup: v.optional(v.string()), // GRUP
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
    bulanAuditSebelumnyaSustain: v.optional(v.string()), // BULAN AUDIT SEBELUMNYA SUSTAIN (Format: YYYY-MM-DD)
    bulanAudit: v.optional(v.string()), // BULAN AUDIT (Format: YYYY-MM-DD)
    statusInvoice: v.optional(v.union(v.literal("Terbit"), v.literal("Belum Terbit"))), // STATUS INVOICE
    statusPembayaran: v.optional(v.union(v.literal("Lunas"), v.literal("Belum Lunas"), v.literal("Sudah DP"))), // STATUS PEMBAYARAN
    statusKomisi: v.optional(v.union(v.literal("Sudah Diajukan"), v.literal("Belum Diajukan"), v.literal("Tidak Ada"))), // STATUS KOMISI
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

  // Table Master Associate
  masterAssociate: defineTable({
    kode: v.string(), // Kode associate (ASS001, ASS002, dll)
    nama: v.string(), // Nama associate
    kategori: v.union(v.literal("Direct"), v.literal("Associate")), // Kategori
    status: v.union(v.literal("Aktif"), v.literal("Non-Aktif")), // Status

    // Audit fields
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_kode", ["kode"])
    .index("by_kategori", ["kategori"])
    .index("by_status", ["status"])
    .index("by_creationTime", ["createdAt"]),

  // Table Flyers (upload flyer per bulan)
  flyers: defineTable({
    title: v.string(), // Judul flyer
    description: v.optional(v.string()), // Deskripsi flyer
    month: v.number(), // Bulan (1-12)
    year: v.number(), // Tahun
    imageUrl: v.string(), // URL gambar flyer (disimpan di Convex storage)
    status: v.union(v.literal("active"), v.literal("inactive")), // Status flyer
    category: v.union(v.literal("Training"), v.literal("Webinar"), v.literal("Promosi")), // Kategori flyer
    tanggalTerbit: v.optional(v.string()), // Tanggal terbit (format: YYYY-MM-DD)
    tanggalBroadcast: v.optional(v.string()), // Tanggal broadcast (format: YYYY-MM-DD)

    // Audit fields
    created_by: v.optional(v.id("users")), // User yang mengupload (optional untuk sementara)
    updated_by: v.optional(v.id("users")), // User yang terakhir update
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_month_year", ["month", "year"])
    .index("by_year", ["year"])
    .index("by_status", ["status"])
    .index("by_category", ["category"])
    .index("by_created_by", ["created_by"]),

  // Table Isu Kendala (catatan isu/kendala per bulan)
  isuKendala: defineTable({
    title: v.string(), // Judul isu/kendala
    month: v.number(), // Bulan (1-12)
    year: v.number(), // Tahun
    points: v.array(v.object({
      text: v.string(), // Text point isu/kendala
      images: v.optional(v.array(v.string())) // Array base64 images untuk point ini
    })), // Array object point-point isu/kendala dengan gambar
    status: v.union(v.literal("active"), v.literal("inactive")), // Status isu
    category: v.union(v.literal("Internal"), v.literal("Eksternal"), v.literal("Operasional"), v.literal("Teknis")), // Kategori isu
    priority: v.union(v.literal("Low"), v.literal("Medium"), v.literal("High"), v.literal("Critical")), // Prioritas isu
    tanggalKejadian: v.optional(v.string()), // Tanggal kejadian (format: YYYY-MM-DD)
    tanggalSelesai: v.optional(v.string()), // Tanggal selesai (format: YYYY-MM-DD)

    // Audit fields
    created_by: v.optional(v.id("users")), // User yang membuat
    updated_by: v.optional(v.id("users")), // User yang terakhir update
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_month_year", ["month", "year"])
    .index("by_year", ["year"])
    .index("by_status", ["status"])
    .index("by_category", ["category"])
    .index("by_priority", ["priority"])
    .index("by_created_by", ["created_by"]),

  // Table Struktur Divisi (organization chart image)
  strukturDivisi: defineTable({
    title: v.string(), // Judul struktur organisasi
    description: v.optional(v.string()), // Deskripsi
    year: v.number(), // Tahun struktur organisasi
    imageUrl: v.string(), // URL gambar struktur organisasi
    isActive: v.boolean(), // Status aktif/non-aktif

    // Audit fields
    created_by: v.optional(v.id("users")),
    updated_by: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_year", ["year"])
    .index("by_active", ["isActive"])
    .index("by_created_by", ["created_by"]),

  // Table Struktur Divisi CRP (Interactive - like Kolaborasi CRM)
  strukturDivisiCrp: defineTable({
    // Data dasar staff
    nama: v.string(), // Nama lengkap
    fotoUrl: v.optional(v.string()), // URL foto profil
    jabatan: v.string(), // Jabatan (Manager, Supervisor, Staff, dll)

    // Posisi card (untuk drag & drop)
    positionX: v.number(), // Posisi X (default: 0)
    positionY: v.number(), // Posisi Y (default: 0)

    // Connections (garis penghubung dengan metadata)
    connections: v.optional(v.array(v.object({
      targetId: v.id("strukturDivisiCrp"), // Target staff ID
      type: v.optional(v.string()), // Tipe koneksi: "solid", "dashed", "dotted"
      label: v.optional(v.string()), // Label koneksi: "reporting", "collaboration", "communication"
      color: v.optional(v.string()), // Warna garis (hex code)
      routing: v.optional(v.string()), // Routing style: "straight", "free", "siku", "custom", "orgchart"
      controlPoints: v.optional(v.array(v.object({
        x: v.number(), // Posisi X control point
        y: v.number(), // Posisi Y control point
      }))), // Array control points untuk custom routing
      fromConnector: v.optional(v.string()), // Connector position: "top", "bottom", "left", "right"
      toConnector: v.optional(v.string()), // Connector position: "top", "bottom", "left", "right"
      verticalOffset: v.optional(v.number()), // Tinggi garis org chart (default: 0 = auto)
    }))), // Array of koneksi dengan metadata

    // Data tambahan
    keterangan: v.optional(v.string()), // Keterangan tambahan
    isActive: v.boolean(), // Status aktif/non-aktif

    // Audit fields
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_jabatan", ["jabatan"])
    .index("by_active", ["isActive"])
    .index("by_createdAt", ["createdAt"]),

  // Table NPS (Net Promoter Score)
  nps: defineTable({
    // Filter fields
    month: v.optional(v.number()), // Bulan (1-12)
    year: v.optional(v.number()), // Tahun
    category: v.union(v.literal("ISO"), v.literal("ISPO"), v.string()), // Kategori (temporarily allow any string for migration)

    // NPS Chart
    detractors: v.optional(v.number()), // Jumlah Detractors (score 0-6)
    passives: v.optional(v.number()), // Jumlah Passives (score 7-8)
    promoters: v.optional(v.number()), // Jumlah Promoters (score 9-10)
    npsDescription: v.optional(v.string()), // Deskripsi NPS

    // Rating Chart
    customerRelation: v.optional(v.number()), // Rating Customer Relation
    finance: v.optional(v.number()), // Rating Finance
    auditor: v.optional(v.number()), // Rating Auditor
    admin: v.optional(v.number()), // Rating Admin
    sales: v.optional(v.number()), // Rating Sales
    ratingDescription: v.optional(v.string()), // Deskripsi Rating

    isActive: v.boolean(),

    // Audit fields
    created_by: v.optional(v.id("users")),
    updated_by: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),

    // Legacy fields (for backward compatibility during migration)
    clientName: v.optional(v.string()),
    surveyDate: v.optional(v.string()),
    surveyorName: v.optional(v.string()),
    response: v.optional(v.number()),
    notes: v.optional(v.string()),
    type: v.optional(v.string()),
  })
    .index("by_month_year", ["month", "year"])
    .index("by_category", ["category"])
    .index("by_active", ["isActive"])
    .index("by_created_by", ["created_by"]),

  // Table Kolaborasi CRM (Struktur Organisasi & Job Desk)
  kolaborasiCrm: defineTable({
    // Data dasar staf
    nama: v.string(), // Nama lengkap
    fotoUrl: v.optional(v.string()), // URL foto profil
    jabatan: v.string(), // Jabatan (Manager, Supervisor, Staff, dll)

    // Job Deskripsi (HTML content or legacy array)
    jobDesk: v.optional(v.union(v.string(), v.array(v.string()))), // HTML content atau legacy array

    // Posisi card (untuk drag & drop)
    positionX: v.number(), // Posisi X (default: 0)
    positionY: v.number(), // Posisi Y (default: 0)

    // Connections (garis penghubung dengan metadata)
    connections: v.optional(v.array(v.object({
      targetId: v.id("kolaborasiCrm"), // Target staff ID
      type: v.optional(v.string()), // Tipe koneksi: "solid", "dashed", "dotted"
      label: v.optional(v.string()), // Label koneksi: "reporting", "collaboration", "communication"
      color: v.optional(v.string()), // Warna garis (hex code)
      routing: v.optional(v.string()), // Routing style: "straight", "free", "siku", "custom"
      controlPoints: v.optional(v.array(v.object({
        x: v.number(), // Posisi X control point
        y: v.number(), // Posisi Y control point
      }))), // Array control points untuk custom routing
      fromConnector: v.optional(v.string()), // Connector position: "top", "bottom", "left", "right"
      toConnector: v.optional(v.string()), // Connector position: "top", "bottom", "left", "right"
      arrowType: v.optional(v.string()), // Arrow type: "one-way", "two-way"
    }))), // Array of koneksi dengan metadata

    // Data tambahan
    keterangan: v.optional(v.string()), // Keterangan tambahan
    isActive: v.boolean(), // Status aktif/non-aktif

    // Audit fields
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_jabatan", ["jabatan"])
    .index("by_active", ["isActive"])
    .index("by_createdAt", ["createdAt"]),

  // Table Customer Complain
  customerComplain: defineTable({
    namaPerusahaan: v.string(), // Nama perusahaan
    komplain: v.string(), // Isi komplain
    divisi: v.union(
      v.literal("Sales"),
      v.literal("CRM"),
      v.literal("Opration ISO"),
      v.literal("Opration ISPO"),
      v.literal("HR"),
      v.literal("Finance"),
      v.literal("Product Development"),
      v.literal("Tata Kelola"),
      v.literal("IT")
    ), // Divisi
    tanggal: v.string(), // Tanggal komplain (format: YYYY-MM-DD)
    month: v.number(), // Bulan (1-12)
    year: v.number(), // Tahun
    status: v.union(v.literal("active"), v.literal("inactive")), // Status komplain
    priority: v.union(v.literal("Low"), v.literal("Medium"), v.literal("High"), v.literal("Critical")), // Prioritas komplain
    tanggalSelesai: v.optional(v.string()), // Tanggal selesai (format: YYYY-MM-DD)
    penyelesaian: v.optional(v.string()), // Penyelesaian masalah

    // Audit fields
    created_by: v.optional(v.id("users")), // User yang membuat
    updated_by: v.optional(v.id("users")), // User yang terakhir update
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_month_year", ["month", "year"])
    .index("by_year", ["year"])
    .index("by_status", ["status"])
    .index("by_divisi", ["divisi"])
    .index("by_priority", ["priority"])
    .index("by_created_by", ["created_by"]),

  // Table Kunjungan Engagement Partnership
  kunjunganEngagementPartnership: defineTable({
    namaClient: v.string(), // Nama Client
    namaPicClient: v.string(), // Nama PIC Client
    noHp: v.string(), // No HP
    picTsi: v.string(), // PIC TSI
    tglKunjungan: v.string(), // Tanggal Kunjungan (format: YYYY-MM-DD)
    month: v.number(), // Bulan (1-12)
    year: v.number(), // Tahun
    catatan: v.optional(v.string()), // Catatan
    tindakLanjut: v.optional(v.string()), // Tindak Lanjut
    fotoBukti: v.optional(v.string()), // Foto bukti kunjungan (base64)

    // Audit fields
    created_by: v.optional(v.id("users")), // User yang membuat
    updated_by: v.optional(v.id("users")), // User yang terakhir update
    createdByName: v.string(), // Nama user yang membuat (denormalized for easier display)
    updatedByName: v.optional(v.string()), // Nama user yang terakhir update
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_month_year", ["month", "year"])
    .index("by_year", ["year"])
    .index("by_tglKunjungan", ["tglKunjungan"])
    .index("by_created_by", ["created_by"]),

  // Table CRM New Client (untuk new client visits, separated from existing crmTargets)
  crmNewClient: defineTable({
    // Kunjungan Engagement Partnership fields (same as kunjunganEngagementPartnership)
    namaClient: v.string(), // Nama Client
    namaPicClient: v.string(), // Nama PIC Client
    noHp: v.string(), // No HP
    picTsi: v.string(), // PIC TSI
    tglKunjungan: v.string(), // Tanggal Kunjungan (format: YYYY-MM-DD)
    month: v.number(), // Bulan (1-12)
    year: v.number(), // Tahun
    catatan: v.optional(v.string()), // Catatan
    tindakLanjut: v.optional(v.string()), // Tindak Lanjut
    fotoBukti: v.optional(v.string()), // Foto bukti kunjungan

    // Audit fields
    created_by: v.optional(v.id("users")), // User yang membuat
    updated_by: v.optional(v.id("users")), // User yang terakhir update
    createdByName: v.string(), // Nama user yang membuat (denormalized for easier display)
    updatedByName: v.optional(v.string()), // Nama user yang terakhir update
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_month_year", ["month", "year"])
    .index("by_year", ["year"])
    .index("by_tglKunjungan", ["tglKunjungan"])
    .index("by_created_by", ["created_by"]),
});