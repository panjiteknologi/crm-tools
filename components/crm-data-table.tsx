"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  Column,
  ColumnDef,
  ColumnFiltersState,
  ExpandedState,
  FilterFn,
  GroupingState,
  PaginationState,
  RowSelectionState,
  SortingState,
  VisibilityState,
  ColumnPinningState,
  Row,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getGroupedRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  IconFilter,
  IconFilterOff,
  IconSearch,
  IconRowInsertBottom,
  IconLayoutColumns,
  IconChevronDown,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconChevronLeft,
  IconSelector,
  IconSortAscending,
  IconSortDescending,
  IconDownload,
  IconTrash,
  IconX,
  IconPlus,
  IconCalendar,
} from "@tabler/icons-react";
import * as XLSX from "xlsx";
import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "@/components/ui/calendar";
import { type DateRange } from "react-day-picker";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { CrmTarget } from "@/lib/crm-types";
import { CrmBulkEditDialog } from "@/components/crm-bulk-edit-dialog";
import { EditCrmDialog } from "@/components/crm-edit-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WhatsAppIcon, formatPhoneForWa, buildWaMessage, renderWaPreview } from "@/lib/wa-utils";

// ── Module augmentation ──────────────────────────────────────────────────────
declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    isNumeric?: boolean;
    footerColorClass?: string;
    label?: string;
  }
}

// ── Types ────────────────────────────────────────────────────────────────────
export type { CrmTarget } from "@/lib/crm-types";

export interface CrmDataTableProps {
  data: CrmTarget[];
  canEdit?: boolean;
  showExport?: boolean;
  onEdit?: (target: CrmTarget) => void;
  onDelete?: (id: string) => Promise<void>;
  onBulkDelete?: (ids: string[]) => Promise<void>;
  onFilteredRowsChange?: (count: number) => void;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const STORAGE_KEY = "crm-data-table-column-visibility";

const DEFAULT_COLUMN_VISIBILITY: VisibilityState = {
  grup: false,
  catatanKunjungan: false,
  alamat: false,
  eaCode: false,
  iaDate: false,
  bulanAuditSebelumnyaSustain: false,
  fotoBuktiKunjungan: false,
  tahun: false,
  picDirect: false,
  noTelp: false,
  email: false,
  namaKonsultan: false,
  noTelpKonsultan: false,
  emailKonsultan: false,
};

const DEFAULT_COLUMN_PINNING: ColumnPinningState = {
  left: ["select", "no", "namaPerusahaan"],
};

const BULAN_ORDER: Record<string, number> = {
  januari: 1, februari: 2, maret: 3, april: 4,
  mei: 5, juni: 6, juli: 7, agustus: 8,
  september: 9, oktober: 10, november: 11, desember: 12,
};

const GROUPABLE_COLUMNS = [
  { id: "namaPerusahaan", label: "Perusahaan" },
  { id: "tahun", label: "Tahun" },
  { id: "bulanExpDate", label: "Bulan Exp" },
  { id: "produk", label: "Produk" },
  { id: "picCrm", label: "PIC CRM" },
  { id: "sales", label: "Sales" },
  { id: "namaAssociate", label: "Associate" },
  { id: "directOrAssociate", label: "Direct/Assoc" },
  { id: "grup", label: "Grup" },
  { id: "status", label: "Status" },
  { id: "alasan", label: "Alasan" },
  { id: "category", label: "Category" },
  { id: "kuadran", label: "Kuadran" },
  { id: "luarKota", label: "Luar Kota" },
  { id: "provinsi", label: "Provinsi" },
  { id: "kota", label: "Kota" },
  { id: "akreditasi", label: "Akreditasi" },
  { id: "catAkre", label: "Cat Akre" },
  { id: "std", label: "STD" },
  { id: "tahapAudit", label: "Tahap Audit" },
  { id: "terminPembayaran", label: "Termin" },
  { id: "statusInvoice", label: "Status Invoice" },
  { id: "statusPembayaran", label: "Status Bayar" },
  { id: "statusKomisi", label: "Status Komisi" },
  { id: "statusSertifikat", label: "Status Sertifikat" },
  { id: "statusKunjungan", label: "Status Kunjungan" },
  { id: "picDirect", label: "PIC Direct" },
  { id: "noTelp", label: "No Telp" },
  { id: "email", label: "Email" },
  { id: "namaKonsultan", label: "Konsultan" },
  { id: "noTelpKonsultan", label: "Telp Konsultan" },
  { id: "emailKonsultan", label: "Email Konsultan" },
  { id: "eaCode", label: "EA Code" },
  { id: "iaDate", label: "IA Date" },
  { id: "bulanAuditSebelumnyaSustain", label: "Bln Audit Sblm" },
  { id: "expDate", label: "Exp Date" },
  { id: "bulanTtdNotif", label: "Bulan TTD" },
  { id: "bulanAudit", label: "Bulan Audit" },
  { id: "tanggalKunjungan", label: "Tgl Kunjungan" },
];

const BASE_COLUMN_IDS = [
  "namaPerusahaan", "tahun", "bulanExpDate", "produk", "picCrm", "sales",
  "namaAssociate", "directOrAssociate", "grup", "status", "alasan",
  "catatanKunjungan", "category", "kuadran", "luarKota", "provinsi", "kota",
  "alamat", "akreditasi", "catAkre", "eaCode", "std", "iaDate",
  "bulanAuditSebelumnyaSustain", "expDate", "tahapAudit", "hargaKontrak",
  "bulanTtdNotif", "bulanAudit", "hargaTerupdate", "trimmingValue", "lossValue",
  "cashback", "terminPembayaran", "statusInvoice", "statusPembayaran",
  "statusKomisi", "statusSertifikat", "tanggalKunjungan", "statusKunjungan",
  "fotoBuktiKunjungan", "picDirect", "noTelp", "email",
  "namaKonsultan", "noTelpKonsultan", "emailKonsultan",
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function getStatusBadgeColor(s: string): string {
  switch ((s ?? "").toUpperCase()) {
    case "DONE":    return "bg-green-600 text-white border-green-600";
    case "PROSES":  return "bg-blue-600 text-white border-blue-600";
    case "LANJUT":  return "bg-blue-400 text-white border-blue-400";
    case "LOSS":    return "bg-red-600 text-white border-red-600";
    case "SUSPEND": return "bg-orange-500 text-white border-orange-500";
    case "WAITING": return "bg-gray-400 text-white border-gray-400";
    default:        return "bg-gray-400 text-white border-gray-400";
  }
}
function getCategoryBadgeStyle(c: string): string {
  switch ((c ?? "").toUpperCase()) {
    case "GOLD": return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white border-yellow-500 font-semibold";
    case "SILVER": return "bg-gradient-to-r from-gray-300 to-gray-500 text-white border-gray-400 font-semibold";
    case "BRONZE": return "bg-gradient-to-r from-orange-400 to-orange-700 text-white border-orange-600 font-semibold";
    default: return "";
  }
}
function getKuadranBadgeStyle(k: string): string {
  switch (k.toUpperCase()) {
    case "K1": return "bg-violet-600 text-white border-violet-600 font-semibold";
    case "K2": return "bg-fuchsia-600 text-white border-fuchsia-600 font-semibold";
    case "K3": return "bg-purple-500 text-white border-purple-500 font-semibold";
    case "K4": return "bg-pink-500 text-white border-pink-500 font-semibold";
    default: return "bg-gray-400 text-white border-gray-400";
  }
}
function getStatusKunjunganBadgeStyle(s: string | undefined): string {
  switch ((s ?? "").toUpperCase()) {
    case "VISITED": return "bg-green-600 text-white border-green-600 font-semibold";
    default: return "bg-gray-500 text-white border-gray-500";
  }
}
function fmtCurrency(v: number | undefined): string {
  return v ? `Rp ${v.toLocaleString("id-ID")}` : "-";
}

function getExpireAlert(expDate: string | undefined): "red" | "orange" | "yellow" | null {
  if (!expDate?.trim() || expDate.trim() === "-") return null;
  const parsed = new Date(expDate.trim());
  if (isNaN(parsed.getTime())) return null;
  const now   = new Date();
  now.setHours(0, 0, 0, 0);
  const diffMs   = parsed.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / 86400000);
  if (diffDays < 0)   return null;        // sudah lewat
  if (diffDays <= 30)  return "red";
  if (diffDays <= 60)  return "orange";
  if (diffDays <= 90)  return "yellow";
  return null;
}
const MONTH_FULL = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
const MONTH_SHORT_MAP: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, mei: 4, jun: 5,
  jul: 6, agu: 7, sep: 8, okt: 9, nov: 10, des: 11,
};
const MONTH_FULL_ORDER: Record<string, number> = Object.fromEntries(
  MONTH_FULL.map((m, i) => [m.toLowerCase(), i + 1])
);

function extractMonthYear(ds: string | undefined): string {
  if (!ds?.trim() || ds.trim() === "-") return "-";
  const c = ds.trim();
  const n = parseFloat(c);
  if (!isNaN(n) && n > 10000) {
    const d = new Date(new Date(1900, 0, 1).getTime() + (n - 2) * 86400000);
    return `${MONTH_FULL[d.getMonth()]} ${d.getFullYear()}`;
  }
  const m1 = c.match(/^(\d{4})-?(\d{2})-?(\d{2})$/);
  if (m1) return `${MONTH_FULL[parseInt(m1[2]) - 1]} ${m1[1]}`;
  const m2 = c.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m2) return `${MONTH_FULL[parseInt(m2[2]) - 1]} ${m2[3]}`;
  const m3 = c.match(/^\d{1,2}\s+(\w+)$/);
  if (m3) {
    const idx = MONTH_SHORT_MAP[m3[1].toLowerCase().substring(0, 3)];
    if (idx !== undefined) return MONTH_FULL[idx];
  }
  return c;
}

function fmtDateShort(ds: string | undefined): string {
  if (!ds?.trim() || ds.trim() === "-") return "-";
  const months = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
  const c = ds.trim();
  const n = parseFloat(c);
  if (!isNaN(n) && n > 10000) {
    const d = new Date(new Date(1900,0,1).getTime() + (n-2)*86400000);
    return `${d.getDate()} ${months[d.getMonth()]}`;
  }
  const m1 = c.match(/^(\d{4})-?(\d{2})-?(\d{2})$/);
  if (m1) return `${parseInt(m1[3])} ${months[parseInt(m1[2])-1]}`;
  const m2 = c.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m2) return `${parseInt(m2[1])} ${months[parseInt(m2[2])-1]}`;
  return c;
}
function fmtDateFull(ds: string | undefined): string {
  if (!ds?.trim() || ds.trim() === "-") return "-";
  const months = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
  const c = ds.trim();
  const m1 = c.match(/^(\d{4})-?(\d{2})-?(\d{2})$/);
  if (m1) return `${parseInt(m1[3])} ${months[parseInt(m1[2])-1]} ${m1[1]}`;
  const m2 = c.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m2) return `${parseInt(m2[1])} ${months[parseInt(m2[2])-1]} ${m2[3]}`;
  return c;
}
function getPinStyles(column: Column<CrmTarget>, isHeader = false): React.CSSProperties {
  const p = column.getIsPinned();
  if (!p) return {};
  return {
    position: "sticky",
    left: p === "left" ? `${column.getStart("left")}px` : undefined,
    right: p === "right" ? `${column.getAfter("right")}px` : undefined,
    zIndex: isHeader ? 4 : 2,
  };
}

// ── Custom filter fn ──────────────────────────────────────────────────────────
const EMPTY_SENTINEL = "__EMPTY__";

const multiSelectFilter: FilterFn<CrmTarget> = (row, columnId, filterValue: string[]) => {
  if (!filterValue?.length) return true;
  const raw = row.getValue(columnId);
  const cell = String(raw ?? "").toLowerCase().trim();
  const isEmpty = !cell || cell === "-";
  if (filterValue.includes(EMPTY_SENTINEL) && isEmpty) return true;
  const others = filterValue.filter(v => v !== EMPTY_SENTINEL).map(v => v.toLowerCase().trim());
  return others.length > 0 && others.includes(cell);
};
multiSelectFilter.autoRemove = (v: string[]) => !v?.length;

const EXCLUDED_KEYS = new Set(["_id", "createdAt", "updatedAt"]);
const globalSearchFilter: FilterFn<CrmTarget> = (row, _columnId, filterValue) => {
  const search = String(filterValue ?? "").toLowerCase().trim();
  if (!search) return true;
  return Object.entries(row.original).some(([key, val]) => {
    if (EXCLUDED_KEYS.has(key)) return false;
    return String(val ?? "").toLowerCase().includes(search);
  });
};
globalSearchFilter.autoRemove = (v: string) => !v?.trim();

// ── ColumnFilterPopover ───────────────────────────────────────────────────────
function ColumnFilterPopover({ column, title }: { column: Column<CrmTarget>; title: string }) {
  const [search, setSearch] = useState("");
  const currentFilter = (column.getFilterValue() as string[] | undefined) ?? [];
  const isActive = currentFilter.length > 0;

  const uniqueValues = useMemo(() => {
    return Array.from(column.getFacetedUniqueValues().keys())
      .map(v => String(v ?? "").trim())
      .filter((v, i, arr) => v && v !== "-" && arr.findIndex(x => x.toLowerCase() === v.toLowerCase()) === i)
      .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [column.getFacetedUniqueValues()]);

  const displayed = search ? uniqueValues.filter(v => v.toLowerCase().includes(search.toLowerCase())) : uniqueValues;

  const toggle = (value: string) => {
    const lo = value.toLowerCase();
    const next = currentFilter.some(v => v.toLowerCase() === lo)
      ? currentFilter.filter(v => v.toLowerCase() !== lo)
      : [...currentFilter, value];
    column.setFilterValue(next.length ? next : undefined);
  };

  const toggleEmpty = () => {
    const next = currentFilter.includes(EMPTY_SENTINEL)
      ? currentFilter.filter(v => v !== EMPTY_SENTINEL)
      : [...currentFilter, EMPTY_SENTINEL];
    column.setFilterValue(next.length ? next : undefined);
  };

  const emptyChecked = currentFilter.includes(EMPTY_SENTINEL);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative ml-1 inline-flex items-center rounded p-0.5 hover:bg-accent" onClick={e => e.stopPropagation()}>
          <IconFilter className={`h-3 w-3 ${isActive ? "text-yellow-300" : "text-white/60"}`} />
          {isActive && (
            <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-destructive text-[8px] font-bold text-white leading-none">
              {currentFilter.length}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-3 z-[60]" align="start" onClick={e => e.stopPropagation()}>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
        <Input placeholder="Cari..." value={search} onChange={e => setSearch(e.target.value)} className="mb-2 h-7 text-xs" />
        <ScrollArea className="h-44">
          <div className="space-y-0.5 pr-1">
            {/* Kosong (blank) option */}
            <div className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 hover:bg-accent border-b border-dashed border-muted mb-1 pb-1" onClick={toggleEmpty}>
              <Checkbox checked={emptyChecked} className="pointer-events-none h-3.5 w-3.5" />
              <span className="truncate text-xs italic text-muted-foreground">(Kosong)</span>
            </div>
            {displayed.length === 0 ? (
              <p className="py-3 text-center text-xs text-muted-foreground">Tidak ada nilai</p>
            ) : displayed.map(val => {
              const checked = currentFilter.some(v => v.toLowerCase() === val.toLowerCase());
              return (
                <div key={val} className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 hover:bg-accent" onClick={() => toggle(val)}>
                  <Checkbox checked={checked} className="pointer-events-none h-3.5 w-3.5" />
                  <span className="truncate text-xs">{val}</span>
                </div>
              );
            })}
          </div>
        </ScrollArea>
        {isActive && (
          <>
            <Separator className="my-2" />
            <Button variant="ghost" size="sm" className="h-7 w-full text-xs text-destructive hover:text-destructive"
              onClick={() => { column.setFilterValue(undefined); setSearch(""); }}>
              Reset filter ini
            </Button>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}

// ── ColHead ───────────────────────────────────────────────────────────────────
function ColHead({ column, title }: { column: Column<CrmTarget>; title: string }) {
  const sortDir = column.getIsSorted();
  return (
    <div className="flex items-center gap-0.5 whitespace-nowrap select-none">
      {column.getCanSort() ? (
        <button className="flex items-center gap-1 hover:text-foreground"
          onClick={e => { e.stopPropagation(); column.getToggleSortingHandler()?.(e); }}>
          {title}
          {sortDir === "asc" ? <IconSortAscending className="h-3 w-3 text-yellow-300" />
           : sortDir === "desc" ? <IconSortDescending className="h-3 w-3 text-yellow-300" />
           : <IconSelector className="h-3 w-3 text-white/40" />}
        </button>
      ) : <span>{title}</span>}
      {column.getCanFilter() && <ColumnFilterPopover column={column} title={title} />}
    </div>
  );
}

// ── GroupByBar ────────────────────────────────────────────────────────────────
function GroupByBar({ grouping, onGroupingChange }: { grouping: string[]; onGroupingChange: (g: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const available = GROUPABLE_COLUMNS.filter(c => !grouping.includes(c.id));
  const displayed = search ? available.filter(c => c.label.toLowerCase().includes(search.toLowerCase())) : available;
  const getLabel = (id: string) => GROUPABLE_COLUMNS.find(c => c.id === id)?.label ?? id;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {grouping.map((g, i) => (
        <React.Fragment key={g}>
          {i > 0 && <span className="text-muted-foreground text-xs">›</span>}
          <span className="inline-flex items-center gap-1.5 rounded-md bg-purple-700 h-8 px-3 text-xs font-medium text-white">
            {getLabel(g)}
            <button onClick={() => onGroupingChange(grouping.filter(x => x !== g))} className="hover:opacity-70 cursor-pointer">
              <IconX className="h-2.5 w-2.5" />
            </button>
          </span>
        </React.Fragment>
      ))}
      {available.length > 0 && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs border-purple-500 text-purple-600 hover:bg-purple-50 hover:border-purple-600 cursor-pointer">
              <IconPlus className="h-3.5 w-3.5" />
              Group By
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2 z-50" align="start">
            <Input placeholder="Cari kolom..." value={search} onChange={e => setSearch(e.target.value)} className="mb-2 h-7 text-xs" />
            <ScrollArea className="h-40">
              <div className="space-y-0.5">
                {displayed.map(col => (
                  <button key={col.id} className="w-full cursor-pointer rounded px-2 py-1.5 text-left text-xs hover:bg-accent"
                    onClick={() => { onGroupingChange([...grouping, col.id]); setOpen(false); setSearch(""); }}>
                    {col.label}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>
      )}
      {grouping.length > 0 && (
        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive cursor-pointer"
          onClick={() => onGroupingChange([])}>
          <IconX className="h-3 w-3 mr-0.5" /> Clear
        </Button>
      )}
    </div>
  );
}

// ── DetailDrawer ──────────────────────────────────────────────────────────────
function DetailDrawer({ target, open, onClose, onEdit, canEdit, isMobile, onWaClick }: {
  target: CrmTarget | null; open: boolean; onClose: () => void;
  onEdit?: (t: CrmTarget) => void; canEdit?: boolean; isMobile: boolean;
  onWaClick?: (target: CrmTarget, phone: string) => void;
}) {
  if (!target) return null;
  const fields: { label: string; value: React.ReactNode; span?: boolean }[] = [
    { label: "Perusahaan", value: target.namaPerusahaan, span: true },
    { label: "Tahun", value: target.tahun ?? "-" },
    { label: "Bulan Exp", value: target.bulanExpDate ?? "-" },
    { label: "Produk", value: target.produk ?? "-" },
    { label: "PIC CRM", value: target.picCrm ?? "-" },
    { label: "Sales", value: target.sales ?? "-" },
    { label: "Associate", value: target.namaAssociate ?? "-" },
    { label: "Direct/Assoc", value: target.directOrAssociate ?? "-" },
    { label: "Grup", value: target.grup ?? "-" },
    { label: "Status", value: <Badge variant="outline" className={`text-[10px] ${getStatusBadgeColor(target.status)}`}>{target.status}</Badge> },
    { label: "Alasan", value: target.alasan ?? "-" },
    { label: "Category", value: target.category ? <Badge variant="outline" className={`text-[10px] ${getCategoryBadgeStyle(target.category)}`}>{target.category}</Badge> : "-" },
    { label: "Kuadran", value: target.kuadran ?? "-" },
    { label: "Luar Kota", value: target.luarKota ?? "-" },
    { label: "Provinsi", value: target.provinsi ?? "-" },
    { label: "Kota", value: target.kota ?? "-" },
    { label: "Alamat", value: target.alamat ?? "-", span: true },
    { label: "Akreditasi", value: target.akreditasi ?? "-" },
    { label: "Cat Akre", value: target.catAkre ?? "-" },
    { label: "EA Code", value: target.eaCode ?? "-" },
    { label: "STD", value: target.std ?? "-" },
    { label: "IA Date", value: target.iaDate ?? "-" },
    { label: "Bulan Audit Sblm", value: target.bulanAuditSebelumnyaSustain ?? "-" },
    { label: "Exp Date", value: target.expDate ?? "-" },
    { label: "Tahap Audit", value: target.tahapAudit ?? "-" },
    { label: "Harga Kontrak", value: <span className="text-blue-600 font-semibold">{fmtCurrency(target.hargaKontrak)}</span> },
    { label: "Bulan TTD", value: fmtDateShort(target.bulanTtdNotif) },
    { label: "Bulan Audit", value: target.bulanAudit ?? "-" },
    { label: "Harga Terupdate", value: <span className="text-purple-600 font-semibold">{fmtCurrency(target.hargaTerupdate)}</span> },
    { label: "Trimming", value: <span className="text-green-600 font-semibold">{fmtCurrency(target.trimmingValue)}</span> },
    { label: "Loss", value: <span className="text-red-600 font-semibold">{fmtCurrency(target.lossValue)}</span> },
    { label: "Cashback", value: <span className="text-orange-600 font-semibold">{fmtCurrency(target.cashback)}</span> },
    { label: "Termin", value: target.terminPembayaran ?? "-" },
    { label: "Status Invoice", value: target.statusInvoice ? <Badge variant={target.statusInvoice === "Terbit" ? "default" : "secondary"} className="text-[10px]">{target.statusInvoice}</Badge> : "-" },
    { label: "Status Bayar", value: target.statusPembayaran ? <Badge variant={target.statusPembayaran === "Lunas" ? "default" : "secondary"} className="text-[10px]">{target.statusPembayaran}</Badge> : "-" },
    { label: "Status Komisi", value: target.statusKomisi ? <Badge variant="outline" className="text-[10px]">{target.statusKomisi}</Badge> : "-" },
    { label: "Status Sertifikat", value: target.statusSertifikat ?? "-" },
    { label: "Tgl Kunjungan", value: fmtDateFull(target.tanggalKunjungan) },
    { label: "Status Kunjungan", value: target.statusKunjungan ? <Badge variant="outline" className={`text-[10px] ${getStatusKunjunganBadgeStyle(target.statusKunjungan)}`}>{target.statusKunjungan}</Badge> : "-" },
    { label: "Catatan", value: target.catatanKunjungan ?? "-", span: true },
    { label: "PIC Direct", value: target.picDirect ?? "-" },
    { label: "No Telp", value: target.noTelp ?? "-" },
    { label: "Email", value: target.email ?? "-" },
    { label: "Konsultan", value: target.namaKonsultan ?? "-" },
    { label: "Telp Konsultan", value: target.noTelpKonsultan ?? "-" },
    { label: "Email Konsultan", value: target.emailKonsultan ?? "-" },
  ];

  const content = (
    <ScrollArea className="flex-1 px-4 py-3">
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        {fields.map(({ label, value, span }) => (
          <div key={label} className={span ? "col-span-2" : ""}>
            <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">{label}</p>
            <div className="text-xs">{value}</div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={o => !o && onClose()}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="pb-2 border-b">
            <DrawerTitle className="text-sm">{target.namaPerusahaan}</DrawerTitle>
          </DrawerHeader>
          {content}
          <DrawerFooter className="pt-2 flex-row gap-2 border-t flex-wrap">
            {canEdit && onEdit && (
              <Button className="flex-1 h-9 text-sm cursor-pointer" onClick={() => { onEdit(target); onClose(); }}>Edit Data</Button>
            )}
            {onWaClick && (target.noTelp || target.noTelpKonsultan) && (
              <Button variant="outline" className="flex-1 h-9 text-sm cursor-pointer text-green-600 border-green-300 hover:bg-green-50"
                onClick={() => onWaClick(target, target.noTelp || target.noTelpKonsultan || "")}>
                <WhatsAppIcon className="h-4 w-4 mr-1.5 text-green-500" />
                WhatsApp
              </Button>
            )}
            <DrawerClose asChild>
              <Button variant="outline" className="flex-1 h-9 text-sm cursor-pointer">Tutup</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Drawer open={open} onOpenChange={o => !o && onClose()} direction="right">
      <DrawerContent className="w-[420px] max-w-[95vw] flex flex-col gap-0">
        <DrawerHeader className="border-b px-5 py-3 flex-row items-center justify-between">
          <DrawerTitle className="text-sm font-semibold leading-tight">{target.namaPerusahaan}</DrawerTitle>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 cursor-pointer"><IconX className="h-4 w-4" /></Button>
          </DrawerClose>
        </DrawerHeader>
        {content}
        {canEdit && onEdit && (
          <DrawerFooter className="border-t px-5 py-3 flex-row gap-2">
            <Button className="flex-1 h-9 text-sm cursor-pointer" onClick={() => { onEdit(target); onClose(); }}>Edit Data</Button>
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
}

// ── MobileCardList ─────────────────────────────────────────────────────────────
function MobileCardList({ rows, onRowClick }: { rows: Row<CrmTarget>[]; onRowClick: (t: CrmTarget) => void }) {
  return (
    <div className="space-y-3 p-3">
      {rows.filter(r => !r.getIsGrouped()).map(row => {
        const d = row.original;
        return (
          <div key={row.id} className="cursor-pointer rounded-lg border bg-card p-3 shadow-sm hover:shadow-md transition-shadow active:bg-accent"
            onClick={() => onRowClick(d)}>
            <div className="mb-2 flex items-start justify-between gap-2">
              <p className="text-sm font-semibold leading-tight">{d.namaPerusahaan}</p>
              {d.status && <Badge variant="outline" className={`text-[9px] shrink-0 ${getStatusBadgeColor(d.status)}`}>{d.status}</Badge>}
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs mb-2">
              {d.picCrm && <span className="text-muted-foreground">PIC: <span className="text-foreground font-medium">{d.picCrm}</span></span>}
              {d.sales && <span className="text-muted-foreground">Sales: <span className="text-foreground font-medium">{d.sales}</span></span>}
              {d.provinsi && <span className="text-muted-foreground">Provinsi: <span className="text-foreground">{d.provinsi}</span></span>}
              {d.produk && <span className="text-muted-foreground">Produk: <span className="text-foreground">{d.produk}</span></span>}
            </div>
            {(d.hargaKontrak || d.hargaTerupdate) && (
              <div className="grid grid-cols-2 gap-2 border-t pt-2">
                {d.hargaKontrak && <div><p className="text-[9px] text-muted-foreground uppercase">Kontrak</p><p className="text-xs font-semibold text-blue-600">{fmtCurrency(d.hargaKontrak)}</p></div>}
                {d.hargaTerupdate && <div><p className="text-[9px] text-muted-foreground uppercase">Update</p><p className="text-xs font-semibold text-purple-600">{fmtCurrency(d.hargaTerupdate)}</p></div>}
              </div>
            )}
            <div className="mt-1.5 flex flex-wrap gap-1">
              {d.category && <Badge variant="outline" className={`text-[9px] ${getCategoryBadgeStyle(d.category)}`}>{d.category}</Badge>}
              {d.statusKunjungan && <Badge variant="outline" className={`text-[9px] ${getStatusKunjunganBadgeStyle(d.statusKunjungan)}`}>{d.statusKunjungan}</Badge>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── ColVisibilityPanel ────────────────────────────────────────────────────────
function ColVisibilityPanel({ table }: { table: ReturnType<typeof useReactTable<CrmTarget>> }) {
  const [search, setSearch] = useState("");
  const allCols = table.getAllLeafColumns().filter(c => c.getCanHide());
  const filtered = search
    ? allCols.filter(c => (c.columnDef.meta?.label ?? c.id).toLowerCase().includes(search.toLowerCase()))
    : allCols;

  return (
    <>
      <Input
        placeholder="Cari kolom..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        onKeyDown={e => e.stopPropagation()}
        className="h-7 text-xs"
      />
      {filtered.map(column => (
        <DropdownMenuCheckboxItem
          key={column.id}
          className="text-xs cursor-pointer"
          checked={column.getIsVisible()}
          onCheckedChange={v => column.toggleVisibility(!!v)}
        >
          {column.columnDef.meta?.label ?? column.id}
        </DropdownMenuCheckboxItem>
      ))}
    </>
  );
}

// ── CrmDataTable (main) ───────────────────────────────────────────────────────
export function CrmDataTable({ data, canEdit = false, showExport = true, onEdit, onDelete, onBulkDelete, onFilteredRowsChange }: CrmDataTableProps) {
  const isMobile = useIsMobile();

  // State
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [grouping, setGrouping] = useState<GroupingState>([]);
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>(
    canEdit ? DEFAULT_COLUMN_PINNING : { left: ["no", "namaPerusahaan"] }
  );
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 25 });
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
    if (typeof window === "undefined") return DEFAULT_COLUMN_VISIBILITY;
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      return s ? JSON.parse(s) : DEFAULT_COLUMN_VISIBILITY;
    } catch { return DEFAULT_COLUMN_VISIBILITY; }
  });
  const [editDialogTarget, setEditDialogTarget] = useState<CrmTarget | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [waDialog, setWaDialog] = useState<{ open: boolean; phone: string; target: CrmTarget; message: string } | null>(null);
  const [waTab, setWaTab] = useState<"preview" | "edit">("preview");

  const openWaDialog = useCallback((target: CrmTarget, phone: string) => {
    setWaDialog({ open: true, phone, target, message: buildWaMessage(target) });
    setWaTab("preview");
  }, []);
  const allUsers = useQuery(api.auth.getAllUsers);
  const staffUsers = allUsers?.filter((u: { role: string }) => u.role === "staff") ?? [];
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(columnVisibility));
  }, [columnVisibility]);

  // Apply grouping: reorder + pin + show grouped cols
  const applyGrouping = useCallback((newGrouping: GroupingState) => {
    setGrouping(newGrouping);
    // Auto-sort bulanExpDate / bulanTtdNotif by month order when grouped by them
    setSorting(prev => {
      const MONTH_COLS = ["bulanExpDate", "bulanTtdNotif", "bulanAudit", "tanggalKunjungan", "iaDate", "bulanAuditSebelumnyaSustain", "expDate"];
      let next = prev.filter(s => !MONTH_COLS.includes(s.id));
      const monthGrouped = MONTH_COLS.filter(id => newGrouping.includes(id));
      return [...monthGrouped.map(id => ({ id, desc: false })), ...next];
    });
    if (newGrouping.length === 0) {
      setColumnPinning(canEdit ? DEFAULT_COLUMN_PINNING : { left: ["no", "namaPerusahaan"] });
      setColumnOrder([]);
    } else {
      const fixed = canEdit ? ["select", "no"] : ["no"];
      const namaCol = newGrouping.includes("namaPerusahaan") ? [] : ["namaPerusahaan"];
      const rest = BASE_COLUMN_IDS.filter(id => !newGrouping.includes(id) && id !== "namaPerusahaan");
      setColumnOrder([...fixed, ...newGrouping, ...namaCol, ...rest]);
      setColumnPinning({ left: [...new Set([...fixed, ...newGrouping, "namaPerusahaan"])] });
      setColumnVisibility(prev => {
        const next = { ...prev };
        newGrouping.forEach(id => { delete next[id]; });
        return next;
      });
    }
    setPagination(p => ({ ...p, pageIndex: 0 }));
  }, [canEdit]);

  // Column definitions
  const columns = useMemo<ColumnDef<CrmTarget>[]>(() => {
    const mkCol = (
      key: keyof CrmTarget,
      title: string,
      cell?: (val: unknown, row: Row<CrmTarget>) => React.ReactNode,
      extra?: Partial<ColumnDef<CrmTarget>>
    ): ColumnDef<CrmTarget> => ({
      accessorKey: key,
      header: ({ column }) => <ColHead column={column} title={title} />,
      cell: ({ getValue, row }) => {
        if (row.getIsGrouped()) return null;
        const v = getValue();
        if (cell) return cell(v, row);
        return String(v ?? "") || "-";
      },
      filterFn: multiSelectFilter,
      aggregationFn: () => null,
      aggregatedCell: () => null,
      meta: { label: title, ...(extra?.meta as object ?? {}) },
      ...extra,
    });

    const mkNum = (key: keyof CrmTarget, title: string, colorClass: string, size = 120): ColumnDef<CrmTarget> => ({
      accessorKey: key,
      header: ({ column }) => <div className="flex justify-end w-full"><ColHead column={column} title={title} /></div>,
      cell: ({ getValue, row }) => row.getIsGrouped() ? null : (
        <span className={`block text-right tabular-nums ${colorClass}`}>{fmtCurrency(getValue() as number | undefined)}</span>
      ),
      aggregationFn: "sum",
      aggregatedCell: ({ getValue }) => (
        <span className={`block text-right tabular-nums text-xs font-bold ${colorClass}`}>{fmtCurrency(getValue() as number | undefined)}</span>
      ),
      enableGrouping: false,
      enableColumnFilter: false,
      size,
      meta: { isNumeric: true, footerColorClass: colorClass, label: title },
    });

    const baseColumns: ColumnDef<CrmTarget>[] = [
      mkCol("namaPerusahaan", "Company", v => (
        <span className="font-medium leading-snug block whitespace-normal break-words" style={{ width: 200, maxWidth: 200 }}>{String(v ?? "-")}</span>
      ), { size: 200, minSize: 200, maxSize: 200, enableResizing: false }),
      mkCol("tahun", "Tahun", undefined, { size: 70, meta: {} }),
      mkCol("bulanExpDate", "Bulan Exp", undefined, {
        size: 100,
        sortingFn: (a, b, colId) => {
          const aVal = BULAN_ORDER[(String(a.getValue(colId) ?? "")).toLowerCase()] ?? 99;
          const bVal = BULAN_ORDER[(String(b.getValue(colId) ?? "")).toLowerCase()] ?? 99;
          return aVal - bVal;
        },
      }),
      mkCol("produk", "Produk", v => {
        const val = String(v ?? "");
        if (!val) return "-";
        const style = val === "ISO"
          ? "bg-blue-100 text-blue-700 border-blue-200"
          : val === "SUSTAIN"
          ? "bg-green-100 text-green-700 border-green-200"
          : "bg-gray-100 text-gray-600 border-gray-200";
        return <Badge variant="outline" className={`text-[10px] font-semibold ${style}`}>{val}</Badge>;
      }, { size: 85 }),
      mkCol("picCrm", "PIC CRM", v => {
        const val = String(v ?? "");
        if (!val) return "-";
        const style = val === "DHA"
          ? "bg-red-100 text-red-700 border-red-200"
          : val === "MRC"
          ? "bg-purple-100 text-purple-700 border-purple-200"
          : "bg-gray-100 text-gray-600 border-gray-200";
        return <Badge variant="outline" className={`text-[10px] font-semibold ${style}`}>{val}</Badge>;
      }, { size: 75 }),
      mkCol("sales", "Sales", undefined, { size: 85 }),
      mkCol("namaAssociate", "Associate", v => (
        <span className="break-words leading-snug">{String(v ?? "-")}</span>
      ), { size: 150 }),
      mkCol("directOrAssociate", "Direct/Assoc", v => {
        const val = String(v ?? "");
        if (!val) return "-";
        const style = val === "Direct"
          ? "bg-blue-100 text-blue-700 border-blue-200"
          : val === "Associate"
          ? "bg-orange-100 text-orange-700 border-orange-200"
          : "bg-gray-100 text-gray-600 border-gray-200";
        return <Badge variant="outline" className={`text-[10px] font-semibold ${style}`}>{val}</Badge>;
      }, { size: 105 }),
      mkCol("grup", "Grup", undefined, { size: 90 }),
      mkCol("status", "Status", v => v ? (
        <Badge variant="outline" className={`text-[10px] ${getStatusBadgeColor(String(v))}`}>{String(v)}</Badge>
      ) : "-", { size: 85 }),
      mkCol("alasan", "Alasan", v => (
        <span className="break-words leading-snug">{String(v ?? "") || "-"}</span>
      ), { size: 160 }),
      mkCol("catatanKunjungan", "Catatan", v => (
        <span className="break-words leading-snug">{String(v ?? "") || "-"}</span>
      ), { enableColumnFilter: false, size: 200 }),
      mkCol("category", "Category", v => v ? (
        <Badge variant="outline" className={`text-[10px] ${getCategoryBadgeStyle(String(v))}`}>{String(v)}</Badge>
      ) : "-", { size: 80 }),
      mkCol("kuadran", "Kuadran", v => v ? (
        <Badge variant="outline" className={`text-[10px] ${getKuadranBadgeStyle(String(v))}`}>{String(v)}</Badge>
      ) : "-", { size: 80 }),
      mkCol("luarKota", "Luar Kota", undefined, { size: 90 }),
      mkCol("provinsi", "Provinsi", undefined, { size: 100 }),
      mkCol("kota", "Kota", undefined, { size: 100 }),
      mkCol("alamat", "Alamat", v => (
        <span className="break-words leading-snug">{String(v ?? "") || "-"}</span>
      ), { enableColumnFilter: false, enableGrouping: false, size: 180 }),
      mkCol("akreditasi", "Akreditasi", undefined, { size: 90 }),
      mkCol("catAkre", "Cat Akre", v => {
        const val = String(v ?? "");
        if (!val) return "-";
        const style = val === "KAN"
          ? "bg-blue-100 text-blue-700 border-blue-200"
          : val === "NON AKRE"
          ? "bg-gray-100 text-gray-600 border-gray-200"
          : val === "INTERNASIONAL"
          ? "bg-orange-100 text-orange-700 border-orange-200"
          : "bg-gray-100 text-gray-600 border-gray-200";
        return <Badge variant="outline" className={`text-[10px] font-semibold ${style}`}>{val}</Badge>;
      }, { size: 100 }),
      mkCol("eaCode", "EA Code", undefined, { size: 80 }),
      mkCol("std", "STD", v => {
        const val = String(v ?? "");
        if (!val) return "-";
        const STD_COLORS: Record<string, string> = {
          "9001":        "bg-blue-100 text-blue-700 border-blue-200",
          "14001":       "bg-green-100 text-green-700 border-green-200",
          "27001":       "bg-purple-100 text-purple-700 border-purple-200",
          "45001":       "bg-orange-100 text-orange-700 border-orange-200",
          "22000":       "bg-teal-100 text-teal-700 border-teal-200",
          "21000":       "bg-indigo-100 text-indigo-700 border-indigo-200",
          "22301":       "bg-cyan-100 text-cyan-700 border-cyan-200",
          "27701":       "bg-violet-100 text-violet-700 border-violet-200",
          "37001":       "bg-rose-100 text-rose-700 border-rose-200",
          "37301":       "bg-pink-100 text-pink-700 border-pink-200",
          "20000-1":     "bg-sky-100 text-sky-700 border-sky-200",
          "31000":       "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200",
          "13485":       "bg-amber-100 text-amber-700 border-amber-200",
          "56001":       "bg-yellow-100 text-yellow-700 border-yellow-200",
          "9994":        "bg-slate-200 text-slate-700 border-slate-300",
          "SMK3":        "bg-red-100 text-red-700 border-red-200",
          "ISPO":        "bg-emerald-100 text-emerald-700 border-emerald-200",
          "ISCC":        "bg-lime-100 text-lime-700 border-lime-200",
          "HACCP":       "bg-zinc-200 text-zinc-700 border-zinc-300",
          "GMP":         "bg-orange-600 text-white border-orange-600",
          "GDP":         "bg-amber-600 text-white border-amber-600",
          "ISCC PLUS":   "bg-emerald-600 text-white border-emerald-600",
          "ISCC EU":     "bg-lime-600 text-white border-lime-600",
          "ISCC CORSIA": "bg-teal-600 text-white border-teal-600",
        };
        const style = STD_COLORS[val] ?? "bg-gray-100 text-gray-600 border-gray-200";
        return <Badge variant="outline" className={`text-[10px] font-semibold ${style}`}>{val}</Badge>;
      }, { size: 100 }),
      mkCol("iaDate", "IA Date", v => fmtDateShort(String(v ?? "")), {
        size: 90,
        getGroupingValue: (row: CrmTarget) => extractMonthYear(row.iaDate),
        sortingFn: (a, b, colId) => {
          const parseOrder = (val: string) => {
            const parts = String(val ?? "").trim().split(" ");
            const monthOrder = MONTH_FULL_ORDER[parts[0].toLowerCase()] ?? 99;
            const year = parts.length > 1 ? parseInt(parts[1]) || 0 : 0;
            return year * 100 + monthOrder;
          };
          const aVal = String(a.getGroupingValue(colId) ?? extractMonthYear(String(a.getValue(colId) ?? "")));
          const bVal = String(b.getGroupingValue(colId) ?? extractMonthYear(String(b.getValue(colId) ?? "")));
          return parseOrder(aVal) - parseOrder(bVal);
        },
      }),
      mkCol("bulanAuditSebelumnyaSustain", "Bln Audit Sblm", v => fmtDateShort(String(v ?? "")), {
        size: 120,
        getGroupingValue: (row: CrmTarget) => extractMonthYear(row.bulanAuditSebelumnyaSustain),
        sortingFn: (a, b, colId) => {
          const parseOrder = (val: string) => {
            const parts = String(val ?? "").trim().split(" ");
            const monthOrder = MONTH_FULL_ORDER[parts[0].toLowerCase()] ?? 99;
            const year = parts.length > 1 ? parseInt(parts[1]) || 0 : 0;
            return year * 100 + monthOrder;
          };
          const aVal = String(a.getGroupingValue(colId) ?? extractMonthYear(String(a.getValue(colId) ?? "")));
          const bVal = String(b.getGroupingValue(colId) ?? extractMonthYear(String(b.getValue(colId) ?? "")));
          return parseOrder(aVal) - parseOrder(bVal);
        },
      }),
      mkCol("expDate", "Exp Date", v => fmtDateShort(String(v ?? "")), {
        size: 90,
        getGroupingValue: (row: CrmTarget) => extractMonthYear(row.expDate),
        sortingFn: (a, b, colId) => {
          const parseOrder = (val: string) => {
            const parts = String(val ?? "").trim().split(" ");
            const monthOrder = MONTH_FULL_ORDER[parts[0].toLowerCase()] ?? 99;
            const year = parts.length > 1 ? parseInt(parts[1]) || 0 : 0;
            return year * 100 + monthOrder;
          };
          const aVal = String(a.getGroupingValue(colId) ?? extractMonthYear(String(a.getValue(colId) ?? "")));
          const bVal = String(b.getGroupingValue(colId) ?? extractMonthYear(String(b.getValue(colId) ?? "")));
          return parseOrder(aVal) - parseOrder(bVal);
        },
      }),
      mkCol("tahapAudit", "Tahap Audit", undefined, { size: 100 }),
      mkNum("hargaKontrak", "Harga Kontrak", "text-blue-600", 180),
      mkCol("bulanTtdNotif", "Bulan TTD", v => fmtDateShort(String(v ?? "")), {
        size: 100,
        getGroupingValue: (row: CrmTarget) => extractMonthYear(row.bulanTtdNotif),
        sortingFn: (a, b, colId) => {
          const parseOrder = (val: string) => {
            const parts = String(val ?? "").trim().split(" ");
            const monthOrder = MONTH_FULL_ORDER[parts[0].toLowerCase()] ?? 99;
            const year = parts.length > 1 ? parseInt(parts[1]) || 0 : 0;
            return year * 100 + monthOrder;
          };
          const aVal = String(a.getGroupingValue(colId) ?? extractMonthYear(String(a.getValue(colId) ?? "")));
          const bVal = String(b.getGroupingValue(colId) ?? extractMonthYear(String(b.getValue(colId) ?? "")));
          return parseOrder(aVal) - parseOrder(bVal);
        },
      }),
      mkCol("bulanAudit", "Bulan Audit", v => fmtDateShort(String(v ?? "")), {
        size: 100,
        getGroupingValue: (row: CrmTarget) => extractMonthYear(row.bulanAudit),
        sortingFn: (a, b, colId) => {
          const parseOrder = (val: string) => {
            const parts = String(val ?? "").trim().split(" ");
            const monthOrder = MONTH_FULL_ORDER[parts[0].toLowerCase()] ?? 99;
            const year = parts.length > 1 ? parseInt(parts[1]) || 0 : 0;
            return year * 100 + monthOrder;
          };
          const aVal = String(a.getGroupingValue(colId) ?? extractMonthYear(String(a.getValue(colId) ?? "")));
          const bVal = String(b.getGroupingValue(colId) ?? extractMonthYear(String(b.getValue(colId) ?? "")));
          return parseOrder(aVal) - parseOrder(bVal);
        },
      }),
      mkNum("hargaTerupdate", "Harga Update", "text-purple-600", 180),
      mkNum("trimmingValue", "Trimming", "text-green-600", 160),
      mkNum("lossValue", "Loss", "text-red-600", 160),
      mkNum("cashback", "Cashback", "text-orange-600", 160),
      mkCol("terminPembayaran", "Termin", undefined, { size: 100 }),
      mkCol("statusInvoice", "Status Invoice", v => v ? (
        <Badge variant={(v === "Terbit") ? "default" : "secondary"} className="text-[10px]">{String(v)}</Badge>
      ) : "-", { size: 110 }),
      mkCol("statusPembayaran", "Status Bayar", v => v ? (
        <Badge variant={(v === "Lunas") ? "default" : "secondary"} className="text-[10px]">{String(v)}</Badge>
      ) : "-", { size: 110 }),
      mkCol("statusKomisi", "Status Komisi", v => v ? (
        <Badge variant="outline" className="text-[10px]">{String(v)}</Badge>
      ) : "-", { size: 110 }),
      mkCol("statusSertifikat", "Status Sertifikat", undefined, { size: 120 }),
      mkCol("tanggalKunjungan", "Tgl Kunjungan", v => fmtDateFull(String(v ?? "")), {
        size: 110,
        getGroupingValue: (row: CrmTarget) => extractMonthYear(row.tanggalKunjungan),
        sortingFn: (a, b, colId) => {
          const parseOrder = (val: string) => {
            const parts = String(val ?? "").trim().split(" ");
            const monthOrder = MONTH_FULL_ORDER[parts[0].toLowerCase()] ?? 99;
            const year = parts.length > 1 ? parseInt(parts[1]) || 0 : 0;
            return year * 100 + monthOrder;
          };
          const aVal = String(a.getGroupingValue(colId) ?? extractMonthYear(String(a.getValue(colId) ?? "")));
          const bVal = String(b.getGroupingValue(colId) ?? extractMonthYear(String(b.getValue(colId) ?? "")));
          return parseOrder(aVal) - parseOrder(bVal);
        },
      }),
      mkCol("statusKunjungan", "Status Kunjungan", v => v ? (
        <Badge variant="outline" className={`text-[10px] ${getStatusKunjunganBadgeStyle(String(v))}`}>{String(v)}</Badge>
      ) : "-", { size: 120 }),
      mkCol("fotoBuktiKunjungan", "Foto Bukti", undefined, { enableColumnFilter: false, enableGrouping: false, size: 100 }),
      mkCol("picDirect", "PIC Direct", v => <span>{String(v ?? "") || "-"}</span>, { size: 130 }),
      mkCol("noTelp", "No Telp", (v, row) => {
        const phone = String(v ?? "");
        if (!phone) return <span>-</span>;
        return (
          <div className="flex items-center gap-1">
            <span>{phone}</span>
            <button onClick={e => { e.stopPropagation(); openWaDialog(row.original, phone); }}
              className="flex items-center justify-center h-5 w-5 rounded hover:bg-green-50 dark:hover:bg-green-950/30 transition-colors cursor-pointer shrink-0" title="Kirim WhatsApp">
              <WhatsAppIcon className="h-3 w-3 text-green-500" />
            </button>
          </div>
        );
      }, { size: 155 }),
      mkCol("email", "Email", v => <span className="truncate">{String(v ?? "") || "-"}</span>, { size: 180 }),
      mkCol("namaKonsultan", "Konsultan", v => <span>{String(v ?? "") || "-"}</span>, { size: 140 }),
      mkCol("noTelpKonsultan", "Telp Konsultan", (v, row) => {
        const phone = String(v ?? "");
        if (!phone) return <span>-</span>;
        return (
          <div className="flex items-center gap-1">
            <span>{phone}</span>
            <button onClick={e => { e.stopPropagation(); openWaDialog(row.original, phone); }}
              className="flex items-center justify-center h-5 w-5 rounded hover:bg-green-50 dark:hover:bg-green-950/30 transition-colors cursor-pointer shrink-0" title="Kirim WhatsApp">
              <WhatsAppIcon className="h-3 w-3 text-green-500" />
            </button>
          </div>
        );
      }, { size: 155 }),
      mkCol("emailKonsultan", "Email Konsultan", v => <span className="truncate">{String(v ?? "") || "-"}</span>, { size: 180 }),
    ];

    const noCol: ColumnDef<CrmTarget> = {
      id: "no",
      header: "No",
      cell: ({ row }) => row.getIsGrouped() ? null : <span className="text-muted-foreground">{row.index + 1}</span>,
      enableSorting: false,
      enableHiding: false,
      enableGrouping: false,
      enableColumnFilter: false,
      size: 36,
    };

    if (!canEdit) return [noCol, ...baseColumns];

    return [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllRowsSelected() || (table.getIsSomeRowsSelected() && "indeterminate")}
            onCheckedChange={v => table.toggleAllRowsSelected(!!v)}
            aria-label="Select all" className="cursor-pointer"
          />
        ),
        cell: ({ row }) => row.getIsGrouped() ? null : (
          <Checkbox checked={row.getIsSelected()} onCheckedChange={v => row.toggleSelected(!!v)}
            aria-label="Select row" onClick={e => e.stopPropagation()} className="cursor-pointer" />
        ),
        enableSorting: false, enableHiding: false, enableGrouping: false, enableColumnFilter: false, size: 40,
      },
      noCol,
      ...baseColumns,
    ];
  }, [canEdit]);

  // Date range pre-filter
  const dateFilteredData = useMemo(() => {
    if (!dateRange?.from && !dateRange?.to) return data;
    const from = dateRange.from ? new Date(dateRange.from).setHours(0, 0, 0, 0) : null;
    const to = dateRange.to ? new Date(dateRange.to).setHours(23, 59, 59, 999) : null;
    return data.filter(row => {
      if (from && row.createdAt < from) return false;
      if (to && row.createdAt > to) return false;
      return true;
    });
  }, [data, dateRange]);

  // Table instance
  const table = useReactTable({
    data: dateFilteredData,
    columns,
    getRowId: (row) => row._id,
    filterFns: { multiSelect: multiSelectFilter },
    globalFilterFn: globalSearchFilter,
    state: { sorting, columnFilters, globalFilter, grouping, expanded, rowSelection, columnOrder, columnPinning: isMobile ? {} : columnPinning, pagination, columnVisibility },
    autoResetExpanded: false,
    groupedColumnMode: false,
    enableRowSelection: row => !row.getIsGrouped(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onGroupingChange: updater => {
      const next = typeof updater === "function" ? updater(grouping) : updater;
      applyGrouping(next);
    },
    onExpandedChange: setExpanded,
    onRowSelectionChange: setRowSelection,
    onColumnOrderChange: setColumnOrder,
    onColumnPinningChange: setColumnPinning,
    onPaginationChange: setPagination,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  // Derived
  const filteredRows = table.getFilteredRowModel().rows;
  const selectedRowIds = Object.keys(rowSelection).filter(k => rowSelection[k]);
  const hasActiveFilters = columnFilters.length > 0 || !!globalFilter || !!dateRange?.from || !!dateRange?.to;

  useEffect(() => { onFilteredRowsChange?.(filteredRows.length); }, [filteredRows.length, onFilteredRowsChange]);

  // Footer totals from ALL filtered rows (not just current page)
  const totals = useMemo(() => {
    const rows = filteredRows;
    return {
      hargaKontrak: rows.reduce((s, r) => s + (r.original.hargaKontrak ?? 0), 0),
      hargaTerupdate: rows.reduce((s, r) => s + (r.original.hargaTerupdate ?? 0), 0),
      trimmingValue: rows.reduce((s, r) => s + (r.original.trimmingValue ?? 0), 0),
      lossValue: rows.reduce((s, r) => s + (r.original.lossValue ?? 0), 0),
      cashback: rows.reduce((s, r) => s + (r.original.cashback ?? 0), 0),
    };
  }, [filteredRows]);

  // Export
  const handleExport = () => {
    const rows = filteredRows;
    const exportData = rows.map(r => {
      const d = r.original;
      return {
        "Nama Perusahaan": d.namaPerusahaan, "Tahun": d.tahun ?? "", "Bulan Exp": d.bulanExpDate ?? "",
        "Produk": d.produk ?? "", "PIC CRM": d.picCrm ?? "", "Sales": d.sales ?? "",
        "Associate": d.namaAssociate ?? "", "Direct/Assoc": d.directOrAssociate ?? "", "Grup": d.grup ?? "",
        "Status": d.status ?? "", "Alasan": d.alasan ?? "", "Catatan": d.catatanKunjungan ?? "",
        "Category": d.category ?? "", "Kuadran": d.kuadran ?? "", "Luar Kota": d.luarKota ?? "",
        "Provinsi": d.provinsi ?? "", "Kota": d.kota ?? "", "Alamat": d.alamat ?? "",
        "Akreditasi": d.akreditasi ?? "", "Cat Akre": d.catAkre ?? "", "EA Code": d.eaCode ?? "",
        "STD": d.std ?? "", "IA Date": d.iaDate ?? "", "Bulan Audit Sblm": d.bulanAuditSebelumnyaSustain ?? "",
        "Exp Date": d.expDate ?? "", "Tahap Audit": d.tahapAudit ?? "",
        "Harga Kontrak": d.hargaKontrak ?? 0, "Bulan TTD": d.bulanTtdNotif ?? "",
        "Bulan Audit": d.bulanAudit ?? "", "Harga Terupdate": d.hargaTerupdate ?? 0,
        "Trimming": d.trimmingValue ?? 0, "Loss": d.lossValue ?? 0, "Cashback": d.cashback ?? 0,
        "Termin": d.terminPembayaran ?? "", "Status Invoice": d.statusInvoice ?? "",
        "Status Pembayaran": d.statusPembayaran ?? "", "Status Komisi": d.statusKomisi ?? "",
        "Status Sertifikat": d.statusSertifikat ?? "", "Tgl Kunjungan": d.tanggalKunjungan ?? "",
        "Status Kunjungan": d.statusKunjungan ?? "",
        "PIC Direct": d.picDirect ?? "", "No Telp": d.noTelp ?? "", "Email": d.email ?? "",
        "Konsultan": d.namaKonsultan ?? "", "Telp Konsultan": d.noTelpKonsultan ?? "", "Email Konsultan": d.emailKonsultan ?? "",
      };
    });
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "CRM Data");
    XLSX.writeFile(wb, `crm-data-${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (!onBulkDelete || selectedRowIds.length === 0) return;
    setIsBulkDeleting(true);
    try {
      await onBulkDelete(selectedRowIds);
      setRowSelection({});
    } finally {
      setIsBulkDeleting(false);
      setBulkDeleteOpen(false);
    }
  };

  const pageCount = table.getPageCount();
  const { pageIndex, pageSize } = table.getState().pagination;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-2">
      <style>{`
        @keyframes blink-yellow {
          0%, 100% { background-color: rgba(254, 240, 138, 0.55); }
          50%       { background-color: transparent; }
        }
        @keyframes blink-orange {
          0%, 100% { background-color: rgba(253, 186, 116, 0.55); }
          50%       { background-color: transparent; }
        }
        @keyframes blink-red {
          0%, 100% { background-color: rgba(252, 165, 165, 0.65); }
          50%       { background-color: transparent; }
        }
        .expire-yellow { animation: blink-yellow 1.8s ease-in-out infinite; }
        .expire-orange { animation: blink-orange 1.4s ease-in-out infinite; }
        .expire-red    { animation: blink-red    1.0s ease-in-out infinite; }
      `}</style>
      {/* ── Toolbar ── */}
      <div className="flex flex-col gap-2 rounded-lg border bg-card px-3 py-2.5">

        {/* Row 1: search + actions */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 sm:flex-none sm:min-w-[160px] sm:max-w-[260px]">
            <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Cari data..."
              value={globalFilter}
              onChange={e => setGlobalFilter(e.target.value)}
              className="pl-8 h-8 text-xs w-full"
            />
          </div>

          {/* Desktop: GroupBy + date filter inline */}
          <div className="hidden sm:flex flex-1 items-center gap-2">
            <GroupByBar grouping={grouping} onGroupingChange={applyGrouping} />
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={`h-8 gap-1.5 text-xs cursor-pointer justify-start whitespace-nowrap transition-all ${
                  dateRange?.from
                    ? "bg-purple-600 hover:bg-purple-700 text-white border-purple-600 shadow-sm"
                    : "bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 text-purple-700 hover:from-purple-100 hover:to-blue-100 hover:border-purple-400"
                }`}>
                  <IconCalendar className="h-3.5 w-3.5 flex-shrink-0" />
                  {dateRange?.from
                    ? dateRange.to
                      ? `${format(dateRange.from, "d MMM yyyy", { locale: localeId })} – ${format(dateRange.to, "d MMM yyyy", { locale: localeId })}`
                      : `Dari ${format(dateRange.from, "d MMM yyyy", { locale: localeId })}`
                    : "Cek Data Baru Ditambahkan"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="range" selected={dateRange} onSelect={setDateRange} captionLayout="dropdown" numberOfMonths={2} initialFocus />
              </PopoverContent>
            </Popover>
            {dateRange?.from && (
              <button onClick={() => setDateRange(undefined)}
                className="flex items-center justify-center h-6 w-6 rounded-full bg-purple-100 text-purple-600 hover:bg-red-100 hover:text-red-600 cursor-pointer transition-colors"
                title="Hapus filter tanggal">
                <IconX className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Desktop: action buttons */}
          <div className="hidden sm:flex items-center gap-1.5 ml-auto flex-wrap">
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {selectedRowIds.length > 0 && <span className="font-medium text-primary">{selectedRowIds.length} dipilih / </span>}
              {filteredRows.length} data
            </span>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs cursor-pointer border-destructive text-destructive hover:bg-destructive/10"
                onClick={() => { setColumnFilters([]); setGlobalFilter(""); setDateRange(undefined); }}>
                <IconFilterOff className="h-3.5 w-3.5" />Reset Filter
              </Button>
            )}
            {canEdit && selectedRowIds.length > 0 && (
              <Button variant="destructive" size="sm" className="h-8 gap-1.5 text-xs cursor-pointer"
                onClick={() => setBulkDeleteOpen(true)}>
                <IconTrash className="h-3.5 w-3.5" />Hapus ({selectedRowIds.length})
              </Button>
            )}
            {canEdit && (
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs cursor-pointer border-purple-600 text-purple-700 hover:bg-purple-50" title="Filter data yang diinginkan dahulu, lalu klik Bulk Edit.."
                onClick={() => setBulkEditOpen(true)}>
                <IconRowInsertBottom className="h-3.5 w-3.5" />
                Bulk Edit{selectedRowIds.length > 0 ? ` (${selectedRowIds.length})` : ` (${filteredRows.length})`}
              </Button>
            )}
            {showExport && (
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs cursor-pointer border-green-600 text-green-600 hover:bg-green-50"
                onClick={handleExport}>
                <IconDownload className="h-3.5 w-3.5" />Export
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs cursor-pointer">
                  <IconLayoutColumns className="h-3.5 w-3.5" />Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 z-50" onCloseAutoFocus={e => e.preventDefault()}>
                <DropdownMenuLabel className="text-xs">Toggle Kolom</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="px-2 py-1">
                  <ScrollArea className="h-72">
                    <ColVisibilityPanel table={table} />
                  </ScrollArea>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile: icon-only action buttons */}
          <div className="flex sm:hidden items-center gap-1 ml-auto">
            {hasActiveFilters && (
              <Button variant="outline" size="icon" className="h-8 w-8 cursor-pointer border-destructive text-destructive hover:bg-destructive/10"
                title="Reset Filter" onClick={() => { setColumnFilters([]); setGlobalFilter(""); setDateRange(undefined); }}>
                <IconFilterOff className="h-3.5 w-3.5" />
              </Button>
            )}
            {canEdit && selectedRowIds.length > 0 && (
              <Button variant="destructive" size="icon" className="h-8 w-8 cursor-pointer"
                title={`Hapus (${selectedRowIds.length})`} onClick={() => setBulkDeleteOpen(true)}>
                <IconTrash className="h-3.5 w-3.5" />
              </Button>
            )}
            {canEdit && (
              <Button variant="outline" size="icon" className="h-8 w-8 cursor-pointer border-purple-600 text-purple-700 hover:bg-purple-50"
                title="Edit Cepat" onClick={() => setBulkEditOpen(true)}>
                <IconRowInsertBottom className="h-3.5 w-3.5" />
              </Button>
            )}
            {showExport && (
              <Button variant="outline" size="icon" className="h-8 w-8 cursor-pointer border-green-600 text-green-600 hover:bg-green-50"
                title="Export" onClick={handleExport}>
                <IconDownload className="h-3.5 w-3.5" />
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8 cursor-pointer" title="Kolom">
                  <IconLayoutColumns className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 z-50" onCloseAutoFocus={e => e.preventDefault()}>
                <DropdownMenuLabel className="text-xs">Toggle Kolom</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="px-2 py-1">
                  <ScrollArea className="h-72">
                    <ColVisibilityPanel table={table} />
                  </ScrollArea>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Row 2 (mobile only): GroupBy + date filter + counter */}
        <div className="flex sm:hidden items-center gap-2">
          <div className="flex-1 min-w-0">
            <GroupByBar grouping={grouping} onGroupingChange={applyGrouping} />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className={`h-8 w-8 flex-shrink-0 cursor-pointer transition-all ${
                dateRange?.from
                  ? "bg-purple-600 hover:bg-purple-700 text-white border-purple-600"
                  : "bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200 text-purple-600 hover:border-purple-400"
              }`} title="Filter tanggal">
                <IconCalendar className="h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar mode="range" selected={dateRange} onSelect={setDateRange} captionLayout="dropdown" numberOfMonths={1} initialFocus />
            </PopoverContent>
          </Popover>
          {dateRange?.from && (
            <button onClick={() => setDateRange(undefined)} className="text-muted-foreground hover:text-destructive cursor-pointer flex-shrink-0" title="Hapus filter tanggal">
              <IconX className="h-3.5 w-3.5" />
            </button>
          )}
          <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
            {selectedRowIds.length > 0 && <span className="font-medium text-primary">{selectedRowIds.length} / </span>}
            {filteredRows.length} data
          </span>
        </div>

      </div>

      {/* ── Table ── */}
      {(
        <div className="rounded-lg border overflow-auto max-h-[calc(100vh-300px)]">
            <table className="text-xs caption-bottom border-separate border-spacing-0" style={{ tableLayout: "fixed", width: "max-content", minWidth: "100%" }}>
              <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
                {table.getHeaderGroups().map(hg => (
                  <tr key={hg.id}>
                    {hg.headers.map(header => {
                      const isPinned = header.column.getIsPinned();
                      const pinStyle = isPinned ? { position: "sticky" as const, left: isPinned === "left" ? header.column.getStart("left") : undefined, zIndex: 11 } : {};
                      return (
                        <th
                          key={header.id}
                          style={{ ...pinStyle, width: header.getSize() }}
                          className={`py-2 px-3 text-[11px] font-semibold text-white bg-purple-700 text-left align-middle border-b border-purple-600 ${isPinned === "left" ? "border-r border-purple-500" : ""}`}
                        >
                          {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>

              <tbody className="[&_tr:last-child]:border-0">
                {table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="py-16 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <IconSearch className="h-8 w-8 opacity-30" />
                        <p className="font-medium">Tidak ada data</p>
                        <p className="text-xs">Coba ubah filter atau kata pencarian</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row, rowIdx) => {
                    const isGrouped = row.getIsGrouped();
                    const isSelected = row.getIsSelected();
                    const isEven = rowIdx % 2 === 0;
                    const expAlert = !isGrouped ? getExpireAlert(row.original.expDate) : null;

                    return (
                      <tr
                        key={row.id}
                        className={`border-b transition-colors cursor-pointer
                          ${expAlert ? `expire-${expAlert}` : isGrouped ? "bg-purple-50 font-medium hover:bg-purple-100" : isSelected ? "bg-primary/10 hover:bg-primary/15" : isEven ? "bg-white hover:bg-purple-50" : "bg-purple-50/40 hover:bg-purple-100/60"}
                        `}
                        onClick={() => {
                          if (isGrouped) { row.getToggleExpandedHandler()(); }
                          else if (canEdit) { setEditDialogTarget(row.original); setEditDialogOpen(true); }
                        }}
                      >
                        {row.getVisibleCells().map(cell => {
                          const isPinned = cell.column.getIsPinned();
                          const isLastLeftPin = isPinned === "left" && cell.column.id === "namaPerusahaan";
                          const pinBg = isPinned ? (isSelected ? "bg-purple-100" : isGrouped ? "bg-purple-50" : "bg-white") : "";
                          const pinBorder = "border-b border-gray-200";

                          if (cell.getIsGrouped()) {
                            return (
                              <td key={cell.id} style={{ ...getPinStyles(cell.column), width: cell.column.getSize() }}
                                className={`py-2 px-3 align-top ${pinBg} ${pinBorder} ${isPinned === "left" ? "border-r border-gray-200" : ""}`}>
                                <div className="flex items-start gap-1.5">
                                  <span className="pointer-events-none flex-shrink-0 mt-0.5">
                                    {row.getIsExpanded() ? <IconChevronDown className="h-3.5 w-3.5" /> : <IconChevronRight className="h-3.5 w-3.5" />}
                                  </span>
                                  <span className="font-medium text-purple-900 break-words whitespace-normal leading-snug">{String(row.getGroupingValue(cell.column.id) ?? cell.getValue() ?? "") || "-"}</span>
                                  <span className="inline-flex flex-shrink-0 items-center justify-center rounded-full bg-purple-700 text-white text-[10px] font-semibold h-5 min-w-5 px-1.5 mt-0.5">{row.subRows.length}</span>
                                </div>
                              </td>
                            );
                          }
                          if (cell.getIsAggregated()) {
                            return (
                              <td key={cell.id} style={{ ...getPinStyles(cell.column), width: cell.column.getSize() }}
                                className={`py-2 px-3 align-top text-right ${pinBg} ${pinBorder} ${isPinned === "left" ? "border-r border-gray-200" : ""}`}>
                                {flexRender(cell.column.columnDef.aggregatedCell ?? cell.column.columnDef.cell, cell.getContext())}
                              </td>
                            );
                          }
                          if (cell.getIsPlaceholder()) {
                            return (
                              <td key={cell.id} style={{ ...getPinStyles(cell.column), width: cell.column.getSize() }}
                                className={`py-2 px-3 align-top ${pinBg} ${pinBorder} ${isPinned === "left" ? "border-r border-gray-200" : ""}`}>
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </td>
                            );
                          }
                          return (
                            <td key={cell.id} style={{ ...getPinStyles(cell.column), width: cell.column.getSize() }}
                              className={`py-2 px-3 align-top border-b border-gray-200 ${pinBg} ${isPinned === "left" ? "border-r border-gray-200" : ""}`}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>

              {/* Footer totals */}
              {filteredRows.length > 0 && (
                <tfoot className="bg-muted/50 border-t font-medium sticky bottom-0 z-10">
                  <tr>
                    {table.getVisibleFlatColumns().map((column) => {
                      const isNumeric = column.columnDef.meta?.isNumeric;
                      const colorClass = column.columnDef.meta?.footerColorClass ?? "";
                      const isPinned = column.getIsPinned();
                      const isLastLeftPin = isPinned === "left" && column.id === "namaPerusahaan";

                      if (column.id === "namaPerusahaan") {
                        return (
                          <td key={column.id} style={{ ...getPinStyles(column), width: column.getSize() }}
                            className={`py-2 px-3 bg-muted/80 ${isPinned === "left" ? "border-r border-gray-200" : ""}`}>
                            <span className="text-[10px] font-bold text-muted-foreground">Total ({filteredRows.length} data)</span>
                          </td>
                        );
                      }
                      if (isNumeric) {
                        const val = totals[column.id as keyof typeof totals];
                        return (
                          <td key={column.id} style={{ width: column.getSize() }} className="py-2 px-3 text-right">
                            <span className={`text-xs font-bold tabular-nums ${colorClass}`}>{fmtCurrency(val)}</span>
                          </td>
                        );
                      }
                      return <td key={column.id} style={{ ...getPinStyles(column), width: column.getSize() }}
                        className={`py-2 px-3 ${isPinned ? "bg-muted/80" : ""}`} />;
                    })}
                  </tr>
                </tfoot>
              )}
            </table>
        </div>
      )}
      {/* ── Pagination ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1 py-1">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Baris per halaman</span>
          <select
            value={pageSize}
            onChange={e => { table.setPageSize(Number(e.target.value)); }}
            className="h-8 rounded-md border border-input bg-background px-2 text-xs cursor-pointer"
          >
            {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        <span className="text-xs text-muted-foreground">
          Menampilkan {pageIndex * pageSize + 1}–{Math.min((pageIndex + 1) * pageSize, filteredRows.length)} dari {filteredRows.length} data
        </span>

        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8 cursor-pointer" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>
            <IconChevronsLeft className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8 cursor-pointer" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            <IconChevronLeft className="h-3.5 w-3.5" />
          </Button>
          {Array.from({ length: Math.min(5, pageCount) }, (_, i) => {
            const start = Math.max(0, Math.min(pageIndex - 2, pageCount - 5));
            const p = start + i;
            return (
              <Button key={p} variant={p === pageIndex ? "default" : "outline"} size="icon"
                className="h-8 w-8 text-xs cursor-pointer" onClick={() => table.setPageIndex(p)}>
                {p + 1}
              </Button>
            );
          })}
          <Button variant="outline" size="icon" className="h-8 w-8 cursor-pointer" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            <IconChevronRight className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8 cursor-pointer" onClick={() => table.setPageIndex(pageCount - 1)} disabled={!table.getCanNextPage()}>
            <IconChevronsRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* ── Edit Dialog ── */}
      <EditCrmDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        target={editDialogTarget}
        staffUsers={staffUsers}
        onSuccess={() => {}}
      />

      {/* ── Bulk Delete Dialog ── */}
      {(() => {
        const isDeleteAll = table.getIsAllRowsSelected();
        const CONFIRM_PHRASE = "saya yakin dan sadar akan menghapus semua data ini";
        const confirmOk = !isDeleteAll || deleteConfirmText.trim().toLowerCase() === CONFIRM_PHRASE;
        return (
          <AlertDialog open={bulkDeleteOpen} onOpenChange={open => { setBulkDeleteOpen(open); if (!open) setDeleteConfirmText(""); }}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Hapus {selectedRowIds.length} Data?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tindakan ini tidak dapat dibatalkan. {selectedRowIds.length} data CRM akan dihapus secara permanen.
                </AlertDialogDescription>
              </AlertDialogHeader>
              {isDeleteAll && (
                <div className="flex flex-col gap-2 py-1">
                  <p className="text-sm text-destructive font-medium">Anda akan menghapus <strong>semua data</strong>. Ketik kalimat berikut untuk konfirmasi:</p>
                  <p className="text-xs font-mono bg-muted rounded px-3 py-2 select-none pointer-events-none text-muted-foreground">{CONFIRM_PHRASE}</p>
                  <Input
                    placeholder="Ketik kalimat konfirmasi di sini..."
                    value={deleteConfirmText}
                    onChange={e => setDeleteConfirmText(e.target.value)}
                    className={`text-sm ${deleteConfirmText && !confirmOk ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    disabled={isBulkDeleting}
                  />
                </div>
              )}
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isBulkDeleting} className="cursor-pointer" onClick={() => setDeleteConfirmText("")}>Batal</AlertDialogCancel>
                <AlertDialogAction onClick={handleBulkDelete} disabled={isBulkDeleting || !confirmOk} className="cursor-pointer bg-destructive hover:bg-destructive/90 disabled:opacity-50">
                  {isBulkDeleting ? "Menghapus..." : `Hapus ${selectedRowIds.length} Data`}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        );
      })()}

      {/* ── WhatsApp Dialog ── */}
      {waDialog && (
        <Dialog open={waDialog.open} onOpenChange={(open) => !open && setWaDialog(null)}>
          <DialogContent className="!w-[95vw] !max-w-[95vw] sm:!w-[70vw] sm:!max-w-[70vw] !h-[90vh] !max-h-[90vh] flex flex-col overflow-hidden p-4 sm:p-6">
            <DialogHeader className="shrink-0">
              <DialogTitle className="flex items-center gap-2">
                <WhatsAppIcon className="h-5 w-5 text-green-500" />
                Kirim WhatsApp
              </DialogTitle>
              <DialogDescription>
                ke {waDialog.phone} — {waDialog.target.namaPerusahaan}
              </DialogDescription>
            </DialogHeader>

            {/* Tab switcher mobile */}
            <div className="flex sm:hidden shrink-0 border rounded-lg overflow-hidden">
              <button onClick={() => setWaTab("preview")}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${waTab === "preview" ? "bg-green-600 text-white" : "bg-muted text-muted-foreground"}`}>
                Preview
              </button>
              <button onClick={() => setWaTab("edit")}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${waTab === "edit" ? "bg-green-600 text-white" : "bg-muted text-muted-foreground"}`}>
                Edit
              </button>
            </div>

            {/* Layout 2 kolom desktop / tab mobile */}
            <div className="flex-1 min-h-0 sm:grid sm:grid-cols-2 sm:gap-4">
              {/* Preview */}
              <div className={`flex flex-col space-y-1.5 min-h-0 h-full ${isMobile && waTab !== "preview" ? "hidden" : ""}`}>
                <div className="hidden sm:flex items-center gap-2 shrink-0">
                  <WhatsAppIcon className="h-3.5 w-3.5 text-green-500" />
                  <span className="text-sm font-medium">Preview WhatsApp</span>
                </div>
                <div className="flex-1 overflow-y-auto rounded-2xl rounded-tl-sm bg-[#dcf8c6] dark:bg-[#056162] p-4 text-sm text-gray-800 dark:text-gray-100 whitespace-pre-wrap leading-relaxed shadow-sm">
                  {renderWaPreview(waDialog.message)}
                </div>
              </div>
              {/* Edit */}
              <div className={`flex flex-col space-y-1.5 min-h-0 h-full ${isMobile && waTab !== "edit" ? "hidden" : ""}`}>
                <div className="hidden sm:flex items-center gap-2 shrink-0">
                  <span className="text-sm font-medium">Edit Pesan</span>
                  <span className="text-xs text-muted-foreground">— gunakan *teks* untuk bold</span>
                </div>
                <textarea
                  className="flex-1 w-full text-sm border rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-green-500 bg-background font-mono"
                  value={waDialog.message}
                  onChange={(e) => setWaDialog({ ...waDialog, message: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 shrink-0">
              <Button variant="outline" onClick={() => setWaDialog(null)}>Batal</Button>
              <Button className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => {
                  const phone = formatPhoneForWa(waDialog.phone);
                  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(waDialog.message)}`, "_blank");
                }}>
                <WhatsAppIcon className="h-4 w-4 mr-2" />
                Buka WhatsApp
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Bulk edit dialog */}
      <CrmBulkEditDialog
        open={bulkEditOpen}
        onOpenChange={setBulkEditOpen}
        rows={
          selectedRowIds.length > 0
            ? filteredRows.filter(r => selectedRowIds.includes(r.id)).map(r => r.original)
            : filteredRows.filter(r => !r.getIsGrouped()).map(r => r.original)
        }
        onSaved={() => setRowSelection({})}
      />
    </div>
  );
}
