"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { toast } from 'sonner';
import indonesiaData from '@/data/indonesia-provinsi-kota.json';
import masterSalesData from '@/data/master-sales.json';
import masterAssociateData from '@/data/master-associate.json';
import masterStandarData from '@/data/master-standar.json';
import masterEaCodeData from '@/data/master-ea-code.json';
import masterAlasanData from '@/data/master-alasan.json';
import masterTahapanData from '@/data/master-tahapan.json';
import masterKuadranData from '@/data/master-kuadran.json';
import masterAkreditasiData from '@/data/master-akreditasi.json';
import { Save, X, Building2, Users, FileText, DollarSign, Calendar, Loader2 } from 'lucide-react';

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
  luarKota?: string;
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

interface EditCrmDialogProps {
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
  luarKota: string;
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
  fotoBuktiKunjungan: string;
}

const EditCrmDialog = React.memo(({ open, onOpenChange, target, staffUsers, onSuccess }: EditCrmDialogProps) => {
  const updateTargetMutation = useMutation(api.crmTargets.updateCrmTarget);

  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    luarKota: '',
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
    fotoBuktiKunjungan: '',
  });

  // Clean formatted number back to plain number (e.g., 1.000 -> 1000)
  const cleanNumber = (value: string): string => {
    return value.replace(/\./g, '');
  };

  // Helper function to normalize value for case-insensitive comparison
  const normalizeForSelect = useCallback((value: string | undefined, options: string[]): string => {
    if (!value) return '';
    const normalizedValue = value.toLowerCase().trim();
    const matchedOption = options.find(opt => opt.toLowerCase() === normalizedValue);
    return matchedOption || value;
  }, []);

  // Sync form data when target changes
  useEffect(() => {
    if (target) {
      setFormData({
        tahun: target.tahun || '',
        bulanExpDate: target.bulanExpDate,
        produk: target.produk,
        picCrm: target.picCrm,
        sales: target.sales,
        namaAssociate: target.namaAssociate,
        directOrAssociate: normalizeForSelect(target.directOrAssociate, ['Direct', 'Associate']),
        namaPerusahaan: target.namaPerusahaan,
        status: target.status,
        alasan: target.alasan || '',
        category: target.category || '',
        kuadran: target.kuadran || '',
        provinsi: target.provinsi,
        kota: target.kota,
        alamat: target.alamat,
        luarKota: target.luarKota || '',
        akreditasi: target.akreditasi || '',
        catAkre: target.catAkre || '',
        eaCode: target.eaCode || '',
        std: target.std || '',
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
        fotoBuktiKunjungan: target.fotoBuktiKunjungan || '',
      });
    }
  }, [target, normalizeForSelect]);

  // Auto-calculate trimming and loss when hargaKontrak or hargaTerupdate changes
  useEffect(() => {
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
  const provinsiOptions = useMemo(() => Object.keys(indonesiaData).sort(), []);
  const kotaOptions = useMemo(
    () => formData.provinsi ? (indonesiaData as any)[formData.provinsi]?.kabupaten_kota?.sort() || [] : [],
    [formData.provinsi]
  );
  const alasanOptions = useMemo(() => masterAlasanData.alasan.map(item => item.alasan), []);
  const associateOptions = useMemo(() => masterAssociateData.associate.map(assoc => assoc.nama), []);
  const salesOptions = useMemo(() => masterSalesData.map(sales => sales.nama), []);
  const standarOptions = useMemo(() => masterStandarData.standar.map(std => std.kode), []);
  const eaCodeOptions = useMemo(() => masterEaCodeData.ea_code.map(ea => ({ id: ea.id, code: ea.ea_code })), []);
  const tahapanOptions = useMemo(() => masterTahapanData.tahapan.map(t => t.nama), []);
  const kuadranOptions = useMemo(() => masterKuadranData.kuadran.map(k => k.kode), []);

  // Format number to thousand separator (e.g., 1000 -> 1.000)
  const formatNumber = (value: string): string => {
    const cleaned = value.replace(/\./g, '');
    if (!cleaned) return '';
    const num = parseInt(cleaned);
    if (isNaN(num)) return '';
    return num.toLocaleString('id-ID');
  };

  // Optimized handler with special formatting for currency fields
  const updateFormField = useCallback((field: keyof FormData, value: string) => {
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

    setIsSubmitting(true);

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
        luarKota: formData.luarKota || null,
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
        fotoBuktiKunjungan: formData.fotoBuktiKunjungan || null,
      });

      toast.success('✅ Data berhasil disimpan!', {
        description: 'CRM Target telah berhasil diperbarui',
        duration: 3000,
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error('❌ Gagal menyimpan data', {
        description: 'Terjadi kesalahan saat memperbarui CRM Target',
        duration: 4000,
      });
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!target) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-full h-[92vh] sm:max-h-[92vh] p-0 gap-0 overflow-hidden bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl sm:max-w-5xl flex flex-col">
        {/* Modern Gradient Header */}
        <div className="relative px-4 sm:px-8 py-3 sm:py-4 flex-shrink-0">
          <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>
          <DialogHeader className="relative">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 sm:gap-4">
                  <div className="w-8 h-8 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center shadow-xl">
                    <Building2 className="w-4 h-4 sm:w-6 sm:h-6 text-purple" />
                  </div>
                  <div>
                    <DialogTitle className="text-lg sm:text-2xl font-bold text-purple-600 dark:text-purple-400 tracking-tight">
                      Edit CRM Target
                    </DialogTitle>
                    <p className="text-purple-600/90 dark:text-purple-400/80 text-[10px] sm:text-sm mt-1 font-medium line-clamp-2">{target.namaPerusahaan}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="px-2 py-1 sm:px-4 sm:py-2 bg-purple/20 backdrop-blur-md rounded-lg text-purple text-[9px] sm:text-xs font-bold border border-purple/30 shadow-lg">
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
              {/* Column 1: Company Info + Status & People */}
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
                      <Select
                        value={formData.provinsi || undefined}
                        onValueChange={(value) => {
                          updateFormField('provinsi', value);
                          updateFormField('kota', '');
                        }}
                      >
                        <SelectTrigger className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 h-9 text-sm w-full">
                          <SelectValue placeholder="Pilih" />
                        </SelectTrigger>
                        <SelectContent className="w-full">
                          {provinsiOptions.map(prov => (
                            <SelectItem key={prov} value={prov}>{prov}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Kota <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.kota || undefined}
                        onValueChange={(value) => updateFormField('kota', value)}
                        disabled={!formData.provinsi}
                      >
                        <SelectTrigger className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 h-9 text-sm w-full">
                          <SelectValue placeholder="Pilih" />
                        </SelectTrigger>
                        <SelectContent className="w-full">
                          {kotaOptions.map((kota: string) => (
                            <SelectItem key={kota} value={kota}>{kota}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Luar Kota</Label>
                    <Select value={formData.luarKota || undefined} onValueChange={(value) => updateFormField('luarKota', value)}>
                      <SelectTrigger className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 h-9 text-sm">
                        <SelectValue placeholder="Pilih" />
                      </SelectTrigger>
                      <SelectContent className="w-full">
                        <SelectItem value="Luar Kota">Luar Kota</SelectItem>
                        <SelectItem value="Dalam Kota">Dalam Kota</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-3 mt-3">
                    <h4 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-3">Status & Team</h4>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Status</Label>
                      <Select value={formData.status || undefined} onValueChange={(value) => updateFormField('status', value)}>
                        <SelectTrigger className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 h-9 text-sm w-full">
                          <SelectValue placeholder="Pilih" />
                        </SelectTrigger>
                        <SelectContent className="w-full">
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
                        <SelectTrigger className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 h-9 text-sm w-full">
                          <SelectValue placeholder="Pilih" />
                        </SelectTrigger>
                        <SelectContent className="w-full">
                          <SelectItem value="GOLD">GOLD</SelectItem>
                          <SelectItem value="SILVER">SILVER</SelectItem>
                          <SelectItem value="BRONZE">BRONZE</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Kuadran</Label>
                      <Select value={formData.kuadran || undefined} onValueChange={(value) => updateFormField('kuadran', value)}>
                        <SelectTrigger className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 h-9 text-sm w-full">
                          <SelectValue placeholder="Pilih" />
                        </SelectTrigger>
                        <SelectContent className="w-full">
                          {masterKuadranData.kuadran.map((k) => (
                            <SelectItem key={k.kode} value={k.kode}>{k.kode}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Alasan</Label>
                    <Select value={formData.alasan || undefined} onValueChange={(value) => updateFormField('alasan', value === 'empty' ? '' : value)}>
                      <SelectTrigger className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 h-9 text-sm w-full">
                        <SelectValue placeholder="Pilih" />
                      </SelectTrigger>
                      <SelectContent className="w-full">
                        <SelectItem value="empty">
                          <span className="text-slate-400 italic">Kosong</span>
                        </SelectItem>
                        {alasanOptions.map((alasan) => (
                          <SelectItem key={alasan} value={alasan}>{alasan}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">PIC CRM</Label>
                      <Select value={formData.picCrm || undefined} onValueChange={(value) => updateFormField('picCrm', value)}>
                        <SelectTrigger className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 h-9 text-sm w-full">
                          <SelectValue placeholder="Pilih" />
                        </SelectTrigger>
                        <SelectContent className="w-full">
                          <SelectItem value="DHA">DHA</SelectItem>
                          <SelectItem value="MRC">MRC</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Sales</Label>
                      <Select value={formData.sales || undefined} onValueChange={(value) => updateFormField('sales', value)}>
                        <SelectTrigger className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 h-9 text-sm w-full">
                          <SelectValue placeholder="Pilih" />
                        </SelectTrigger>
                        <SelectContent className="w-full">
                          {salesOptions.map((sales) => (
                            <SelectItem key={sales} value={sales}>{sales}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Associate</Label>
                    <Select value={formData.namaAssociate || undefined} onValueChange={(value) => updateFormField('namaAssociate', value === 'empty' ? '' : value)}>
                      <SelectTrigger className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 h-9 text-sm w-full">
                        <SelectValue placeholder="Pilih" />
                      </SelectTrigger>
                      <SelectContent className="w-full">
                        <SelectItem value="empty">
                          <span className="text-slate-400 italic">Kosong</span>
                        </SelectItem>
                        {associateOptions.map((assoc) => (
                          <SelectItem key={assoc} value={assoc}>{assoc}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Direct/Associate</Label>
                    <Select value={formData.directOrAssociate || undefined} onValueChange={(value) => updateFormField('directOrAssociate', value === 'empty' ? '' : value)}>
                      <SelectTrigger className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 h-9 text-sm w-full">
                        <SelectValue placeholder="Pilih" />
                      </SelectTrigger>
                      <SelectContent className="w-full">
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
                        <SelectTrigger className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-purple-500 h-9 text-sm w-full">
                          <SelectValue placeholder="Pilih" />
                        </SelectTrigger>
                        <SelectContent className="w-full">
                          {Array.from({ length: 11 }, (_, i) => 2024 + i).map(year => (
                            <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Bulan Exp</Label>
                      <Select value={formData.bulanExpDate || undefined} onValueChange={(value) => updateFormField('bulanExpDate', value)}>
                        <SelectTrigger className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-purple-500 h-9 text-sm w-full">
                          <SelectValue placeholder="Pilih" />
                        </SelectTrigger>
                        <SelectContent className="w-full">
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
                      <SelectTrigger className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-purple-500 h-9 text-sm w-full">
                        <SelectValue placeholder="Pilih" />
                      </SelectTrigger>
                      <SelectContent className="w-full">
                        <SelectItem value="ISO">ISO</SelectItem>
                        <SelectItem value="SUSTAIN">SUSTAIN</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Akreditasi</Label>
                      <Select value={formData.akreditasi || undefined} onValueChange={(value) => updateFormField('akreditasi', value)}>
                        <SelectTrigger className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-purple-500 h-9 text-sm w-full">
                          <SelectValue placeholder="Pilih" />
                        </SelectTrigger>
                        <SelectContent className="w-full">
                          {masterAkreditasiData.akreditasi.map((akre) => (
                            <SelectItem key={akre.id} value={akre.kode}>{akre.nama}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Cat Akre</Label>
                      <Select value={formData.catAkre || undefined} onValueChange={(value) => updateFormField('catAkre', value)}>
                        <SelectTrigger className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-purple-500 h-9 text-sm w-full">
                          <SelectValue placeholder="Pilih" />
                        </SelectTrigger>
                        <SelectContent className="w-full">
                          <SelectItem value="KAN">KAN</SelectItem>
                          <SelectItem value="NON AKRE">NON AKRE</SelectItem>
                          <SelectItem value="INTERNASIONAL">INTERNASIONAL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Standar</Label>
                    <Select value={formData.std || undefined} onValueChange={(value) => updateFormField('std', value)}>
                      <SelectTrigger className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-purple-500 h-9 text-sm w-full">
                        <SelectValue placeholder="Pilih" />
                      </SelectTrigger>
                      <SelectContent className="w-full">
                        {masterStandarData.standar.map((std) => (
                          <SelectItem key={std.kode} value={std.kode}>{std.kode}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">EA Code</Label>
                      <Select value={formData.eaCode || undefined} onValueChange={(value) => updateFormField('eaCode', value)}>
                        <SelectTrigger className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-purple-500 h-9 text-sm w-full">
                          <SelectValue placeholder="Pilih" />
                        </SelectTrigger>
                        <SelectContent className="w-full">
                          {eaCodeOptions.map((ea) => (
                            <SelectItem key={ea.id} value={ea.code}>{ea.code}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Tahap Audit</Label>
                      <Select value={formData.tahapAudit || undefined} onValueChange={(value) => updateFormField('tahapAudit', value)}>
                        <SelectTrigger className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-purple-500 h-9 text-sm w-full">
                          <SelectValue placeholder="Pilih" />
                        </SelectTrigger>
                        <SelectContent className="w-full">
                          <SelectItem value="IA">IA</SelectItem>
                          {tahapanOptions.map((tahap) => (
                            <SelectItem key={tahap} value={tahap}>{tahap}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Status Sertifikat</Label>
                    <Select value={formData.statusSertifikat || undefined} onValueChange={(value) => updateFormField('statusSertifikat', value)}>
                      <SelectTrigger className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-purple-500 h-9 text-sm w-full">
                        <SelectValue placeholder="Pilih" />
                      </SelectTrigger>
                      <SelectContent className="w-full">
                        <SelectItem value="terbit">terbit</SelectItem>
                        <SelectItem value="belum terbit">belum terbit</SelectItem>
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

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Tgl Kunjungan</Label>
                          <Input
                            type="date"
                            value={formData.tanggalKunjungan}
                            onChange={(e) => updateFormField('tanggalKunjungan', e.target.value)}
                            className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 h-9 text-sm"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Status Kunjungan</Label>
                          <Select value={formData.statusKunjungan || undefined} onValueChange={(value) => updateFormField('statusKunjungan', value)}>
                            <SelectTrigger className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 h-9 text-sm w-full">
                              <SelectValue placeholder="Pilih" />
                            </SelectTrigger>
                            <SelectContent className="w-full">
                              <SelectItem value="VISITED">VISITED</SelectItem>
                              <SelectItem value="NOT YET">NOT YET</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Catatan Kunjungan</Label>
                        <Textarea
                          value={formData.catatanKunjungan}
                          onChange={(e) => updateFormField('catatanKunjungan', e.target.value)}
                          placeholder="Catatan kunjungan..."
                          rows={2}
                          className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Foto Bukti Kunjungan (URL)</Label>
                        <Input
                          type="text"
                          value={formData.fotoBuktiKunjungan}
                          onChange={(e) => updateFormField('fotoBuktiKunjungan', e.target.value)}
                          placeholder="https://example.com/foto.jpg"
                          className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 h-9 text-sm"
                        />
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
                          <SelectTrigger className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-green-500 h-9 text-sm w-full">
                            <SelectValue placeholder="Pilih" />
                          </SelectTrigger>
                          <SelectContent className="w-full">
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
              className="cursor-pointer flex-1 sm:flex-none border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 h-8 sm:h-10 px-3 sm:px-6 text-xs sm:text-sm"
            >
              <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              <span>Batal</span>
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg h-8 sm:h-10 px-3 sm:px-6 text-xs sm:text-sm cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 animate-spin" />
                  <span>Menyimpan...</span>
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
  );
});

EditCrmDialog.displayName = 'EditCrmDialog';

export { EditCrmDialog };
