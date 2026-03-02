"use client";

import React, { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
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
import { NewClientDialog } from '@/components/new-client-dialog';
import { useFilterContext } from '@/components/tabs/laporan-kunjungan-tabs';
import { toast } from 'sonner';
import {
  Handshake,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Loader2,
  Calendar,
  Phone,
  User,
  Building2,
  LayoutGrid,
  Table as TableIcon,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
} from 'lucide-react';

interface NewClient {
  _id: Id<"crmNewClient">;
  namaClient: string;
  namaPicClient: string;
  noHp: string;
  picTsi: string;
  tglKunjungan: string;
  month: number;
  year: number;
  catatan?: string;
  tindakLanjut?: string;
  fotoBukti?: string;
  created_by?: Id<"users">;
  createdByName: string;
  updated_by?: Id<"users">;
  updatedByName?: string | null | undefined;
  createdAt: number;
  updatedAt: number;
  _creationTime?: number;
}

const MONTHS = [
  "All", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export function NewClientView() {
  // Get filter state from context
  const { selectedMonth, setSelectedMonth, selectedYear, setSelectedYear, searchQuery, setSearchQuery } = useFilterContext();

  // Queries
  const newClients = useQuery(api.crmNewClient.getAllNewClients);
  const deleteClientMutation = useMutation(api.crmNewClient.deleteCrmNewClient);

  // State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<NewClient | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingClient, setDeletingClient] = useState<NewClient | null>(null);
  const [viewDetailOpen, setViewDetailOpen] = useState(false);
  const [viewingClient, setViewingClient] = useState<NewClient | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [mobileFilterOpen, setMobileFilterOpen] = useState<'search' | 'date' | null>(null);

  // Generate year options (current year - 2 to current year + 5)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 8 }, (_, i) => currentYear - 2 + i);

  // Filter new clients
  const filteredClients = newClients?.filter(item => {
    const matchesMonth = selectedMonth === 0 || item.month === selectedMonth;
    const matchesYear = item.year === selectedYear;
    const matchesSearch = searchQuery === "" ||
      item.namaClient.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.namaPicClient.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.picTsi.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesMonth && matchesYear && matchesSearch;
  }) || [];

  // Sort clients by date descending
  const sortedClients = [...filteredClients].sort((a, b) => {
    return new Date(b.tglKunjungan).getTime() - new Date(a.tglKunjungan).getTime();
  });

  // Pagination logic
  const totalPages = Math.ceil(sortedClients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedClients = sortedClients.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedMonth, selectedYear, searchQuery, itemsPerPage]);

  const handleAdd = () => {
    setEditingClient(null);
    setDialogOpen(true);
  };

  const handleEdit = (item: NewClient) => {
    setEditingClient(item);
    setDialogOpen(true);
  };

  const handleDelete = (item: NewClient) => {
    setDeletingClient(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingClient) return;

    setIsDeleting(true);
    try {
      await deleteClientMutation({ id: deletingClient._id });
      toast.success("✅ New Client berhasil dihapus");
      setDeleteDialogOpen(false);
      setDeletingClient(null);
    } catch (error) {
      toast.error("❌ Gagal menghapus new client");
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewDetail = (item: NewClient) => {
    setViewingClient(item);
    setViewDetailOpen(true);
  };

  return (
    <>
      <div className="flex-1 space-y-4 sm:space-y-6 p-4 sm:p-8 pt-6 pb-20 sm:pb-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Laporan Kunjungan New Client</h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Catat dan kelola kunjungan new client per bulan
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
              onClick={handleAdd}
              className="cursor-pointer bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg w-full sm:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              Tambah Kunjungan
            </Button>
          </div>
        </div>

        {/* Filters - Desktop */}
        <Card className="hidden sm:block p-4 sm:p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 border-slate-200 dark:border-slate-800">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Bulan
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
                Tahun
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
                Cari
              </Label>
              <Input
                placeholder="Cari client, PIC, atau TSI..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </Card>

        {/* Total Data Info */}
        {sortedClients.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm">
            <div className="flex flex-wrap items-center gap-2 text-center sm:text-left">
              {/* Total New Client Badge */}
              <Card className="px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2">
                  <span className="text-blue-700 dark:text-blue-300 text-xs font-medium">Total:</span>
                  <span className="text-blue-900 dark:text-blue-100 text-sm font-bold">{sortedClients.length}</span>
                  <span className="text-blue-600 dark:text-blue-400 text-xs">new client</span>
                </div>
              </Card>
            </div>
            {viewMode === "table" && (
              <div className="text-slate-600 dark:text-slate-400 text-center sm:text-right">
                Menampilkan <span className="font-bold text-slate-900 dark:text-white mx-1">{startIndex + 1}-{Math.min(endIndex, sortedClients.length)}</span> dari <span className="font-bold text-slate-900 dark:text-white mx-1">{sortedClients.length}</span> data
              </div>
            )}
          </div>
        )}

        {/* New Clients Grid */}
        {newClients === undefined ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : sortedClients.length === 0 ? (
          <Card className="p-12 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 border-slate-200 dark:border-slate-800">
            <div className="text-center">
              <Handshake className="h-16 w-16 mx-auto text-slate-400 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Tidak ada new client
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-4">
                {searchQuery ? "Tidak ditemukan new client yang sesuai dengan pencarian" : `Belum ada kunjungan untuk ${selectedMonth === 0 ? "semua bulan" : MONTHS[selectedMonth]} ${selectedYear}`}
              </p>
              <Button
                onClick={handleAdd}
                variant="outline"
                className="cursor-pointer border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                <Plus className="mr-2 h-4 w-4" />
                Buat Kunjungan Pertama
              </Button>
            </div>
          </Card>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 lg:gap-6">
            {sortedClients.map((item) => (
              <Card
                key={item._id}
                className="overflow-hidden shadow-md hover:shadow-lg transition-all duration-200 flex flex-col bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 cursor-pointer group relative"
                onClick={() => handleEdit(item)}
              >
                {/* Delete Button - Top Right Corner */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(item);
                  }}
                  className="absolute top-2 right-2 z-10 h-7 w-7 p-0 bg-white/95 dark:bg-slate-900/95 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 hover:text-red-700 rounded-full shadow-md border border-slate-200 dark:border-slate-700"
                  disabled={isDeleting}
                  title="Hapus"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>

                {/* Foto Bukti - Thumbnail */}
                {item.fotoBukti ? (
                  <div className="relative aspect-square w-full overflow-hidden bg-slate-100 dark:bg-slate-900">
                    <img
                      src={item.fotoBukti}
                      alt="Foto Bukti"
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
                  {/* Client Name */}
                  <h3 className="font-semibold text-xs sm:text-sm lg:text-base text-slate-900 dark:text-white line-clamp-2 leading-tight">
                    {item.namaClient}
                  </h3>

                  {/* PIC Client - Compact */}
                  <div className="flex items-center gap-1 text-[10px] sm:text-xs lg:text-sm text-slate-600 dark:text-slate-400">
                    <User className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0 text-blue-500" />
                    <span className="font-semibold flex-shrink-0">PIC Client:</span>
                    <span className="line-clamp-1">{item.namaPicClient}</span>
                  </div>

                  {/* PIC TSI - Compact */}
                  <div className="flex items-center gap-1 text-[10px] sm:text-xs lg:text-sm text-slate-600 dark:text-slate-400">
                    <Building2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0 text-purple-500" />
                    <span className="font-semibold flex-shrink-0">PIC TSI:</span>
                    <span className="line-clamp-1">{item.picTsi}</span>
                  </div>

                  {/* Date - Compact */}
                  <div className="flex items-center gap-1 text-[10px] sm:text-xs text-slate-500 dark:text-slate-500">
                    <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                    <span className="line-clamp-1">
                      {new Date(item.tglKunjungan).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>

                  {/* Catatan & Tindak Lanjut - Show values */}
                  <div className="space-y-1 pt-1 mt-auto">
                    {item.catatan && (
                      <div className="bg-blue-50 dark:bg-blue-950/50 rounded-md px-1.5 py-1 border border-blue-200 dark:border-blue-800">
                        <p className="text-[8px] sm:text-[9px] lg:text-[11px] text-blue-600 dark:text-blue-400 font-semibold mb-0.5">Catatan:</p>
                        <p className="text-[9px] sm:text-[10px] lg:text-sm text-blue-700 dark:text-blue-300 font-medium line-clamp-2 leading-tight">
                          {item.catatan}
                        </p>
                      </div>
                    )}
                    {item.tindakLanjut && (
                      <div className="bg-green-50 dark:bg-green-950/50 rounded-md px-1.5 py-1 border border-green-200 dark:border-green-800">
                        <p className="text-[8px] sm:text-[9px] lg:text-[11px] text-green-600 dark:text-green-400 font-semibold mb-0.5">Tindak Lanjut:</p>
                        <p className="text-[9px] sm:text-[10px] lg:text-sm text-green-700 dark:text-green-300 font-medium line-clamp-2 leading-tight">
                          {item.tindakLanjut}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          /* Table View */
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-900">
                    <TableHead className="w-16 text-center">No</TableHead>
                    <TableHead className="min-w-[120px]">Client</TableHead>
                    <TableHead className="min-w-[120px]">PIC Client</TableHead>
                    <TableHead className="min-w-[100px]">No HP</TableHead>
                    <TableHead className="min-w-[100px]">PIC TSI</TableHead>
                    <TableHead className="min-w-[100px]">Tanggal</TableHead>
                    <TableHead className="text-center min-w-[70px]">Foto</TableHead>
                    <TableHead className="min-w-[150px]">Catatan</TableHead>
                    <TableHead className="min-w-[150px]">Tindak Lanjut</TableHead>
                    <TableHead className="text-right min-w-[120px]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                  <TableBody>
                    {paginatedClients.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-12">
                          <div className="flex flex-col items-center justify-center space-y-3">
                            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                              <Search className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-semibold text-lg">No Data Found</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {searchQuery
                                  ? 'Try adjusting your search terms'
                                  : 'Belum ada kunjungan untuk periode ini'}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedClients.map((item, index) => (
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
                          <TableCell className="font-medium">{item.namaClient}</TableCell>
                          <TableCell>{item.namaPicClient}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3 text-slate-400" />
                              <span>{item.noHp}</span>
                            </div>
                          </TableCell>
                          <TableCell>{item.picTsi}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-slate-400" />
                              <span>{new Date(item.tglKunjungan).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {item.fotoBukti ? (
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
                          <TableCell className="max-w-xs">
                            <p className="text-sm line-clamp-2">
                              {item.catatan || "-"}
                            </p>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <p className="text-sm line-clamp-2">
                              {item.tindakLanjut || "-"}
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
      <NewClientDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        client={editingClient}
        onSuccess={() => {
          setDialogOpen(false);
          setEditingClient(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus New Client?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus new client "{deletingClient?.namaClient}"? Tindakan ini tidak dapat dibatalkan.
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
                  <Handshake className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 flex-shrink-0" />
                  <AlertDialogTitle className="text-xl sm:text-2xl break-words">{viewingClient?.namaClient}</AlertDialogTitle>
                </div>
              </div>
            </div>
          </AlertDialogHeader>

          <div className="space-y-4 mt-4">
            {/* Foto Bukti */}
            {viewingClient?.fotoBukti && (
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">Foto Bukti Kunjungan:</p>
                <div className="rounded-lg border-2 border-slate-200 dark:border-slate-700 overflow-hidden">
                  <img
                    src={viewingClient.fotoBukti}
                    alt="Foto Bukti Kunjungan"
                    className="w-full h-auto"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">PIC Client:</p>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <p className="text-sm text-slate-600 dark:text-slate-400 break-words">{viewingClient?.namaPicClient}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">No HP:</p>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <p className="text-sm text-slate-600 dark:text-slate-400 break-words">{viewingClient?.noHp}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">PIC TSI:</p>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-purple-600 flex-shrink-0" />
                  <p className="text-sm text-slate-600 dark:text-slate-400 break-words">{viewingClient?.picTsi}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tanggal Kunjungan:</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-amber-600 flex-shrink-0" />
                  <p className="text-sm text-slate-600 dark:text-slate-400 break-words">
                    {new Date(viewingClient?.tglKunjungan || "").toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>

            {viewingClient?.catatan && (
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Catatan:</p>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg border-2 border-blue-200 dark:border-blue-800 p-4">
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {viewingClient.catatan}
                  </p>
                </div>
              </div>
            )}

            {viewingClient?.tindakLanjut && (
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Tindak Lanjut:</p>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-lg border-2 border-green-200 dark:border-green-800 p-4">
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {viewingClient.tindakLanjut}
                  </p>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-xs sm:text-xs">
              <p className="text-slate-500 dark:text-slate-400 break-words">
                Dibuat oleh: {viewingClient?.createdByName} pada {new Date(viewingClient?.createdAt || 0).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
              {viewingClient?.updatedByName && (
                <p className="text-slate-500 dark:text-slate-400 mt-1 break-words">
                  Terakhir diupdate oleh: {viewingClient.updatedByName} pada {new Date(viewingClient.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Tutup</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border lg:hidden">
        <div className="grid grid-cols-4 gap-1 p-2">
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

          {/* Add Button */}
          <button
            onClick={handleAdd}
            className="flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md"
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
                    <h3 className="font-semibold text-sm">Cari New Client</h3>
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
                        placeholder="Cari client, PIC, atau TSI..."
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
                        <span>Ditemukan: {sortedClients.length} hasil</span>
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
                      <Label className="text-sm font-semibold">Bulan</Label>
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
                      <Label className="text-sm font-semibold">Tahun</Label>
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

                    {/* Filter Info */}
                    <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                      <p>📊 Menampilkan <span className="font-bold text-foreground">{sortedClients.length}</span> new client</p>
                      <p className="mt-1">
                        {selectedMonth === 0 ? 'Semua bulan' : MONTHS[selectedMonth]} {selectedYear}
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
