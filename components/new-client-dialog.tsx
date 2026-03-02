"use client";

import React, { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useCurrentUser } from '@/hooks/use-current-user';
import { Save, X, Loader2, Upload, Calendar } from 'lucide-react';

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

interface NewClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: any;
  onSuccess?: () => void;
}

export function NewClientDialog({ open, onOpenChange, client, onSuccess }: NewClientDialogProps) {
  const createClientMutation = useMutation(api.crmNewClient.createCrmNewClient);
  const updateClientMutation = useMutation(api.crmNewClient.updateCrmNewClient);
  const { user } = useCurrentUser();

  const [namaClient, setNamaClient] = useState("");
  const [namaPicClient, setNamaPicClient] = useState("");
  const [noHp, setNoHp] = useState("");
  const [picTsi, setPicTsi] = useState("");
  const [tglKunjungan, setTglKunjungan] = useState("");
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [catatan, setCatatan] = useState("");
  const [tindakLanjut, setTindakLanjut] = useState("");
  const [fotoBukti, setFotoBukti] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Reset form when client changes or dialog opens/closes
  React.useEffect(() => {
    if (client && open) {
      setNamaClient(client.namaClient || "");
      setNamaPicClient(client.namaPicClient || "");
      setNoHp(client.noHp || "");
      setPicTsi(client.picTsi || "");
      setTglKunjungan(client.tglKunjungan || "");
      setMonth(client.month || new Date().getMonth() + 1);
      setYear(client.year || new Date().getFullYear());
      setCatatan(client.catatan || "");
      setTindakLanjut(client.tindakLanjut || "");
      setFotoBukti(client.fotoBukti || "");
    } else {
      setNamaClient("");
      setNamaPicClient("");
      setNoHp("");
      setPicTsi("");
      setTglKunjungan("");
      setMonth(new Date().getMonth() + 1);
      setYear(new Date().getFullYear());
      setCatatan("");
      setTindakLanjut("");
      setFotoBukti("");
    }
  }, [client, open]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('❌ Ukuran file maksimal 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('❌ Hanya file gambar yang diperbolehkan');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();

    reader.onloadend = () => {
      const base64String = reader.result as string;
      setFotoBukti(base64String);
      setIsUploading(false);
      toast.success('✅ Foto berhasil diupload');
    };

    reader.onerror = () => {
      toast.error('❌ Gagal mengupload foto');
      setIsUploading(false);
    };

    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    // Validation
    if (!namaClient.trim()) {
      toast.error('❌ Nama Client wajib diisi!');
      return;
    }
    if (!namaPicClient.trim()) {
      toast.error('❌ Nama PIC Client wajib diisi!');
      return;
    }
    if (!noHp.trim()) {
      toast.error('❌ No HP wajib diisi!');
      return;
    }
    if (!picTsi.trim()) {
      toast.error('❌ PIC TSI wajib diisi!');
      return;
    }
    if (!tglKunjungan) {
      toast.error('❌ Tanggal Kunjungan wajib diisi!');
      return;
    }

    setIsSaving(true);
    try {
      if (client) {
        // Update existing client
        await updateClientMutation({
          id: client._id,
          namaClient: namaClient.trim(),
          namaPicClient: namaPicClient.trim(),
          noHp: noHp.trim(),
          picTsi: picTsi.trim(),
          tglKunjungan,
          month,
          year,
          catatan: catatan.trim() || undefined,
          tindakLanjut: tindakLanjut.trim() || undefined,
          fotoBukti: fotoBukti || undefined,
          updated_by: user?._id,
          updatedByName: user?.name,
        });
        toast.success(`✅ Client ${namaClient} berhasil diupdate`);
      } else {
        // Create new client
        await createClientMutation({
          namaClient: namaClient.trim(),
          namaPicClient: namaPicClient.trim(),
          noHp: noHp.trim(),
          picTsi: picTsi.trim(),
          tglKunjungan,
          month,
          year,
          catatan: catatan.trim() || undefined,
          tindakLanjut: tindakLanjut.trim() || undefined,
          fotoBukti: fotoBukti || undefined,
          created_by: user?._id,
          createdByName: user?.name || "Unknown",
        });
        toast.success(`✅ Client baru ${namaClient} berhasil ditambahkan`);
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error saving client:', error);
      toast.error('❌ Gagal menyimpan Client');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-white">
            {client ? 'Edit' : 'Tambah'} Kunjungan New Client
          </DialogTitle>
          <DialogDescription className="text-slate-500 dark:text-slate-400">
            {client ? 'Update informasi' : 'Tambah'} new client untuk engagement partnership
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Nama Client */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Nama Client <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="Masukkan nama client/perusahaan"
              value={namaClient}
              onChange={(e) => setNamaClient(e.target.value)}
              disabled={isSaving}
              className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Nama PIC Client */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Nama PIC Client <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="Masukkan nama PIC Client"
              value={namaPicClient}
              onChange={(e) => setNamaPicClient(e.target.value)}
              disabled={isSaving}
              className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* No HP */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No HP <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="Masukkan nomor HP"
              value={noHp}
              onChange={(e) => setNoHp(e.target.value)}
              disabled={isSaving}
              className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* PIC TSI */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              PIC TSI <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="Masukkan nama PIC TSI"
              value={picTsi}
              onChange={(e) => setPicTsi(e.target.value)}
              disabled={isSaving}
              className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Tanggal Kunjungan */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Tanggal Kunjungan <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="date"
                value={tglKunjungan}
                onChange={(e) => setTglKunjungan(e.target.value)}
                disabled={isSaving}
                className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 h-9 pl-10"
              />
            </div>
          </div>

          {/* Bulan & Tahun */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Bulan
              </Label>
              <Select value={month.toString()} onValueChange={(v) => setMonth(parseInt(v))} disabled={isSaving}>
                <SelectTrigger className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500">
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
                Tahun
              </Label>
              <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))} disabled={isSaving}>
                <SelectTrigger className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500">
                  <SelectValue placeholder="Pilih tahun" />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026, 2027, 2028].map((y) => (
                    <SelectItem key={y} value={y.toString()}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Catatan */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Catatan
            </Label>
            <Textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Catatan mengenai client..."
              disabled={isSaving}
              className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 min-h-[80px] text-sm resize-y"
            />
          </div>

          {/* Tindak Lanjut */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Tindak Lanjut
            </Label>
            <Textarea
              value={tindakLanjut}
              onChange={(e) => setTindakLanjut(e.target.value)}
              placeholder="Tindak lanjut yang perlu dilakukan..."
              disabled={isSaving}
              className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 min-h-[80px] text-sm resize-y"
            />
          </div>

          {/* Foto Bukti */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Foto Bukti
            </Label>
            {fotoBukti ? (
              <div className="space-y-3">
                <div className="relative group">
                  <img
                    src={fotoBukti}
                    alt="Foto Bukti"
                    className="w-full max-w-md h-64 object-contain rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => setFotoBukti("")}
                    disabled={isSaving}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    id="replace-foto"
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={isUploading || isSaving}
                    className="hidden"
                  />
                  <Label
                    htmlFor="replace-foto"
                    className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Upload className="h-4 w-4" />
                    Ganti Foto
                  </Label>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-8 text-center hover:border-blue-500 dark:hover:border-blue-500 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={isUploading || isSaving}
                  className="hidden"
                  id="foto-bukti-upload"
                />
                <Label
                  htmlFor="foto-bukti-upload"
                  className="cursor-pointer flex flex-col items-center gap-3"
                >
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 flex items-center justify-center">
                    {isUploading ? (
                      <Loader2 className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin" />
                    ) : (
                      <Upload className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {isUploading ? 'Mengupload...' : 'Klik untuk upload foto bukti'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      PNG, JPG, JPEG hingga 5MB
                    </p>
                  </div>
                </Label>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            className="cursor-pointer"
          >
            <X className="mr-2 h-4 w-4" />
            Batal
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || isUploading}
            className="cursor-pointer bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {client ? 'Update' : 'Simpan'}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
