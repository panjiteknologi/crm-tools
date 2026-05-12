"use client";

import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Save, RotateCcw, X, Loader2, TableProperties } from "lucide-react";
import { CrmTarget } from "@/lib/crm-types";
import masterSalesData       from "@/data/master-sales.json";
import masterTahapanData     from "@/data/master-tahapan.json";
import masterKuadranData     from "@/data/master-kuadran.json";
import masterAlasanData      from "@/data/master-alasan.json";
import masterAkreditasiData  from "@/data/master-akreditasi.json";
import masterEaCodeData      from "@/data/master-ea-code.json";
import masterStandarData     from "@/data/master-standar.json";
import indonesiaData         from "@/data/indonesia-provinsi-kota.json";
import { cn } from "@/lib/utils";

// ─── Option constants ─────────────────────────────────────────────────────────
const MONTHS = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember",
];
const STATUS_OPTIONS           = ["WAITING","PROSES","LANJUT","DONE","SUSPEND","LOSS"];
const CATEGORY_OPTIONS         = ["GOLD","SILVER","BRONZE"];
const PIC_CRM_OPTIONS          = ["DHA","MRC"];
const DIRECT_ASSOC_OPTIONS     = ["Direct","Associate"];
const LUAR_KOTA_OPTIONS        = ["Luar Kota","Dalam Kota"];
const TERMIN_OPTIONS           = ["Lunas Diawal","Lunas Diakhir"];
const STATUS_INVOICE_OPTIONS   = ["Terbit","Belum Terbit"];
const STATUS_PEMBAYARAN_OPTIONS= ["Lunas","Belum Lunas","Sudah DP"];
const STATUS_KOMISI_OPTIONS    = ["Sudah Diajukan","Belum Diajukan","Tidak Ada"];
const STATUS_SERTIFIKAT_OPTIONS= ["terbit","belum terbit"];
const STATUS_KUNJUNGAN_OPTIONS = ["VISITED","NOT YET"];

// ─── Types ────────────────────────────────────────────────────────────────────
type EditableField =
  | "status" | "picCrm" | "sales" | "produk" | "namaAssociate" | "directOrAssociate" | "grup"
  | "bulanExpDate" | "tahun" | "category" | "kuadran" | "tahapAudit" | "alasan"
  | "luarKota" | "provinsi" | "kota" | "alamat"
  | "akreditasi" | "catAkre" | "eaCode" | "std"
  | "iaDate" | "bulanAuditSebelumnyaSustain" | "expDate"
  | "bulanTtdNotif" | "bulanAudit" | "tanggalKunjungan"
  | "hargaKontrak" | "hargaTerupdate" | "cashback"
  | "terminPembayaran" | "statusInvoice" | "statusPembayaran" | "statusKomisi" | "statusSertifikat" | "nomorSertifikat"
  | "statusKunjungan" | "catatanKunjungan"
  | "picDirect" | "noTelp" | "email" | "namaKonsultan" | "noTelpKonsultan" | "emailKonsultan";

type ColKey  = EditableField | "trimmingValue" | "lossValue";
type CellType = "text" | "number" | "combobox" | "calc" | "date";

interface ColDef {
  key: ColKey;
  header: string;
  width: number;
  type: CellType;
  options?: string[];
  isCurrency?: boolean;
}

type RowEdits   = Partial<Record<EditableField, string>>;
type EditsState = Record<string, RowEdits>;

export interface CrmBulkEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rows: CrmTarget[];
  onSaved?: () => void;
}

// ─── CellCombobox ─────────────────────────────────────────────────────────────
interface CellComboboxProps {
  value: string;
  options: string[];
  onChange: (v: string) => void;
  isDirty?: boolean;
  onEnterDown?: () => void;
  inputRef?: (el: HTMLInputElement | null) => void;
}

function CellCombobox({ value, options, onChange, isDirty, onEnterDown, inputRef }: CellComboboxProps) {
  const [open, setOpen]     = useState(false);
  const [search, setSearch] = useState("");
  const [style, setStyle]   = useState<React.CSSProperties>({});
  const wrapRef             = useRef<HTMLDivElement>(null);

  const filtered = useMemo(
    () => options.filter(o => o.toLowerCase().includes(search.toLowerCase())),
    [options, search],
  );

  const openDropdown = useCallback(() => {
    if (wrapRef.current) {
      const r = wrapRef.current.getBoundingClientRect();
      setStyle({ position:"fixed", top: r.bottom+2, left: r.left, minWidth: Math.max(r.width,140), zIndex:9999, pointerEvents:"auto" });
    }
    setSearch(""); setOpen(true);
  }, []);

  const select = useCallback((opt: string) => {
    onChange(opt); setOpen(false); setSearch("");
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape")    { setOpen(false); e.currentTarget.blur(); }
    else if (e.key === "Enter") {
      e.preventDefault();
      if (open && filtered.length > 0) select(filtered[0]);
      else { setOpen(false); onEnterDown?.(); }
    }
    else if (e.key === "ArrowDown" && !open) openDropdown();
  }, [open, filtered, select, onEnterDown, openDropdown]);

  const displayValue = open ? search : value;

  return (
    <div ref={wrapRef} className="w-full h-full relative">
      <input
        ref={inputRef}
        value={displayValue}
        placeholder={isDirty && !value ? "✕ dikosongkan" : "—"}
        className={cn(
          "w-full h-full px-2 text-[11px] bg-transparent focus:outline-none cursor-pointer",
          isDirty && !value && "placeholder:text-amber-500",
          isDirty && "bg-amber-50",
        )}
        onFocus={openDropdown}
        onChange={e => { if (open) setSearch(e.target.value); }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={handleKeyDown}
      />
      {open && typeof window !== "undefined" && createPortal(
        <div
          style={style}
          className="bg-white border border-gray-200 rounded-md shadow-xl max-h-52 overflow-y-auto"
        >
          {/* Clear / unset option — onPointerDown prevents subsequent mousedown so input stays focused */}
          <div
            className={cn(
              "px-3 py-1.5 text-xs cursor-pointer select-none italic border-b border-gray-100",
              value === "" && isDirty ? "text-amber-600 font-semibold bg-amber-50" : "text-gray-400 hover:bg-gray-50",
            )}
            onPointerDown={e => { e.preventDefault(); select(""); }}
          >
            ✕ Kosongkan
          </div>
          {filtered.length === 0
            ? <div className="px-3 py-2 text-xs text-muted-foreground italic">Tidak ada hasil</div>
            : filtered.map(opt => (
              <div key={opt}
                className={cn(
                  "px-3 py-1.5 text-xs cursor-pointer select-none hover:bg-purple-50",
                  opt === value && "bg-purple-100 text-purple-700 font-semibold",
                )}
                onPointerDown={e => { e.preventDefault(); select(opt); }}
              >{opt}</div>
            ))
          }
        </div>,
        document.body,
      )}
    </div>
  );
}

// ─── CellInput ────────────────────────────────────────────────────────────────
interface CellInputProps {
  value: string;
  onChange: (v: string) => void;
  isDirty?: boolean;
  isNumber?: boolean;
  isCurrency?: boolean;
  onEnterDown?: () => void;
  inputRef?: (el: HTMLInputElement | null) => void;
}

function CellInput({ value, onChange, isDirty, isNumber, isCurrency, onEnterDown, inputRef }: CellInputProps) {
  const internalRef = useRef<HTMLInputElement>(null);

  const mergedRef = useCallback((el: HTMLInputElement | null) => {
    (internalRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
    inputRef?.(el);
  }, [inputRef]);

  const fmt = (raw: string) => {
    const digits = raw.replace(/[^0-9]/g, "");
    if (!digits) return "";
    const n = parseInt(digits, 10);
    return isNaN(n) ? "" : n.toLocaleString("id-ID");
  };

  const displayValue = isCurrency ? fmt(value) : (value || "");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isCurrency) {
      onChange(isNumber ? e.target.value.replace(/[^0-9]/g, "") : e.target.value);
      return;
    }
    // Count digits before cursor so we can restore cursor position after reformat
    const selStart = e.target.selectionStart ?? 0;
    const digitsBeforeCursor = e.target.value.slice(0, selStart).replace(/[^0-9]/g, "").length;
    const newRaw = e.target.value.replace(/[^0-9]/g, "");
    onChange(newRaw);
    const newFormatted = fmt(newRaw);
    requestAnimationFrame(() => {
      const el = internalRef.current;
      if (!el) return;
      // Find cursor position in newFormatted after digitsBeforeCursor digits
      let pos = newFormatted.length;
      let digits = 0;
      for (let i = 0; i < newFormatted.length; i++) {
        if (digits === digitsBeforeCursor) { pos = i; break; }
        if (/\d/.test(newFormatted[i])) digits++;
      }
      el.setSelectionRange(pos, pos);
    });
  };

  return (
    <input
      ref={mergedRef}
      type="text"
      inputMode={isNumber || isCurrency ? "numeric" : "text"}
      value={displayValue}
      placeholder="—"
      className={cn(
        "w-full h-full px-2 text-[11px] bg-transparent focus:outline-none",
        isCurrency && "text-right tabular-nums",
        isDirty && "bg-amber-50",
      )}
      onChange={handleChange}
      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); onEnterDown?.(); } }}
    />
  );
}

// ─── CellDate ─────────────────────────────────────────────────────────────────
interface CellDateProps {
  value: string;
  onChange: (v: string) => void;
  isDirty?: boolean;
  inputRef?: (el: HTMLInputElement | null) => void;
}

function CellDate({ value, onChange, isDirty, inputRef }: CellDateProps) {
  return (
    <input
      ref={inputRef}
      type="date"
      value={value}
      className={cn(
        "w-full h-full px-2 text-[11px] bg-transparent focus:outline-none",
        isDirty && "bg-amber-50",
      )}
      onChange={e => onChange(e.target.value)}
    />
  );
}

// ─── CellCalc (read-only) ─────────────────────────────────────────────────────
function CellCalc({ value }: { value: string }) {
  return (
    <div className="w-full h-full px-2 flex items-center text-[11px] text-muted-foreground bg-gray-50/80 select-none cursor-default">
      {value || "0"}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function CrmBulkEditDialog({ open, onOpenChange, rows, onSaved }: CrmBulkEditDialogProps) {
  const updateMutation = useMutation(api.crmTargets.updateCrmTarget);
  const associates     = useQuery(api.masterAssociate.getAssociates);

  const salesOptions      = useMemo(() => masterSalesData.map(s => s.nama), []);
  const tahapanOptions    = useMemo(() => masterTahapanData.tahapan.map(t => t.nama), []);
  const kuadranOptions    = useMemo(() => masterKuadranData.kuadran.map(k => k.kode), []);
  const alasanOptions     = useMemo(() => masterAlasanData.alasan.map(a => a.alasan), []);
  const akreditasiOptions = useMemo(() => masterAkreditasiData.akreditasi.map(a => a.nama), []);
  const eaCodeOptions     = useMemo(() => masterEaCodeData.ea_code.map(e => e.ea_code), []);
  const stdOptions        = useMemo(() => masterStandarData.standar.map(s => s.kode), []);
  const associateOptions  = useMemo(() => associates?.map(a => a.nama) ?? [], [associates]);
  const provinsiOptions   = useMemo(() => Object.keys(indonesiaData).sort(), []);
  const allKotaOptions    = useMemo(() => {
    const all: string[] = [];
    for (const prov of Object.values(indonesiaData as Record<string, { kabupaten_kota: string[] }>)) {
      all.push(...prov.kabupaten_kota);
    }
    return [...new Set(all)].sort();
  }, []);

  const colDefs = useMemo<ColDef[]>(() => [
    // ── Identitas ──────────────────────────────────────────────────────────
    { key:"tahun",             header:"Tahun",            width:70,  type:"text" },
    { key:"bulanExpDate",      header:"Bulan Exp",        width:110, type:"combobox", options:MONTHS },
    { key:"produk",            header:"Produk",           width:100, type:"text" },
    { key:"picCrm",            header:"PIC CRM",          width:80,  type:"combobox", options:PIC_CRM_OPTIONS },
    { key:"sales",             header:"Sales",            width:130, type:"combobox", options:salesOptions },
    { key:"namaAssociate",     header:"Associate",        width:140, type:"combobox", options:associateOptions },
    { key:"directOrAssociate", header:"Direct/Assoc",     width:100, type:"combobox", options:DIRECT_ASSOC_OPTIONS },
    { key:"grup",              header:"Grup",             width:90,  type:"text" },
    // ── Status ────────────────────────────────────────────────────────────
    { key:"status",            header:"Status",           width:100, type:"combobox", options:STATUS_OPTIONS },
    { key:"alasan",            header:"Alasan",           width:160, type:"combobox", options:alasanOptions },
    { key:"catatanKunjungan",  header:"Catatan",          width:180, type:"text" },
    // ── Kategori ──────────────────────────────────────────────────────────
    { key:"category",          header:"Category",         width:90,  type:"combobox", options:CATEGORY_OPTIONS },
    { key:"kuadran",           header:"Kuadran",          width:80,  type:"combobox", options:kuadranOptions },
    // ── Lokasi ────────────────────────────────────────────────────────────
    { key:"luarKota",          header:"Luar Kota",        width:100, type:"combobox", options:LUAR_KOTA_OPTIONS },
    { key:"provinsi",          header:"Provinsi",         width:130, type:"combobox", options:provinsiOptions },
    { key:"kota",              header:"Kota",             width:130, type:"combobox", options:allKotaOptions },
    { key:"alamat",            header:"Alamat",           width:180, type:"text" },
    // ── Standar & Akreditasi ──────────────────────────────────────────────
    { key:"akreditasi",        header:"Akreditasi",       width:100, type:"combobox", options:akreditasiOptions },
    { key:"catAkre",           header:"Cat Akre",         width:90,  type:"text" },
    { key:"eaCode",            header:"EA Code",          width:80,  type:"combobox", options:eaCodeOptions },
    { key:"std",               header:"STD",              width:90,  type:"combobox", options:stdOptions },
    // ── Tanggal & Audit ───────────────────────────────────────────────────
    { key:"iaDate",            header:"IA Date",          width:140, type:"date" },
    { key:"bulanAuditSebelumnyaSustain", header:"Bulan Audit Sblm", width:140, type:"date" },
    { key:"expDate",           header:"Exp Date",         width:140, type:"date" },
    { key:"tahapAudit",        header:"Tahap Audit",      width:120, type:"combobox", options:tahapanOptions },
    // ── Keuangan ──────────────────────────────────────────────────────────
    { key:"hargaKontrak",      header:"Harga Kontrak",    width:140, type:"number", isCurrency:true },
    { key:"bulanTtdNotif",     header:"Bulan TTD",        width:140, type:"date" },
    { key:"bulanAudit",        header:"Bulan Audit",      width:140, type:"date" },
    { key:"hargaTerupdate",    header:"Harga Terupdate",  width:140, type:"number", isCurrency:true },
    { key:"trimmingValue",     header:"Trimming",         width:120, type:"calc" },
    { key:"lossValue",         header:"Loss",             width:120, type:"calc" },
    { key:"cashback",          header:"Cashback",         width:120, type:"number", isCurrency:true },
    { key:"terminPembayaran",  header:"Termin",           width:120, type:"combobox", options:TERMIN_OPTIONS },
    // ── Status Transaksi ──────────────────────────────────────────────────
    { key:"statusInvoice",     header:"Status Invoice",   width:110, type:"combobox", options:STATUS_INVOICE_OPTIONS },
    { key:"statusPembayaran",  header:"Status Pembayaran",width:130, type:"combobox", options:STATUS_PEMBAYARAN_OPTIONS },
    { key:"statusKomisi",      header:"Status Komisi",    width:130, type:"combobox", options:STATUS_KOMISI_OPTIONS },
    { key:"statusSertifikat",  header:"Status Sertifikat",width:120, type:"combobox", options:STATUS_SERTIFIKAT_OPTIONS },
    { key:"nomorSertifikat",   header:"No. Sertifikat",   width:140, type:"text" },
    // ── Kunjungan ─────────────────────────────────────────────────────────
    { key:"tanggalKunjungan",  header:"Tgl Kunjungan",    width:140, type:"date" },
    { key:"statusKunjungan",   header:"Status Kunjungan", width:120, type:"combobox", options:STATUS_KUNJUNGAN_OPTIONS },
    // ── Kontak ────────────────────────────────────────────────────────────────
    { key:"picDirect",         header:"PIC Direct",       width:140, type:"text" },
    { key:"noTelp",            header:"No Telp",          width:130, type:"text" },
    { key:"email",             header:"Email",            width:180, type:"text" },
    { key:"namaKonsultan",     header:"Konsultan",        width:140, type:"text" },
    { key:"noTelpKonsultan",   header:"Telp Konsultan",   width:130, type:"text" },
    { key:"emailKonsultan",    header:"Email Konsultan",  width:180, type:"text" },
  ], [salesOptions, associateOptions, tahapanOptions, kuadranOptions, alasanOptions,
      akreditasiOptions, eaCodeOptions, stdOptions, provinsiOptions, allKotaOptions]);

  // ── State ──────────────────────────────────────────────────────────────────
  const [localRows, setLocalRows] = useState<CrmTarget[]>([]);
  const [edits,     setEdits]     = useState<EditsState>({});
  const [saving,    setSaving]    = useState(false);

  const cellRefsMap = useRef(new Map<string, HTMLInputElement | null>());

  const focusCell = useCallback((rowIdx: number, colIdx: number) => {
    cellRefsMap.current.get(`${rowIdx}-${colIdx}`)?.focus();
  }, []);

  useEffect(() => {
    if (open) {
      setLocalRows(rows);
      setEdits({});
      cellRefsMap.current.clear();
    }
  }, [open, rows]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const dirtyRowIds = useMemo(
    () => Object.entries(edits).filter(([,v]) => Object.keys(v).length > 0).map(([k]) => k),
    [edits],
  );
  const dirtyCount = dirtyRowIds.length;

  const getValue = useCallback((row: CrmTarget, field: EditableField): string => {
    const edit = edits[row._id]?.[field];
    if (edit !== undefined) return edit;
    const raw = row[field as keyof CrmTarget];
    if (raw === null || raw === undefined) return "";
    return String(raw);
  }, [edits]);

  // Auto-calc: trimming and loss from current (possibly edited) values
  const getCalcValue = useCallback((row: CrmTarget, field: "trimmingValue" | "lossValue"): string => {
    const kontrak   = parseInt(getValue(row, "hargaKontrak").replace(/[^0-9]/g,"")   || "0", 10) || 0;
    const terupdate = parseInt(getValue(row, "hargaTerupdate").replace(/[^0-9]/g,"") || "0", 10) || 0;
    if (field === "trimmingValue") {
      const v = terupdate > kontrak ? terupdate - kontrak : 0;
      return v > 0 ? v.toLocaleString("id-ID") : "0";
    } else {
      const v = kontrak > terupdate ? kontrak - terupdate : 0;
      return v > 0 ? v.toLocaleString("id-ID") : "0";
    }
  }, [getValue]);

  const isDirtyCell = useCallback((rowId: string, field: EditableField) =>
    field in (edits[rowId] ?? {}), [edits]);

  const isDirtyRow = useCallback((rowId: string) =>
    Object.keys(edits[rowId] ?? {}).length > 0, [edits]);

  const isRequiredError = useCallback((row: CrmTarget, field: EditableField): boolean => {
    const status = getValue(row, "status");
    const val    = getValue(row, field);
    if (!val) {
      if (field === "bulanTtdNotif"  && status === "DONE") return true;
      if (field === "hargaTerupdate" && status === "DONE") return true;
      if (field === "statusKomisi"   && status === "DONE") return true;
      if (field === "alasan" && (status === "SUSPEND" || status === "LOSS")) return true;
    }
    return false;
  }, [getValue]);

  const hasRequiredErrors = useMemo(
    () => localRows.some(row =>
      isRequiredError(row, "bulanTtdNotif")  ||
      isRequiredError(row, "hargaTerupdate") ||
      isRequiredError(row, "statusKomisi")   ||
      isRequiredError(row, "alasan")
    ),
    [localRows, isRequiredError],
  );

  const setCellValue = useCallback((rowId: string, field: EditableField, value: string) => {
    setEdits(prev => ({ ...prev, [rowId]: { ...(prev[rowId] ?? {}), [field]: value } }));
  }, []);

  const resetRow = useCallback((rowId: string) => {
    setEdits(prev => { const n = { ...prev }; delete n[rowId]; return n; });
  }, []);

  const removeRow = useCallback((rowId: string) => {
    setLocalRows(prev => prev.filter(r => r._id !== rowId));
    setEdits(prev => { const n = { ...prev }; delete n[rowId]; return n; });
  }, []);

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (dirtyCount === 0) return;

    // Validate all dirty rows before saving
    const errors: string[] = [];
    for (const rowId of dirtyRowIds) {
      const row = localRows.find(r => r._id === rowId);
      if (!row) continue;
      const status         = getValue(row, "status");
      const bulanTtdNotif  = getValue(row, "bulanTtdNotif");
      const hargaTerupdate = getValue(row, "hargaTerupdate");
      const statusKomisi   = getValue(row, "statusKomisi");
      const alasan         = getValue(row, "alasan");
      const name           = row.namaPerusahaan;

      if (status === "DONE" && !bulanTtdNotif)
        errors.push(`${name}: Bulan TTD Notif wajib diisi (status DONE)`);
      if (status === "DONE" && !hargaTerupdate)
        errors.push(`${name}: Harga Terupdate wajib diisi (status DONE)`);
      if (status === "DONE" && !statusKomisi)
        errors.push(`${name}: Status Komisi wajib diisi (status DONE)`);
      if ((status === "SUSPEND" || status === "LOSS") && !alasan)
        errors.push(`${name}: Alasan wajib diisi (status ${status})`);
    }

    if (errors.length > 0) {
      toast.error(`Validasi gagal — ${errors.length} error`, {
        description: errors.slice(0, 3).join(" · ") + (errors.length > 3 ? ` +${errors.length - 3} lainnya` : ""),
        duration: 6000,
        style: { background: "#dc2626", color: "#ffffff", border: "1px solid #b91c1c" },
        descriptionClassName: "!text-red-100",
      });
      return;
    }

    setSaving(true);
    let ok = 0, fail = 0;

    for (const rowId of dirtyRowIds) {
      const row = localRows.find(r => r._id === rowId);
      if (!row) continue;
      const e = edits[rowId] ?? {};

      const s = (v: string) => v || null;
      const n = (v: string) => { const x = parseFloat(v.replace(/[^0-9]/g,"")); return isNaN(x) ? null : x; };

      try {
        await updateMutation({
          id: row._id,
          ...(e.status                    !== undefined && { status:                    s(e.status) }),
          ...(e.picCrm                    !== undefined && { picCrm:                    s(e.picCrm) }),
          ...(e.sales                     !== undefined && { sales:                     s(e.sales) }),
          ...(e.produk                    !== undefined && { produk:                    s(e.produk) }),
          ...(e.namaAssociate             !== undefined && { namaAssociate:             s(e.namaAssociate) }),
          ...(e.directOrAssociate         !== undefined && { directOrAssociate:         s(e.directOrAssociate) }),
          ...(e.grup                      !== undefined && { grup:                      s(e.grup) }),
          ...(e.category                  !== undefined && { category:                  s(e.category) }),
          ...(e.kuadran                   !== undefined && { kuadran:                   s(e.kuadran) }),
          ...(e.alasan                    !== undefined && { alasan:                    s(e.alasan) }),
          ...(e.luarKota                  !== undefined && { luarKota:                  s(e.luarKota) }),
          ...(e.provinsi                  !== undefined && { provinsi:                  s(e.provinsi) }),
          ...(e.kota                      !== undefined && { kota:                      s(e.kota) }),
          ...(e.alamat                    !== undefined && { alamat:                    s(e.alamat) }),
          ...(e.akreditasi                !== undefined && { akreditasi:                s(e.akreditasi) }),
          ...(e.catAkre                   !== undefined && { catAkre:                   s(e.catAkre) }),
          ...(e.eaCode                    !== undefined && { eaCode:                    s(e.eaCode) }),
          ...(e.std                       !== undefined && { std:                       s(e.std) }),
          ...(e.bulanExpDate              !== undefined && { bulanExpDate:              s(e.bulanExpDate) }),
          ...(e.tahun                     !== undefined && { tahun:                     s(e.tahun) }),
          ...(e.tahapAudit                !== undefined && { tahapAudit:                s(e.tahapAudit) }),
          ...(e.iaDate                    !== undefined && { iaDate:                    s(e.iaDate) }),
          ...(e.bulanAuditSebelumnyaSustain !== undefined && { bulanAuditSebelumnyaSustain: s(e.bulanAuditSebelumnyaSustain) }),
          ...(e.expDate                   !== undefined && { expDate:                   s(e.expDate) }),
          ...(e.bulanTtdNotif             !== undefined && { bulanTtdNotif:             s(e.bulanTtdNotif) }),
          ...(e.bulanAudit               !== undefined && { bulanAudit:               s(e.bulanAudit) }),
          ...(e.tanggalKunjungan          !== undefined && { tanggalKunjungan:          s(e.tanggalKunjungan) }),
          ...(e.hargaKontrak              !== undefined && { hargaKontrak:              n(e.hargaKontrak) }),
          ...(e.hargaTerupdate            !== undefined && { hargaTerupdate:            n(e.hargaTerupdate) }),
          ...(e.cashback                  !== undefined && { cashback:                  n(e.cashback) }),
          ...(e.terminPembayaran          !== undefined && { terminPembayaran:          s(e.terminPembayaran) }),
          ...(e.statusInvoice             !== undefined && { statusInvoice:             s(e.statusInvoice) }),
          ...(e.statusPembayaran          !== undefined && { statusPembayaran:          s(e.statusPembayaran) }),
          ...(e.statusKomisi              !== undefined && { statusKomisi:              s(e.statusKomisi) }),
          ...(e.statusSertifikat          !== undefined && { statusSertifikat:          s(e.statusSertifikat) }),
          ...(e.nomorSertifikat           !== undefined && { nomorSertifikat:           s(e.nomorSertifikat) }),
          ...(e.statusKunjungan           !== undefined && { statusKunjungan:           s(e.statusKunjungan) }),
          ...(e.catatanKunjungan          !== undefined && { catatanKunjungan:          s(e.catatanKunjungan) }),
          ...(e.picDirect                 !== undefined && { picDirect:                 s(e.picDirect) }),
          ...(e.noTelp                    !== undefined && { noTelp:                    s(e.noTelp) }),
          ...(e.email                     !== undefined && { email:                     s(e.email) }),
          ...(e.namaKonsultan             !== undefined && { namaKonsultan:             s(e.namaKonsultan) }),
          ...(e.noTelpKonsultan           !== undefined && { noTelpKonsultan:           s(e.noTelpKonsultan) }),
          ...(e.emailKonsultan            !== undefined && { emailKonsultan:            s(e.emailKonsultan) }),
        });
        ok++;
      } catch {
        fail++;
      }
    }

    setSaving(false);
    if (fail === 0) {
      toast.success(`${ok} data berhasil diperbarui`);
      onSaved?.();
      onOpenChange(false);
    } else {
      toast.error(`${fail} gagal diperbarui, ${ok} berhasil`);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!top-0 !left-0 !translate-x-0 !translate-y-0 !max-w-none !w-screen !h-screen !rounded-none !border-0 !p-0 flex flex-col gap-0 overflow-hidden">

        {/* Header */}
        <DialogHeader className="px-4 py-3 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-700 shadow-sm">
                <TableProperties className="h-4 w-4 text-white" />
              </div>
              <div>
                <DialogTitle className="text-sm font-semibold leading-tight">Edit Cepat</DialogTitle>
                <p className="text-[11px] text-muted-foreground mt-0.5">{localRows.length} baris · {colDefs.length} kolom</p>
              </div>
            </div>
            {dirtyCount > 0 && (
              <Badge className="bg-amber-100 text-amber-700 border border-amber-300 text-[11px] font-medium mr-6">
                {dirtyCount} baris diubah
              </Badge>
            )}
          </div>
        </DialogHeader>

        {/* Table */}
        <div className="flex-1 overflow-auto min-h-0">
          <table
            className="text-xs border-separate border-spacing-0"
            style={{ tableLayout:"fixed", width:"max-content", minWidth:"100%" }}
          >
            <thead style={{ position:"sticky", top:0, zIndex:20 }}>
              <tr>
                {/* Sticky: # */}
                <th style={{ position:"sticky", left:0, zIndex:21, width:44 }}
                  className="bg-purple-700 text-white text-[10px] font-semibold px-2 py-2 text-center border-b border-purple-600 border-r border-purple-500 whitespace-nowrap">
                  #
                </th>
                {/* Sticky: Nama Perusahaan */}
                <th style={{ position:"sticky", left:44, zIndex:21, width:200 }}
                  className="bg-purple-700 text-white text-[10px] font-semibold px-2 py-2 text-left border-b border-purple-600 border-r border-purple-500 whitespace-nowrap">
                  Nama Perusahaan
                </th>
                {/* Editable + calc columns */}
                {colDefs.map(col => {
                  const conditionalLabel =
                    col.key === "bulanTtdNotif"  ? "wajib jika DONE" :
                    col.key === "hargaTerupdate" ? "wajib jika DONE" :
                    col.key === "statusKomisi"   ? "wajib jika DONE" :
                    col.key === "alasan"         ? "wajib jika SUSPEND/LOSS" : null;
                  return (
                    <th key={col.key} style={{ width: col.width }}
                      className={cn(
                        "bg-purple-700 text-white text-[10px] font-semibold px-2 py-2 text-left border-b border-purple-600 border-r border-purple-800/20 whitespace-nowrap",
                        col.type === "calc" && "bg-purple-800/80",
                      )}>
                      <span className="flex items-center gap-1">
                        {col.header}
                        {conditionalLabel && (
                          <span className="text-red-300 text-[9px] font-normal italic" title={conditionalLabel}>*</span>
                        )}
                        {col.type === "calc" && <span className="text-purple-300 text-[9px]">auto</span>}
                      </span>
                    </th>
                  );
                })}
                {/* Actions */}
                <th style={{ width:68 }}
                  className="bg-purple-700 text-white text-[10px] font-semibold px-2 py-2 text-center border-b border-purple-600 whitespace-nowrap">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody>
              {localRows.map((row, rowIdx) => {
                const rowDirty = isDirtyRow(row._id);
                const stripe   = rowIdx % 2 === 1;
                const baseBg   = rowDirty ? "bg-amber-50" : stripe ? "bg-purple-50/30" : "bg-white";

                return (
                  <tr key={row._id} className={baseBg}>
                    {/* # */}
                    <td style={{ position:"sticky", left:0, zIndex:2, width:44 }}
                      className={cn(
                        "text-center text-[10px] text-muted-foreground border-b border-gray-200 border-r border-gray-200 py-0",
                        rowDirty ? "bg-amber-50" : stripe ? "bg-purple-50" : "bg-white",
                      )}>
                      {rowIdx + 1}
                    </td>

                    {/* Company */}
                    <td style={{ position:"sticky", left:44, zIndex:2, width:200 }}
                      className={cn(
                        "px-2 py-1 border-b border-gray-200 border-r border-gray-300 text-[11px] font-medium",
                        rowDirty ? "bg-amber-50" : stripe ? "bg-purple-50" : "bg-white",
                      )}>
                      <div className="truncate max-w-[188px]" title={row.namaPerusahaan}>
                        {row.namaPerusahaan}
                      </div>
                    </td>

                    {/* Data cells */}
                    {colDefs.map((col, colIdx) => {
                      if (col.type === "calc") {
                        const calcVal = getCalcValue(row, col.key as "trimmingValue" | "lossValue");
                        return (
                          <td key={col.key} style={{ width: col.width }}
                            className="border-b border-r border-gray-200 p-0 h-8 bg-gray-50/60">
                            <CellCalc value={calcVal} />
                          </td>
                        );
                      }

                      const field     = col.key as EditableField;
                      const val       = getValue(row, field);
                      const cellDirty = isDirtyCell(row._id, field);
                      const reqError  = isRequiredError(row, field);
                      const refKey    = `${rowIdx}-${colIdx}`;

                      return (
                        <td key={col.key} style={{ width: col.width }}
                          className={cn(
                            "border-b border-r border-gray-200 p-0 h-8 focus-within:ring-1 focus-within:ring-inset",
                            reqError
                              ? "bg-red-50 border-red-500 ring-1 ring-inset ring-red-500 focus-within:ring-red-600"
                              : "focus-within:ring-purple-400",
                            cellDirty && !reqError && "bg-amber-50",
                          )}>
                          {col.type === "combobox" ? (
                            <CellCombobox
                              value={val}
                              options={col.options ?? []}
                              onChange={v => setCellValue(row._id, field, v)}
                              isDirty={cellDirty}
                              onEnterDown={() => focusCell(rowIdx + 1, colIdx)}
                              inputRef={el => cellRefsMap.current.set(refKey, el)}
                            />
                          ) : col.type === "date" ? (
                            <CellDate
                              value={val}
                              onChange={v => setCellValue(row._id, field, v)}
                              isDirty={cellDirty}
                              inputRef={el => cellRefsMap.current.set(refKey, el)}
                            />
                          ) : (
                            <CellInput
                              value={val}
                              onChange={v => setCellValue(row._id, field, v)}
                              isDirty={cellDirty}
                              isNumber={col.type === "number" && !col.isCurrency}
                              isCurrency={col.isCurrency}
                              onEnterDown={() => focusCell(rowIdx + 1, colIdx)}
                              inputRef={el => cellRefsMap.current.set(refKey, el)}
                            />
                          )}
                        </td>
                      );
                    })}

                    {/* Row actions */}
                    <td style={{ width:68 }} className="border-b border-gray-200 px-1 py-0 text-center h-8">
                      <div className="flex items-center justify-center gap-1 h-full">
                        {rowDirty && (
                          <button
                            className="h-6 w-6 rounded hover:bg-amber-100 flex items-center justify-center text-amber-600 transition-colors"
                            title="Reset perubahan baris ini"
                            onClick={() => resetRow(row._id)}
                          >
                            <RotateCcw className="h-3 w-3" />
                          </button>
                        )}
                        <button
                          className="h-6 w-6 rounded hover:bg-red-100 flex items-center justify-center text-red-400 transition-colors"
                          title="Hapus dari daftar edit"
                          onClick={() => removeRow(row._id)}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {localRows.length === 0 && (
                <tr>
                  <td colSpan={colDefs.length + 3}
                    className="py-12 text-center text-xs text-muted-foreground">
                    Tidak ada data untuk diedit
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="border-t px-4 py-3 flex items-center justify-between flex-shrink-0 bg-card">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{localRows.length} baris · {colDefs.length} kolom</span>
            {dirtyCount > 0 && (
              <span className="text-amber-600 font-medium">{dirtyCount} baris diubah</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs"
              onClick={() => onOpenChange(false)} disabled={saving}>
              Batal
            </Button>
            <Button size="sm"
              className="h-8 text-xs bg-purple-700 hover:bg-purple-800 gap-1.5"
              onClick={handleSave}
              disabled={dirtyCount === 0 || saving || hasRequiredErrors}
              title={hasRequiredErrors ? "Masih ada kolom wajib yang belum diisi (ditandai merah)" : undefined}
            >
              {saving
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Save className="h-3.5 w-3.5" />
              }
              Simpan{dirtyCount > 0 ? ` (${dirtyCount})` : ""}
            </Button>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}
