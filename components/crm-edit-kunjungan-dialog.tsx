"use client";

import React, { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Save, X, Calendar, MapPin, Building2, FileText, DollarSign, Users, Phone, Loader2 } from 'lucide-react';
import { ImagePreviewDialog } from '@/components/image-preview-dialog';
import indonesiaData from '@/data/indonesia-provinsi-kota.json';
import masterSalesData from '@/data/master-sales.json';
import masterAssociateData from '@/data/master-associate.json';
import masterStandarData from '@/data/master-standar.json';
import masterEaCodeData from '@/data/master-ea-code.json';
import masterAlasanData from '@/data/master-alasan.json';
import masterKuadranData from '@/data/master-kuadran.json';
import masterAkreditasiData from '@/data/master-akreditasi.json';

interface CrmTarget {
  _id: Id<"crmTargets">;
  tahun?: string;
  bulanExpDate: string;
  produk: string;
  picCrm: string;
  sales: string;
  namaAssociate: string;
  directOrAssociate?: string;
  namaPerusahaan: string;
  status: string;
  alasan?: string;
  category?: string;
  kuadran?: string;
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
}

interface StaffUser {
  _id: string;
  name: string;
  role: string;
}

interface EditKunjunganDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: CrmTarget | null;
  staffUsers: StaffUser[];
  onSuccess?: () => void;
}

interface FormData {
  tahun: string;
  bulanExpDate: string;
  produk: string;
  picCrm: string;
  sales: string;
  namaAssociate: string;
  directOrAssociate: string;
  namaPerusahaan: string;
  status: string;
  alasan: string;
  category: string;
  kuadran: string;
  provinsi: string;
  kota: string;
  alamat: string;
  akreditasi: string;
  catAkre: string;
  eaCode: string;
  std: string;
  iaDate: string;
  expDate: string;
  tahapAudit: string;
  hargaKontrak: string;
  bulanTtdNotif: string;
  hargaTerupdate: string;
  trimmingValue: string;
  lossValue: string;
  cashback: string;
  terminPembayaran: string;
  statusSertifikat: string;
  tanggalKunjungan: string;
  statusKunjungan: string;
  catatanKunjungan: string;
}

const EditKunjunganDialog = React.memo(({ open, onOpenChange, target, staffUsers, onSuccess }: EditKunjunganDialogProps) => {
  const updateTargetMutation = useMutation(api.crmTargets.updateCrmTarget);

  // Form state
  const [formData, setFormData] = useState<FormData>({
    tahun: '',
    bulanExpDate: '',
    produk: '',
    picCrm: '',
    sales: '',
    namaAssociate: '',
    directOrAssociate: '',
    namaPerusahaan: '',
    status: '',
    alasan: '',
    category: '',
    kuadran: '',
    provinsi: '',
    kota: '',
    alamat: '',
    akreditasi: '',
    catAkre: '',
    eaCode: '',
    std: '',
    iaDate: '',
    expDate: '',
    tahapAudit: '',
    hargaKontrak: '',
    bulanTtdNotif: '',
    hargaTerupdate: '',
    trimmingValue: '',
    lossValue: '',
    cashback: '',
    terminPembayaran: '',
    statusSertifikat: '',
    tanggalKunjungan: '',
    statusKunjungan: '',
    catatanKunjungan: '',
  });

  const [editFoto, setEditFoto] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewImageOpen, setPreviewImageOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const isInitialLoad = React.useRef(true);

  // Clean formatted number back to plain number
  const cleanNumber = (value: string): string => {
    return value.replace(/\./g, '');
  };

  // Helper function to normalize value for case-insensitive comparison
  const normalizeForSelect = React.useCallback((value: string | undefined, options: string[]): string => {
    if (!value) return '';
    const normalizedValue = value.toLowerCase().trim();
    const matchedOption = options.find(opt => opt.toLowerCase() === normalizedValue);
    return matchedOption || value;
  }, []);

  // Sync form data when target changes
  useEffect(() => {
    if (target) {
      isInitialLoad.current = true;

      // Get all options for normalization
      const salesOptionsList = masterSalesData.map(sales => sales.nama);
      const associateOptionsList = masterAssociateData.associate.map(assoc => assoc.nama);
      const standarOptionsList = masterStandarData.standar.map(std => std.kode);
      const alasanOptionsList = masterAlasanData.alasan.map(item => item.alasan);
      const kuadranOptionsList = masterKuadranData.kuadran.map(k => k.kode);

      setFormData({
        tahun: target.tahun || '',
        bulanExpDate: target.bulanExpDate,
        produk: target.produk,
        picCrm: target.picCrm,
        sales: normalizeForSelect(target.sales, salesOptionsList),
        namaAssociate: normalizeForSelect(target.namaAssociate, associateOptionsList),
        directOrAssociate: normalizeForSelect(target.directOrAssociate, ['Direct', 'Associate']),
        namaPerusahaan: target.namaPerusahaan,
        status: target.status,
        alasan: normalizeForSelect(target.alasan, alasanOptionsList),
        category: target.category || '',
        kuadran: normalizeForSelect(target.kuadran, kuadranOptionsList),
        provinsi: target.provinsi,
        kota: target.kota,
        alamat: target.alamat,
        akreditasi: target.akreditasi || '',
        catAkre: target.catAkre || '',
        eaCode: target.eaCode || '',
        std: normalizeForSelect(target.std, standarOptionsList),
        iaDate: target.iaDate || '',
        expDate: target.expDate || '',
        tahapAudit: target.tahapAudit || '',
        hargaKontrak: target.hargaKontrak ? target.hargaKontrak.toLocaleString('id-ID') : '',
        bulanTtdNotif: target.bulanTtdNotif || '',
        hargaTerupdate: target.hargaTerupdate ? target.hargaTerupdate.toLocaleString('id-ID') : '',
        trimmingValue: target.trimmingValue?.toString() || '',
        lossValue: target.lossValue?.toString() || '',
        cashback: target.cashback ? target.cashback.toLocaleString('id-ID') : '',
        terminPembayaran: target.terminPembayaran || '',
        statusSertifikat: normalizeForSelect(target.statusSertifikat, ['terbit', 'belum terbit']),
        tanggalKunjungan: target.tanggalKunjungan || '',
        statusKunjungan: target.statusKunjungan || '',
        catatanKunjungan: target.catatanKunjungan || '',
      });
      setEditFoto(target.fotoBuktiKunjungan || null);

      // Reset initial load flag after a short delay
      setTimeout(() => {
        isInitialLoad.current = false;
      }, 100);
    }
  }, [target, normalizeForSelect]);

  // Auto-calculate trimming and loss when hargaKontrak or hargaTerupdate changes
  // Skip calculation during initial load to preserve existing values from database
  useEffect(() => {
    // Skip during initial load - use existing values from database
    if (isInitialLoad.current) {
      return;
    }

    const hargaKontrakNum = parseFloat(cleanNumber(formData.hargaKontrak));
    const hargaTerupdateNum = parseFloat(cleanNumber(formData.hargaTerupdate));

    if (!isNaN(hargaKontrakNum) && !isNaN(hargaTerupdateNum) && hargaKontrakNum > 0) {
      // Calculate trimming (when hargaTerupdate > hargaKontrak)
      if (hargaTerupdateNum > hargaKontrakNum) {
        const trimming = hargaTerupdateNum - hargaKontrakNum;
        setFormData(prev => ({ ...prev, trimmingValue: trimming.toString(), lossValue: '0' }));
      }
      // Calculate loss (when hargaTerupdate < hargaKontrak)
      else if (hargaTerupdateNum < hargaKontrakNum) {
        const loss = hargaKontrakNum - hargaTerupdateNum;
        setFormData(prev => ({ ...prev, lossValue: loss.toString(), trimmingValue: '0' }));
      }
      // Equal values
      else {
        setFormData(prev => ({ ...prev, trimmingValue: '0', lossValue: '0' }));
      }
    }
  }, [formData.hargaKontrak, formData.hargaTerupdate]);

  // Memoized options
  const provinsiOptions = React.useMemo(() => Object.keys(indonesiaData).sort(), []);
  const kotaOptions = React.useMemo(
    () => formData.provinsi ? (indonesiaData as any)[formData.provinsi]?.kabupaten_kota?.sort() || [] : [],
    [formData.provinsi]
  );
  const alasanOptions = React.useMemo(() => masterAlasanData.alasan.map(item => item.alasan), []);
  const associateOptions = React.useMemo(() => masterAssociateData.associate.map(assoc => assoc.nama), []);
  const salesOptions = React.useMemo(() => masterSalesData.map(sales => sales.nama), []);
  const standarOptions = React.useMemo(() => masterStandarData.standar.map(std => std.kode), []);
  const eaCodeOptions = React.useMemo(() => masterEaCodeData.ea_code.map(ea => ({ id: ea.id, code: ea.ea_code })), []);
  const kuadranOptions = React.useMemo(() => masterKuadranData.kuadran.map(k => ({ kode: k.kode, nama: k.nama })), []);
  const tahapanOptions = [
    { value: 'IA', label: 'IA' },
    { value: 'RC', label: 'RC' },
    { value: 'SV1', label: 'SV1' },
    { value: 'SV2', label: 'SV2' },
    { value: 'SV3', label: 'SV3' },
    { value: 'SV4', label: 'SV4' },
  ];

  // Format number to thousand separator (e.g., 1000 -> 1.000)
  const formatNumber = (value: string): string => {
    const cleaned = value.replace(/\./g, '');
    if (!cleaned) return '';
    const num = parseInt(cleaned);
    if (isNaN(num)) return '';
    return num.toLocaleString('id-ID');
  };

  // Optimized handler with special formatting for currency fields
  const updateFormField = React.useCallback((field: keyof FormData, value: string) => {
    // Format currency fields
    if (field === 'hargaKontrak' || field === 'hargaTerupdate' || field === 'cashback') {
      const formatted = formatNumber(value);
      setFormData(prev => ({ ...prev, [field]: formatted }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  }, []);

  const handleUpdate = async () => {
    if (!target) return;

    // Validation: Check if bulanTtdNotif is required when status is DONE
    if (formData.status === 'DONE' && !formData.bulanTtdNotif) {
      toast.error('❌ Bulan TTD Notif wajib diisi!', {
        description: 'Status DONE memerlukan Bulan TTD Notif untuk diisi',
        duration: 4000,
      });
      return;
    }

    setIsSaving(true);
    try {
      await updateTargetMutation({
        id: target._id,
        tahun: formData.tahun,
        bulanExpDate: formData.bulanExpDate,
        produk: formData.produk,
        picCrm: formData.picCrm,
        sales: formData.sales,
        namaAssociate: formData.namaAssociate || null,
        directOrAssociate: formData.directOrAssociate || null,
        namaPerusahaan: formData.namaPerusahaan,
        status: formData.status,
        alasan: formData.alasan || null,
        category: formData.category || null,
        kuadran: formData.kuadran || null,
        provinsi: formData.provinsi,
        kota: formData.kota,
        alamat: formData.alamat,
        akreditasi: formData.akreditasi || null,
        catAkre: formData.catAkre || null,
        eaCode: formData.eaCode || null,
        std: formData.std || null,
        iaDate: formData.iaDate || null,
        expDate: formData.expDate || null,
        tahapAudit: formData.tahapAudit || null,
        hargaKontrak: formData.hargaKontrak ? parseFloat(cleanNumber(formData.hargaKontrak)) : null,
        bulanTtdNotif: formData.bulanTtdNotif || null,
        hargaTerupdate: formData.hargaTerupdate ? parseFloat(cleanNumber(formData.hargaTerupdate)) : null,
        trimmingValue: formData.trimmingValue ? parseFloat(formData.trimmingValue) : null,
        lossValue: formData.lossValue ? parseFloat(formData.lossValue) : null,
        cashback: formData.cashback ? parseFloat(cleanNumber(formData.cashback)) : null,
        terminPembayaran: formData.terminPembayaran || null,
        statusSertifikat: formData.statusSertifikat || null,
        tanggalKunjungan: formData.tanggalKunjungan || null,
        statusKunjungan: formData.statusKunjungan || null,
        catatanKunjungan: formData.catatanKunjungan || null,
        fotoBuktiKunjungan: editFoto || null,
      });

      toast.success('✅ Data kunjungan berhasil disimpan!');
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error('❌ Gagal menyimpan data kunjungan');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

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
      setEditFoto(compressedImage);
      setIsUploading(false);
      toast.success('Foto berhasil diupload');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Gagal mengupload foto. Silakan coba lagi.');
      setIsUploading(false);
    }
  };

  const handleImageClick = (imageUrl: string) => {
    setPreviewImageUrl(imageUrl);
    setPreviewImageOpen(true);
  };

  if (!target) return null;

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-full h-[92vh] sm:max-h-[92vh] p-0 gap-0 overflow-hidden bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl sm:max-w-5xl flex flex-col">
        {/* Modern Gradient Header */}
        <div className="relative px-4 sm:px-8 py-3 sm:py-4 flex-shrink-0">
          <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>
          <DialogHeader className="relative">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 sm:gap-4">
                  <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-xl">
                    <Building2 className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <DialogTitle className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400 tracking-tight">
                      Edit CRM Target
                    </DialogTitle>
                    <p className="text-blue-600/90 dark:text-blue-400/80 text-[10px] sm:text-sm mt-1 font-medium line-clamp-2">{target.namaPerusahaan}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="px-2 py-1 sm:px-4 sm:py-2 bg-blue/20 backdrop-blur-md rounded-lg text-blue text-[9px] sm:text-xs font-bold border border-blue/30 shadow-lg">
                  ID: {target._id.slice(-8).toUpperCase()}
                </div>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 px-3 sm:px-8 py-3 sm:py-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
          <div className="space-y-4 sm:space-y-6">
            {/* Quick Stats Cards - Responsive */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-2 sm:p-4 text-white shadow-lg">
                <div className="text-[10px] sm:text-xs font-semibold text-blue-100 mb-1">Status</div>
                <div className="text-sm sm:text-lg font-bold truncate">{formData.status || 'N/A'}</div>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-2 sm:p-4 text-white shadow-lg">
                <div className="text-[10px] sm:text-xs font-semibold text-purple-100 mb-1">Produk</div>
                <div className="text-sm sm:text-lg font-bold truncate">{formData.produk || 'N/A'}</div>
              </div>
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-2 sm:p-4 text-white shadow-lg">
                <div className="text-[10px] sm:text-xs font-semibold text-emerald-100 mb-1">PIC CRM</div>
                <div className="text-[10px] sm:text-sm font-bold truncate">{formData.picCrm || 'N/A'}</div>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-2 sm:p-4 text-white shadow-lg">
                <div className="text-[10px] sm:text-xs font-semibold text-orange-100 mb-1">Sales</div>
                <div className="text-[10px] sm:text-sm font-bold truncate">{formData.sales || 'N/A'}</div>
              </div>
              <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl p-2 sm:p-4 text-white shadow-lg">
                <div className="text-[10px] sm:text-xs font-semibold text-pink-100 mb-1">Tahun</div>
                <div className="text-sm sm:text-lg font-bold">{formData.tahun || 'N/A'}</div>
              </div>
              <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl p-2 sm:p-4 text-white shadow-lg">
                <div className="text-[10px] sm:text-xs font-semibold text-cyan-100 mb-1">Category</div>
                <div className="text-sm sm:text-lg font-bold">{formData.category || 'N/A'}</div>
              </div>
            </div>

            {/* Main Form - Responsive: 1 column on mobile, 3 columns on desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Column 1: Company Info & Status & People */}
              <div className="space-y-4 bg-white dark:bg-slate-800 rounded-xl p-3 sm:p-5 shadow-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3 pb-3 border-b-2 border-blue-500">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Perusahaan & PIC</h3>
                    <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">Informasi dasar</p>
                  </div>
                </div>

                <div className="space-y-2 sm:space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Nama Perusahaan <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={formData.namaPerusahaan}
                      onChange={(e) => updateFormField('namaPerusahaan', e.target.value)}
                      placeholder="Nama perusahaan"
                      className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 h-9 text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Alamat <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      value={formData.alamat}
                      onChange={(e) => updateFormField('alamat', e.target.value)}
                      placeholder="Alamat lengkap"
                      rows={3}
                      className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Provinsi <span className="text-red-500">*</span>
                      </Label>
                      <SearchableSelect
                        options={provinsiOptions}
                        value={formData.provinsi || ''}
                        onChange={(value) => {
                          updateFormField('provinsi', value);
                          updateFormField('kota', '');
                        }}
                        placeholder="Pilih provinsi"
                        emptyText="Tidak ada provinsi"
                        className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 h-9 text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Kota <span className="text-red-500">*</span>
                      </Label>
                      <SearchableSelect
                        options={kotaOptions}
                        value={formData.kota || ''}
                        onChange={(value) => updateFormField('kota', value)}
                        placeholder="Pilih kota"
                        emptyText="Pilih provinsi dulu"
                        disabled={!formData.provinsi}
                        className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 h-9 text-sm"
                      />
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-3 mt-3">
                    <h4 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-3">Status & Team</h4>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Status</Label>
                      <Select value={formData.status || undefined} onValueChange={(value) => updateFormField('status', value)}>
                        <SelectTrigger className="w-full border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 h-9 text-sm">
                          <SelectValue placeholder="Pilih" />
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

                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Category</Label>
                      <Select value={formData.category || undefined} onValueChange={(value) => updateFormField('category', value)}>
                        <SelectTrigger className="w-full border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 h-9 text-sm">
                          <SelectValue placeholder="Pilih" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GOLD">GOLD</SelectItem>
                          <SelectItem value="SILVER">SILVER</SelectItem>
                          <SelectItem value="BRONZE">BRONZE</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Kuadran</Label>
                      <Select value={formData.kuadran || undefined} onValueChange={(value) => updateFormField('kuadran', value)}>
                        <SelectTrigger className="w-full border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 h-9 text-sm">
                          <SelectValue placeholder="Pilih" />
                        </SelectTrigger>
                        <SelectContent>
                          {kuadranOptions.map((kuadran) => (
                            <SelectItem key={kuadran.kode} value={kuadran.kode}>{kuadran.kode}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Alasan</Label>
                    <SearchableSelect
                      options={[{ value: '', label: 'Kosong' }, ...alasanOptions.map(a => ({ value: a, label: a }))]}
                      value={formData.alasan || ''}
                      onChange={(value) => updateFormField('alasan', value)}
                      placeholder="Cari alasan..."
                      emptyText="Tidak ada alasan"
                      className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 h-9 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">PIC CRM</Label>
                      <Select value={formData.picCrm || undefined} onValueChange={(value) => updateFormField('picCrm', value)}>
                        <SelectTrigger className="w-full border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 h-9 text-sm">
                          <SelectValue placeholder="Pilih" />
                        </SelectTrigger>
                        <SelectContent>
                          {staffUsers.map(user => (
                            <SelectItem key={user._id} value={user.name}>{user.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Sales</Label>
                      <SearchableSelect
                        options={salesOptions}
                        value={formData.sales || ''}
                        onChange={(value) => updateFormField('sales', value)}
                        placeholder="Cari sales..."
                        emptyText="Tidak ada sales"
                        className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 h-9 text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Associate</Label>
                    <SearchableSelect
                      options={associateOptions}
                      value={formData.namaAssociate || ''}
                      onChange={(value) => updateFormField('namaAssociate', value)}
                      placeholder="Cari associate..."
                      emptyText="Tidak ada associate"
                      className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 h-9 text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Direct/Associate</Label>
                    <Select value={formData.directOrAssociate || undefined} onValueChange={(value) => updateFormField('directOrAssociate', value === 'empty' ? '' : value)}>
                      <SelectTrigger className="w-full border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 h-9 text-sm">
                        <SelectValue placeholder="Pilih" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="empty">
                          <span className="text-slate-400 italic">Kosong</span>
                        </SelectItem>
                        <SelectItem value="Direct">Direct</SelectItem>
                        <SelectItem value="Associate">Associate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Column 2: Sertifikat */}
              <div className="space-y-4 bg-white dark:bg-slate-800 rounded-xl p-3 sm:p-5 shadow-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3 pb-3 border-b-2 border-purple-500">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Sertifikat</h3>
                    <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">Detail sertifikasi</p>
                  </div>
                </div>

                <div className="space-y-2 sm:space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Tahun</Label>
                      <Select value={formData.tahun || undefined} onValueChange={(value) => updateFormField('tahun', value)}>
                        <SelectTrigger className="w-full border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-purple-500 h-9 text-sm">
                          <SelectValue placeholder="Pilih" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 11 }, (_, i) => 2024 + i).map(year => (
                            <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Bulan Exp</Label>
                      <Select value={formData.bulanExpDate || undefined} onValueChange={(value) => updateFormField('bulanExpDate', value)}>
                        <SelectTrigger className="w-full border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-purple-500 h-9 text-sm">
                          <SelectValue placeholder="Pilih" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Januari">Januari</SelectItem>
                          <SelectItem value="Februari">Februari</SelectItem>
                          <SelectItem value="Maret">Maret</SelectItem>
                          <SelectItem value="April">April</SelectItem>
                          <SelectItem value="Mei">Mei</SelectItem>
                          <SelectItem value="Juni">Juni</SelectItem>
                          <SelectItem value="Juli">Juli</SelectItem>
                          <SelectItem value="Agustus">Agustus</SelectItem>
                          <SelectItem value="September">September</SelectItem>
                          <SelectItem value="Oktober">Oktober</SelectItem>
                          <SelectItem value="November">November</SelectItem>
                          <SelectItem value="Desember">Desember</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Produk</Label>
                    <Select value={formData.produk || undefined} onValueChange={(value) => updateFormField('produk', value)}>
                      <SelectTrigger className="w-full border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-purple-500 h-9 text-sm">
                        <SelectValue placeholder="Pilih" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ISO">ISO</SelectItem>
                        <SelectItem value="SUSTAIN">SUSTAIN</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Akreditasi</Label>
                      <Select value={formData.akreditasi || undefined} onValueChange={(value) => updateFormField('akreditasi', value)}>
                        <SelectTrigger className="w-full border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-purple-500 h-9 text-sm">
                          <SelectValue placeholder="Pilih" />
                        </SelectTrigger>
                        <SelectContent>
                          {masterAkreditasiData.akreditasi.map((akre) => (
                            <SelectItem key={akre.id} value={akre.kode}>{akre.nama}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Cat Akre</Label>
                      <Select value={formData.catAkre || undefined} onValueChange={(value) => updateFormField('catAkre', value)}>
                        <SelectTrigger className="w-full border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-purple-500 h-9 text-sm">
                          <SelectValue placeholder="Pilih" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="KAN">KAN</SelectItem>
                          <SelectItem value="NON AKRE">NON AKRE</SelectItem>
                          <SelectItem value="INTERNASIONAL">INTERNASIONAL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Standar</Label>
                    <SearchableSelect
                      options={standarOptions}
                      value={formData.std || ''}
                      onChange={(value) => updateFormField('std', value)}
                      placeholder="Cari standar..."
                      emptyText="Tidak ada standar"
                      className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-purple-500 h-9 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">EA Code</Label>
                      <SearchableSelect
                        options={eaCodeOptions.map(ea => ({ value: ea.code, label: ea.code }))}
                        value={formData.eaCode || ''}
                        onChange={(value) => updateFormField('eaCode', value)}
                        placeholder="Cari EA Code..."
                        emptyText="Tidak ada EA Code"
                        className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-purple-500 h-9 text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Tahap Audit</Label>
                      <Select value={formData.tahapAudit || undefined} onValueChange={(value) => updateFormField('tahapAudit', value)}>
                        <SelectTrigger className="w-full border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-purple-500 h-9 text-sm">
                          <SelectValue placeholder="Pilih" />
                        </SelectTrigger>
                        <SelectContent>
                          {tahapanOptions.map((tahap) => (
                            <SelectItem key={tahap.value} value={tahap.value}>{tahap.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Status Sertifikat</Label>
                    <Select value={formData.statusSertifikat || undefined} onValueChange={(value) => updateFormField('statusSertifikat', value)}>
                      <SelectTrigger className="w-full border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-purple-500 h-9 text-sm">
                        <SelectValue placeholder="Pilih" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="terbit">Terbit</SelectItem>
                        <SelectItem value="belum terbit">Belum Terbit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Column 3: Tanggal & Keuangan */}
              <div className="space-y-4 bg-white dark:bg-slate-800 rounded-xl p-3 sm:p-5 shadow-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3 pb-3 border-b-2 border-indigo-500">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Tanggal & Keuangan</h3>
                    <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">Jadwal & nilai</p>
                  </div>
                </div>

                <div className="space-y-2 sm:space-y-3">
                  {/* Tanggal Section */}
                  <div>
                    <h4 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-2">Tanggal Penting</h4>
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">IA Date</Label>
                        <Input
                          type="date"
                          value={formData.iaDate}
                          onChange={(e) => updateFormField('iaDate', e.target.value)}
                          className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 h-9 text-sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Exp Date</Label>
                        <Input
                          type="date"
                          value={formData.expDate}
                          onChange={(e) => updateFormField('expDate', e.target.value)}
                          className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 h-9 text-sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                          Bulan TTD Notif {formData.status === 'DONE' && <span className="text-red-500">*</span>}
                        </Label>
                        <Input
                          type="date"
                          value={formData.bulanTtdNotif}
                          onChange={(e) => updateFormField('bulanTtdNotif', e.target.value)}
                          className={`border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 h-9 text-sm ${formData.status === 'DONE' && !formData.bulanTtdNotif ? 'border-red-500' : ''}`}
                          required={formData.status === 'DONE'}
                        />
                        {formData.status === 'DONE' && !formData.bulanTtdNotif && (
                          <p className="text-[9px] text-red-500 dark:text-red-400">Wajib diisi untuk status DONE</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-3 mt-3">
                    <h4 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-3">Keuangan</h4>
                  </div>

                  {/* Keuangan Section */}
                  <div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Harga Kontrak</Label>
                        <Input
                          type="text"
                          value={formData.hargaKontrak}
                          onChange={(e) => updateFormField('hargaKontrak', e.target.value.replace(/[^0-9.]/g, ''))}
                          placeholder="0"
                          className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-green-500 h-9 text-sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Harga Update</Label>
                        <Input
                          type="text"
                          value={formData.hargaTerupdate}
                          onChange={(e) => updateFormField('hargaTerupdate', e.target.value.replace(/[^0-9.]/g, ''))}
                          placeholder="0"
                          className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-green-500 h-9 text-sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Cashback</Label>
                        <Input
                          type="text"
                          value={formData.cashback}
                          onChange={(e) => updateFormField('cashback', e.target.value.replace(/[^0-9.]/g, ''))}
                          placeholder="0"
                          className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-green-500 h-9 text-sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Termin</Label>
                        <Select value={formData.terminPembayaran || undefined} onValueChange={(value) => updateFormField('terminPembayaran', value)}>
                          <SelectTrigger className="w-full border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-green-500 h-9 text-sm">
                            <SelectValue placeholder="Pilih" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Lunas Diawal">Lunas Diawal</SelectItem>
                            <SelectItem value="Lunas Diakhir">Lunas Diakhir</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 rounded-lg p-3 border-2 border-emerald-200 dark:border-emerald-800">
                        <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300 mb-1">Trimming</div>
                        <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                          {formData.trimmingValue ? parseFloat(formData.trimmingValue).toLocaleString('id-ID') : '0'}
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 rounded-lg p-3 border-2 border-red-200 dark:border-red-800">
                        <div className="text-xs font-bold text-red-700 dark:text-red-300 mb-1">Loss</div>
                        <div className="text-lg font-bold text-red-600 dark:text-red-400">
                          {formData.lossValue ? parseFloat(formData.lossValue).toLocaleString('id-ID') : '0'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Catatan & Foto Section - Full Width */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-3 sm:p-5 shadow-lg border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3 pb-3 border-b-2 border-green-500">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Kunjungan</h3>
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">Update data kunjungan</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Tanggal Kunjungan <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="date"
                      value={formData.tanggalKunjungan}
                      onChange={(e) => updateFormField('tanggalKunjungan', e.target.value)}
                      className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-green-500 h-9 text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Status Kunjungan <span className="text-red-500">*</span>
                    </Label>
                    <Select value={formData.statusKunjungan || undefined} onValueChange={(value) => updateFormField('statusKunjungan', value)}>
                      <SelectTrigger className="w-full border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-green-500 h-9 text-sm">
                        <SelectValue placeholder="Pilih status" />
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
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Catatan Kunjungan</Label>
                    <Textarea
                      placeholder="Tambahkan catatan kunjungan..."
                      className="min-h-[80px] border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-green-500 text-sm resize-none"
                      value={formData.catatanKunjungan}
                      onChange={(e) => updateFormField('catatanKunjungan', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Foto Bukti Kunjungan</Label>
                    <div className="space-y-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                        className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-green-500 h-9 text-sm"
                      />
                      {editFoto && (
                        <div className="mt-2 space-y-2">
                          <p className="text-xs text-muted-foreground">Preview:</p>
                          <img
                            src={editFoto}
                            alt="Preview bukti kunjungan"
                            className="max-w-full max-h-40 object-cover rounded-lg border"
                          />
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleImageClick(editFoto)}
                              className="cursor-pointer text-xs h-7 bg-white dark:bg-slate-950 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            >
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                              </svg>
                              Lihat Gambar
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditFoto(null)}
                              className="text-xs text-red-600 hover:text-red-700 h-7"
                            >
                              <X className="w-3 h-3 mr-1" />
                              Hapus
                            </Button>
                          </div>
                        </div>
                      )}
                      {isUploading && (
                        <p className="text-xs text-muted-foreground">Mengupload foto...</p>
                      )}
                    </div>
                  </div>
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
              className="cursor-pointer flex-1 sm:flex-none border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 h-8 sm:h-10 px-3 sm:px-6 text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              <span>Batal</span>
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={isSaving || isUploading}
              className="flex-1 sm:flex-none bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white shadow-lg h-8 sm:h-10 px-3 sm:px-6 text-xs sm:text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : isUploading ? (
                <>
                  <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 animate-spin" />
                  <span>Mengupload...</span>
                </>
              ) : (
                <>
                  <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  <span>Simpan</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Image Preview Dialog */}
    <ImagePreviewDialog
      open={previewImageOpen}
      onOpenChange={setPreviewImageOpen}
      imageUrl={previewImageUrl}
      alt="Bukti Kunjungan"
    />
    </>
  );
});

EditKunjunganDialog.displayName = 'EditKunjunganDialog';

export { EditKunjunganDialog };
