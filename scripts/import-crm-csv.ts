import { readFileSync } from "fs";
import { join } from "path";
import Papa from "papaparse";
import { ConvexClient } from "convex/browser";
import { api } from "../convex/_generated/api";

// Helper function untuk convert currency string ke number
const parseCurrency = (value: string): number | null => {
  if (!value || value.trim() === "-" || value.trim() === "") {
    return null;
  }

  // Remove formatting: spaces, quotes, parentheses, commas
  const cleaned = value
    .replace(/[\s"']/g, "")
    .replace(/\(/g, "-")
    .replace(/\)/g, "")
    .replace(/,/g, "");

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
};

// Helper function untuk parse tanggal
const parseDate = (value: string): string | null => {
  if (!value || value.trim() === "") {
    return null;
  }

  // Jika sudah dalam format ISO atau YYYY-MM-DD, return as is
  if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return value;
  }

  // Parse format M/D/YYYY atau D/M/YYYY
  const dateParts = value.split("/");
  if (dateParts.length === 3) {
    const [month, day, year] = dateParts;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return value; // Return original if can't parse
};

// Helper function untuk convert string ke number atau null
const parseNumber = (value: string): number | null => {
  if (!value || value.trim() === "" || value.trim() === "-") {
    return null;
  }

  const cleaned = value.replace(/[\s"']/g, "").replace(/,/g, ".");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
};

// Main import function
async function importCrmTargets() {

  // Read CSV file
  const csvPath = join(__dirname, "../data/data-crm.csv");
  const csvContent = readFileSync(csvPath, "utf-8");

  // Parse CSV
  const parseResult = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    transform: (value) => value.trim(),
  });

  const records = parseResult.data as any[];
  

  // Transform data ke format Convex
  const transformedData = records.map((record, index) => {
    // Skip jika baris kosong
    if (!record["NAMA PERUSAHAAN"]) {
      return null;
    }

    const now = Date.now();

    return {
      no: parseNumber(record["NO"]) || index + 1,
      bulanExpDate: record["BULAN EXP DATE"] || "",
      produk: record["PRODUK"] || "",
      picCrm: record["PIC CRM"] || "",
      sales: record["SALES"] || "",
      namaAssociate: record["NAMA ASSOSIATE"] || "",
      namaPerusahaan: record["NAMA PERUSAHAAN"] || "",
      status: record["STATUS"] || "",
      alasanSuspendLoss: record["ALASAN SUSPEND/LOSS"] || null,
      segmen: record["SEGMEN"] || null,
      kuadran: record["KUADRAN"] || null,
      alasan: record["ALASAN"] || null,
      category: record["CATEGORY"] || null,
      provinsi: record["PROVINSI"] || "",
      kota: record["KOTA"] || "",
      alamat: record["ALAMAT"] || "",
      akreditasi: record["AKREDITASI"] || null,
      eaCode: record["EA CODE"] || null,
      std: record["STD"] || null,
      iaDate: parseDate(record["IA DATE"]),
      expDate: parseDate(record["EXP DATE"]),
      statusKlienNew2025: record["STATUS KLIEN NEW 2025"] || null,
      hargaInitial: parseCurrency(record[" HARGA INITIAL "]),
      hargaSurveillanceFinance: parseCurrency(record[" HARGA SURVEILLANCE FINANCE "]),
      hargaRecert: parseCurrency(record[" HARGA RECERT "]),
      tahapAudit2024: record[" TAHAP AUDIT 2024 "] || null,
      totalNilai2024: parseCurrency(record[" TOTAL NILAI 2024 "]),
      tahapAudit2025: record[" TAHAP AUDIT 2025 "] || null,
      totalNilai2025: parseCurrency(record[" TOTAL NILAI 2025 "]),
      tahapAudit2026: record["TAHAP AUDIT 2026"] || null,
      totalNilai2026: parseCurrency(record[" TOTAL NILAI 2026 ( HARGA KONTRAK) "]),
      bulanTtdNotif: record[" BULAN TTD NOTIF "] || null,
      jumlahMandays: parseNumber(record[" JUMLAH MANDAYS "]),
      hargaTerupdate: parseCurrency(record[" HARGA TERUPDATE "]),
      trimmingValue: parseCurrency(record[" TRIMMING VALUE "]),
      lossValue: parseCurrency(record[" LOSS VALUE "]),
      nilaiTransportasi: parseCurrency(record[" NILAI TRANSPORTASI "]),
      nilaiAkomodasi: parseCurrency(record[" NILAI AKOMODASI "]),
      ppn: parseCurrency(record[" PPN "]),
      cashback: parseCurrency(record[" CASHBACK "]),
      nilaiBersih: parseCurrency(record[" NILAI BERSIH "]),
      terminPembayaran: record[" TERMIN PEMBAYARAN "] || null,
      statusInvoice: record[" STATUS INVOICE"] || null,
      statusSertifikat: record[" STATUS SERTIFIKAT"] || null,
      tanggalKunjungan: parseDate(record["TANGGAL KUNJUNGAN"]),
      statusKunjungan: record["STATUS KUNJUNGAN"] || "NOT YET",

      // Audit fields
      created_by: undefined, // Will be set to admin user ID if needed
      updated_by: undefined,
      createdAt: now,
      updatedAt: now,
    };
  }).filter(Boolean); // Remove null values

  

  // TODO: Uncomment ini untuk insert ke Convex
  // try {
  //   const result = await context.runMutation(api.importCrmTargets.bulkInsertCrmTargets, {
  //     targets: transformedData,
  //   });

  //   
  //   
  // } catch (error) {
  //   console.error("❌ Error importing CRM targets:", error);
  // }

  // Sementara hanya log data
  
  transformedData.slice(0, 3).forEach((record: any, idx) => {
    
    
    
  });

  
}

// Run import
importCrmTargets().catch(console.error);
