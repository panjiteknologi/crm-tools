"use client";

import React, { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Calendar, Building2, Loader2, Save, X, Users, CheckCircle2, DollarSign } from 'lucide-react';

interface CrmTarget {
  _id: Id<"crmTargets">;
  namaPerusahaan: string;
  provinsi?: string;
  kota?: string;
  tanggalKunjungan?: string;
  statusKunjungan?: string;
  catatanKunjungan?: string;
  fotoBuktiKunjungan?: string;
  status?: string;
  hargaKontrak?: number;
  hargaTerupdate?: number;
  trimmingValue?: number;
  lossValue?: number;
  bulanTtdNotif?: string;
  [key: string]: any;
}

interface MassUpdateKunjunganDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCompany: string | null;
  companyTargets: CrmTarget[];
  onUpdate: (data: {
    status: string;
    hargaKontrak: number;
    hargaTerupdate: number;
    trimmingValue: number;
    lossValue: number;
    bulanTtdNotif: string;
    tanggalKunjungan: string;
    statusKunjungan: string;
    catatanKunjungan: string;
    fotoBuktiKunjungan: string | null;
  }) => Promise<void>;
}

const MassUpdateKunjunganDialog = React.memo(({
  open,
  onOpenChange,
  selectedCompany,
  companyTargets,
  onUpdate
}: MassUpdateKunjunganDialogProps) => {
  const [status, setStatus] = useState<string>("");
  const [hargaKontrak, setHargaKontrak] = useState<string>("");
  const [hargaTerupdate, setHargaTerupdate] = useState<string>("");
  const [trimmingValue, setTrimmingValue] = useState<string>("");
  const [lossValue, setLossValue] = useState<string>("");
  const [bulanTtdNotif, setBulanTtdNotif] = useState<string>("");
  const [tanggalKunjungan, setTanggalKunjungan] = useState<string>("");
  const [statusKunjungan, setStatusKunjungan] = useState<string>("");
  const [catatanKunjungan, setCatatanKunjungan] = useState<string>("");
  const [fotoBukti, setFotoBukti] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Clean formatted number back to plain number
  const cleanNumber = (value: string): string => {
    return value.replace(/\./g, '');
  };

  // Format number to thousand separator (e.g., 1000 -> 1.000)
  const formatNumber = (value: string): string => {
    const cleaned = value.replace(/\./g, '');
    if (!cleaned) return '';
    const num = parseInt(cleaned);
    if (isNaN(num)) return '';
    return num.toLocaleString('id-ID');
  };

  // Auto-calculate trimming and loss when hargaTerupdate changes
  useEffect(() => {
    const hargaKontrakNum = parseFloat(cleanNumber(hargaKontrak));
    const hargaTerupdateNum = parseFloat(cleanNumber(hargaTerupdate));

    // Jika hargaTerupdate 0, kosong, atau NaN, set trimming dan loss ke 0
    if (!hargaTerupdate || hargaTerupdateNum === 0 || isNaN(hargaTerupdateNum)) {
      setTrimmingValue("0");
      setLossValue("0");
      return;
    }

    // Jika hargaKontrak valid dan hargaTerupdate valid
    if (!isNaN(hargaKontrakNum) && !isNaN(hargaTerupdateNum) && hargaKontrakNum > 0) {
      // Calculate trimming (when hargaTerupdate > hargaKontrak)
      if (hargaTerupdateNum > hargaKontrakNum) {
        const trimming = hargaTerupdateNum - hargaKontrakNum;
        setTrimmingValue(trimming.toString());
        setLossValue("0");
      }
      // Calculate loss (when hargaTerupdate < hargaKontrak)
      else if (hargaTerupdateNum < hargaKontrakNum) {
        const loss = hargaKontrakNum - hargaTerupdateNum;
        setLossValue(loss.toString());
        setTrimmingValue("0");
      }
      // Equal values
      else {
        setTrimmingValue("0");
        setLossValue("0");
      }
    } else {
      // Jika hargaKontrak tidak valid, set ke 0
      setTrimmingValue("0");
      setLossValue("0");
    }
  }, [hargaKontrak, hargaTerupdate]);

  // Reset form when modal opens or company changes
  useEffect(() => {
    if (open && selectedCompany && companyTargets.length > 0) {
      const firstTarget = companyTargets[0];
      setStatus(firstTarget.status || "");
      setHargaKontrak(firstTarget.hargaKontrak ? firstTarget.hargaKontrak.toLocaleString('id-ID') : "");
      setHargaTerupdate(firstTarget.hargaTerupdate ? firstTarget.hargaTerupdate.toLocaleString('id-ID') : "");
      setTrimmingValue(firstTarget.trimmingValue?.toString() || "0");
      setLossValue(firstTarget.lossValue?.toString() || "0");
      setBulanTtdNotif(firstTarget.bulanTtdNotif || "");
      setTanggalKunjungan(firstTarget.tanggalKunjungan || "");
      setStatusKunjungan(firstTarget.statusKunjungan || "");
      setCatatanKunjungan(firstTarget.catatanKunjungan || "");
      setFotoBukti(firstTarget.fotoBuktiKunjungan || null);
    }
  }, [open, selectedCompany, companyTargets]);

  // Compress image before upload
  const compressImage = (file: File, maxSizeKB: number = 500): Promise<string> => {
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
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Start with high quality
          let quality = 0.9;
          let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);

          // Reduce quality until size is under limit
          while (compressedDataUrl.length > maxSizeKB * 1024 * 1.37 && quality > 0.1) {
            quality -= 0.1;
            compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          }

          resolve(compressedDataUrl);
        }
        img.onerror = (error) => reject(error);
      }
      reader.onerror = (error) => reject(error);
    });
  }

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 2MB before compression)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File terlalu besar! Maksimum 2MB.');
      return;
    }

    setIsUploading(true);
    try {
      // Compress image to max 500KB
      const compressedImage = await compressImage(file, 500);
      setFotoBukti(compressedImage);
      setIsUploading(false);
      toast.success('Foto berhasil diupload');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Gagal mengupload foto. Silakan coba lagi.');
      setIsUploading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedCompany) return;

    // Validation: Check if bulanTtdNotif is required when status is DONE
    if (status === 'DONE' && !bulanTtdNotif) {
      toast.error('❌ Bulan TTD Notif wajib diisi!', {
        description: 'Status DONE memerlukan Bulan TTD Notif untuk diisi',
        duration: 4000,
      });
      return;
    }

    setIsSaving(true);
    try {
      await onUpdate({
        status,
        hargaKontrak: parseFloat(cleanNumber(hargaKontrak)) || 0,
        hargaTerupdate: parseFloat(cleanNumber(hargaTerupdate)) || 0,
        trimmingValue: parseFloat(trimmingValue) || 0,
        lossValue: parseFloat(lossValue) || 0,
        bulanTtdNotif,
        tanggalKunjungan,
        statusKunjungan,
        catatanKunjungan,
        fotoBuktiKunjungan: fotoBukti
      });

      toast.success(`✅ Kunjungan berhasil diupdate untuk ${companyTargets.length} standar!`);
      onOpenChange(false);

      // Reset form
      setStatus("");
      setHargaKontrak("");
      setHargaTerupdate("");
      setTrimmingValue("");
      setLossValue("");
      setBulanTtdNotif("");
      setTanggalKunjungan("");
      setStatusKunjungan("");
      setCatatanKunjungan("");
      setFotoBukti(null);
    } catch (error) {
      toast.error('❌ Gagal mengupdate kunjungan');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!selectedCompany) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-full max-h-[92vh] p-0 gap-0 overflow-hidden bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl sm:max-w-4xl flex flex-col">
        {/* Modern Gradient Header */}
        <div className="relative px-4 sm:px-8 py-3 sm:py-4 flex-shrink-0 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950">
          <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>
          <DialogHeader className="relative">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 sm:gap-4">
                  <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-xl">
                    <Building2 className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <DialogTitle className="text-lg sm:text-2xl font-bold text-purple-600 dark:text-purple-400 tracking-tight">
                      Update Kunjungan Massal
                    </DialogTitle>
                    <p className="text-purple-600/90 dark:text-purple-400/80 text-[10px] sm:text-sm mt-1 font-medium line-clamp-2">{selectedCompany}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="px-2 py-1 sm:px-4 sm:py-2 bg-purple/20 backdrop-blur-md rounded-lg text-purple text-[9px] sm:text-xs font-bold border border-purple/30 shadow-lg">
                  {companyTargets.length} Standar
                </div>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 px-3 sm:px-8 py-3 sm:py-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
          <div className="space-y-4 sm:space-y-6">
            {/* Warning Alert */}
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 rounded-xl p-4 border-2 border-blue-200 dark:border-blue-800 shadow-lg">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-1">Perhatian!</h3>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Update ini akan diterapkan ke <span className="font-bold">{companyTargets.length} standar/produk</span> under perusahaan <span className="font-bold">{selectedCompany}</span>. Pastikan data sudah benar sebelum menyimpan.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Stats Cards - Responsive */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-2 sm:p-4 text-white shadow-lg">
                <div className="text-[10px] sm:text-xs font-semibold text-blue-100 mb-1">Total Standar</div>
                <div className="text-sm sm:text-lg font-bold">{companyTargets.length}</div>
              </div>
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-2 sm:p-4 text-white shadow-lg">
                <div className="text-[10px] sm:text-xs font-semibold text-emerald-100 mb-1">Sudah Visit</div>
                <div className="text-sm sm:text-lg font-bold">
                  {companyTargets.filter(t => t.statusKunjungan === 'VISITED').length}
                </div>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-2 sm:p-4 text-white shadow-lg">
                <div className="text-[10px] sm:text-xs font-semibold text-orange-100 mb-1">Belum Visit</div>
                <div className="text-sm sm:text-lg font-bold">
                  {companyTargets.filter(t => t.statusKunjungan === 'NOT YET').length}
                </div>
              </div>
              <div className="bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl p-2 sm:p-4 text-white shadow-lg">
                <div className="text-[10px] sm:text-xs font-semibold text-gray-100 mb-1">Belum Scheduled</div>
                <div className="text-sm sm:text-lg font-bold">
                  {companyTargets.filter(t => !t.tanggalKunjungan).length}
                </div>
              </div>
            </div>

            {/* Main Form - Responsive: 1 column on mobile, 2 columns on desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Left Column: Tanggal & Status */}
              <div className="space-y-4 bg-white dark:bg-slate-800 rounded-xl p-3 sm:p-5 shadow-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3 pb-3 border-b-2 border-purple-500">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Jadwal Kunjungan</h3>
                    <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">Tanggal & status</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Tanggal Kunjungan <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="date"
                      value={tanggalKunjungan}
                      onChange={(e) => setTanggalKunjungan(e.target.value)}
                      className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-purple-500 h-10 text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Status Kunjungan <span className="text-red-500">*</span>
                    </Label>
                    <Select value={statusKunjungan} onValueChange={setStatusKunjungan}>
                      <SelectTrigger className="w-full border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-purple-500 h-10 text-sm">
                        <SelectValue placeholder="Pilih status kunjungan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="VISITED">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-green-600 hover:bg-green-700">Visited</Badge>
                            <span className="text-xs">Sudah dikunjungi</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="NOT YET">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-gray-500 hover:bg-gray-600">Not Yet</Badge>
                            <span className="text-xs">Belum dikunjungi</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Catatan Kunjungan
                    </Label>
                    <Textarea
                      placeholder="Tambahkan catatan kunjungan untuk semua standar..."
                      className="min-h-[100px] border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-purple-500 text-sm resize-none"
                      value={catatanKunjungan}
                      onChange={(e) => setCatatanKunjungan(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Foto Bukti */}
              <div className="space-y-4 bg-white dark:bg-slate-800 rounded-xl p-3 sm:p-5 shadow-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3 pb-3 border-b-2 border-blue-500">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Bukti Kunjungan</h3>
                    <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">Upload foto</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Foto Bukti Kunjungan
                    </Label>
                    <div className="space-y-3">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                        className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 h-10 text-sm"
                      />
                      {isUploading && (
                        <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Mengupload & mengkompresi foto...</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {fotoBukti && (
                    <div className="space-y-2 p-3 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-blue-900 dark:text-blue-100">Preview:</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setFotoBukti(null)}
                          className="text-xs text-red-600 hover:text-red-700 h-7 px-2"
                        >
                          <X className="w-3 h-3 mr-1" />
                          Hapus
                        </Button>
                      </div>
                      <img
                        src={fotoBukti}
                        alt="Preview bukti kunjungan"
                        className="w-full max-h-48 object-cover rounded-lg border shadow-lg"
                      />
                      <p className="text-[10px] text-blue-700 dark:text-blue-300">
                        Ukuran: {Math.round((fotoBukti.length * 0.75) / 1024)} KB (terkompresi)
                      </p>
                    </div>
                  )}

                  {!fotoBukti && !isUploading && (
                    <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900">
                      <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center mb-2">
                        <Calendar className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                      </div>
                      <p className="text-xs text-center text-slate-600 dark:text-slate-400">
                        Belum ada foto yang diupload
                      </p>
                      <p className="text-[10px] text-center text-slate-500 dark:text-slate-500 mt-1">
                        Maksimum 2MB (akan dikompresi otomatis)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Status & Keuangan Section */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-3 sm:p-5 shadow-lg border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3 pb-3 border-b-2 border-emerald-500">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Status & Keuangan</h3>
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                    Update untuk semua {companyTargets.length} standar
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-3">
                {/* Status CRM */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Status CRM <span className="text-red-500">*</span>
                  </Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="w-full border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 h-10 text-sm">
                      <SelectValue placeholder="Pilih status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WAITING">WAITING</SelectItem>
                      <SelectItem value="PROSES">PROSES</SelectItem>
                      <SelectItem value="DONE">DONE</SelectItem>
                      <SelectItem value="SUSPEND">SUSPEND</SelectItem>
                      <SelectItem value="LOSS">LOSS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Bulan TTD Notif */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Bulan TTD Notif {status === 'DONE' && <span className="text-red-500">*</span>}
                  </Label>
                  <Input
                    type="date"
                    value={bulanTtdNotif}
                    onChange={(e) => setBulanTtdNotif(e.target.value)}
                    className={`border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 h-10 text-sm ${status === 'DONE' && !bulanTtdNotif ? 'border-red-500' : ''}`}
                    required={status === 'DONE'}
                  />
                  {status === 'DONE' && !bulanTtdNotif && (
                    <p className="text-[9px] text-red-500 dark:text-red-400">Wajib diisi untuk status DONE</p>
                  )}
                </div>

                {/* Harga Kontrak - Readonly */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Harga Kontrak
                  </Label>
                  <Input
                    type="text"
                    value={hargaKontrak}
                    disabled
                    className="border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 h-10 text-sm cursor-not-allowed"
                  />
                  <p className="text-[10px] text-slate-500">Readonly - dari data existing</p>
                </div>

                {/* Harga Terupdate */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Harga Terupdate
                  </Label>
                  <Input
                    type="text"
                    value={hargaTerupdate}
                    onChange={(e) => setHargaTerupdate(formatNumber(e.target.value.replace(/[^0-9]/g, '')))}
                    placeholder="Masukkan harga terupdate..."
                    className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 h-10 text-sm"
                  />
                </div>
              </div>

              {/* Trimming & Loss Values - Auto Calculated */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 rounded-lg p-4 border-2 border-emerald-200 dark:border-emerald-800">
                  <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300 mb-1">Trimming Value</div>
                  <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    {parseFloat(trimmingValue).toLocaleString('id-ID')}
                  </div>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">Otomatis dihitung</p>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 rounded-lg p-4 border-2 border-red-200 dark:border-red-800">
                  <div className="text-xs font-bold text-red-700 dark:text-red-300 mb-1">Loss Value</div>
                  <div className="text-lg font-bold text-red-600 dark:text-red-400">
                    {parseFloat(lossValue).toLocaleString('id-ID')}
                  </div>
                  <p className="text-[10px] text-red-600 dark:text-red-400 mt-1">Otomatis dihitung</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 px-3 sm:px-8 py-3 sm:py-4 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex-shrink-0">
          <div className="text-[10px] sm:text-sm text-slate-500 dark:text-slate-400">
            <span className="text-red-500">*</span> Wajib diisi
          </div>
          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving || isUploading}
              className="cursor-pointer flex-1 sm:flex-none border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 h-9 sm:h-10 px-3 sm:px-6 text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              <span>Batal</span>
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={isSaving || isUploading || !status || !tanggalKunjungan || !statusKunjungan || (status === 'DONE' && !bulanTtdNotif)}
              className="flex-1 sm:flex-none bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg h-9 sm:h-10 px-3 sm:px-6 text-xs sm:text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  <span>Update {companyTargets.length} Standar</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});

MassUpdateKunjunganDialog.displayName = 'MassUpdateKunjunganDialog';

export { MassUpdateKunjunganDialog };
