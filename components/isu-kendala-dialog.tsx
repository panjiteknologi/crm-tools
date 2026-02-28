"use client";

import React, { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Save, X, Loader2, Plus, Trash2, Image as ImageIcon } from 'lucide-react';

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

interface IsuKendala {
  _id: Id<"isuKendala">;
  title: string;
  month: number;
  year: number;
  points: Array<{ text: string; images?: string[] }>;
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

interface IsuKendalaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isuKendala: IsuKendala | null;
  onSuccess?: () => void;
}

// Helper function to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

// Helper function to compress image before converting to base64
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions (max 1024px)
        const MAX_DIMENSION = 1024;
        if (width > height) {
          if (width > MAX_DIMENSION) {
            height *= MAX_DIMENSION / width;
            width = MAX_DIMENSION;
          }
        } else {
          if (height > MAX_DIMENSION) {
            width *= MAX_DIMENSION / height;
            height = MAX_DIMENSION;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);

          // Start with high quality
          let quality = 0.9;
          let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);

          // Reduce quality until size is under limit (100KB per gambar untuk isu kendala)
          while (compressedDataUrl.length > 100 * 1024 * 1.37 && quality > 0.1) {
            quality -= 0.1;
            compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          }

          resolve(compressedDataUrl);
        } else {
          reject(new Error('Failed to get canvas context'));
        }
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

export function IsuKendalaDialog({ open, onOpenChange, isuKendala, onSuccess }: IsuKendalaDialogProps) {
  // Mutations from server actions
  const addIsuKendala = useMutation(api.isuKendala.createIsuKendala);
  const updateIsuKendala = useMutation(api.isuKendala.updateIsuKendala);

  const [title, setTitle] = useState("");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [category, setCategory] = useState<"Internal" | "Eksternal" | "Operasional" | "Teknis">("Internal");
  const [priority, setPriority] = useState<"Low" | "Medium" | "High" | "Critical">("Medium");
  const [tanggalKejadian, setTanggalKejadian] = useState("");
  const [tanggalSelesai, setTanggalSelesai] = useState("");
  const [points, setPoints] = useState<Array<{ text: string; images?: string[] }>>([{ text: "", images: [] }]);
  const [isSaving, setIsSaving] = useState(false);

  // Reset form when isuKendala changes or dialog opens/closes
  React.useEffect(() => {
    if (isuKendala) {
      setTitle(isuKendala.title);
      setMonth(isuKendala.month);
      setYear(isuKendala.year);
      setStatus(isuKendala.status);
      setCategory(isuKendala.category);
      setPriority(isuKendala.priority);
      setTanggalKejadian(isuKendala.tanggalKejadian || "");
      setTanggalSelesai(isuKendala.tanggalSelesai || "");
      setPoints(isuKendala.points.length > 0 ? isuKendala.points : [{ text: "", images: [] }]);
    } else {
      setTitle("");
      setMonth(new Date().getMonth() + 1);
      setYear(new Date().getFullYear());
      setStatus("active");
      setCategory("Internal");
      setPriority("Medium");
      setTanggalKejadian("");
      setTanggalSelesai("");
      setPoints([{ text: "", images: [] }]);
    }
  }, [isuKendala, open]);

  // Generate year options (current year - 2 to current year + 5)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 8 }, (_, i) => currentYear - 2 + i);

  const handleAddPoint = () => {
    setPoints([...points, { text: "", images: [] }]);
  };

  const handleRemovePoint = (index: number) => {
    if (points.length > 1) {
      const newPoints = points.filter((_, i) => i !== index);
      setPoints(newPoints);
    } else {
      toast.error("❌ Minimal harus ada 1 point");
    }
  };

  const handlePointChange = (index: number, value: string) => {
    const newPoints = [...points];
    newPoints[index].text = value;
    setPoints(newPoints);
  };

  const handleImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const base64Images: string[] = [];

      // Hitung total size base64 yang sudah ada DI SEMUA POINTS (ukuran sebenarnya dari string)
      const totalExistingImagesSize = points.reduce((total, point) => {
        return total + (point.images || []).reduce((imgTotal, img) => {
          // Base64 string length adalah ukuran sebenarnya dalam bytes
          return imgTotal + img.length;
        }, 0);
      }, 0);

      // Max absolute: 900KB (aman di bawah limit 1MB Convex, memberi ruang untuk teks)
      // 1MB = 1,048,576 bytes, jadi 900KB = 921,600 bytes
      const maxAbsoluteSize = 900 * 1024;

      // Jika sudah melebihi limit, cegah upload baru
      if (totalExistingImagesSize >= maxAbsoluteSize) {
        const sizeKB = (totalExistingImagesSize / 1024).toFixed(0);
        toast.error(`❌ Total gambar sudah ${sizeKB}KB. Sudah mencapai batas maksimum. Hapus beberapa gambar terlebih dahulu.`);
        return;
      }

      // Max 5 gambar per point (ditingkatkan dari 3)
      const currentPointImages = points[index].images || [];
      if (currentPointImages.length >= 5) {
        toast.error("❌ Maksimal 5 gambar per point. Hapus beberapa gambar terlebih dahulu.");
        return;
      }

      const remainingSlots = 5 - currentPointImages.length;
      const filesToProcess = Math.min(files.length, remainingSlots);

      for (let i = 0; i < filesToProcess; i++) {
        const file = files[i];

        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast.error(`❌ File "${file.name}" bukan gambar`);
          continue;
        }

        // Check file size (max 5MB before compression)
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`❌ File "${file.name}" terlalu besar. Maksimal 5MB`);
          continue;
        }

        try {
          // Kompress gambar dengan adaptive quality (seperti flyer)
          const compressedBase64 = await compressImage(file);

          // Hitung ukuran base64 sebenarnya
          const compressedSize = compressedBase64.length;

          // Hitung total size jika gambar ini ditambahkan
          const currentBatchSize = base64Images.reduce((sum, img) => sum + img.length, 0);
          const newTotalSize = totalExistingImagesSize + currentBatchSize + compressedSize;

          if (newTotalSize > maxAbsoluteSize) {
            const remainingKB = Math.round((maxAbsoluteSize - totalExistingImagesSize - currentBatchSize) / 1024);
            toast.error(`❌ Gambar "${file.name}" akan melebihi limit total. Sisa space: ${remainingKB}KB`);
            continue;
          }

          base64Images.push(compressedBase64);
        } catch (error) {
          console.error('Error compressing image:', error);
          toast.error(`❌ Gagal memproses gambar "${file.name}"`);
        }
      }

      if (base64Images.length > 0) {
        const newPoints = [...points];
        newPoints[index].images = [...(newPoints[index].images || []), ...base64Images];
        setPoints(newPoints);

        // Hitung total size baru (ukuran base64 sebenarnya)
        const newTotalSize = points.reduce((total, point) => {
          return total + (point.images || []).reduce((imgTotal, img) => {
            return imgTotal + img.length;
          }, 0);
        }, 0) + base64Images.reduce((sum, img) => sum + img.length, 0);

        const sizeKB = (newTotalSize / 1024).toFixed(0);
        toast.success(`✅ ${base64Images.length} gambar berhasil ditambahkan. Total: ${sizeKB}KB / 900KB`);
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('❌ Gagal mengupload gambar');
    }
  };

  const handleRemoveImage = (pointIndex: number, imageIndex: number) => {
    const newPoints = [...points];
    if (newPoints[pointIndex].images) {
      newPoints[pointIndex].images = newPoints[pointIndex].images!.filter((_, i) => i !== imageIndex);
      setPoints(newPoints);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!title.trim()) {
      toast.error('❌ Judul wajib diisi!');
      return;
    }

    const validPoints = points.filter(p => p.text.trim() !== "");
    if (validPoints.length === 0) {
      toast.error('❌ Minimal harus ada 1 point isu!');
      return;
    }

    // Validasi total ukuran base64 sebelum save (ukuran sebenarnya)
    const totalImageSize = validPoints.reduce((total, point) => {
      return total + (point.images || []).reduce((imgTotal, img) => {
        // Base64 string length adalah ukuran sebenarnya dalam bytes
        return imgTotal + img.length;
      }, 0);
    }, 0);

    // Max 900KB (aman di bawah limit 1MB Convex = 1,048,576 bytes)
    const maxAbsoluteSize = 900 * 1024;
    const totalSizeKB = totalImageSize / 1024;

    if (totalImageSize > maxAbsoluteSize) {
      toast.error(`❌ Total gambar terlalu besar: ${totalSizeKB.toFixed(0)}KB. Max: 900KB. Hapus beberapa gambar.`);
      return;
    }

    setIsSaving(true);
    try {
      let result;

      // Check if creating new or updating existing
      if (isuKendala) {
        console.log('Editing existing isu kendala:', isuKendala._id);
        // Update existing isu kendala
        result = await updateIsuKendala({
          id: isuKendala._id,
          title: title.trim(),
          month,
          year,
          points: validPoints,
          status,
          category,
          priority,
          tanggalKejadian: tanggalKejadian || undefined,
          tanggalSelesai: tanggalSelesai || undefined,
        });
      } else {
        console.log('Creating new isu kendala');
        // Create new isu kendala
        result = await addIsuKendala({
          title: title.trim(),
          month,
          year,
          points: validPoints,
          status,
          category,
          priority,
          tanggalKejadian: tanggalKejadian || undefined,
          tanggalSelesai: tanggalSelesai || undefined,
        });
      }

      if (result.success) {
        toast.success(isuKendala ? '✅ Isu Kendala berhasil diupdate' : '✅ Isu Kendala berhasil dibuat');
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(result.message || '❌ Gagal menyimpan Isu Kendala');
      }
    } catch (error) {
      console.error('Error saving isu kendala:', error);
      toast.error('❌ Gagal menyimpan Isu Kendala');
    } finally {
      setIsSaving(false);
    }
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-full max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-white">
            {isuKendala ? 'Edit Isu Kendala' : 'Tambah Isu Kendala Baru'}
          </DialogTitle>
          <DialogDescription className="text-slate-500 dark:text-slate-400">
            {isuKendala ? 'Edit informasi Isu Kendala yang sudah ada' : 'Catat isu atau kendala yang terjadi'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Judul Isu <span className="text-red-500">*</span>
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Kendala Server Down"
              disabled={isSaving}
              className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 h-9 text-sm"
            />
          </div>

          {/* Points */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Point-Point Isu <span className="text-red-500">*</span>
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddPoint}
                disabled={isSaving}
                className="cursor-pointer text-xs h-7 px-2 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950"
              >
                <Plus className="w-3 h-3 mr-1" />
                Tambah Point
              </Button>
            </div>
            <div className="space-y-3">
              {points.map((point, index) => (
                <div key={index} className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 space-y-2">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        value={point.text}
                        onChange={(e) => handlePointChange(index, e.target.value)}
                        placeholder={`Point ${index + 1}`}
                        disabled={isSaving}
                        className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 h-9 text-sm"
                      />
                    </div>
                    {points.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemovePoint(index)}
                        disabled={isSaving}
                        className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 h-9 px-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {/* Image Upload */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                        📷 Gambar Pendukung ({point.images?.length || 0})
                      </Label>
                      <label className="cursor-pointer">
                        <Input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => handleImageUpload(index, e)}
                          disabled={isSaving}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isSaving}
                          className="text-xs h-7 px-2 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950"
                          onClick={(e) => {
                            e.preventDefault();
                            (e.currentTarget.previousElementSibling as HTMLInputElement)?.click();
                          }}
                        >
                          <ImageIcon className="w-3 h-3 mr-1" />
                          Upload
                        </Button>
                      </label>
                    </div>

                    {/* Image Previews */}
                    {point.images && point.images.length > 0 && (
                      <div className="grid grid-cols-4 gap-2">
                        {point.images.map((img, imgIdx) => (
                          <div key={imgIdx} className="relative group">
                            <img
                              src={img}
                              alt={`Point ${index + 1} - Gambar ${imgIdx + 1}`}
                              className="w-full h-20 object-cover rounded-lg border border-slate-300"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRemoveImage(index, imgIdx)}
                              disabled={isSaving}
                              className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              * Tekan Enter atau klik tombol "Tambah Point" untuk menambah point baru. Gambar akan dikompres otomatis dengan kualitas tinggi. Max 5 gambar per point, max 900KB total.
            </p>
          </div>

          {/* Category & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Kategori <span className="text-red-500">*</span>
              </Label>
              <Select value={category} onValueChange={(v) => setCategory(v as "Internal" | "Eksternal" | "Operasional" | "Teknis")}>
                <SelectTrigger disabled={isSaving} className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 h-9 text-sm">
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Internal">Internal</SelectItem>
                  <SelectItem value="Eksternal">Eksternal</SelectItem>
                  <SelectItem value="Operasional">Operasional</SelectItem>
                  <SelectItem value="Teknis">Teknis</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Prioritas <span className="text-red-500">*</span>
              </Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as "Low" | "Medium" | "High" | "Critical")}>
                <SelectTrigger disabled={isSaving} className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 h-9 text-sm">
                  <SelectValue placeholder="Pilih prioritas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low (Rendah)</SelectItem>
                  <SelectItem value="Medium">Medium (Sedang)</SelectItem>
                  <SelectItem value="High">High (Tinggi)</SelectItem>
                  <SelectItem value="Critical">Critical (Kritis)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tanggal Kejadian & Tanggal Selesai */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Tanggal Kejadian
              </Label>
              <Input
                type="date"
                value={tanggalKejadian}
                onChange={(e) => setTanggalKejadian(e.target.value)}
                disabled={isSaving}
                className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 h-9 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Tanggal Selesai
              </Label>
              <Input
                type="date"
                value={tanggalSelesai}
                onChange={(e) => setTanggalSelesai(e.target.value)}
                disabled={isSaving}
                className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 h-9 text-sm"
              />
            </div>
          </div>

          {/* Month & Year */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Bulan <span className="text-red-500">*</span>
              </Label>
              <Select value={month.toString()} onValueChange={(v) => setMonth(parseInt(v))}>
                <SelectTrigger disabled={isSaving} className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 h-9 text-sm">
                  <SelectValue placeholder="Pilih bulan" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, idx) => (
                    <SelectItem key={idx} value={(idx + 1).toString()}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Tahun <span className="text-red-500">*</span>
              </Label>
              <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
                <SelectTrigger disabled={isSaving} className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 h-9 text-sm">
                  <SelectValue placeholder="Pilih tahun" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((y) => (
                    <SelectItem key={y} value={y.toString()}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Status
            </Label>
            <Select value={status} onValueChange={(v) => setStatus(v as "active" | "inactive")}>
              <SelectTrigger disabled={isSaving} className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 h-9 text-sm">
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Non-Aktif</SelectItem>
                </SelectContent>
              </Select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
              className="cursor-pointer flex-1 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <X className="mr-2 h-4 w-4" />
              Batal
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="cursor-pointer flex-1 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span className="ml-2">Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  <span className="ml-2">Simpan</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

IsuKendalaDialog.displayName = 'IsuKendalaDialog';
