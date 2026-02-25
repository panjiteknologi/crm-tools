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
import { IsuKendalaDialog } from '@/components/isu-kendala-dialog';
import { toast } from 'sonner';
import {
  AlertTriangle,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Loader2,
  Calendar,
  CheckCircle2,
  XCircle,
  Info,
  LayoutGrid,
  Table as TableIcon,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
} from 'lucide-react';

interface IsuKendala {
  _id: Id<"isuKendala">;
  title: string;
  month: number;
  year: number;
  points: string[];
  status: "active" | "inactive";
  category: "Internal" | "Eksternal" | "Operasional" | "Teknis";
  priority: "Low" | "Medium" | "High" | "Critical";
  tanggalKejadian?: string;
  tanggalSelesai?: string;
  created_by?: Id<"users">;
  createdByName: string;
  updated_by?: Id<"users">;
  updatedByName?: string | null | undefined;
  createdAt: number;
  updatedAt: number;
  _creationTime?: number;
}

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export default function IsuKendalaPage() {
  const isuKendala = useQuery(api.isuKendala.getIsuKendala);
  const deleteIsuKendalaMutation = useMutation(api.isuKendala.deleteIsuKendala);
  const updateStatusMutation = useMutation(api.isuKendala.updateIsuKendalaStatus);

  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIsu, setEditingIsu] = useState<IsuKendala | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingIsu, setDeletingIsu] = useState<IsuKendala | null>(null);
  const [viewDetailOpen, setViewDetailOpen] = useState(false);
  const [viewingIsu, setViewingIsu] = useState<IsuKendala | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [mobileFilterOpen, setMobileFilterOpen] = useState<'search' | 'date' | null>(null);

  // Generate year options (current year - 2 to current year + 5)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 8 }, (_, i) => currentYear - 2 + i);

  // Filter isu kendala
  const filteredIsuKendala = isuKendala?.filter(isu => {
    const matchesMonth = isu.month === selectedMonth;
    const matchesYear = isu.year === selectedYear;
    const matchesSearch = searchQuery === "" ||
      isu.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      isu.points.some(point => point.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesMonth && matchesYear && matchesSearch;
  }) || [];

  // Sort isu kendala: active first, then by priority, then by updated date
  const priorityOrder = { "Critical": 0, "High": 1, "Medium": 2, "Low": 3 };

  const sortedIsuKendala = [...filteredIsuKendala].sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === "active" ? -1 : 1;
    }
    if (a.priority !== b.priority) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return b.updatedAt - a.updatedAt;
  });

  // Pagination logic
  const totalPages = Math.ceil(sortedIsuKendala.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedIsuKendala = sortedIsuKendala.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedMonth, selectedYear, searchQuery, itemsPerPage]);

  const handleAdd = () => {
    setEditingIsu(null);
    setDialogOpen(true);
  };

  const handleEdit = (isu: IsuKendala) => {
    setEditingIsu(isu);
    setDialogOpen(true);
  };

  const handleDelete = (isu: IsuKendala) => {
    setDeletingIsu(isu);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingIsu) return;

    setIsDeleting(true);
    try {
      await deleteIsuKendalaMutation({ id: deletingIsu._id });
      toast.success("✅ Isu Kendala berhasil dihapus");
      setDeleteDialogOpen(false);
      setDeletingIsu(null);
    } catch (error) {
      toast.error("❌ Gagal menghapus isu kendala");
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async (isu: IsuKendala) => {
    setIsUpdatingStatus(true);
    try {
      const newStatus = isu.status === "active" ? "inactive" : "active";
      await updateStatusMutation({
        id: isu._id,
        status: newStatus,
      });
      toast.success(`✅ Isu Kendala berhasil diubah menjadi ${newStatus}`);
    } catch (error) {
      toast.error("❌ Gagal mengubah status isu kendala");
      console.error(error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleViewDetail = (isu: IsuKendala) => {
    setViewingIsu(isu);
    setViewDetailOpen(true);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical": return "bg-red-100 text-red-700 border-red-300 dark:bg-red-900 dark:text-red-300 dark:border-red-700";
      case "High": return "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900 dark:text-orange-300 dark:border-orange-700";
      case "Medium": return "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-700";
      case "Low": return "bg-green-100 text-green-700 border-green-300 dark:bg-green-900 dark:text-green-300 dark:border-green-700";
      default: return "";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Internal": return "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700";
      case "Eksternal": return "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900 dark:text-purple-300 dark:border-purple-700";
      case "Operasional": return "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900 dark:text-amber-300 dark:border-amber-700";
      case "Teknis": return "bg-cyan-100 text-cyan-700 border-cyan-300 dark:bg-cyan-900 dark:text-cyan-300 dark:border-cyan-700";
      default: return "";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "Critical":
      case "High":
        return <AlertTriangle className="h-3 w-3" />;
      case "Medium":
        return <Info className="h-3 w-3" />;
      case "Low":
        return <CheckCircle2 className="h-3 w-3" />;
      default:
        return null;
    }
  };

  return (
    <>
      <div className="flex-1 space-y-4 sm:space-y-6 p-4 sm:p-8 pt-6 pb-20 sm:pb-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Isu Kendala</h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Catat dan kelola isu atau kendala yang terjadi per bulan
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
              Tambah Isu
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
                    <SelectItem key={idx} value={(idx + 1).toString()}>
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
                placeholder="Cari isu kendala..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </Card>

        {/* Total Data Info */}
        {sortedIsuKendala.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
            <div className="text-slate-600 dark:text-slate-400 text-center sm:text-left">
              Total <span className="font-bold text-slate-900 dark:text-white mx-1">{sortedIsuKendala.length}</span> isu kendala
            </div>
            {viewMode === "table" && (
              <div className="text-slate-600 dark:text-slate-400 text-center sm:text-right">
                Menampilkan <span className="font-bold text-slate-900 dark:text-white mx-1">{startIndex + 1}-{Math.min(endIndex, sortedIsuKendala.length)}</span> dari <span className="font-bold text-slate-900 dark:text-white mx-1">{sortedIsuKendala.length}</span> data
              </div>
            )}
          </div>
        )}

        {/* Isu Kendala Grid */}
        {isuKendala === undefined ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : sortedIsuKendala.length === 0 ? (
          <Card className="p-12 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 border-slate-200 dark:border-slate-800">
            <div className="text-center">
              <AlertTriangle className="h-16 w-16 mx-auto text-slate-400 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Tidak ada isu kendala
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-4">
                {searchQuery ? "Tidak ditemukan isu kendala yang sesuai dengan pencarian" : `Belum ada isu kendala untuk ${MONTHS[selectedMonth - 1]} ${selectedYear}`}
              </p>
              <Button
                onClick={handleAdd}
                variant="outline"
                className="cursor-pointer border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                <Plus className="mr-2 h-4 w-4" />
                Catat Isu Pertama
              </Button>
            </div>
          </Card>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedIsuKendala.map((isu) => (
              <Card
                key={isu._id}
                className="overflow-hidden bg-white dark:bg-slate-800 shadow-lg border-slate-200 dark:border-slate-700 hover:shadow-xl transition-shadow flex flex-col"
              >
                {/* Header with badges */}
                <div className="p-4 space-y-3 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white line-clamp-2 flex-1">
                      {isu.title}
                    </h3>
                    <div className="flex flex-col gap-1 shrink-0">
                      <Badge
                        variant={isu.status === "active" ? "default" : "secondary"}
                        className={isu.status === "active"
                          ? "bg-green-600 hover:bg-green-700 text-white shadow-lg text-xs"
                          : "bg-gray-600 hover:bg-gray-700 text-white shadow-lg text-xs"
                        }
                      >
                        {isu.status === "active" ? "Aktif" : "Selesai"}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant="outline"
                      className={`text-xs font-semibold ${getCategoryColor(isu.category)}`}
                    >
                      {isu.category}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-xs font-semibold flex items-center gap-1 ${getPriorityColor(isu.priority)}`}
                    >
                      {getPriorityIcon(isu.priority)}
                      {isu.priority}
                    </Badge>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3 flex-1">
                  <div className="space-y-3">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Point-Point Isu:
                    </p>
                    <div className="space-y-2">
                      {isu.points.map((point, idx) => (
                        <div
                          key={idx}
                          className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg border-2 border-blue-200 dark:border-blue-800 p-3 shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start gap-2">
                            <span className="flex-shrink-0 w-6 h-6 bg-blue-600 dark:bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                              {idx + 1}
                            </span>
                            <p className="text-sm text-slate-700 dark:text-slate-300 flex-1 leading-snug">
                              {point}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <Calendar className="h-3 w-3" />
                      <span className="font-semibold">
                        {MONTHS[isu.month - 1]} {isu.year}
                      </span>
                    </div>
                    {(isu.tanggalKejadian || isu.tanggalSelesai) && (
                      <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                        {isu.tanggalKejadian && (
                          <div className="flex items-center gap-1">
                            <span className="font-semibold">Kejadian:</span>
                            <span>{new Date(isu.tanggalKejadian).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          </div>
                        )}
                        {isu.tanggalSelesai && (
                          <div className="flex items-center gap-1">
                            <span className="font-semibold">Selesai:</span>
                            <span>{new Date(isu.tanggalSelesai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1 sm:gap-2 p-3 sm:p-4 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleViewDetail(isu)}
                    className="cursor-pointer flex-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 h-8 sm:h-8 px-1 sm:px-2"
                    disabled={isUpdatingStatus}
                  >
                    <Eye className="h-3 w-3 sm:mr-1" />
                    <span className="hidden sm:inline text-xs">Lihat</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleToggleStatus(isu)}
                    className={`cursor-pointer flex-1 h-8 sm:h-8 px-1 sm:px-2 ${
                      isu.status === "active"
                        ? "text-gray-600 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/20"
                        : "text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                    }`}
                    disabled={isUpdatingStatus}
                  >
                    {isu.status === "active" ? (
                      <>
                        <XCircle className="h-3 w-3 sm:mr-1" />
                        <span className="hidden sm:inline text-xs">Selesai</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-3 w-3 sm:mr-1" />
                        <span className="hidden sm:inline text-xs">Aktif</span>
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(isu)}
                    className="cursor-pointer flex-1 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20 h-8 sm:h-8 px-1 sm:px-2"
                    disabled={isUpdatingStatus}
                  >
                    <Pencil className="h-3 w-3 sm:mr-1" />
                    <span className="hidden sm:inline text-xs">Edit</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(isu)}
                    className="cursor-pointer flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 h-8 sm:h-8 px-1 sm:px-2"
                    disabled={isDeleting || isUpdatingStatus}
                  >
                    <Trash2 className="h-3 w-3 sm:mr-1" />
                    <span className="hidden sm:inline text-xs">Hapus</span>
                  </Button>
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
                    <TableHead className="min-w-[150px]">Judul</TableHead>
                    <TableHead className="min-w-[100px]">Kategori</TableHead>
                    <TableHead className="min-w-[100px]">Prioritas</TableHead>
                    <TableHead className="min-w-[100px]">Status</TableHead>
                    <TableHead className="min-w-[100px]">Bulan/Tahun</TableHead>
                    <TableHead className="min-w-[200px]">Points</TableHead>
                    <TableHead className="text-right min-w-[120px]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedIsuKendala.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12">
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                            <Search className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-semibold text-lg">No Data Found</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {searchQuery ? 'Try adjusting your search terms' : 'Belum ada isu kendala untuk periode ini'}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedIsuKendala.map((isu, index) => (
                      <TableRow
                        key={isu._id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                        onClick={() => handleEdit(isu)}
                      >
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-white text-xs font-bold shadow-md mx-auto">
                            {startIndex + index + 1}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{isu.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-xs ${getCategoryColor(isu.category)}`}>
                            {isu.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-xs flex items-center gap-1 ${getPriorityColor(isu.priority)}`}>
                            {getPriorityIcon(isu.priority)}
                            {isu.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={isu.status === "active" ? "default" : "secondary"}
                            className={isu.status === "active"
                              ? "bg-green-600 hover:bg-green-700 text-white shadow-lg text-xs"
                              : "bg-gray-600 hover:bg-gray-700 text-white shadow-lg text-xs"
                            }
                          >
                            {isu.status === "active" ? "Aktif" : "Selesai"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-slate-400" />
                            <span>{MONTHS[isu.month - 1]} {isu.year}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <p className="text-sm line-clamp-2">
                            {isu.points.slice(0, 2).join("; ")}
                            {isu.points.length > 2 && "..."}
                          </p>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewDetail(isu);
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
                                handleEdit(isu);
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
                                handleDelete(isu);
                              }}
                              className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 h-8 w-8 p-0"
                              disabled={isDeleting || isUpdatingStatus}
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
      <IsuKendalaDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        isuKendala={editingIsu}
        onSuccess={() => {
          setDialogOpen(false);
          setEditingIsu(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Isu Kendala?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus isu kendala "{deletingIsu?.title}"? Tindakan ini tidak dapat dibatalkan.
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
        <AlertDialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <AlertDialogTitle className="text-2xl mb-2">{viewingIsu?.title}</AlertDialogTitle>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant="outline"
                    className={`text-xs font-semibold ${getCategoryColor(viewingIsu?.category || "")}`}
                  >
                    {viewingIsu?.category}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`text-xs font-semibold flex items-center gap-1 ${getPriorityColor(viewingIsu?.priority || "")}`}
                  >
                    {getPriorityIcon(viewingIsu?.priority || "")}
                    {viewingIsu?.priority}
                  </Badge>
                  <Badge
                    variant={viewingIsu?.status === "active" ? "default" : "secondary"}
                    className={viewingIsu?.status === "active"
                      ? "bg-green-600 hover:bg-green-700 text-white shadow-lg text-xs"
                      : "bg-gray-600 hover:bg-gray-700 text-white shadow-lg text-xs"
                    }
                  >
                    {viewingIsu?.status === "active" ? "Aktif" : "Selesai"}
                  </Badge>
                </div>
              </div>
            </div>
          </AlertDialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <p className="text-base font-bold text-slate-800 dark:text-slate-200 mb-3">Point-Point Isu:</p>
              <div className="space-y-3">
                {viewingIsu?.points.map((point, idx) => (
                  <div
                    key={idx}
                    className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg border-2 border-blue-200 dark:border-blue-800 p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-7 h-7 bg-blue-600 dark:bg-blue-500 text-white rounded-full flex items-center justify-center text-base font-bold mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="text-base text-slate-700 dark:text-slate-300 flex-1 leading-snug">
                        {point}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-slate-700">
              <div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Bulan/Tahun:</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {MONTHS[(viewingIsu?.month || 1) - 1]} {viewingIsu?.year}
                </p>
              </div>
              {viewingIsu?.tanggalKejadian && (
                <div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tanggal Kejadian:</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {new Date(viewingIsu.tanggalKejadian).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              )}
              {viewingIsu?.tanggalSelesai && (
                <div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tanggal Selesai:</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {new Date(viewingIsu.tanggalSelesai).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Dibuat oleh: {viewingIsu?.createdByName} pada {new Date(viewingIsu?.createdAt || 0).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
              {viewingIsu?.updatedByName && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Terakhir diupdate oleh: {viewingIsu.updatedByName} pada {new Date(viewingIsu.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
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
                    <h3 className="font-semibold text-sm">Cari Isu Kendala</h3>
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
                        placeholder="Cari isu kendala..."
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
                        <span>Ditemukan: {sortedIsuKendala.length} hasil</span>
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
                            <SelectItem key={idx} value={(idx + 1).toString()}>
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
                      <p>📊 Menampilkan <span className="font-bold text-foreground">{sortedIsuKendala.length}</span> isu kendala</p>
                      <p className="mt-1">
                        {MONTHS[selectedMonth - 1]} {selectedYear}
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
