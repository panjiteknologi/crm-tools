"use client";

import React, { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  TrendingDown,
  TrendingUp,
  Users,
  Star,
  Calendar,
  Filter,
  X,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface NPS {
  _id: Id<"nps">;
  month?: number;
  year?: number;
  category: "ISO" | "ISPO" | string;
  detractors?: number;
  passives?: number;
  promoters?: number;
  npsDescription?: string;
  customerRelation?: number;
  finance?: number;
  auditor?: number;
  admin?: number;
  sales?: number;
  ratingDescription?: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

// Interface for form data (with string values for decimal input)
interface NPSFormData {
  month: number;
  year: number;
  category: "ISO" | "ISPO";
  detractors: string;
  passives: string;
  promoters: string;
  npsDescription: string;
  customerRelation: string;
  finance: string;
  auditor: string;
  admin: string;
  sales: string;
  ratingDescription: string;
}

const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export default function NPSPage() {
  const npsData = useQuery(api.nps.getNPS);
  const addMutation = useMutation(api.nps.addNPS);
  const updateMutation = useMutation(api.nps.updateNPS);
  const deleteMutation = useMutation(api.nps.deleteNPS);

  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NPS | null>(null);
  const [deletingItem, setDeletingItem] = useState<NPS | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Form state - store as string to allow comma input
  const [formData, setFormData] = useState<NPSFormData>({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    category: "ISO" as "ISO" | "ISPO",
    detractors: "",
    passives: "",
    promoters: "",
    npsDescription: "",
    customerRelation: "",
    finance: "",
    auditor: "",
    admin: "",
    sales: "",
    ratingDescription: "",
  });

  // Helper function to parse decimal input (comma or dot) to number
  const parseDecimal = (value: string): number => {
    if (!value || value.trim() === "") return 0;
    // Replace comma with dot and parse
    const normalized = value.replace(",", ".");
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Helper function to safely update decimal field
  const handleDecimalChange = (field: keyof NPSFormData, value: string) => {
    // Allow: numbers, one comma, one dot, and backspace
    const cleaned = value.replace(/\s/g, "");
    // Only allow digits, commas, and dots
    if (cleaned === "" || /^[0-9,\.]*$/.test(cleaned)) {
      setFormData((prev) => ({ ...prev, [field]: cleaned }));
    }
  };

  // Generate year options
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 8 }, (_, i) => currentYear - 2 + i);

  // Filter by month and year
  const filteredItems = npsData?.filter((item) => {
    return item.month === selectedMonth && item.year === selectedYear;
  }) || [];

  // Separate by type
  const isoItems = filteredItems.filter((item) => item.category === "ISO");
  const ispoItems = filteredItems.filter((item) => item.category === "ISPO");

  const handleOpenDialog = () => {
    setEditingItem(null);
    setFormData({
      month: selectedMonth,
      year: selectedYear,
      category: "ISO",
      detractors: "",
      passives: "",
      promoters: "",
      npsDescription: "",
      customerRelation: "",
      finance: "",
      auditor: "",
      admin: "",
      sales: "",
      ratingDescription: "",
    });
    setDialogOpen(true);
  };

  const handleEdit = (item: NPS) => {
    setEditingItem(item);
    setFormData({
      month: item.month || new Date().getMonth() + 1,
      year: item.year || new Date().getFullYear(),
      category: (item.category === "ISO" || item.category === "ISPO") ? item.category : "ISO",
      detractors: (item.detractors || 0).toString(),
      passives: (item.passives || 0).toString(),
      promoters: (item.promoters || 0).toString(),
      npsDescription: item.npsDescription || "",
      customerRelation: (item.customerRelation || 0).toString(),
      finance: (item.finance || 0).toString(),
      auditor: (item.auditor || 0).toString(),
      admin: (item.admin || 0).toString(),
      sales: (item.sales || 0).toString(),
      ratingDescription: item.ratingDescription || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = (item: NPS) => {
    setDeletingItem(item);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    // Convert string values to numbers for submission
    const numericData = {
      detractors: parseDecimal(formData.detractors),
      passives: parseDecimal(formData.passives),
      promoters: parseDecimal(formData.promoters),
      customerRelation: parseDecimal(formData.customerRelation),
      finance: parseDecimal(formData.finance),
      auditor: parseDecimal(formData.auditor),
      admin: parseDecimal(formData.admin),
      sales: parseDecimal(formData.sales),
    };

    // Validation - semua numeric harus >= 0
    if (
      numericData.detractors < 0 ||
      numericData.passives < 0 ||
      numericData.promoters < 0 ||
      numericData.customerRelation < 0 ||
      numericData.finance < 0 ||
      numericData.auditor < 0 ||
      numericData.admin < 0 ||
      numericData.sales < 0
    ) {
      toast.error("❌ Semua nilai harus angka positif");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = editingItem
        ? await updateMutation({
            id: editingItem._id,
            month: formData.month,
            year: formData.year,
            category: formData.category,
            ...numericData,
            npsDescription: formData.npsDescription,
            ratingDescription: formData.ratingDescription,
          })
        : await addMutation({
            month: formData.month,
            year: formData.year,
            category: formData.category,
            ...numericData,
            npsDescription: formData.npsDescription,
            ratingDescription: formData.ratingDescription,
          });

      if (result.success) {
        toast.success("✅ " + result.message);
        setDialogOpen(false);
      } else {
        toast.error("❌ " + result.message);
      }
    } catch (error) {
      console.error(error);
      toast.error("❌ Gagal menyimpan NPS");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingItem) return;

    setIsDeleting(true);

    try {
      const result = await deleteMutation({ id: deletingItem._id });

      if (result.success) {
        toast.success("✅ " + result.message);
        setDeleteDialogOpen(false);
        setDeletingItem(null);
      } else {
        toast.error("❌ " + result.message);
      }
    } catch (error) {
      console.error(error);
      toast.error("❌ Gagal menghapus NPS");
    } finally {
      setIsDeleting(false);
    }
  };

  // Calculate NPS score
  const calculateNPSScore = (item: NPS) => {
    const detractors = item.detractors || 0;
    const passives = item.passives || 0;
    const promoters = item.promoters || 0;
    const total = detractors + passives + promoters;
    if (total === 0) return 0;
    return ((promoters - detractors) / total) * 100;
  };

  // Calculate average rating
  const calculateAvgRating = (item: NPS) => {
    const ratings = [
      item.customerRelation || 0,
      item.finance || 0,
      item.auditor || 0,
      item.admin || 0,
      item.sales || 0,
    ];
    const sum = ratings.reduce((a, b) => a + b, 0);
    return sum / ratings.length;
  };

  // Get NPS expression emoji based on score (1-100 scale)
  const getNPSExpression = (score: number) => {
    // Convert score to 1-100 range
    const normalizedScore = Math.max(1, Math.min(100, score));

    if (normalizedScore < 40) return { emoji: "😞", label: "Buruk", filter: "sepia(1) saturate(10) hue-rotate(-50deg)", textColor: "text-red-600", animation: "" };
    if (normalizedScore < 70) return { emoji: "😐", label: "Cukup", filter: "sepia(1) saturate(5) hue-rotate(0deg)", textColor: "text-yellow-600", animation: "" };
    return { emoji: "😊", label: "Baik", filter: "sepia(1) saturate(10) hue-rotate(50deg)", textColor: "text-green-600", animation: "animate-bounce" };
  };

  const renderCard = (item: NPS) => {
    const npsScore = calculateNPSScore(item);
    const avgRating = calculateAvgRating(item);
    const npsExpression = getNPSExpression(npsScore);

    // Prepare data for NPS Pie Chart
    const npsPieData = [
      { name: 'Detractors', value: item.detractors || 0, color: '#ef4444' },
      { name: 'Passives', value: item.passives || 0, color: '#eab308' },
      { name: 'Promoters', value: item.promoters || 0, color: '#22c55e' },
    ].filter(d => d.value > 0);

    return (
      <Card
        key={item._id}
        className="p-4 bg-white dark:bg-slate-800 shadow-md border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow"
      >
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                {MONTHS[(item.month || 1) - 1]} {item.year || new Date().getFullYear()}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {item.category}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleEdit(item)}
                className="cursor-pointer text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                disabled={isSubmitting}
              >
                <Pencil className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDelete(item)}
                className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                disabled={isDeleting}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Row 1: NPS - Kiri Chart, Kanan Deskripsi */}
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Kiri: NPS Chart (Recharts Pie Chart) */}
              <div className="w-full md:w-1/2">
                <h5 className="text-xs font-semibold text-purple-900 dark:text-purple-100 uppercase tracking-wide mb-2">
                  NPS Chart
                </h5>
                <div className="flex items-center justify-center gap-3">
                  {/* Pie Chart */}
                  <div className="relative w-48 h-48 md:w-60 md:h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={npsPieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry) => entry.value}
                          outerRadius={50}
                          dataKey="value"
                        >
                          {npsPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              const total = npsPieData.reduce((sum, d) => sum + d.value, 0);
                              const percentage = ((data.value / total) * 100).toFixed(1);
                              return (
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-2">
                                  <p className="font-semibold text-sm mb-1" style={{ color: data.color }}>{data.name}</p>
                                  <p className="text-xs text-slate-600 dark:text-slate-400">Jumlah: {data.value}</p>
                                  <p className="text-sm font-bold">{percentage}%</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* NPS Score Badge */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="bg-white dark:bg-slate-900 rounded-full px-2 py-1 shadow-sm">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {npsScore.toFixed(0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded bg-red-500"></div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-700 dark:text-slate-300">Detractors</span>
                        <span className="text-xs font-semibold text-slate-900 dark:text-white">{item.detractors || 0}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded bg-yellow-500"></div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-700 dark:text-slate-300">Passives</span>
                        <span className="text-xs font-semibold text-slate-900 dark:text-white">{item.passives || 0}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded bg-green-500"></div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-700 dark:text-slate-300">Promoters</span>
                        <span className="text-xs font-semibold text-slate-900 dark:text-white">{item.promoters || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Kanan: Deskripsi NPS */}
              <div className="w-full md:w-1/2 flex flex-col">
                <h5 className="text-xs font-semibold text-purple-900 dark:text-purple-100 uppercase tracking-wide mb-2">
                  Deskripsi
                </h5>

                {/* NPS Score dengan Emoji dan Progress Bar */}
                <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-purple-100 dark:border-purple-900 mb-2">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-3xl ${npsExpression.animation}`} style={{ filter: npsExpression.filter }}>{npsExpression.emoji}</span>
                      <div>
                        <p className={`text-sm font-bold ${npsExpression.textColor}`}>{npsExpression.label}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">NPS Score</p>
                      </div>
                    </div>
                    <span className={`text-2xl font-bold ${npsExpression.textColor}`}>
                      {Math.max(1, Math.min(100, npsScore)).toFixed(0)}
                    </span>
                  </div>
                  {/* Progress Bar 1-100 */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                      <span>1</span>
                      <span>50</span>
                      <span>100</span>
                    </div>
                    <Progress
                      value={Math.max(1, Math.min(100, npsScore))}
                      className="h-2 [&_[data-slot=progress-indicator]]:bg-purple-500"
                    />
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-purple-100 dark:border-purple-900 flex-1 min-h-[120px] max-h-[120px] overflow-y-auto">
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {item.npsDescription || <span className="italic text-slate-400">Tidak ada deskripsi</span>}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Rating - Kiri Chart, Kanan Deskripsi */}
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Kiri: Rating Chart */}
              <div className="w-full md:w-1/2">
                <h5 className="text-xs font-semibold text-purple-900 dark:text-purple-100 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <Star className="w-3 h-3 text-purple-500 fill-purple-500" />
                  Rating Chart
                </h5>
                <div className="grid grid-cols-1 gap-1.5">
                  {[
                    { label: "Customer Relation", value: item.customerRelation, icon: "👥" },
                    { label: "Finance", value: item.finance, icon: "💰" },
                    { label: "Auditor", value: item.auditor, icon: "🔍" },
                    { label: "Admin", value: item.admin, icon: "📋" },
                    { label: "Sales", value: item.sales, icon: "📊" },
                  ].map((rating) => (
                    <div key={rating.label} className="flex items-center gap-2">
                      <span className="text-sm">{rating.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-700 dark:text-slate-300 truncate">{rating.label}</span>
                          <span className="font-bold text-purple-600 dark:text-purple-400">{rating.value || 0}</span>
                        </div>
                        <Progress value={((rating.value || 0) / 5) * 100} className="h-2 [&_[data-slot=progress-indicator]]:bg-purple-500" />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-center">
                  <span className="text-xs text-slate-600 dark:text-slate-400">Avg: </span>
                  <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                    {avgRating.toFixed(1)}
                  </span>
                </div>
              </div>

              {/* Kanan: Deskripsi Rating */}
              <div className="w-full md:w-1/2 flex flex-col">
                <h5 className="text-xs font-semibold text-purple-900 dark:text-purple-100 uppercase tracking-wide mb-2">
                  Deskripsi
                </h5>
                <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-purple-100 dark:border-purple-900 flex-1 min-h-[150px] max-h-[150px] overflow-y-auto">
                  <p className="text-md text-slate-600 dark:text-slate-400 leading-relaxed">
                    {item.ratingDescription || <span className="italic text-slate-400">Tidak ada deskripsi</span>}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <>
      <div className="flex-1 space-y-4 sm:space-y-6 p-4 sm:p-8 pt-6 pb-20 sm:pb-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">NPS</h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Net Promoter Score & Rating - Kelola data survei ISO & ISPO
            </p>
          </div>
          <div className="hidden sm:block">
            <Button
              onClick={handleOpenDialog}
              className="cursor-pointer bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
            >
              <Plus className="mr-2 h-4 w-4" />
              Tambah NPS
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="hidden sm:block p-4 sm:p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 border-slate-200 dark:border-slate-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Bulan
              </Label>
              <Select
                value={selectedMonth.toString()}
                onValueChange={(v) => setSelectedMonth(parseInt(v))}
              >
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
              <Select
                value={selectedYear.toString()}
                onValueChange={(v) => setSelectedYear(parseInt(v))}
              >
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
          </div>
        </Card>

        {/* NPS Grids */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* NPS ISO */}
          <div className="space-y-4">
            <Card className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100">
                    NPS ISO
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {isoItems.length} data
                  </p>
                </div>
              </div>
            </Card>

            <div className="space-y-3">
              {isoItems.length === 0 ? (
                <Card className="p-8 text-center bg-slate-50 dark:bg-slate-900">
                  <p className="text-slate-500 dark:text-slate-400">
                    Belum ada data NPS ISO untuk {MONTHS[selectedMonth - 1]}{" "}
                    {selectedYear}
                  </p>
                </Card>
              ) : (
                isoItems.map((item) => renderCard(item))
              )}
            </div>
          </div>

          {/* NPS ISPO */}
          <div className="space-y-4">
            <Card className="p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-green-900 dark:text-green-100">
                    NPS ISPO
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {ispoItems.length} data
                  </p>
                </div>
              </div>
            </Card>

            <div className="space-y-3">
              {ispoItems.length === 0 ? (
                <Card className="p-8 text-center bg-slate-50 dark:bg-slate-900">
                  <p className="text-slate-500 dark:text-slate-400">
                    Belum ada data NPS ISPO untuk {MONTHS[selectedMonth - 1]}{" "}
                    {selectedYear}
                  </p>
                </Card>
              ) : (
                ispoItems.map((item) => renderCard(item))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl w-[95vw] md:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit NPS" : "Tambah NPS Baru"}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? "Update data Net Promoter Score & Rating"
                : "Tambah data survei NPS dan Rating baru"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Tahun & Bulan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year">
                  Tahun <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.year.toString()}
                  onValueChange={(v) =>
                    setFormData((prev) => ({ ...prev, year: parseInt(v) }))
                  }
                >
                  <SelectTrigger id="year">
                    <SelectValue />
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
                <Label htmlFor="month">
                  Bulan <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.month.toString()}
                  onValueChange={(v) =>
                    setFormData((prev) => ({ ...prev, month: parseInt(v) }))
                  }
                >
                  <SelectTrigger id="month">
                    <SelectValue />
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
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">
                Category <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.category}
                onValueChange={(v: "ISO" | "ISPO") =>
                  setFormData((prev) => ({ ...prev, category: v }))
                }
              >
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ISO">ISO</SelectItem>
                  <SelectItem value="ISPO">ISPO</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* NPS Chart Section */}
            <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                NPS Chart
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="detractors" className="text-xs">
                    Detractors
                  </Label>
                  <Input
                    id="detractors"
                    type="text"
                    inputMode="decimal"
                    value={formData.detractors}
                    onChange={(e) => handleDecimalChange("detractors", e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="passives" className="text-xs">
                    Passives
                  </Label>
                  <Input
                    id="passives"
                    type="text"
                    inputMode="decimal"
                    value={formData.passives}
                    onChange={(e) => handleDecimalChange("passives", e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="promoters" className="text-xs">
                    Promoters
                  </Label>
                  <Input
                    id="promoters"
                    type="text"
                    inputMode="decimal"
                    value={formData.promoters}
                    onChange={(e) => handleDecimalChange("promoters", e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="npsDescription" className="text-xs">
                  Deskripsi NPS
                </Label>
                <Textarea
                  id="npsDescription"
                  value={formData.npsDescription}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, npsDescription: e.target.value }))
                  }
                  placeholder="Deskripsi NPS..."
                  rows={2}
                />
              </div>
            </div>

            {/* Rating Chart Section */}
            <div className="space-y-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <h4 className="font-semibold text-amber-900 dark:text-amber-100 flex items-center gap-1">
                <Star className="w-4 h-4" />
                Rating Chart
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {[
                  { field: "customerRelation", label: "Cust Relation" },
                  { field: "finance", label: "Finance" },
                  { field: "auditor", label: "Auditor" },
                  { field: "admin", label: "Admin" },
                  { field: "sales", label: "Sales" },
                ].map((item) => (
                  <div key={item.field} className="space-y-1">
                    <Label htmlFor={item.field} className="text-xs">
                      {item.label}
                    </Label>
                    <Input
                      id={item.field}
                      type="text"
                      inputMode="decimal"
                      value={formData[item.field as keyof typeof formData] as string}
                      onChange={(e) => handleDecimalChange(item.field as keyof typeof formData, e.target.value)}
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                <Label htmlFor="ratingDescription" className="text-xs">
                  Deskripsi Rating
                </Label>
                <Textarea
                  id="ratingDescription"
                  value={formData.ratingDescription}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      ratingDescription: e.target.value,
                    }))
                  }
                  placeholder="Deskripsi Rating..."
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isSubmitting}
              className="cursor-pointer"
            >
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1 cursor-pointer">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : editingItem ? (
                "Simpan Perubahan"
              ) : (
                "Tambah NPS"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus NPS?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus data NPS {MONTHS[deletingItem?.month || 1 - 1]}{" "}
              {deletingItem?.year}? Tindakan ini tidak dapat dibatalkan.
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

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border lg:hidden">
        <div className="grid grid-cols-2 gap-1 p-2">
          {/* Filter Button */}
          <button
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors ${
              mobileFilterOpen ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
            }`}
          >
            <Calendar className="h-5 w-5 mb-1" />
            <span className="text-[10px] font-medium">Filter</span>
          </button>

          {/* Add Button */}
          <button
            onClick={handleOpenDialog}
            className="flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md"
          >
            <Plus className="h-5 w-5 mb-1" />
            <span className="text-[10px] font-medium">Tambah</span>
          </button>
        </div>
      </div>

      {/* Mobile Filter Sheet Overlay */}
      {mobileFilterOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setMobileFilterOpen(false)}
          />

          {/* Filter Sheet */}
          <div className="fixed bottom-16 left-0 right-0 z-40 lg:hidden max-h-[70vh] overflow-y-auto bg-background rounded-t-2xl border-t border-border shadow-2xl animate-in slide-in-from-bottom-10">
            {/* Handle bar */}
            <div className="flex justify-center border-b p-3">
              <div className="w-12 h-1.5 bg-muted rounded-full" />
            </div>

            {/* Filter Content */}
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">Filter Tanggal</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMobileFilterOpen(false)}
                  className="h-8 text-xs"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-3">
                {/* Bulan */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Bulan</Label>
                  <Select
                    value={selectedMonth.toString()}
                    onValueChange={(v) => setSelectedMonth(parseInt(v))}
                  >
                    <SelectTrigger className="w-full bg-muted/50 border-muted focus:ring-2 focus:ring-blue-500">
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
                  <Select
                    value={selectedYear.toString()}
                    onValueChange={(v) => setSelectedYear(parseInt(v))}
                  >
                    <SelectTrigger className="w-full bg-muted/50 border-muted focus:ring-2 focus:ring-blue-500">
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
                <div className="text-xs bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p className="text-blue-700 dark:text-blue-300 font-medium">📊 Menampilkan data untuk:</p>
                  <p className="mt-1 font-bold text-slate-900 dark:text-white">
                    {MONTHS[selectedMonth - 1]} {selectedYear}
                  </p>
                  <p className="mt-1 text-slate-700 dark:text-slate-300">
                    ISO: <span className="font-bold text-blue-600 dark:text-blue-400">{isoItems.length}</span> data |
                    ISPO: <span className="font-bold text-purple-600 dark:text-purple-400">{ispoItems.length}</span> data
                  </p>
                </div>

                <Button
                  onClick={() => setMobileFilterOpen(false)}
                  className="w-full"
                >
                  OK
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
