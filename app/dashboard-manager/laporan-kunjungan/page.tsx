"use client";

import React, { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { LaporanKunjunganDialog } from '@/components/laporan-kunjungan-dialog';
import { TambahKunjunganDialog } from '@/components/tambah-kunjungan-dialog';
import { useCurrentUser } from '@/hooks/use-current-user';
import { toast } from 'sonner';
import {
  FileText,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Loader2,
  Calendar,
  CheckCircle2,
  XCircle,
  Phone,
  User,
  Building2,
  LayoutGrid,
  Table as TableIcon,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  X,
  Search,
  MapPin,
} from 'lucide-react';

interface CrmTarget {
  _id: Id<"crmTargets">;
  tahun: string;
  bulanExpDate: string;
  produk: string;
  picCrm: string;
  sales: string;
  namaAssociate: string;
  directOrAssociate?: string;
  grup?: string;
  namaPerusahaan: string;
  status: string;
  alasan?: string;
  category?: string;
  kuadran?: string;
  luarKota?: string;
  provinsi: string;
  kota: string;
  alamat: string;
  akreditasi?: string;
  catAkre?: string;
  eaCode?: string;
  std?: string;
  iaDate?: string;
  expDate?: string;
  tahapAudit?: string;
  hargaKontrak?: number;
  bulanTtdNotif?: string;
  hargaTerupdate?: number;
  trimmingValue?: number;
  lossValue?: number;
  cashback?: number;
  terminPembayaran?: string;
  statusSertifikat?: string;
  tanggalKunjungan?: string;
  statusKunjungan?: string;
  catatanKunjungan?: string;
  fotoBuktiKunjungan?: string;
  bulanAuditSebelumnyaSustain?: string;
  bulanAudit?: string;
  statusInvoice?: "Terbit" | "Belum Terbit";
  statusPembayaran?: "Lunas" | "Belum Lunas" | "Sudah DP";
  statusKomisi?: "Sudah Diajukan" | "Belum Diajukan" | "Tidak Ada";
  created_by?: Id<"users">;
  createdAt: number;
  updated_by?: Id<"users">;
  updatedAt: number;
}

const MONTHS = [
  "All", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export default function LaporanKunjunganPage() {
  const visitedTargets = useQuery(api.crmTargets.getVisitedTargets);
  const updateCrmTargetMutation = useMutation(api.crmTargets.updateCrmTarget);
  const deleteCrmTargetMutation = useMutation(api.crmTargets.deleteCrmTarget);
  const { user } = useCurrentUser();

  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedPicCrm, setSelectedPicCrm] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<CrmTarget[] | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingTarget, setDeletingTarget] = useState<CrmTarget | null>(null);
  const [viewDetailOpen, setViewDetailOpen] = useState(false);
  const [viewingTarget, setViewingTarget] = useState<CrmTarget | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [tambahKunjunganOpen, setTambahKunjunganOpen] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState<'search' | 'date' | null>(null);
  const [showHargaKontrak, setShowHargaKontrak] = useState(false);

  // Generate year options (current year - 2 to current year + 5)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 8 }, (_, i) => currentYear - 2 + i);

  // Filter targets based on month from tanggalKunjungan
  const filteredTargets = visitedTargets?.filter(item => {
    if (!item.tanggalKunjungan) return false;

    const visitDate = new Date(item.tanggalKunjungan);
    const visitMonth = visitDate.getMonth() + 1; // 1-12
    const visitYear = visitDate.getFullYear();

    const matchesMonth = selectedMonth === 0 || visitMonth === selectedMonth;
    const matchesYear = visitYear === selectedYear;
    const matchesPicCrm = selectedPicCrm === "All" || item.picCrm === selectedPicCrm;
    const matchesSearch = searchQuery === "" ||
      item.namaPerusahaan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.picCrm.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sales.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.kota.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesMonth && matchesYear && matchesPicCrm && matchesSearch;
  }) || [];

  // Group targets by company name
  const groupedByCompany = filteredTargets.reduce((acc, target) => {
    const companyName = target.namaPerusahaan;
    if (!acc[companyName]) {
      acc[companyName] = [];
    }
    acc[companyName].push(target);
    return acc;
  }, {} as Record<string, CrmTarget[]>);

  // Sort each group's visits by date descending
  Object.keys(groupedByCompany).forEach(companyName => {
    groupedByCompany[companyName].sort((a, b) => {
      return new Date(b.tanggalKunjungan!).getTime() - new Date(a.tanggalKunjungan!).getTime();
    });
  });

  // Convert grouped object to array and sort by company name
  const sortedGroupedCompanies = Object.entries(groupedByCompany)
    .sort(([companyA], [companyB]) => companyA.localeCompare(companyB));

  // Flatten grouped data for pagination
  const flattenedTargets = sortedGroupedCompanies.flatMap(([companyName, targets]) => targets);

  // Pagination logic
  const totalPages = Math.ceil(flattenedTargets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTargets = flattenedTargets.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedMonth, selectedYear, selectedPicCrm, searchQuery, itemsPerPage]);

  const handleAdd = () => {
    setEditingTarget(null);
    setDialogOpen(true);
  };

  const handleEdit = (item: CrmTarget) => {
    // Get all targets with the same company name
    const allTargetsFromSameCompany = visitedTargets?.filter(
      target => target.namaPerusahaan === item.namaPerusahaan
    ) || [];

    setEditingTarget(allTargetsFromSameCompany.length > 0 ? allTargetsFromSameCompany : [item]);
    setDialogOpen(true);
  };

  const handleDelete = (item: CrmTarget) => {
    setDeletingTarget(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingTarget) return;

    setIsDeleting(true);
    try {
      await deleteCrmTargetMutation({ id: deletingTarget._id });
      toast.success("✅ Laporan Kunjungan berhasil dihapus");
      setDeleteDialogOpen(false);
      setDeletingTarget(null);
    } catch (error) {
      toast.error("❌ Gagal menghapus laporan kunjungan");
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewDetail = (item: CrmTarget) => {
    setViewingTarget(item);
    setViewDetailOpen(true);
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return "Rp 0";
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <>
      <div className="flex-1 space-y-4 sm:space-y-6 p-4 sm:p-8 pt-6 pb-20 sm:pb-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Laporan Kunjungan</h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Laporan kunjungan yang sudah dilakukan (VISITED)
            </p>
          </div>
          <div className="hidden sm:flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              onClick={() => setViewMode(viewMode === "grid" ? "table" : "grid")}
              variant="outline"
              className="cursor-pointer border-slate-200 dark:border-slate-700 w-full sm:w-auto"
            >
              {viewMode === "grid" ? (
                <>
                  <TableIcon className="mr-2 h-4 w-4" />
                  Table View
                </>
              ) : (
                <>
                  <LayoutGrid className="mr-2 h-4 w-4" />
                  Grid View
                </>
              )}
            </Button>
            <Button
              onClick={() => setTambahKunjunganOpen(true)}
              className="cursor-pointer bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg w-full sm:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              Tambah Kunjungan
            </Button>
          </div>
        </div>

        {/* Filters - Desktop */}
        <Card className="hidden sm:block p-4 sm:p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 border-slate-200 dark:border-slate-800">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Bulan Kunjungan
              </Label>
              <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                <SelectTrigger className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500">
                  <SelectValue placeholder="Pilih bulan" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month, idx) => (
                    <SelectItem key={idx} value={idx.toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Tahun Kunjungan
              </Label>
              <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                <SelectTrigger className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500">
                  <SelectValue placeholder="Pilih tahun" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                PIC CRM
              </Label>
              <Select value={selectedPicCrm} onValueChange={setSelectedPicCrm}>
                <SelectTrigger className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500">
                  <SelectValue placeholder="Pilih PIC CRM" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">Semua PIC</SelectItem>
                  <SelectItem value="DHA">DHA</SelectItem>
                  <SelectItem value="MRC">MRC</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Cari
              </Label>
              <Input
                placeholder="Cari perusahaan, PIC, Sales..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Harga Kontrak
              </Label>
              <Button
                onClick={() => setShowHargaKontrak(!showHargaKontrak)}
                className={`w-full cursor-pointer transition-all ${
                  showHargaKontrak
                    ? "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-md"
                    : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md"
                }`}
              >
                {showHargaKontrak ? "Sembunyikan" : "Tampilkan"}
                <span className="mr-2 text-sm font-bold">Harga</span>
              </Button>
            </div>
          </div>
        </Card>

        {/* Total Data Info */}
        {flattenedTargets.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm">
            <div className="flex flex-wrap items-center gap-2 text-center sm:text-left">
              {/* Total Perusahaan Badge */}
              <Card className="px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2">
                  <span className="text-blue-700 dark:text-blue-300 text-xs font-medium">Total:</span>
                  <span className="text-blue-900 dark:text-blue-100 text-sm font-bold">{sortedGroupedCompanies.length}</span>
                  <span className="text-blue-600 dark:text-blue-400 text-xs">perusahaan</span>
                </div>
              </Card>

              {/* Bulan Badge */}
              <Badge variant="outline" className="px-3 py-1.5 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 font-semibold">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  <span className="text-xs">{selectedMonth === 0 ? 'Semua Bulan' : MONTHS[selectedMonth]}</span>
                  <span className="text-purple-500 dark:text-purple-400">•</span>
                  <span className="text-xs font-bold">{selectedYear}</span>
                </div>
              </Badge>

              {/* PIC Badge */}
              <Badge variant="outline" className="px-3 py-1.5 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 font-semibold">
                <div className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  <span className="text-xs font-bold">{selectedPicCrm === "All" ? "Semua PIC" : selectedPicCrm}</span>
                </div>
              </Badge>
            </div>

            {viewMode === "table" && (
              <Card className="px-3 py-1.5 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 border-slate-200 dark:border-slate-700">
                <div className="text-slate-600 dark:text-slate-400 text-center sm:text-right">
                  Menampilkan <span className="font-bold text-slate-900 dark:text-white mx-1">{startIndex + 1}-{Math.min(endIndex, flattenedTargets.length)}</span> dari <span className="font-bold text-slate-900 dark:text-white mx-1">{flattenedTargets.length}</span> data
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Targets Grid */}
        {visitedTargets === undefined ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : flattenedTargets.length === 0 ? (
          <Card className="p-12 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 border-slate-200 dark:border-slate-800">
            <div className="text-center">
              <FileText className="h-16 w-16 mx-auto text-slate-400 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Tidak ada laporan kunjungan
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-4">
                {searchQuery ? "Tidak ditemukan laporan yang sesuai dengan pencarian" : `Belum ada kunjungan untuk ${selectedMonth === 0 ? "semua bulan" : MONTHS[selectedMonth]} ${selectedYear}`}
              </p>
            </div>
          </Card>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 lg:gap-6">
            {sortedGroupedCompanies.map(([companyName, targets]) => {
              // Only show the latest visit (first one after sorting by date desc)
              const latestVisit = targets[0];

              // Calculate total harga kontrak from all visits
              const totalHargaKontrak = targets.reduce((sum, target) => {
                return sum + (target.hargaKontrak || 0);
              }, 0);

              return (
                <Card
                  key={latestVisit._id}
                  className="overflow-hidden shadow-md hover:shadow-lg transition-all duration-200 flex flex-col bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 cursor-pointer group relative"
                  onClick={() => handleEdit(latestVisit)}
                >
                  {/* Visit Count Badge */}
                  {targets.length > 1 && (
                    <div className="absolute top-2 left-2 z-10">
                      <Badge variant="secondary" className="bg-blue-600 text-white text-xs px-2 py-1">
                        {targets.length} Standard
                      </Badge>
                    </div>
                  )}

                  {/* Delete Button - Top Right Corner */}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(latestVisit);
                    }}
                    className="absolute top-2 right-2 z-10 h-7 w-7 p-0 bg-white/95 dark:bg-slate-900/95 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 hover:text-red-700 rounded-full shadow-md border border-slate-200 dark:border-slate-700"
                    disabled={isDeleting}
                    title="Hapus"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>

                {/* Foto Bukti - Thumbnail */}
                {latestVisit.fotoBuktiKunjungan ? (
                  <div className="relative aspect-square w-full overflow-hidden bg-slate-100 dark:bg-slate-900">
                    <img
                      src={latestVisit.fotoBuktiKunjungan}
                      alt="Foto Bukti Kunjungan"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  </div>
                ) : (
                  /* Placeholder when no photo */
                  <div className="aspect-square w-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center">
                    <ImageIcon className="h-12 w-12 sm:h-16 sm:w-16 text-slate-400 dark:text-slate-600" />
                  </div>
                )}

                {/* Content - Compact */}
                <div className="px-2 py-1 sm:px-3 sm:py-1 lg:px-4 lg:py-1 flex flex-col flex-1 space-y-1 sm:space-y-1.5 lg:space-y-2 !mt-[-20px]">
                  {/* Company Name */}
                  <h3 className="font-semibold text-xs sm:text-sm lg:text-base text-slate-900 dark:text-white line-clamp-2 leading-tight">
                    {latestVisit.namaPerusahaan}
                  </h3>

                  {/* PIC CRM - Compact */}
                  <div className="flex items-center gap-1 text-[10px] sm:text-xs lg:text-sm text-slate-600 dark:text-slate-400">
                    <User className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0 text-blue-500" />
                    <span className="font-semibold flex-shrink-0">PIC:</span>
                    <span className="line-clamp-1">{latestVisit.picCrm}</span>
                  </div>

                  {/* Sales - Compact */}
                  <div className="flex items-center gap-1 text-[10px] sm:text-xs lg:text-sm text-slate-600 dark:text-slate-400">
                    <Building2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0 text-purple-500" />
                    <span className="font-semibold flex-shrink-0">Sales:</span>
                    <span className="line-clamp-1">{latestVisit.sales}</span>
                  </div>

                  {/* Date & Location - Compact */}
                  <div className="flex items-center gap-1 text-[10px] sm:text-xs text-slate-500 dark:text-slate-500">
                    <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                    <span className="line-clamp-1">
                      {new Date(latestVisit.tanggalKunjungan!).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </span>
                    <span className="mx-1">•</span>
                    <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                    <span className="line-clamp-1">{latestVisit.kota}</span>
                  </div>

                  {/* Harga Kontrak - Show total from all visits */}
                  {showHargaKontrak && totalHargaKontrak > 0 && (
                    <div className="flex items-center gap-1 text-[10px] sm:text-xs text-green-600 dark:text-green-400 font-semibold">
                      <span className="flex-shrink-0 font-bold">Rp</span>
                      <span className="line-clamp-1">
                        {targets.length > 1
                          ? `Total: ${formatCurrency(totalHargaKontrak)}`
                          : formatCurrency(totalHargaKontrak)
                        }
                      </span>
                      {targets.length > 1 && (
                        <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 ml-1 border-green-600 text-green-600">
                          {targets.length}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Catatan Kunjungan - Show values */}
                  {latestVisit.catatanKunjungan && (
                    <div className="space-y-1 pt-1 mt-auto">
                      <div className="bg-blue-50 dark:bg-blue-950/50 rounded-md px-1.5 py-1 border border-blue-200 dark:border-blue-800">
                        <p className="text-[8px] sm:text-[9px] lg:text-[11px] text-blue-600 dark:text-blue-400 font-semibold mb-0.5">Catatan:</p>
                        <p className="text-[9px] sm:text-[10px] lg:text-sm text-blue-700 dark:text-blue-300 font-medium line-clamp-2 leading-tight">
                          {latestVisit.catatanKunjungan}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
              );
            })}
          </div>
        ) : (
          /* Table View */
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-900">
                    <TableHead className="w-16 text-center">No</TableHead>
                    <TableHead className="min-w-[150px]">Perusahaan</TableHead>
                    <TableHead className="min-w-[100px]">PIC CRM</TableHead>
                    <TableHead className="min-w-[100px]">Sales</TableHead>
                    <TableHead className="min-w-[120px]">Kota</TableHead>
                    <TableHead className="min-w-[100px]">Tanggal</TableHead>
                    <TableHead className="min-w-[100px]">Produk</TableHead>
                    <TableHead className="text-center min-w-[70px]">Foto</TableHead>
                    {showHargaKontrak && (
                      <TableHead className="min-w-[120px]">Harga Kontrak</TableHead>
                    )}
                    <TableHead className="min-w-[150px]">Catatan</TableHead>
                    <TableHead className="text-right min-w-[120px]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                  <TableBody>
                    {paginatedTargets.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={showHargaKontrak ? 11 : 10} className="text-center py-12">
                          <div className="flex flex-col items-center justify-center space-y-3">
                            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                              <Search className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-semibold text-lg">No Data Found</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {searchQuery
                                  ? 'Try adjusting your search terms'
                                  : 'Belum ada laporan untuk periode ini'}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedTargets.map((item, index) => (
                        <TableRow
                          key={item._id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                          onClick={() => handleEdit(item)}
                        >
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-white text-xs font-bold shadow-md mx-auto">
                              {startIndex + index + 1}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{item.namaPerusahaan}</TableCell>
                          <TableCell>{item.picCrm}</TableCell>
                          <TableCell>{item.sales}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-slate-400" />
                              <span>{item.kota}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-slate-400" />
                              <span>{new Date(item.tanggalKunjungan!).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {item.produk}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {item.fotoBuktiKunjungan ? (
                              <div className="flex items-center justify-center gap-1 text-green-600 dark:text-green-400">
                                <ImageIcon className="h-4 w-4" />
                                <span className="text-xs font-semibold">Ada</span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-1 text-slate-400 dark:text-slate-600">
                                <ImageIcon className="h-4 w-4" />
                                <span className="text-xs">Tidak</span>
                              </div>
                            )}
                          </TableCell>
                          {showHargaKontrak && (
                            <TableCell>
                              {item.hargaKontrak ? (
                                <div className="flex items-center gap-1">
                                  <span className="text-green-600 font-bold text-xs">Rp</span>
                                  <span className="text-xs font-semibold">{formatCurrency(item.hargaKontrak)}</span>
                                </div>
                              ) : "-"}
                            </TableCell>
                          )}
                          <TableCell className="max-w-xs">
                            <p className="text-sm line-clamp-2">
                              {item.catatanKunjungan || "-"}
                            </p>
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewDetail(item);
                                }}
                                className="cursor-pointer text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 h-8 w-8 p-0"
                                title="Lihat Detail"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(item);
                                }}
                                className="cursor-pointer text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20 h-8 w-8 p-0"
                                title="Edit"
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(item);
                                }}
                                className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 h-8 w-8 p-0"
                                disabled={isDeleting}
                                title="Hapus"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 px-3 sm:px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                {/* Rows per Page */}
                <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-4 text-sm w-full sm:w-auto">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">Tampilkan:</span>
                    <Select
                      value={itemsPerPage.toString()}
                      onValueChange={(v) => setItemsPerPage(parseInt(v))}
                    >
                      <SelectTrigger className="h-8 w-16 sm:w-20 border-slate-300 dark:border-slate-600 text-xs sm:text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm hidden sm:inline">data/hal</span>
                  </div>
                </div>

                {/* Pagination Buttons */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-1 sm:gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="h-7 sm:h-8 px-2 sm:px-3 border-slate-300 dark:border-slate-600 text-xs sm:text-sm"
                    >
                      <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline ml-1">Sebelumnya</span>
                    </Button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage === 1) {
                          pageNum = i + 1;
                        } else if (currentPage === totalPages) {
                          pageNum = totalPages - 2 + i;
                        } else {
                          pageNum = currentPage - 1 + i;
                        }

                        return (
                          <Button
                            key={pageNum}
                            size="sm"
                            variant={currentPage === pageNum ? "default" : "outline"}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`h-7 sm:h-8 w-7 sm:w-8 p-0 text-xs sm:text-sm ${
                              currentPage === pageNum
                                ? "bg-blue-600 hover:bg-blue-700 text-white"
                                : "border-slate-300 dark:border-slate-600"
                            }`}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="h-7 sm:h-8 px-2 sm:px-3 border-slate-300 dark:border-slate-600 text-xs sm:text-sm"
                    >
                      <span className="hidden sm:inline mr-1">Selanjutnya</span>
                      <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                )}

                {/* Page Info */}
                <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 text-center">
                  Hal <span className="font-bold text-slate-900 dark:text-white">{currentPage}</span> / <span className="font-bold text-slate-900 dark:text-white">{totalPages}</span>
                </div>
              </div>
          </Card>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <LaporanKunjunganDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        targets={editingTarget}
        onSuccess={() => {
          setDialogOpen(false);
          setEditingTarget(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Laporan Kunjungan?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus laporan kunjungan "{deletingTarget?.namaPerusahaan}"? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menghapus...
                </>
              ) : (
                "Hapus"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Detail Dialog */}
      <AlertDialog open={viewDetailOpen} onOpenChange={setViewDetailOpen}>
        <AlertDialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <div className="flex items-start justify-between gap-2 sm:gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 flex-shrink-0" />
                  <AlertDialogTitle className="text-xl sm:text-2xl break-words">{viewingTarget?.namaPerusahaan}</AlertDialogTitle>
                </div>
              </div>
            </div>
          </AlertDialogHeader>

          <div className="space-y-4 mt-4">
            {/* Foto Bukti */}
            {viewingTarget?.fotoBuktiKunjungan && (
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">Foto Bukti Kunjungan:</p>
                <div className="rounded-lg border-2 border-slate-200 dark:border-slate-700 overflow-hidden">
                  <img
                    src={viewingTarget.fotoBuktiKunjungan}
                    alt="Foto Bukti Kunjungan"
                    className="w-full h-auto"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">PIC CRM:</p>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <p className="text-sm text-slate-600 dark:text-slate-400 break-words">{viewingTarget?.picCrm}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Sales:</p>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-purple-600 flex-shrink-0" />
                  <p className="text-sm text-slate-600 dark:text-slate-400 break-words">{viewingTarget?.sales}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Kota:</p>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <p className="text-sm text-slate-600 dark:text-slate-400 break-words">{viewingTarget?.kota}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tanggal Kunjungan:</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-amber-600 flex-shrink-0" />
                  <p className="text-sm text-slate-600 dark:text-slate-400 break-words">
                    {new Date(viewingTarget?.tanggalKunjungan || "").toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Produk:</p>
                <Badge variant="outline" className="text-xs">
                  {viewingTarget?.produk}
                </Badge>
              </div>
              {viewingTarget?.hargaKontrak && (
                <div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Harga Kontrak:</p>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 font-bold text-sm flex-shrink-0">Rp</span>
                    <p className="text-sm text-slate-600 dark:text-slate-400 break-words font-semibold">
                      {formatCurrency(viewingTarget.hargaKontrak)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {viewingTarget?.catatanKunjungan && (
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Catatan Kunjungan:</p>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg border-2 border-blue-200 dark:border-blue-800 p-4">
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {viewingTarget.catatanKunjungan}
                  </p>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-xs sm:text-xs">
              <p className="text-slate-500 dark:text-slate-400 break-words">
                Dibuat pada {new Date(viewingTarget?.createdAt || 0).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
              {viewingTarget?.updated_by && (
                <p className="text-slate-500 dark:text-slate-400 mt-1 break-words">
                  Terakhir diupdate pada {new Date(viewingTarget.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Tutup</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Tambah Kunjungan Dialog */}
      <TambahKunjunganDialog
        open={tambahKunjunganOpen}
        onOpenChange={setTambahKunjunganOpen}
        onSuccess={() => {
          setTambahKunjunganOpen(false);
        }}
      />

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border lg:hidden">
        <div className="grid grid-cols-5 gap-1 p-2">
          {/* Search Tab */}
          <button
            onClick={() => setMobileFilterOpen(mobileFilterOpen === 'search' ? null : 'search')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors ${
              mobileFilterOpen === 'search' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
            }`}
          >
            <Search className="h-5 w-5 mb-1" />
            <span className="text-[10px] font-medium">Cari</span>
          </button>

          {/* Date Filter Tab */}
          <button
            onClick={() => setMobileFilterOpen(mobileFilterOpen === 'date' ? null : 'date')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors ${
              mobileFilterOpen === 'date' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
            }`}
          >
            <Calendar className="h-5 w-5 mb-1" />
            <span className="text-[10px] font-medium">Filter</span>
          </button>

          {/* Show/Hide Harga Button */}
          <button
            onClick={() => setShowHargaKontrak(!showHargaKontrak)}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all ${
              showHargaKontrak
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md'
                : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
            }`}
          >
            <span className="text-[14px] font-bold mb-0.5">Rp</span>
            <span className="text-[9px] font-medium">{showHargaKontrak ? 'Hide' : 'Show'}</span>
          </button>

          {/* Add Button */}
          <button
            onClick={() => setTambahKunjunganOpen(true)}
            className="flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md"
          >
            <Plus className="h-5 w-5 mb-1" />
            <span className="text-[10px] font-medium">Tambah</span>
          </button>

          {/* Grid/Table Toggle */}
          <button
            onClick={() => setViewMode(viewMode === "grid" ? "table" : "grid")}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors ${
              viewMode === "grid" ? 'bg-purple-100 hover:bg-purple-200 text-purple-700' : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
            }`}
          >
            {viewMode === "grid" ? (
              <>
                <TableIcon className="h-5 w-5 mb-1" />
                <span className="text-[10px] font-medium">Table</span>
              </>
            ) : (
              <>
                <LayoutGrid className="h-5 w-5 mb-1" />
                <span className="text-[10px] font-medium">Grid</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Filter Sheet Overlay */}
      {mobileFilterOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setMobileFilterOpen(null)}
          />

          {/* Filter Sheet */}
          <div className="fixed bottom-16 left-0 right-0 z-40 lg:hidden max-h-[70vh] overflow-y-auto bg-background rounded-t-2xl border-t border-border shadow-2xl animate-in slide-in-from-bottom-10">
            {/* Handle bar */}
            <div className="flex justify-center border-b p-3">
              <div className="w-12 h-1.5 bg-muted rounded-full" />
            </div>

            {/* Filter Content */}
            <div className="p-4 space-y-4">
              {/* Search Filter */}
              {mobileFilterOpen === 'search' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">Cari Laporan Kunjungan</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setMobileFilterOpen(null)}
                      className="h-8 text-xs"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Cari perusahaan, PIC, Sales..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            setMobileFilterOpen(null);
                          }
                        }}
                      />
                    </div>
                    {searchQuery && (
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Ditemukan: {flattenedTargets.length} hasil</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSearchQuery('')}
                          className="h-7 text-xs"
                        >
                          Hapus
                        </Button>
                      </div>
                    )}
                    <Button
                      onClick={() => setMobileFilterOpen(null)}
                      className="w-full"
                    >
                      OK
                    </Button>
                  </div>
                </div>
              )}

              {/* Date Filter */}
              {mobileFilterOpen === 'date' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">Filter Tanggal</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setMobileFilterOpen(null)}
                      className="h-8 text-xs"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {/* Bulan */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Bulan Kunjungan</Label>
                      <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                        <SelectTrigger className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500">
                          <SelectValue placeholder="Pilih bulan" />
                        </SelectTrigger>
                        <SelectContent>
                          {MONTHS.map((month, idx) => (
                            <SelectItem key={idx} value={idx.toString()}>
                              {month}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Tahun */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Tahun Kunjungan</Label>
                      <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                        <SelectTrigger className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500">
                          <SelectValue placeholder="Pilih tahun" />
                        </SelectTrigger>
                        <SelectContent>
                          {yearOptions.map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* PIC CRM */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">PIC CRM</Label>
                      <Select value={selectedPicCrm} onValueChange={setSelectedPicCrm}>
                        <SelectTrigger className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500">
                          <SelectValue placeholder="Pilih PIC CRM" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="All">Semua PIC</SelectItem>
                          <SelectItem value="DHA">DHA</SelectItem>
                          <SelectItem value="MRC">MRC</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Filter Info */}
                    <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                      <p>📊 Menampilkan <span className="font-bold text-foreground">{sortedGroupedCompanies.length}</span> perusahaan</p>
                      <p className="mt-1">
                        {selectedMonth === 0 ? 'Semua bulan' : MONTHS[selectedMonth]} {selectedYear}
                      </p>
                      <p className="mt-1">
                        PIC: {selectedPicCrm === "All" ? "Semua" : selectedPicCrm}
                      </p>
                    </div>

                    <Button
                      onClick={() => setMobileFilterOpen(null)}
                      className="w-full"
                    >
                      Terapkan
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
