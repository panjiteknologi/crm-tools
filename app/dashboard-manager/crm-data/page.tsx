"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Pencil, Trash2, Upload, Download, Search, Filter, X, Save, FileSpreadsheet, ChevronDown, ChevronRight, Calendar, CalendarClock, Building, MapPin, Shield, Clock, FileClock, Database } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { getCurrentUser } from '@/lib/auth';
import indonesiaData from '@/data/indonesia-provinsi-kota.json';
import masterSalesData from '@/data/master-sales.json';
import masterStandarData from '@/data/master-standar.json';
import masterEaCodeData from '@/data/master-ea-code.json';
import masterAlasanData from '@/data/master-alasan.json';
import masterTahapanData from '@/data/master-tahapan.json';
import { InfinityLoader } from '@/components/ui/infinity-loader';
import { FilterSection } from '@/components/filters/FilterSection';
import { FilterDateSection } from '@/components/filters/FilterDateSection';
import { FilterPicCrmSection } from '@/components/filters/FilterPicCrmSection';
import { FilterCompanySection } from '@/components/filters/FilterCompanySection';
import { FilterPicSalesSection } from '@/components/filters/FilterPicSalesSection';
import { FilterSertifikatSection } from '@/components/filters/FilterSertifikatSection';
import { FilterKunjunganSection } from '@/components/filters/FilterKunjunganSection';
import { FilterBulanAuditSustain } from '@/components/filters/FilterBulanAuditSustain';
import { FilterBulanAudit } from '@/components/filters/FilterBulanAudit';
import { EditCrmDialog } from '@/components/crm-edit-dialog';
import { CrmDataTable } from '@/components/crm-data-table';

interface CrmTarget {
  _id: Id<"crmTargets">;
  tahun?: string;
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
  bulanAuditSebelumnyaSustain?: string;
  expDate?: string;
  tahapAudit?: string;
  hargaKontrak?: number;
  bulanTtdNotif?: string;
  bulanAudit?: string;
  hargaTerupdate?: number;
  trimmingValue?: number;
  lossValue?: number;
  cashback?: number;
  terminPembayaran?: string;
  statusInvoice?: string;
  statusPembayaran?: string;
  statusKomisi?: string;
  statusSertifikat?: string;
  nomorSertifikat?: string;
  tanggalKunjungan?: string;
  statusKunjungan?: string;
  catatanKunjungan?: string;
  fotoBuktiKunjungan?: string;
  createdAt: number;
  updatedAt: number;
}

// Excel-like Form Data Interface
interface CrmFormData {
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
  bulanAuditSebelumnyaSustain?: string;
  expDate?: string;
  tahapAudit?: string;
  hargaKontrak?: string;
  bulanTtdNotif?: string;
  bulanAudit?: string;
  hargaTerupdate?: string;
  trimmingValue?: string;
  lossValue?: string;
  cashback?: string;
  terminPembayaran?: string;
  statusInvoice?: string;
  statusPembayaran?: string;
  statusKomisi?: string;
  statusSertifikat?: string;
  nomorSertifikat?: string;
  tanggalKunjungan?: string;
  statusKunjungan?: string;
  catatanKunjungan?: string;
  fotoBuktiKunjungan?: string;
}

interface FormDataRowProps {
  row: CrmFormData;
  index: number;
  onFieldChange: (index: number, field: keyof CrmFormData, value: string) => void;
  onRemove: (index: number) => void;
  totalRows: number;
  staffUsers: any[];
  associates: any[];
  tahapanOptions: Array<{ value: string; label: string }>;
}

// Helper functions to normalize provinsi and kota for flexible matching
const normalizeProvinsi = (str: string): string => {
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ') // multiple spaces to single space
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '') // remove special chars
    .replace(/\bdki\b/g, 'dki')
    .replace(/\bd\.k\.i\./g, 'dki');
};

const normalizeKota = (str: string): string => {
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ') // multiple spaces to single space
    .replace(/^kota\s+/i, '') // remove "Kota " prefix
    .replace(/^kabupaten\s+/i, '') // remove "Kabupaten " prefix
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ''); // remove special chars
};

// FormDataRow Component for Excel-like table
const FormDataRow = ({ row, index, onFieldChange, onRemove, totalRows, staffUsers, associates, tahapanOptions }: FormDataRowProps) => {
  const handleChange = (field: keyof CrmFormData, value: string) => {
    onFieldChange(index, field, value);
  };

  // Get kota options based on selected provinsi
  const getKotaOptions = () => {
    if (!row.provinsi) return [];
    const selectedProv = (indonesiaData as any)[row.provinsi];
    return selectedProv?.kabupaten_kota || [];
  };

  // Calculate trimming and loss values
  const hargaKontrak = parseFloat(row.hargaKontrak?.replace(/\./g, '').replace(',', '.') || '0') || 0;
  const hargaTerupdate = parseFloat(row.hargaTerupdate?.replace(/\./g, '').replace(',', '.') || '0') || 0;

  const trimmingValue = hargaTerupdate > hargaKontrak ? hargaTerupdate - hargaKontrak : 0;
  const lossValue = hargaKontrak > hargaTerupdate ? hargaKontrak - hargaTerupdate : 0;

  // Format number with thousands separator for display
  const formatNumber = (num: number) => {
    return num > 0 ? num.toLocaleString('id-ID') : '';
  };

  // Handle harga input with formatting
  const handleHargaChange = (field: 'hargaKontrak' | 'hargaTerupdate' | 'cashback', value: string) => {
    // Remove all non-digit characters for storage
    const cleanValue = value.replace(/\./g, '').replace(/,/g, '.');
    handleChange(field, cleanValue);
  };

  // Get display value for harga fields
  const getHargaDisplay = (value: string | undefined) => {
    if (!value) return '';
    const numValue = parseFloat(value.replace(/\./g, '').replace(',', '.')) || 0;
    return numValue > 0 ? numValue.toLocaleString('id-ID') : value;
  };

  return (
    <tr className="hover:bg-muted/30">
      <td className="border border-border p-1 min-w-[80px]">
        <select
          defaultValue={row.tahun || new Date().getFullYear().toString()}
          onChange={(e) => handleChange('tahun', e.target.value)}
          className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded"
        >
          <option value="">- Pilih -</option>
          {Array.from({ length: 11 }, (_, i) => 2024 + i).map(year => (
            <option key={year} value={year.toString()}>{year}</option>
          ))}
        </select>
      </td>
      <td className="border border-border p-1 min-w-[100px]">
        <input
          type="text"
          defaultValue={row.namaPerusahaan}
          onChange={(e) => handleChange('namaPerusahaan', e.target.value)}
          placeholder="Nama Perusahaan"
          className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded"
        />
      </td>
      <td className="border border-border p-1 min-w-[150px]">
        <select
          defaultValue={row.provinsi}
          onChange={(e) => {
            handleChange('provinsi', e.target.value);
            handleChange('kota', ''); // Reset kota when provinsi changes
          }}
          className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded"
        >
          <option value="">- Pilih Provinsi -</option>
          {Object.keys(indonesiaData).sort().map(prov => (
            <option key={prov} value={prov}>{prov}</option>
          ))}
        </select>
      </td>
      <td className="border border-border p-1 min-w-[150px]">
        <select
          defaultValue={row.kota}
          onChange={(e) => handleChange('kota', e.target.value)}
          disabled={!row.provinsi}
          className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded disabled:opacity-50"
        >
          <option value="">- Pilih Kota -</option>
          {getKotaOptions().map((kota: string) => (
            <option key={kota} value={kota}>{kota}</option>
          ))}
        </select>
      </td>
      <td className="border border-border p-1 min-w-[150px]">
        <input
          type="text"
          defaultValue={row.alamat}
          onChange={(e) => handleChange('alamat', e.target.value)}
          placeholder="Alamat lengkap"
          className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded"
        />
      </td>
      <td className="border border-border p-1 min-w-[100px]">
        <select
          defaultValue={row.status}
          onChange={(e) => handleChange('status', e.target.value)}
          className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded"
        >
          <option value="">- Pilih -</option>
          <option value="WAITING">WAITING</option>
          <option value="PROSES">PROSES</option>
          <option value="DONE">DONE</option>
          <option value="SUSPEND">SUSPEND</option>
          <option value="LOSS">LOSS</option>
        </select>
      </td>
      <td className="border border-border p-1 min-w-[150px]">
        <select
          defaultValue={row.alasan}
          onChange={(e) => handleChange('alasan', e.target.value)}
          className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded"
        >
          <option value="">- Pilih -</option>
          {masterAlasanData.alasan.map((item: any) => (
            <option key={item.id} value={item.alasan}>{item.alasan}</option>
          ))}
        </select>
      </td>
      <td className="border border-border p-1 min-w-[100px]">
        <select
          defaultValue={row.picCrm}
          onChange={(e) => handleChange('picCrm', e.target.value)}
          className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded"
        >
          <option value="">- Pilih -</option>
          {staffUsers.map(user => (
            <option key={user._id} value={user.name}>
              {user.name}
            </option>
          ))}
        </select>
      </td>
      <td className="border border-border p-1 min-w-[120px]">
        <select
          defaultValue={row.sales}
          onChange={(e) => handleChange('sales', e.target.value)}
          className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded"
        >
          <option value="">- Pilih -</option>
          {masterSalesData.map((sales: any) => (
            <option key={sales.id} value={sales.nama}>{sales.nama}</option>
          ))}
        </select>
      </td>
      <td className="border border-border p-1 min-w-[150px]">
        <select
          defaultValue={row.namaAssociate}
          onChange={(e) => handleChange('namaAssociate', e.target.value)}
          className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded"
        >
          <option value="">- Pilih -</option>
          {associates?.map((assoc: any) => (
            <option key={assoc._id} value={assoc.nama}>{assoc.nama}</option>
          ))}
        </select>
      </td>
      <td className="border border-border p-1 min-w-[100px]">
        <select
          defaultValue={row.directOrAssociate}
          onChange={(e) => handleChange('directOrAssociate', e.target.value)}
          className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded"
        >
          <option value="">- Pilih -</option>
          <option value="DIRECT">DIRECT</option>
          <option value="ASSOCIATE">ASSOCIATE</option>
        </select>
      </td>
      <td className="border border-border p-1 min-w-[100px]">
        <input
          type="text"
          defaultValue={row.grup}
          onChange={(e) => handleChange('grup', e.target.value)}
          placeholder="Grup"
          className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded"
        />
      </td>
      <td className="border border-border p-1 min-w-[100px]">
        <select
          defaultValue={row.produk}
          onChange={(e) => handleChange('produk', e.target.value)}
          className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded"
        >
          <option value="">- Pilih -</option>
          <option value="ISO">ISO</option>
          <option value="SUSTAIN">SUSTAIN</option>
        </select>
      </td>
      <td className="border border-border p-1 min-w-[100px]">
        <select
          defaultValue={row.std}
          onChange={(e) => handleChange('std', e.target.value)}
          className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded"
        >
          <option value="">- Pilih -</option>
          {masterStandarData.standar.map((std: any) => (
            <option key={std.kode} value={std.nama}>{std.nama}</option>
          ))}
        </select>
      </td>
      <td className="border border-border p-1 min-w-[100px]">
        <select
          defaultValue={row.category}
          onChange={(e) => handleChange('category', e.target.value)}
          className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded"
        >
          <option value="">- Pilih -</option>
          <option value="GOLD">GOLD</option>
          <option value="SILVER">SILVER</option>
          <option value="BRONZE">BRONZE</option>
        </select>
      </td>
      <td className="border border-border p-1 min-w-[100px]">
        <select
          defaultValue={row.kuadran}
          onChange={(e) => handleChange('kuadran', e.target.value)}
          className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded"
        >
          <option value="">- Pilih -</option>
          <option value="K1">K1</option>
          <option value="K2">K2</option>
          <option value="K3">K3</option>
          <option value="K4">K4</option>
        </select>
      </td>
      <td className="border border-border p-1 min-w-[100px]">
        <input
          type="text"
          defaultValue={row.luarKota}
          onChange={(e) => handleChange('luarKota', e.target.value)}
          placeholder="Luar Kota"
          className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded"
        />
      </td>
      <td className="border border-border p-1 min-w-[100px]">
        <select
          defaultValue={row.akreditasi}
          onChange={(e) => handleChange('akreditasi', e.target.value)}
          className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded"
        >
          <option value="">- Pilih -</option>
          <option value="KAN">KAN</option>
          <option value="NON AKRE">NON AKRE</option>
        </select>
      </td>
      <td className="border border-border p-1 min-w-[100px]">
        <select
          defaultValue={row.catAkre}
          onChange={(e) => handleChange('catAkre', e.target.value)}
          className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded"
        >
          <option value="">- Pilih -</option>
          <option value="KAN">KAN</option>
          <option value="NON AKRE">NON AKRE</option>
          <option value="INTERNASIONAL">INTERNASIONAL</option>
        </select>
      </td>
      <td className="border border-border p-1 min-w-[100px]">
        <select
          defaultValue={row.eaCode}
          onChange={(e) => handleChange('eaCode', e.target.value)}
          className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded"
        >
          <option value="">- Pilih -</option>
          {masterEaCodeData.ea_code.map((ea: any) => (
            <option key={ea.id} value={ea.ea_code}>{ea.ea_code}</option>
          ))}
        </select>
      </td>
      <td className="border border-border p-1 min-w-[100px]">
        <select
          defaultValue={row.tahapAudit}
          onChange={(e) => handleChange('tahapAudit', e.target.value)}
          className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded"
        >
          <option value="">- Pilih -</option>
          {tahapanOptions.map((tahap) => (
            <option key={tahap.value} value={tahap.value}>{tahap.label}</option>
          ))}
        </select>
      </td>
      <td className="border border-border p-1 min-w-[100px]">
        <input
          type="date"
          defaultValue={row.iaDate}
          onChange={(e) => handleChange('iaDate', e.target.value)}
          className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded"
        />
      </td>
      <td className="border border-border p-1 min-w-[100px]">
        <input
          type="date"
          defaultValue={row.expDate}
          onChange={(e) => handleChange('expDate', e.target.value)}
          className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded"
        />
      </td>
      <td className="border border-border p-1 min-w-[100px]">
        <input
          type="text"
          value={getHargaDisplay(row.hargaKontrak)}
          onChange={(e) => handleHargaChange('hargaKontrak', e.target.value)}
          placeholder="0"
          className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded text-right"
        />
      </td>
      <td className="border border-border p-1 min-w-[100px]">
        <input
          type="date"
          defaultValue={row.bulanTtdNotif}
          onChange={(e) => handleChange('bulanTtdNotif', e.target.value)}
          className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded"
        />
      </td>
      <td className="border border-border p-1 min-w-[120px]">
        <input
          type="text"
          value={getHargaDisplay(row.hargaTerupdate)}
          onChange={(e) => handleHargaChange('hargaTerupdate', e.target.value)}
          placeholder="0"
          className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded text-right"
        />
      </td>
      <td className="border border-border p-1 min-w-[100px] bg-muted/30">
        <input
          type="text"
          value={formatNumber(trimmingValue)}
          readOnly
          placeholder="0"
          className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-none text-right font-medium text-green-600"
          title="Trimming: Harga Terupdate - Harga Kontrak"
        />
      </td>
      <td className="border border-border p-1 min-w-[100px] bg-muted/30">
        <input
          type="text"
          value={formatNumber(lossValue)}
          readOnly
          placeholder="0"
          className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-none text-right font-medium text-red-600"
          title="Loss: Harga Kontrak - Harga Terupdate"
        />
      </td>
      <td className="border border-border p-1 min-w-[100px]">
        <input
          type="text"
          value={getHargaDisplay(row.cashback)}
          onChange={(e) => handleHargaChange('cashback', e.target.value)}
          placeholder="0"
          className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded text-right"
        />
      </td>
      <td className="border border-border p-1 min-w-[120px]">
        <select
          defaultValue={row.terminPembayaran}
          onChange={(e) => handleChange('terminPembayaran', e.target.value)}
          className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded"
        >
          <option value="">- Pilih -</option>
          <option value="Lunas Diawal">Lunas Diawal</option>
          <option value="Lunas Diakhir">Lunas Diakhir</option>
        </select>
      </td>
      <td className="border border-border p-1 min-w-[120px]">
        <select
          defaultValue={row.statusSertifikat}
          onChange={(e) => handleChange('statusSertifikat', e.target.value)}
          className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded"
        >
          <option value="">- Pilih -</option>
          <option value="Terbit">Terbit</option>
          <option value="Belum Terbit">Belum Terbit</option>
        </select>
      </td>
      <td className="border border-border p-1 min-w-[130px]">
        <input
          type="text"
          defaultValue={row.nomorSertifikat}
          onChange={(e) => handleChange('nomorSertifikat', e.target.value)}
          placeholder="Nomor Sertifikat"
          className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded"
        />
      </td>
      <td className="border border-border p-1 min-w-[120px]">
        <select
          defaultValue={row.bulanExpDate}
          onChange={(e) => handleChange('bulanExpDate', e.target.value)}
          className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded"
        >
          <option value="">- Pilih -</option>
          <option value="Januari">Januari</option>
          <option value="Februari">Februari</option>
          <option value="Maret">Maret</option>
          <option value="April">April</option>
          <option value="Mei">Mei</option>
          <option value="Juni">Juni</option>
          <option value="Juli">Juli</option>
          <option value="Agustus">Agustus</option>
          <option value="September">September</option>
          <option value="Oktober">Oktober</option>
          <option value="November">November</option>
          <option value="Desember">Desember</option>
        </select>
      </td>
      <td className="border border-border p-1 min-w-[100px]">
        <input
          type="date"
          defaultValue={row.tanggalKunjungan}
          onChange={(e) => handleChange('tanggalKunjungan', e.target.value)}
          className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded"
        />
      </td>
      <td className="border border-border p-1 min-w-[100px]">
        <select
          defaultValue={row.statusKunjungan}
          onChange={(e) => handleChange('statusKunjungan', e.target.value)}
          className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded"
        >
          <option value="">- Pilih -</option>
          <option value="VISITED">VISITED</option>
          <option value="NOT YET">NOT YET</option>
        </select>
      </td>
      <td className="border border-border p-1 min-w-[120px]">
        <input
          type="date"
          defaultValue={row.bulanAuditSebelumnyaSustain}
          onChange={(e) => handleChange('bulanAuditSebelumnyaSustain', e.target.value)}
          className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded"
        />
      </td>
      <td className="border border-border p-1 min-w-[120px]">
        <input
          type="date"
          defaultValue={row.bulanAudit}
          onChange={(e) => handleChange('bulanAudit', e.target.value)}
          className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded"
        />
      </td>
      <td className="border border-border p-1 min-w-[120px]">
        <select
          defaultValue={row.statusInvoice}
          onChange={(e) => handleChange('statusInvoice', e.target.value)}
          className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded"
        >
          <option value="">- Pilih -</option>
          <option value="Terbit">Terbit</option>
          <option value="Belum Terbit">Belum Terbit</option>
        </select>
      </td>
      <td className="border border-border p-1 min-w-[120px]">
        <select
          defaultValue={row.statusPembayaran}
          onChange={(e) => handleChange('statusPembayaran', e.target.value)}
          className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded"
        >
          <option value="">- Pilih -</option>
          <option value="Lunas">Lunas</option>
          <option value="Belum Lunas">Belum Lunas</option>
          <option value="Sudah DP">Sudah DP</option>
        </select>
      </td>
      <td className="border border-border p-1 min-w-[140px]">
        <select
          defaultValue={row.statusKomisi}
          onChange={(e) => handleChange('statusKomisi', e.target.value)}
          className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded"
        >
          <option value="">- Pilih -</option>
          <option value="Sudah Diajukan">Sudah Diajukan</option>
          <option value="Belum Diajukan">Belum Diajukan</option>
          <option value="Tidak Ada">Tidak Ada</option>
        </select>
      </td>
      <td className="border border-border p-1 text-center">
        <button
          onClick={() => onRemove(index)}
          disabled={totalRows === 1}
          className="text-red-500 hover:text-red-700 disabled:text-gray-300 disabled:cursor-not-allowed cursor-pointer"
          title="Hapus baris"
        >
          <X className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
};

export default function CrmDataManagementPage() {
  // State variables
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPicCrm, setFilterPicCrm] = useState<string>('all');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [showExcelFormModal, setShowExcelFormModal] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<CrmTarget | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Comprehensive Filters
  const [expandedFilterSections, setExpandedFilterSections] = useState<string[]>([]);
  const currentYear = new Date().getFullYear().toString();
  const [filterTahun, setFilterTahun] = useState<string>(currentYear);
  const [filterFromBulanExp, setFilterFromBulanExp] = useState<string>('1');
  const [filterToBulanExp, setFilterToBulanExp] = useState<string>('12');
  const [filterAlasan, setFilterAlasan] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterProvinsi, setFilterProvinsi] = useState<string>('all');
  const [filterKota, setFilterKota] = useState<string>('all');
  const [filterStandar, setFilterStandar] = useState<string>('all');
  const [filterAkreditasi, setFilterAkreditasi] = useState<string>('all');
  const [filterEaCode, setFilterEaCode] = useState<string>('');
  const [filterTahapAudit, setFilterTahapAudit] = useState<string>('all');
  const [filterFromBulanTTD, setFilterFromBulanTTD] = useState<string>('all');
  const [filterToBulanTTD, setFilterToBulanTTD] = useState<string>('all');
  const [filterStatusSertifikat, setFilterStatusSertifikat] = useState<string>('all');
  const [filterTermin, setFilterTermin] = useState<string>('all');
  const [filterTahunAuditSustain, setFilterTahunAuditSustain] = useState<string>('all');
  const [filterFromBulanAuditSustain, setFilterFromBulanAuditSustain] = useState<string>('all');
  const [filterToBulanAuditSustain, setFilterToBulanAuditSustain] = useState<string>('all');
  const [filterTahunAudit, setFilterTahunAudit] = useState<string>('all');
  const [filterFromBulanAudit, setFilterFromBulanAudit] = useState<string>('all');
  const [filterToBulanAudit, setFilterToBulanAudit] = useState<string>('all');
  const [filterFromKunjungan, setFilterFromKunjungan] = useState<string>('all');
  const [filterToKunjungan, setFilterToKunjungan] = useState<string>('all');
  const [filterStatusKunjungan, setFilterStatusKunjungan] = useState<string>('all');
  const [filterPicSales, setFilterPicSales] = useState<string>('all');
  const [filterTipeProduk, setFilterTipeProduk] = useState<string>('all');

  // Quick filter from statistics cards - support multiple filters
  const [quickFilters, setQuickFilters] = useState<Array<{ field: string; value: string }>>([]);

  // Mobile filter sheet state
  const [activeFilterSheet, setActiveFilterSheet] = useState<string | null>(null);
  const [statsOpen, setStatsOpen] = useState(false);
  // Fetch CRM targets and user permissions
  const crmTargets = useQuery(api.crmTargets.getCrmTargets);
  const allUsers = useQuery(api.auth.getAllUsers);
  const associates = useQuery(api.masterAssociate.getAssociates);
  const staffUsers = allUsers?.filter(user => user.role === 'staff') || [];
  const deleteTarget = useMutation(api.crmTargets.deleteCrmTarget);
  const createTarget = useMutation(api.crmTargets.createCrmTarget);
  const updateTargetMutation = useMutation(api.crmTargets.updateCrmTarget);
  const deleteAllTargets = useMutation(api.crmTargets.deleteAllCrmTargets);

  // Loading state - show loading while any critical query is loading
  const isLoading = crmTargets === undefined || allUsers === undefined;

  // Get current user with role and permissions
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [canEdit, setCanEdit] = React.useState(true);
  const [canViewAll, setCanViewAll] = React.useState(true);

  React.useEffect(() => {
    try {
      const userData = localStorage.getItem('crm_user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setCurrentUser(parsedUser);

        // Check permissions based on role
        // All STAFF are view-only (tidak bisa edit/delete/export)
        if (parsedUser.role === 'staff') {
          setCanEdit(false);     // View-only mode
          setCanViewAll(false);  // Hanya lihat data sendiri
        }
        // Admin and super_admin: full access
        else if (parsedUser.role === 'admin' || parsedUser.role === 'super_admin') {
          setCanEdit(true);
          setCanViewAll(true);
        }
        // Manager: full access
        else if (parsedUser.role === 'manager') {
          setCanEdit(true);
          setCanViewAll(true);
        }

        // Auto-set PIC CRM filter for staff
        if (parsedUser.role === 'staff' && parsedUser.name) {
          setFilterPicCrm(parsedUser.name);
        }
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
      setCanEdit(true);
      setCanViewAll(true);
    }
  }, []);

  // Filter CRM targets based on logged-in user and permissions
  const filteredCrmTargets = React.useMemo(() => {
    if (!crmTargets) return [];

    // If user can view all (admin/super_admin), show all data
    if (canViewAll || currentUser?.role === 'admin' || currentUser?.role === 'super_admin') {
      return crmTargets;
    }

    // If user is staff, only show their own data based on their name matching PIC CRM
    if (currentUser?.role === 'staff' && currentUser?.name) {
      return crmTargets.filter(target => target.picCrm === currentUser.name);
    }

    // Default: return all data if role doesn't match
    return crmTargets;
  }, [crmTargets, currentUser, canViewAll]);

  // Filter options - Dynamic from filteredCrmTargets data
  const tahunOptions = Array.from({ length: 11 }, (_, i) => (2024 + i).toString());
  const bulanOptions = [
    { value: '1', label: 'Januari' },
    { value: '2', label: 'Februari' },
    { value: '3', label: 'Maret' },
    { value: '4', label: 'April' },
    { value: '5', label: 'Mei' },
    { value: '6', label: 'Juni' },
    { value: '7', label: 'Juli' },
    { value: '8', label: 'Agustus' },
    { value: '9', label: 'September' },
    { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' },
    { value: '12', label: 'Desember' },
  ];
  const alasanOptions = [...new Set(filteredCrmTargets?.map(t => t.alasan).filter(Boolean) || [])].sort() as string[];
  // Get standar options from master-standar.json
  const standarOptions = masterStandarData.standar.map((s: any) => s.kode).sort();

  // Get provinsi options from Indonesia data
  const provinsiOptions = Object.keys(indonesiaData).sort();

  // Get unique provinsi values from actual data (for debugging)
  const provinsiFromData = [...new Set(filteredCrmTargets?.map(t => t.provinsi).filter(Boolean) || [])].sort();
 
  // Get kota options based on selected provinsi from Indonesia data
  const kotaOptions = filterProvinsi !== 'all' && (indonesiaData as any)[filterProvinsi]
    ? [...new Set((indonesiaData as any)[filterProvinsi].kabupaten_kota)].sort() as string[] // Remove duplicates with Set
    : [];

  // Tahapan Audit - From master-tahapan.json
  const tahapanOptions = masterTahapanData.tahapan.map((t: any) => ({ value: t.kode, label: t.nama }));

  // Sales options
  const salesOptions = [...new Set(filteredCrmTargets?.map(t => t.sales).filter(Boolean) || [])].sort() as string[];

  // Get unique tahun options from bulanAuditSebelumnyaSustain data
  const tahunAuditSustainOptions = [...new Set(
    filteredCrmTargets
      ?.map(t => {
        if (t.bulanAuditSebelumnyaSustain) {
          const year = new Date(t.bulanAuditSebelumnyaSustain).getUTCFullYear();
          return year.toString();
        }
        return null;
      })
      .filter((year): year is string => year !== null) || []
  )].sort();

  const tahunAuditOptions = [...new Set(
    filteredCrmTargets
      ?.map(t => {
        if (t.bulanAudit) {
          return new Date(t.bulanAudit).getUTCFullYear().toString();
        }
        return null;
      })
      .filter((year): year is string => year !== null) || []
  )].sort();

  const toggleFilterSection = (section: string) => {
    setExpandedFilterSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  // Reset all filters
  const resetAllFilters = () => {
    setFilterTahun(currentYear);
    setFilterFromBulanExp('1');
    setFilterToBulanExp('12');
    setFilterPicCrm('all');
    setFilterStatus('all');
    setFilterAlasan('all');
    setFilterCategory('all');
    setFilterProvinsi('all');
    setFilterKota('all');
    setFilterStandar('all');
    setFilterAkreditasi('all');
    setFilterEaCode('');
    setFilterTahapAudit('all');
    setFilterFromBulanTTD('all');
    setFilterToBulanTTD('all');
    setFilterStatusSertifikat('all');
    setFilterTermin('all');
    setFilterTahunAuditSustain('all');
    setFilterFromBulanAuditSustain('all');
    setFilterToBulanAuditSustain('all');
    setFilterTahunAudit('all');
    setFilterFromBulanAudit('all');
    setFilterToBulanAudit('all');
    setFilterFromKunjungan('all');
    setFilterToKunjungan('all');
    setFilterStatusKunjungan('all');
    setFilterPicSales('all');
    setFilterTipeProduk('all');
    setQuickFilters([]);
  };

  // Quick filter handler for statistics cards - toggle multiple filters
  const handleQuickFilter = (field: string, value: string) => {
    setQuickFilters(prevFilters => {
      // Check if this filter already exists
      const existingIndex = prevFilters.findIndex(f => f.field === field && f.value === value);

      if (existingIndex !== -1) {
        // Remove filter if it exists (toggle off)
        return prevFilters.filter(f => f.field !== field || f.value !== value);
      } else {
        // Add new filter (toggle on)
        return [...prevFilters, { field, value }];
      }
    });
  };

  // Clear specific quick filter
  const clearQuickFilter = (field?: string, value?: string) => {
    if (field && value) {
      // Clear specific filter
      setQuickFilters(prevFilters => prevFilters.filter(f => !(f.field === field && f.value === value)));
    } else {
      // Clear all quick filters
      setQuickFilters([]);
    }
  };

  // Check if a specific filter is active
  const isQuickFilterActive = (field: string, value: string): boolean => {
    return quickFilters.some(f => f.field === field && f.value === value);
  };

  // Get all active filters for a specific field
  const getActiveFiltersForField = (field: string): string[] => {
    return quickFilters.filter(f => f.field === field).map(f => f.value);
  };

  // Excel-like Form state (multiple rows)
  const [excelFormData, setExcelFormData] = useState<CrmFormData[]>([{
    tahun: new Date().getFullYear().toString(),
    bulanExpDate: '',
    produk: '',
    picCrm: '',
    sales: '',
    namaAssociate: '',
    directOrAssociate: '',
    grup: '',
    namaPerusahaan: '',
    status: '',
    alasan: '',
    category: '',
    kuadran: '',
    luarKota: undefined,
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
    nomorSertifikat: '',
    tanggalKunjungan: '',
    statusKunjungan: '',
    bulanAuditSebelumnyaSustain: '',
    bulanAudit: '',
    statusInvoice: '',
    statusPembayaran: '',
    statusKomisi: '',
  }]);
  const [isSubmittingExcel, setIsSubmittingExcel] = useState(false);

  // Filter
  const filteredTargets = filteredCrmTargets?.filter(target => {
    const matchesSearch = true;

    // Date section filters
    const matchesTahun = filterTahun === 'all' || target.tahun === filterTahun;

    let matchesBulanExp = true;
    if (filterFromBulanExp !== 'all' || filterToBulanExp !== 'all') {
      // Mapping bulan nama ke angka
      const bulanNameToNum: { [key: string]: number } = {
        'januari': 1, 'februari': 2, 'maret': 3, 'april': 4, 'mei': 5, 'juni': 6,
        'juli': 7, 'agustus': 8, 'september': 9, 'oktober': 10, 'november': 11, 'desember': 12,
        'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6,
        'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12
      };

      // Coba parse sebagai angka dulu, lalu sebagai nama bulan
      let bulanExpNum = 0;
      const bulanExpLower = (target.bulanExpDate || '').toLowerCase().trim();

      if (bulanExpLower) {
        // Cek apakah angka
        const parsedNum = parseInt(bulanExpLower);
        if (!isNaN(parsedNum)) {
          bulanExpNum = parsedNum;
        } else if (bulanNameToNum[bulanExpLower]) {
          // Jika nama bulan
          bulanExpNum = bulanNameToNum[bulanExpLower];
        }
      }

      const fromMonth = filterFromBulanExp !== 'all' ? parseInt(filterFromBulanExp) : 1;
      const toMonth = filterToBulanExp !== 'all' ? parseInt(filterToBulanExp) : 12;

      // Hanya filter jika bulanExpNum valid (> 0), jika kosong biarkan lewat (true)
      if (bulanExpNum > 0) {
        matchesBulanExp = bulanExpNum >= fromMonth && bulanExpNum <= toMonth;
      }
      // Jika bulanExpNum = 0 (kosong/invalid), biarkan matchesBulanExp = true (tidak filter)
    }

    // Details section filters
    const matchesPicCrm = filterPicCrm === 'all' || target.picCrm === filterPicCrm;
    const matchesPicSales = filterPicSales === 'all' || target.sales === filterPicSales;
    const matchesStatus = filterStatus === 'all' || target.status === filterStatus;
    const matchesAlasan = filterAlasan === 'all' || target.alasan === filterAlasan;
    const matchesCategory = filterCategory === 'all' || target.category === filterCategory;

    // Provinsi filter - case insensitive with flexible matching
    const matchesProvinsi = filterProvinsi === 'all' ||
      (target.provinsi && normalizeProvinsi(target.provinsi) === normalizeProvinsi(filterProvinsi));

    // Kota filter - case insensitive with flexible matching
    const matchesKota = filterKota === 'all' ||
      (target.kota && normalizeKota(target.kota) === normalizeKota(filterKota));

    // Sertifikat section filters
    const matchesTipeProduk = filterTipeProduk === 'all' || target.produk === filterTipeProduk;
    const matchesStandar = filterStandar === 'all' || target.std === filterStandar;
    const matchesAkreditasi = filterAkreditasi === 'all' || target.akreditasi === filterAkreditasi;
    const matchesEaCode = filterEaCode === '' || (target.eaCode || '').toLowerCase().includes(filterEaCode.toLowerCase());
    const matchesTahapAudit = filterTahapAudit === 'all' || target.tahapAudit === filterTahapAudit;
    const matchesStatusSertifikat = filterStatusSertifikat === 'all' || target.statusSertifikat === filterStatusSertifikat;
    const matchesTermin = filterTermin === 'all' || target.terminPembayaran === filterTermin;

    let matchesBulanTTD = true;
    if (filterFromBulanTTD !== 'all' || filterToBulanTTD !== 'all') {
      const ttdDate = target.bulanTtdNotif;
      if (ttdDate) {
        const ttdMonth = new Date(ttdDate).getMonth() + 1;
        const fromMonth = filterFromBulanTTD !== 'all' ? parseInt(filterFromBulanTTD) : 1;
        const toMonth = filterToBulanTTD !== 'all' ? parseInt(filterToBulanTTD) : 12;
        matchesBulanTTD = ttdMonth >= fromMonth && ttdMonth <= toMonth;
      }
      // Jika ttdDate kosong, biarkan matchesBulanTTD = true (tidak filter)
    }

    // Jadwal Kunjungan section filters
    let matchesKunjungan = true;
    if (filterFromKunjungan !== 'all' || filterToKunjungan !== 'all') {
      const visitDate = target.tanggalKunjungan;
      if (visitDate) {
        const visitMonth = new Date(visitDate).getMonth() + 1;
        const fromMonth = filterFromKunjungan !== 'all' ? parseInt(filterFromKunjungan) : 1;
        const toMonth = filterToKunjungan !== 'all' ? parseInt(filterToKunjungan) : 12;
        matchesKunjungan = visitMonth >= fromMonth && visitMonth <= toMonth;
      }
      // Jika visitDate kosong, biarkan matchesKunjungan = true (tidak filter)
    }

    // Bulan Audit Sebelumnya Sustain section filter
    let matchesBulanAuditSustain = true;
    if (filterTahunAuditSustain !== 'all' || filterFromBulanAuditSustain !== 'all' || filterToBulanAuditSustain !== 'all') {
      const auditSustainDate = target.bulanAuditSebelumnyaSustain;

      // Jika filter aktif dan auditSustainDate kosong, exclude record
      if (!auditSustainDate) {
        matchesBulanAuditSustain = false;
      } else {
        // Parse tanggal menggunakan UTC untuk menghindari timezone issues
        const dateObj = new Date(auditSustainDate);
        const auditSustainYear = dateObj.getUTCFullYear().toString();
        const auditSustainMonth = dateObj.getUTCMonth() + 1;

        // Filter tahun
        const matchesTahun = filterTahunAuditSustain === 'all' || auditSustainYear === filterTahunAuditSustain;

        // Filter bulan
        let matchesBulan = true;
        if (filterFromBulanAuditSustain !== 'all' || filterToBulanAuditSustain !== 'all') {
          const fromMonth = filterFromBulanAuditSustain !== 'all' ? parseInt(filterFromBulanAuditSustain) : 1;
          const toMonth = filterToBulanAuditSustain !== 'all' ? parseInt(filterToBulanAuditSustain) : 12;
          matchesBulan = auditSustainMonth >= fromMonth && auditSustainMonth <= toMonth;
        }

        matchesBulanAuditSustain = matchesTahun && matchesBulan;
      }
    }

    const matchesStatusKunjungan = filterStatusKunjungan === 'all' || target.statusKunjungan === filterStatusKunjungan;

    let matchesBulanAudit = true;
    if (filterTahunAudit !== 'all' || filterFromBulanAudit !== 'all' || filterToBulanAudit !== 'all') {
      const auditDate = target.bulanAudit;

      if (!auditDate) {
        matchesBulanAudit = false;
      } else {
        const dateObj = new Date(auditDate);
        const auditYear = dateObj.getUTCFullYear().toString();
        const auditMonth = dateObj.getUTCMonth() + 1;

        const matchesTahun = filterTahunAudit === 'all' || auditYear === filterTahunAudit;

        let matchesBulan = true;
        if (filterFromBulanAudit !== 'all' || filterToBulanAudit !== 'all') {
          const fromMonth = filterFromBulanAudit !== 'all' ? parseInt(filterFromBulanAudit) : 1;
          const toMonth = filterToBulanAudit !== 'all' ? parseInt(filterToBulanAudit) : 12;
          matchesBulan = auditMonth >= fromMonth && auditMonth <= toMonth;
        }

        matchesBulanAudit = matchesTahun && matchesBulan;
      }
    }

    // Quick filter from statistics cards - support multiple filters with OR logic
    let matchesQuickFilter = true;
    if (quickFilters.length > 0) {
      // Group filters by field for OR logic within same field, AND logic between different fields
      const filtersByField: { [key: string]: string[] } = {};
      quickFilters.forEach(filter => {
        if (!filtersByField[filter.field]) {
          filtersByField[filter.field] = [];
        }
        filtersByField[filter.field].push(filter.value);
      });

      // Check if target matches ALL field groups (AND logic between fields)
      matchesQuickFilter = Object.entries(filtersByField).every(([field, values]) => {
        // For each field, check if target matches ANY of the values (OR logic within field)
        return values.some(value => {
          switch (field) {
            case 'status':
              return Boolean(target.status && target.status.toUpperCase() === value.toUpperCase());
            case 'directOrAssociate':
              return Boolean(target.directOrAssociate && target.directOrAssociate.toUpperCase() === value.toUpperCase());
            case 'kuadran':
              return Boolean(target.kuadran && target.kuadran.toUpperCase() === value.toUpperCase());
            case 'luarKota':
              if (value === 'LUAR') {
                return Boolean(target.luarKota && target.luarKota.toUpperCase().includes('LUAR'));
              } else if (value === 'DALAM') {
                return Boolean(!target.luarKota || !target.luarKota.toUpperCase().includes('LUAR'));
              }
              return true;
            case 'catAkre':
              return Boolean(target.catAkre && target.catAkre.toUpperCase() === value.toUpperCase());
            case 'statusSertifikat':
              if (value === 'TERBIT') {
                return Boolean(target.statusSertifikat && target.statusSertifikat.toUpperCase() === 'TERBIT');
              } else if (value === 'BELUM') {
                return Boolean(!target.statusSertifikat || target.statusSertifikat.toUpperCase().includes('BELUM'));
              }
              return true;
            case 'tahapAudit':
              return Boolean(target.tahapAudit && target.tahapAudit.toUpperCase() === value.toUpperCase());
            case 'statusInvoice':
              if (value === 'Terbit') {
                return Boolean(target.statusInvoice && target.statusInvoice.toString().trim().toUpperCase() === 'TERBIT');
              } else if (value === 'Belum') {
                return Boolean(!target.statusInvoice || target.statusInvoice.toString().trim().toUpperCase().includes('BELUM'));
              }
              return true;
            case 'statusPembayaran':
              return Boolean(target.statusPembayaran && target.statusPembayaran.toString().trim().toUpperCase() === value.toUpperCase());
            case 'statusKomisi':
              if (value === 'KOSONG') {
                return Boolean(!target.statusKomisi || target.statusKomisi.toString().trim() === '');
              } else {
                return Boolean(target.statusKomisi && target.statusKomisi.toString().trim().toUpperCase() === value.toUpperCase());
              }
            case 'trimming':
              if (value === 'ADA') {
                return Boolean(target.trimmingValue && target.trimmingValue > 0);
              } else if (value === 'KOSONG') {
                return Boolean(!target.trimmingValue || target.trimmingValue === 0);
              }
              return true;
            case 'lossValue':
              if (value === 'ADA') {
                return Boolean(target.lossValue && target.lossValue > 0);
              } else if (value === 'KOSONG') {
                return Boolean(!target.lossValue || target.lossValue === 0);
              }
              return true;
            default:
              return true;
          }
        });
      });
    }

    return matchesSearch && matchesTahun && matchesBulanExp && matchesPicCrm &&
           matchesPicSales && matchesStatus && matchesAlasan && matchesCategory && matchesProvinsi &&
           matchesKota && matchesTipeProduk && matchesStandar && matchesAkreditasi && matchesEaCode &&
           matchesTahapAudit && matchesBulanTTD && matchesStatusSertifikat &&
           matchesTermin && matchesBulanAuditSustain && matchesBulanAudit && matchesKunjungan && matchesStatusKunjungan && matchesQuickFilter;
  }) || [];

  // Sort targets based on current sort field and direction
  // Get unique values for filters
  const uniqueStatuses = [...new Set(filteredCrmTargets?.map(t => t.status) || [])].sort();
  const uniquePicCrms = [...new Set(filteredCrmTargets?.map(t => t.picCrm) || [])].sort();

  // Helper function to get status badge variant
  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    const statusUpper = status?.toUpperCase() || '';

    switch (statusUpper) {
      case 'PROSES':
        return 'default'; // Blue (primary color)
      case 'LANJUT':
        return 'secondary'; // Green/gray (will override with style)
      case 'LOSS':
        return 'destructive'; // Red
      case 'SUSPEND':
        return 'outline'; // Orange (will override with style)
      default:
        return 'secondary';
    }
  };

  // Helper function to get status badge color
  const getStatusBadgeColor = (status: string): string => {
    const statusUpper = status?.toUpperCase() || '';

    switch (statusUpper) {
      case 'PROSES':
        return 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600';
      case 'LANJUT':
        return 'bg-green-600 hover:bg-green-700 text-white border-green-600';
      case 'LOSS':
        return 'bg-red-600 hover:bg-red-700 text-white border-red-600';
      case 'SUSPEND':
        return 'bg-orange-500 hover:bg-orange-600 text-white border-orange-500';
      case 'WAITING':
        return 'bg-gray-500 hover:bg-gray-600 text-white border-gray-500';
      case 'DONE':
        return 'bg-purple-600 hover:bg-purple-700 text-white border-purple-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600 text-white border-gray-500';
    }
  };

  // Helper function to get category badge style
  const getCategoryBadgeStyle = (category: string): string => {
    const categoryUpper = category?.toUpperCase() || '';

    switch (categoryUpper) {
      case 'GOLD':
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-white border-yellow-500 font-semibold shadow-sm';
      case 'SILVER':
        return 'bg-gradient-to-r from-gray-300 to-gray-500 hover:from-gray-400 hover:to-gray-600 text-white border-gray-400 font-semibold shadow-sm';
      case 'BRONZE':
        return 'bg-gradient-to-r from-orange-400 to-orange-700 hover:from-orange-500 hover:to-orange-800 text-white border-orange-600 font-semibold shadow-sm';
      default:
        return 'bg-gray-500 hover:bg-gray-600 text-white border-gray-500';
    }
  };

  // Helper function to get status kunjungan badge style
  const getStatusKunjunganBadgeStyle = (statusKunjungan: string | undefined): string => {
    if (!statusKunjungan) return 'bg-gray-400 hover:bg-gray-500 text-white border-gray-400';

    const statusUpper = statusKunjungan?.toUpperCase() || '';

    switch (statusUpper) {
      case 'VISITED':
        return 'bg-green-600 hover:bg-green-700 text-white border-green-600 font-semibold';
      case 'NOT YET':
        return 'bg-gray-500 hover:bg-gray-600 text-white border-gray-500';
      default:
        return 'bg-gray-500 hover:bg-gray-600 text-white border-gray-500';
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedTarget) return;
    try {
      await deleteTarget({ id: selectedTarget._id });
      toast.success('CRM Target deleted successfully!');
      setIsDeleteDialogOpen(false);
      setSelectedTarget(null);
    } catch (error) {
      toast.error('Error deleting CRM Target');
      console.error(error);
    }
  };

  // Handle bulk delete (called from DataTable)
  const handleBulkDelete = async (ids: string[]) => {
    let successCount = 0;
    let errorCount = 0;
    for (const id of ids) {
      try {
        await deleteTarget({ id: id as Id<"crmTargets"> });
        successCount++;
      } catch (error) {
        console.error(`Failed to delete ${id}:`, error);
        errorCount++;
      }
    }
    if (successCount > 0 && errorCount === 0) {
      toast.success(`${successCount} data berhasil dihapus!`);
    } else if (successCount > 0 && errorCount > 0) {
      toast.success(`${successCount} dihapus, ${errorCount} gagal`);
    } else {
      toast.error(`Gagal menghapus data`);
    }
  };

  // Excel Form Handlers
  const handleExcelFieldChange = (index: number, field: keyof CrmFormData, value: string) => {
    setExcelFormData(prevFormData => {
      const newFormData = [...prevFormData];
      const currentRow = { ...newFormData[index], [field]: value };

      // Calculate trimmingValue and lossValue when harga fields change
      if (field === 'hargaKontrak' || field === 'hargaTerupdate') {
        const hargaKontrak = parseFloat(currentRow.hargaKontrak?.replace(/\./g, '').replace(/,/g, '.') || '0') || 0;
        const hargaTerupdate = parseFloat(currentRow.hargaTerupdate?.replace(/\./g, '').replace(/,/g, '.') || '0') || 0;

        const trimmingValue = hargaTerupdate > hargaKontrak ? hargaTerupdate - hargaKontrak : 0;
        const lossValue = hargaKontrak > hargaTerupdate ? hargaKontrak - hargaTerupdate : 0;

        currentRow.trimmingValue = trimmingValue > 0 ? trimmingValue.toString() : '';
        currentRow.lossValue = lossValue > 0 ? lossValue.toString() : '';
      }

      newFormData[index] = currentRow;
      return newFormData;
    });
  };

  const addNewExcelFormRow = () => {
    setExcelFormData([...excelFormData, {
      tahun: currentYear,
      bulanExpDate: '',
      produk: '',
      picCrm: '',
      sales: '',
      namaAssociate: '',
      directOrAssociate: '',
      grup: '',
      namaPerusahaan: '',
      status: '',
      alasan: '',
      category: '',
      kuadran: '',
      luarKota: '',
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
      nomorSertifikat: '',
      tanggalKunjungan: '',
      statusKunjungan: '',
    }]);
  };

  const removeExcelFormRow = (index: number) => {
    if (excelFormData.length > 1) {
      const newFormData = excelFormData.filter((_, i) => i !== index);
      setExcelFormData(newFormData);
    }
  };

  const validateExcelFormData = (data: CrmFormData[]): boolean => {
    return data.every(row =>
      row.namaPerusahaan.trim() !== '' &&
      row.provinsi.trim() !== '' &&
      row.kota.trim() !== '' &&
      row.alamat.trim() !== ''
    );
  };

  const submitExcelFormData = async () => {
    if (!validateExcelFormData(excelFormData)) {
      toast.error('Mohon lengkapi data Nama Perusahaan, Provinsi, Kota, dan Alamat untuk semua baris.');
      return;
    }

    setIsSubmittingExcel(true);
    try {
      const currentUser = getCurrentUser();

      const validFormData = excelFormData.filter(row =>
        row.namaPerusahaan.trim() !== '' &&
        row.provinsi.trim() !== '' &&
        row.kota.trim() !== '' &&
        row.alamat.trim() !== ''
      );

      if (validFormData.length === 0) {
        toast.error('Tidak ada data valid untuk disimpan.');
        return;
      }

      // Create all targets
      let successCount = 0;
      for (const row of validFormData) {
        try {
          await createTarget({
            tahun: row.tahun || undefined as any,
            bulanExpDate: row.bulanExpDate,
            produk: row.produk,
            picCrm: row.picCrm,
            sales: row.sales,
            namaAssociate: row.namaAssociate,
            directOrAssociate: row.directOrAssociate || undefined,
            grup: row.grup || undefined,
            namaPerusahaan: row.namaPerusahaan,
            status: row.status || 'WAITING',
            alasan: row.alasan || undefined,
            category: row.category || undefined,
            kuadran: row.kuadran || undefined,
            luarKota: row.luarKota || undefined,
            provinsi: row.provinsi,
            kota: row.kota,
            alamat: row.alamat,
            akreditasi: row.akreditasi || undefined,
            catAkre: row.catAkre || undefined,
            eaCode: row.eaCode || undefined,
            std: row.std || undefined,
            iaDate: row.iaDate || undefined,
            expDate: row.expDate || undefined,
            tahapAudit: row.tahapAudit || undefined,
            hargaKontrak: row.hargaKontrak ? parseFloat(row.hargaKontrak) : undefined,
            bulanTtdNotif: row.bulanTtdNotif || undefined,
            hargaTerupdate: row.hargaTerupdate ? parseFloat(row.hargaTerupdate) : undefined,
            trimmingValue: row.trimmingValue ? parseFloat(row.trimmingValue) : undefined,
            lossValue: row.lossValue ? parseFloat(row.lossValue) : undefined,
            cashback: row.cashback ? parseFloat(row.cashback) : undefined,
            terminPembayaran: row.terminPembayaran || undefined,
            statusSertifikat: row.statusSertifikat || undefined,
            nomorSertifikat: row.nomorSertifikat || undefined,
            tanggalKunjungan: row.tanggalKunjungan || undefined,
            statusKunjungan: row.statusKunjungan || undefined,
            // @ts-ignore - Fields exist in schema but types not updated yet
            bulanAuditSebelumnyaSustain: row.bulanAuditSebelumnyaSustain || undefined,
            bulanAudit: row.bulanAudit || undefined,
            statusInvoice: (row.statusInvoice === "Terbit" || row.statusInvoice === "Belum Terbit") ? row.statusInvoice : null,
            statusPembayaran: (row.statusPembayaran === "Lunas" || row.statusPembayaran === "Belum Lunas" || row.statusPembayaran === "Sudah DP") ? row.statusPembayaran : null,
            statusKomisi: (row.statusKomisi === "Sudah Diajukan" || row.statusKomisi === "Belum Diajukan" || row.statusKomisi === "Tidak Ada") ? row.statusKomisi : null,
            created_by: currentUser?._id as any, // Type assertion for Convex Id
          });
          successCount++;
        } catch (error) {
          console.error('Error creating row:', error);
        }
      }

      toast.success(`✅ Berhasil menambahkan ${successCount} data CRM!`);
      setShowExcelFormModal(false);

      // Reset form
      setExcelFormData([{
        tahun: currentYear,
        bulanExpDate: '',
        produk: '',
        picCrm: '',
        sales: '',
        namaAssociate: '',
        directOrAssociate: '',
        grup: '',
        namaPerusahaan: '',
        status: '',
        alasan: '',
        category: '',
        kuadran: '',
        luarKota: '',
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
        nomorSertifikat: '',
        tanggalKunjungan: '',
        statusKunjungan: '',
      }]);
    } catch (error) {
      toast.error('Error menyimpan data CRM');
      console.error(error);
    } finally {
      setIsSubmittingExcel(false);
    }
  };

  // Handle Excel import
  const handleExcelImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    

    const file = event.target.files?.[0];
    if (!file) {
      console.error('❌ No file selected');
      toast.error('Please select a file');
      return;
    }

    

    // Get current logged in user
    const currentUser = getCurrentUser();
    

    if (!currentUser || !currentUser._id) {
      console.error('❌ No user logged in');
      toast.error('You must be logged in to import data');
      setIsImporting(false);
      return;
    }

    // Start importing
    setIsImporting(true);
    toast.loading(`⏳ Processing ${file.name}...`, { id: 'import-toast', duration: Infinity });

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);

        const workbook = XLSX.read(data, { type: 'array' });

        // Get first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        
        

        if (jsonData.length < 2) {
          console.error('❌ Excel file is empty or invalid');
          toast.error('❌ Excel file is empty or invalid. Please check your file.', { id: 'import-toast' });
          setIsImporting(false);
          return;
        }

        // Get headers from first row, normalizing export-format labels to camelCase field names
        const HEADER_MAP: Record<string, string> = {
          'Nama Perusahaan': 'namaPerusahaan', 'Tahun': 'tahun', 'Bulan Exp': 'bulanExpDate',
          'Produk': 'produk', 'PIC CRM': 'picCrm', 'Sales': 'sales',
          'Associate': 'namaAssociate', 'Direct/Assoc': 'directOrAssociate', 'Grup': 'grup',
          'Status': 'status', 'Alasan': 'alasan', 'Catatan': 'catatanKunjungan',
          'Category': 'category', 'Kuadran': 'kuadran', 'Luar Kota': 'luarKota',
          'Provinsi': 'provinsi', 'Kota': 'kota', 'Alamat': 'alamat',
          'Akreditasi': 'akreditasi', 'Cat Akre': 'catAkre', 'EA Code': 'eaCode',
          'STD': 'std', 'IA Date': 'iaDate', 'Bulan Audit Sblm': 'bulanAuditSebelumnyaSustain',
          'Exp Date': 'expDate', 'Tahap Audit': 'tahapAudit', 'Harga Kontrak': 'hargaKontrak',
          'Bulan TTD': 'bulanTtdNotif', 'Bulan Audit': 'bulanAudit', 'Harga Terupdate': 'hargaTerupdate',
          'Trimming': 'trimmingValue', 'Loss': 'lossValue', 'Cashback': 'cashback',
          'Termin': 'terminPembayaran', 'Status Invoice': 'statusInvoice',
          'Status Pembayaran': 'statusPembayaran', 'Status Komisi': 'statusKomisi',
          'Status Sertifikat': 'statusSertifikat', 'No Sertifikat': 'nomorSertifikat', 'Tgl Kunjungan': 'tanggalKunjungan',
          'Status Kunjungan': 'statusKunjungan', 'Foto Bukti': 'fotoBuktiKunjungan',
        };
        const headers = jsonData[0].map((h: any) => {
          const raw = String(h).trim();
          return HEADER_MAP[raw] ?? raw;
        });
        
        const targets: any[] = [];

        // Process data rows
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          const obj: any = {};

          headers.forEach((header, index) => {
            obj[header] = row[index] !== undefined ? String(row[index]).trim() : '';
          });

          // Skip if no company name
          const companyName = obj['namaPerusahaan'] || obj['NAMA PERUSAHAAN'] || '';
          if (!companyName || companyName.trim() === '') continue;

          // Map Excel columns to database fields
          const target: any = {
            tahun: obj['tahun'] || obj['TAHUN'] || '',
            bulanExpDate: obj['bulanExpDate'] || obj['BULAN EXP DATE'] || '',
            produk: obj['produk'] || obj['PRODUK'] || '',
            picCrm: obj['picCrm'] || obj['PIC CRM'] || '',
            sales: obj['sales'] || obj['SALES'] || '',
            namaAssociate: obj['namaAssociate'] || obj['NAMA ASSOSIATE'] || '',
            directOrAssociate: obj['directOrAssociate'] || obj['DIRECT OR ASSOCIATE'] || undefined,
            grup: obj['grup'] || obj['GRUP'] || undefined,
            namaPerusahaan: obj['namaPerusahaan'] || obj['NAMA PERUSAHAAN'] || '',
            status: obj['status'] || obj['STATUS'] || '',
            alasan: obj['alasan'] || obj['ALASAN'] || undefined,
            category: obj['category'] || obj['CATEGORY'] || undefined,
            kuadran: obj['kuadran'] || obj['KUADRAN'] || undefined,
            luarKota: obj['luarKota'] || obj['LUAR KOTA'] || undefined,
            provinsi: obj['provinsi'] || obj['PROVINSI'] || '',
            kota: obj['kota'] || obj['KOTA'] || '',
            alamat: obj['alamat'] || obj['ALAMAT'] || '',
            akreditasi: obj['akreditasi'] || obj['AKREDITASI'] || undefined,
            catAkre: obj['catAkre'] || obj['CAT AKRE'] || undefined,
            eaCode: obj['eaCode'] || obj['EA CODE'] || undefined,
            std: obj['std'] || obj['STD'] || undefined,
            iaDate: parseDate(obj['iaDate'] || obj['IA DATE']),
            expDate: parseDate(obj['expDate'] || obj['EXP DATE']),
            tahapAudit: obj['tahapAudit'] || obj['TAHAP AUDIT'] || undefined,
            hargaKontrak: parseCurrency(obj['hargaKontrak'] || obj['HARGA KONTRAK']),
            bulanTtdNotif: parseDate(obj['bulanTtdNotif'] || obj['BULAN TTD NOTIF']),
            hargaTerupdate: parseCurrency(obj['hargaTerupdate'] || obj['HARGA TERUPDATE']),
            trimmingValue: parseCurrency(obj['trimmingValue'] || obj['TRIMMING VALUE']),
            lossValue: parseCurrency(obj['lossValue'] || obj['LOSS VALUE']),
            cashback: parseCurrency(obj['cashback'] || obj['CASHBACK']),
            terminPembayaran: obj['terminPembayaran'] || obj['TERMIN PEMBAYARAN'] || undefined,
            statusSertifikat: obj['statusSertifikat'] || obj['STATUS SERTIFIKAT'] || undefined,
            nomorSertifikat: obj['nomorSertifikat'] || obj['NO SERTIFIKAT'] || obj['NOMOR SERTIFIKAT'] || undefined,
            tanggalKunjungan: parseDate(obj['tanggalKunjungan'] || obj['TANGGAL KUNJUNGAN']),
            statusKunjungan: obj['statusKunjungan'] || obj['STATUS KUNJUNGAN'] || undefined,
            catatanKunjungan: obj['catatanKunjungan'] || obj['CATATAN KUNJUNGAN'] || undefined,
            fotoBuktiKunjungan: obj['fotoBuktiKunjungan'] || obj['FOTO BUKTI KUNJUNGAN'] || undefined,
            bulanAuditSebelumnyaSustain: parseDate(obj['bulanAuditSebelumnyaSustain'] || obj['BULAN AUDIT SEBELUMNYA SUSTAIN']),
            bulanAudit: parseDate(obj['bulanAudit'] || obj['BULAN AUDIT']),
            statusInvoice: normalizeStatusInvoice(obj['statusInvoice'] || obj['STATUS INVOICE'] || ''),
            statusPembayaran: normalizeStatusPembayaran(obj['statusPembayaran'] || obj['STATUS PEMBAYARAN'] || ''),
            statusKomisi: obj['statusKomisi'] || obj['STATUS KOMISI'] || undefined,
            created_by: currentUser?._id, // Add current user ID
          };

          targets.push(target);
        }

        

        if (targets.length === 0) {
          console.error('❌ No valid data found');
          toast.error('❌ No valid data found in Excel. Please check the format.', { id: 'import-toast' });
          setIsImporting(false);
          return;
        }

        // Update progress - uploading to database
        toast.loading(`💾 Uploading ${targets.length} records to database...`, { id: 'import-toast', duration: Infinity });
        

        // Bulk insert
        const result = await createBulkInsert({ targets });
        

        // Success!
        toast.success(
          `✅ Successfully imported ${result.insertedCount} CRM targets!\n\n` +
          `📊 File: ${file.name}\n` +
          `📈 Records: ${result.insertedCount} rows\n` +
          `⏱️ Completed in: ${new Date().toLocaleTimeString()}`,
          {
            id: 'import-toast',
            duration: 5000,
            description: new Date().toLocaleString()
          }
        );

        // Reset file input
        event.target.value = '';
        setIsImporting(false);
        
      } catch (error: any) {
        console.error('❌ Error importing Excel:', error);
        console.error('❌ Error stack:', error.stack);

        // Extract error message
        let errorMessage = 'Unknown error occurred';
        if (error.message) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        }

        toast.error(
          `❌ Import Failed!\n\n` +
          `📄 File: ${file.name}\n` +
          `💬 Error: ${errorMessage}\n\n` +
          `Please check:\n` +
          `• File format is .xlsx or .xls\n` +
          `• First row contains headers\n` +
          `• Required field: "NAMA PERUSAHAAN"`,
          {
            id: 'import-toast',
            duration: 8000
          }
        );
        setIsImporting(false);
      }
    };

    reader.onerror = (error) => {
      console.error('❌ FileReader error:', error);
      toast.error('❌ Failed to read file. Please try again.', { id: 'import-toast' });
      setIsImporting(false);
    };

    
    reader.readAsArrayBuffer(file);
    
  };

  // Helper functions
  // Normalize statusInvoice value
  const normalizeStatusInvoice = (value: string): string | undefined => {
    if (!value || value.trim() === '') return undefined;

    const normalized = value.trim().toLowerCase();

    // Map various forms to standard values
    if (normalized === 'terbit' || normalized === 'telah terbit' || normalized === 'sudah terbit') {
      return 'Terbit';
    }
    if (normalized === 'belum terbit' || normalized === 'tidak terbit' || normalized === 'belum terbit.' || normalized === 'tidak') {
      return 'Belum Terbit';
    }

    // Return original if no match (will be validated by Convex)
    return value;
  };

  // Normalize statusPembayaran value
  const normalizeStatusPembayaran = (value: string): string | undefined => {
    if (!value || value.trim() === '') return undefined;

    const normalized = value.trim().toLowerCase();

    // Map various forms to standard values
    if (normalized === 'lunas' || normalized === 'lunas.' || normalized === 'sudah lunas') {
      return 'Lunas';
    }
    if (normalized === 'belum lunas' || normalized === 'belum lunas.' || normalized === 'belum bayar' || normalized === 'unpaid') {
      return 'Belum Lunas';
    }
    if (normalized === 'sudah dp' || normalized === 'dp' || normalized === 'down payment' || normalized === 'sudah dp.') {
      return 'Sudah DP';
    }

    // Return original if no match (will be validated by Convex)
    return value;
  };

  const parseDate = (value: string): string | undefined => {
    if (!value || value.trim() === '' || value.trim() === '-') return undefined;

    const cleaned = value.trim();

    // Return as is if already in YYYY-MM-DD format
    if (cleaned.match(/^\d{4}-\d{2}-\d{2}$/)) return cleaned;

    // Handle Excel serial date format (numbers)
    const excelDate = parseFloat(cleaned);
    if (!isNaN(excelDate) && excelDate > 0) {
      // Excel epoch starts at 1900-01-01, but Excel incorrectly treats 1900 as a leap year
      // So we subtract 2 days to get the correct date
      // USE UTC to avoid timezone issues
      const excelEpoch = Date.UTC(1900, 0, 1);
      const date = new Date(excelEpoch + (excelDate - 2) * 24 * 60 * 60 * 1000);
      const year = date.getUTCFullYear();  // ✅ Use UTC methods
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    // Handle DD/MM/YYYY or DD-MM-YYYY format
    const dmyMatch = cleaned.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmyMatch) {
      const [, day, month, year] = dmyMatch;
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    // Handle MM/DD/YYYY or MM-DD-YYYY format
    const mdyMatch = cleaned.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (mdyMatch) {
      const [, month, day, year] = mdyMatch;
      // Try to determine if it's MM/DD or DD/MM based on context
      // If first number > 12, it must be day
      if (parseInt(month) > 12) {
        return `${year}-${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}`;
      }
      // Default to MM/DD/YYYY format
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    // Handle YYYY-MM or YYYY/MM format (month only)
    const ymMatch = cleaned.match(/^(\d{4})[\/\-](\d{1,2})$/);
    if (ymMatch) {
      const [, year, month] = ymMatch;
      return `${year}-${String(month).padStart(2, '0')}-01`; // Default to day 1
    }

    // Handle month names (Jan-2024, January 2024, etc.) - 4 digit year
    const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const monthNameMatch = cleaned.match(/^([a-zA-Z]+)[\/\-\s]*(\d{4})$/i);
    if (monthNameMatch) {
      const [, monthName, year] = monthNameMatch;
      const monthIndex = monthNames.findIndex(m => monthName.toLowerCase().startsWith(m));
      if (monthIndex !== -1) {
        return `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`;
      }
    }

    // Handle month names with 2-digit year (Jan-26, Feb-26, etc.)
    const monthNameMatch2Digit = cleaned.match(/^([a-zA-Z]+)[\/\-\s]*(\d{2})$/i);
    if (monthNameMatch2Digit) {
      const [, monthName, shortYear] = monthNameMatch2Digit;
      const monthIndex = monthNames.findIndex(m => monthName.toLowerCase().startsWith(m));
      if (monthIndex !== -1) {
        // Convert 2-digit year to 4-digit year
        // Assuming 00-29 = 2000-2029, 30-99 = 1930-1999
        const yearNum = parseInt(shortYear);
        const fullYear = yearNum <= 29 ? 2000 + yearNum : 1900 + yearNum;
        return `${fullYear}-${String(monthIndex + 1).padStart(2, '0')}-01`;
      }
    }

    // If no format matches, return as is
    return cleaned;
  };

  const parseCurrency = (value: string): number | undefined => {
    if (!value || value.trim() === '' || value.trim() === '-') return undefined;
    const cleaned = value.replace(/[\s"']/g, '').replace(/,/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? undefined : parsed;
  };

  // Format date to DD MMM (tanggal dan nama bulan dalam bahasa Indonesia)
  const formatDateToDayMonth = (dateString: string | undefined): string => {
    if (!dateString || dateString.trim() === '' || dateString.trim() === '-') return '-';

    // Nama bulan dalam bahasa Indonesia
    const monthNamesIndo = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    const cleaned = dateString.trim();

    // Handle Excel serial date (angka)
    const excelDate = parseFloat(cleaned);
    if (!isNaN(excelDate) && excelDate > 10000) { // Excel dates are > 10000
      const excelEpoch = new Date(1900, 0, 1);
      const date = new Date(excelEpoch.getTime() + (excelDate - 2) * 24 * 60 * 60 * 1000);
      const day = date.getDate();
      const monthIndex = date.getMonth();
      return `${day} ${monthNamesIndo[monthIndex]}`;
    }

    // Handle YYYY-MM-DD format
    const ymdMatch = cleaned.match(/^(\d{4})\-?(\d{2})\-?(\d{2})$/);
    if (ymdMatch) {
      const [, year, month, day] = ymdMatch;
      const monthIndex = parseInt(month) - 1;
      return `${parseInt(day)} ${monthNamesIndo[monthIndex]}`;
    }

    // Handle DD/MM/YYYY or DD-MM-YYYY format
    const dmyMatch = cleaned.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmyMatch) {
      const [, day, month] = dmyMatch;
      const monthIndex = parseInt(month) - 1;
      return `${parseInt(day)} ${monthNamesIndo[monthIndex]}`;
    }

    // Handle MM/DD/YYYY or MM-DD-YYYY format
    const mdyMatch = cleaned.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (mdyMatch) {
      const [, month, day] = mdyMatch;
      const monthIndex = parseInt(month) - 1;
      return `${parseInt(day)} ${monthNamesIndo[monthIndex]}`;
    }

    // Handle YYYY-MM or YYYY/MM format
    const ymMatch = cleaned.match(/^(\d{4})[\/\-](\d{1,2})$/);
    if (ymMatch) {
      const [, year, month] = ymMatch;
      const monthIndex = parseInt(month) - 1;
      return `01 ${monthNamesIndo[monthIndex]}`;
    }

    // Return as is if no format matches
    return cleaned;
  };

  // Format date to DD MMM YYYY (12 Jan 2026)
  const formatTanggalKunjungan = (dateString: string | undefined): string => {
    if (!dateString || dateString.trim() === '' || dateString.trim() === '-') return '-';

    const monthNamesIndo = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const cleaned = dateString.trim();

    // Handle YYYY-MM-DD format (most common from database)
    const ymdMatch = cleaned.match(/^(\d{4})\-?(\d{2})\-?(\d{2})$/);
    if (ymdMatch) {
      const [, year, month, day] = ymdMatch;
      const monthIndex = parseInt(month) - 1;
      return `${parseInt(day)} ${monthNamesIndo[monthIndex]} ${year}`;
    }

    // Handle DD/MM/YYYY or DD-MM-YYYY format
    const dmyMatch = cleaned.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmyMatch) {
      const [, day, month, year] = dmyMatch;
      const monthIndex = parseInt(month) - 1;
      return `${parseInt(day)} ${monthNamesIndo[monthIndex]} ${year}`;
    }

    // Handle MM/DD/YYYY or MM-DD-YYYY format
    const mdyMatch = cleaned.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (mdyMatch) {
      const [, month, day, year] = mdyMatch;
      const monthIndex = parseInt(month) - 1;
      return `${parseInt(day)} ${monthNamesIndo[monthIndex]} ${year}`;
    }

    // Handle Excel serial date
    const excelDate = parseFloat(cleaned);
    if (!isNaN(excelDate) && excelDate > 10000) {
      const excelEpoch = new Date(1900, 0, 1);
      const date = new Date(excelEpoch.getTime() + (excelDate - 2) * 24 * 60 * 60 * 1000);
      const day = date.getDate();
      const monthIndex = date.getMonth();
      const year = date.getFullYear();
      return `${day} ${monthNamesIndo[monthIndex]} ${year}`;
    }

    // Return as is if no format matches
    return cleaned;
  };

  // Bulk insert mutation
  const createBulkInsert = useMutation(api.crmTargets.bulkInsertCrmTargets);

  // Excel export is now handled by CrmDataTable component

  // Show loading indicator while data is being fetched
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <InfinityLoader size="lg" />
        <p className="mt-6 text-sm font-medium bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Loading CRM Data...
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Please wait while we fetch your data
        </p>
      </div>
    );
  }

  return (
    <div className="py-4 lg:py-8 lg:px-6 pb-20 lg:pb-8">

      {/* MAIN CONTENT */}
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            {/* Icon block */}
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-700 shadow-md">
              <Database className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                  CRM Data Management
                </h1>
                {currentUser?.role === 'staff' && !canEdit && (
                  <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-300 text-[10px]">
                    👁️ View Only
                  </Badge>
                )}
                {currentUser?.role === 'staff' && (
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-300 text-[10px]">
                    PIC: {currentUser.name}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {currentUser?.role === 'staff'
                  ? `Menampilkan ${filteredTargets.length} dari ${filteredCrmTargets.length} data milik ${currentUser.name}`
                  : `${filteredTargets.length} dari ${filteredCrmTargets.length} data ditampilkan`
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={filterTahun} onValueChange={setFilterTahun}>
              <SelectTrigger className="h-9 w-36 text-xs font-semibold border-2 border-indigo-500 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:ring-indigo-500">
                <Calendar className="h-3.5 w-3.5 mr-1 text-indigo-500" />
                <SelectValue placeholder="Tahun" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">Semua Tahun</SelectItem>
                {Array.from({ length: 2030 - 2023 + 1 }, (_, i) => (2023 + i).toString()).map((year) => (
                  <SelectItem key={year} value={year} className="text-xs">{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {canEdit && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  disabled={isImporting}
                  className="h-9 gap-1.5 text-xs border-blue-600 text-blue-600 hover:bg-blue-50 hover:border-blue-700 hover:text-blue-700"
                >
                  <label htmlFor="excel-upload" className={`cursor-pointer ${isImporting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <Upload className="h-4 w-4" />
                    {isImporting ? 'Importing...' : 'Import'}
                    <input
                      id="excel-upload"
                      type="file"
                      accept=".xlsx,.xls"
                      className="hidden"
                      onChange={handleExcelImport}
                      disabled={isImporting}
                    />
                  </label>
                </Button>
                <Button onClick={() => setShowExcelFormModal(true)} size="sm" disabled={isImporting} className="h-9 gap-1.5 text-xs bg-purple-700 hover:bg-purple-800 cursor-pointer">
                  <Plus className="h-4 w-4" />
                  Tambah Data
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Statistics Cards - collapsible accordion */}
        <div className="rounded-lg border bg-card overflow-hidden">
          <button
            onClick={() => setStatsOpen(o => !o)}
            className="cursor-pointer w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/50 transition-colors"
          >
            <span className="flex items-center gap-2">
              <span>📊</span>
              <span>Statistik & Filter Cepat ( Click here )</span>
            </span>
            <svg className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${statsOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
          {statsOpen && (
          <div className="border-t px-4 py-3">
        <div className="lg:grid lg:grid-cols-2 lg:gap-2 pb-2">
          {/* Desktop Statistics - Full Layout */}
          <div className="lg:contents">
            {/* Main Metrics */}
            <div className="flex items-center">
              <span className="text-xs font-semibold text-gray-600 uppercase whitespace-nowrap w-44 hidden lg:block">📊 Main Metrics:</span>
              <div className="flex-1 grid grid-cols-4 gap-1.5">
                <div className="bg-blue-50 rounded px-2 py-1 border border-blue-200 text-center">
                  <p className="text-xs text-blue-700 font-semibold">Records <span className="font-bold">({filteredCrmTargets?.length || 0})</span></p>
                </div>
                <div className="bg-purple-50 rounded px-2 py-1 border border-purple-200 text-center">
                  <p className="text-xs text-purple-700 font-semibold">Companies <span className="font-bold">({new Set((filteredCrmTargets || []).map(t => t.namaPerusahaan)).size})</span></p>
                </div>
                <div className="bg-green-50 rounded px-2 py-1 border border-green-200 text-center">
                  <p className="text-xs text-green-700 font-semibold">Visited <span className="font-bold">({new Set((filteredCrmTargets || []).filter(t => t.statusKunjungan === 'VISITED').map(t => t.namaPerusahaan)).size})</span></p>
                </div>
                <div className="bg-orange-50 rounded px-2 py-1 border border-orange-200 text-center">
                  <p className="text-xs text-orange-700 font-semibold">Not Yet <span className="font-bold">({new Set((filteredCrmTargets || []).filter(t => t.statusKunjungan === 'NOT YET').map(t => t.namaPerusahaan)).size})</span></p>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center">
              <span className="text-xs font-semibold text-gray-600 uppercase whitespace-nowrap w-44 hidden lg:block">📋 Status:</span>
              <div className="flex-1 grid grid-cols-5 gap-1.5">
                <div
                  className={`bg-purple-50 rounded px-2 py-1 border border-purple-200 text-center cursor-pointer hover:ring-2 hover:ring-purple-400 transition-all ${
                    isQuickFilterActive('status', 'DONE') ? 'ring-2 ring-purple-600' : ''
                  }`}
                  onClick={() => handleQuickFilter('status', 'DONE')}
                  title="Click to toggle filter"
                >
                  <p className="text-xs text-purple-700 font-semibold">DONE <span className="font-bold">({(filteredCrmTargets || []).filter(t => t.status && t.status.toUpperCase() === 'DONE').length})</span></p>
                </div>
                <div
                  className={`bg-blue-50 rounded px-2 py-1 border border-blue-200 text-center cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all ${
                    isQuickFilterActive('status', 'PROSES') ? 'ring-2 ring-blue-600' : ''
                  }`}
                  onClick={() => handleQuickFilter('status', 'PROSES')}
                  title="Click to toggle filter"
                >
                  <p className="text-xs text-blue-700 font-semibold">PROSES <span className="font-bold">({(filteredCrmTargets || []).filter(t => t.status && t.status.toUpperCase() === 'PROSES').length})</span></p>
                </div>
                <div
                  className={`bg-orange-50 rounded px-2 py-1 border border-orange-200 text-center cursor-pointer hover:ring-2 hover:ring-orange-400 transition-all ${
                    isQuickFilterActive('status', 'SUSPEND') ? 'ring-2 ring-orange-600' : ''
                  }`}
                  onClick={() => handleQuickFilter('status', 'SUSPEND')}
                  title="Click to toggle filter"
                >
                  <p className="text-xs text-orange-700 font-semibold">SUSPEND <span className="font-bold">({(filteredCrmTargets || []).filter(t => t.status && t.status.toUpperCase() === 'SUSPEND').length})</span></p>
                </div>
                <div
                  className={`bg-red-50 rounded px-2 py-1 border border-red-200 text-center cursor-pointer hover:ring-2 hover:ring-red-400 transition-all ${
                    isQuickFilterActive('status', 'LOSS') ? 'ring-2 ring-red-600' : ''
                  }`}
                  onClick={() => handleQuickFilter('status', 'LOSS')}
                  title="Click to toggle filter"
                >
                  <p className="text-xs text-red-700 font-semibold">LOSS <span className="font-bold">({(filteredCrmTargets || []).filter(t => t.status && t.status.toUpperCase() === 'LOSS').length})</span></p>
                </div>
                <div
                  className={`bg-gray-50 rounded px-2 py-1 border border-gray-200 text-center cursor-pointer hover:ring-2 hover:ring-gray-400 transition-all ${
                    isQuickFilterActive('status', 'WAITING') ? 'ring-2 ring-gray-600' : ''
                  }`}
                  onClick={() => handleQuickFilter('status', 'WAITING')}
                  title="Click to toggle filter"
                >
                  <p className="text-xs text-gray-700 font-semibold">WAITING <span className="font-bold">({(filteredCrmTargets || []).filter(t => t.status && t.status.toUpperCase() === 'WAITING').length})</span></p>
                </div>
              </div>
            </div>

            {/* Kuadran */}
            <div className="flex items-center">
              <span className="text-xs font-semibold text-gray-600 uppercase whitespace-nowrap w-44 hidden lg:block">🎯 Kuadran:</span>
              <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                <div
                  className={`bg-violet-50 rounded px-2 py-1 border border-violet-200 text-center cursor-pointer hover:ring-2 hover:ring-violet-400 transition-all ${
                    isQuickFilterActive('kuadran', 'K1') ? 'ring-2 ring-violet-600' : ''
                  }`}
                  onClick={() => handleQuickFilter('kuadran', 'K1')}
                  title="Click to toggle filter"
                >
                  <p className="text-xs text-violet-700 font-semibold">K1 <span className="font-bold">({(filteredCrmTargets || []).filter(t => t.kuadran && t.kuadran.toUpperCase() === 'K1').length})</span></p>
                </div>
                <div
                  className={`bg-fuchsia-50 rounded px-2 py-1 border border-fuchsia-200 text-center cursor-pointer hover:ring-2 hover:ring-fuchsia-400 transition-all ${
                    isQuickFilterActive('kuadran', 'K2') ? 'ring-2 ring-fuchsia-600' : ''
                  }`}
                  onClick={() => handleQuickFilter('kuadran', 'K2')}
                  title="Click to toggle filter"
                >
                  <p className="text-xs text-fuchsia-700 font-semibold">K2 <span className="font-bold">({(filteredCrmTargets || []).filter(t => t.kuadran && t.kuadran.toUpperCase() === 'K2').length})</span></p>
                </div>
                <div
                  className={`bg-violet-50 rounded px-2 py-1 border border-violet-200 text-center cursor-pointer hover:ring-2 hover:ring-violet-400 transition-all hidden sm:block ${
                    isQuickFilterActive('kuadran', 'K3') ? 'ring-2 ring-violet-600' : ''
                  }`}
                  onClick={() => handleQuickFilter('kuadran', 'K3')}
                  title="Click to toggle filter"
                >
                  <p className="text-xs text-violet-700 font-semibold">K3 <span className="font-bold">({(filteredCrmTargets || []).filter(t => t.kuadran && t.kuadran.toUpperCase() === 'K3').length})</span></p>
                </div>
                <div
                  className={`bg-fuchsia-50 rounded px-2 py-1 border border-fuchsia-200 text-center cursor-pointer hover:ring-2 hover:ring-fuchsia-400 transition-all hidden sm:block ${
                    isQuickFilterActive('kuadran', 'K4') ? 'ring-2 ring-fuchsia-600' : ''
                  }`}
                  onClick={() => handleQuickFilter('kuadran', 'K4')}
                  title="Click to toggle filter"
                >
                  <p className="text-xs text-fuchsia-700 font-semibold">K4 <span className="font-bold">({(filteredCrmTargets || []).filter(t => t.kuadran && t.kuadran.toUpperCase() === 'K4').length})</span></p>
                </div>
              </div>
            </div>

            {/* Lokasi */}
            <div className="flex items-center">
              <span className="text-xs font-semibold text-gray-600 uppercase whitespace-nowrap w-44 hidden lg:block">📍 Lokasi:</span>
              <div className="flex-1 grid grid-cols-2 gap-1.5">
                <div
                  className={`bg-amber-50 rounded px-2 py-1 border border-amber-200 text-center cursor-pointer hover:ring-2 hover:ring-amber-400 transition-all ${
                    isQuickFilterActive('luarKota', 'LUAR') ? 'ring-2 ring-amber-600' : ''
                  }`}
                  onClick={() => handleQuickFilter('luarKota', 'LUAR')}
                  title="Click to toggle filter"
                >
                  <p className="text-xs text-amber-700 font-semibold">Luar Kota <span className="font-bold">({(filteredCrmTargets || []).filter(t => t.luarKota && t.luarKota.toUpperCase().includes('LUAR')).length})</span></p>
                </div>
                <div
                  className={`bg-yellow-50 rounded px-2 py-1 border border-yellow-200 text-center cursor-pointer hover:ring-2 hover:ring-yellow-400 transition-all ${
                    isQuickFilterActive('luarKota', 'DALAM') ? 'ring-2 ring-yellow-600' : ''
                  }`}
                  onClick={() => handleQuickFilter('luarKota', 'DALAM')}
                  title="Click to toggle filter"
                >
                  <p className="text-xs text-yellow-700 font-semibold">Dalam Kota <span className="font-bold">({(filteredCrmTargets || []).filter(t => !t.luarKota || !t.luarKota.toUpperCase().includes('LUAR')).length})</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sertifikat Section - Desktop only */}
        <div className="hidden lg:grid lg:grid-cols-2 lg:gap-2">
          <div className="lg:contents">
            {/* Kategori Akreditasi */}
            <div className="flex items-center">
              <span className="text-xs font-semibold text-gray-600 uppercase whitespace-nowrap w-44 hidden lg:block">🏅 Kategori Akreditasi:</span>
              <div className="flex-1 grid grid-cols-3 gap-1.5">
                <div
                  className={`bg-emerald-50 rounded px-2 py-1 border border-emerald-200 text-center cursor-pointer hover:ring-2 hover:ring-emerald-400 transition-all ${
                    isQuickFilterActive('catAkre', 'KAN') ? 'ring-2 ring-emerald-600' : ''
                  }`}
                  onClick={() => handleQuickFilter('catAkre', 'KAN')}
                  title="Click to toggle filter"
                >
                  <p className="text-xs text-emerald-700 font-semibold">KAN <span className="font-bold">({(filteredCrmTargets || []).filter(t => t.catAkre && t.catAkre.toUpperCase() === 'KAN').length})</span></p>
                </div>
                <div
                  className={`bg-slate-50 rounded px-2 py-1 border border-slate-200 text-center cursor-pointer hover:ring-2 hover:ring-slate-400 transition-all ${
                    isQuickFilterActive('catAkre', 'NON AKRE') ? 'ring-2 ring-slate-600' : ''
                  }`}
                  onClick={() => handleQuickFilter('catAkre', 'NON AKRE')}
                  title="Click to toggle filter"
                >
                  <p className="text-xs text-slate-700 font-semibold">NON AKRE <span className="font-bold">({(filteredCrmTargets || []).filter(t => t.catAkre && t.catAkre.toUpperCase() === 'NON AKRE').length})</span></p>
                </div>
                <div
                  className={`bg-blue-50 rounded px-2 py-1 border border-blue-200 text-center cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all ${
                    isQuickFilterActive('catAkre', 'INTERNASIONAL') ? 'ring-2 ring-blue-600' : ''
                  }`}
                  onClick={() => handleQuickFilter('catAkre', 'INTERNASIONAL')}
                  title="Click to toggle filter"
                >
                  <p className="text-xs text-blue-900 font-semibold">INTERNASIONAL <span className="font-bold">({(filteredCrmTargets || []).filter(t => t.catAkre && t.catAkre.toUpperCase() === 'INTERNASIONAL').length})</span></p>
                </div>
              </div>
            </div>

            {/* Loss Value */}
            <div className="flex items-center">
              <span className="text-xs font-semibold text-gray-600 uppercase whitespace-nowrap w-44 hidden lg:block">📉 Loss Value:</span>
              <div className="flex-1 grid grid-cols-2 gap-1.5">
                <div
                  className={`bg-red-50 rounded px-2 py-1 border border-red-200 text-center cursor-pointer hover:ring-2 hover:ring-red-400 transition-all ${
                    isQuickFilterActive('lossValue', 'ADA') ? 'ring-2 ring-red-600' : ''
                  }`}
                  onClick={() => handleQuickFilter('lossValue', 'ADA')}
                  title="Click to toggle filter"
                >
                  <p className="text-xs text-red-700 font-semibold">Ada Value <span className="font-bold">({(filteredCrmTargets || []).filter(t => t.lossValue && t.lossValue > 0).length})</span></p>
                </div>
                <div
                  className={`bg-slate-50 rounded px-2 py-1 border border-slate-200 text-center cursor-pointer hover:ring-2 hover:ring-slate-400 transition-all ${
                    isQuickFilterActive('lossValue', 'KOSONG') ? 'ring-2 ring-slate-600' : ''
                  }`}
                  onClick={() => handleQuickFilter('lossValue', 'KOSONG')}
                  title="Click to toggle filter"
                >
                  <p className="text-xs text-slate-700 font-semibold">Tidak Ada Value <span className="font-bold">({(filteredCrmTargets || []).filter(t => !t.lossValue || t.lossValue === 0).length})</span></p>
                </div>
              </div>
            </div>

            {/* Tahapan Audit */}
            <div className="flex items-center">
              <span className="text-xs font-semibold text-gray-600 uppercase whitespace-nowrap w-44 hidden lg:block">🔍 Tahapan Audit:</span>
              <div className="flex-1 grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-1.5">
                {masterTahapanData.tahapan.map((tahap: any, idx: number) => {
                  const colorClasses = [
                    'bg-indigo-50 border-indigo-200 text-indigo-700 hover:ring-indigo-400 ring-indigo-600',
                    'bg-rose-50 border-rose-200 text-rose-700 hover:ring-rose-400 ring-rose-600',
                    'bg-sky-50 border-sky-200 text-sky-700 hover:ring-sky-400 ring-sky-600',
                    'bg-blue-50 border-blue-200 text-blue-700 hover:ring-blue-400 ring-blue-600',
                    'bg-cyan-50 border-cyan-200 text-cyan-700 hover:ring-cyan-400 ring-cyan-600',
                    'bg-violet-50 border-violet-200 text-violet-700 hover:ring-violet-400 ring-violet-600',
                    'bg-purple-50 border-purple-200 text-purple-700 hover:ring-purple-400 ring-purple-600',
                  ];
                  const colorClass = colorClasses[idx % colorClasses.length];
                  const isActive = isQuickFilterActive('tahapAudit', tahap.kode);
                  const count = (filteredCrmTargets || []).filter(t => t.tahapAudit && t.tahapAudit.toUpperCase() === tahap.kode).length;

                  return (
                    <div
                      key={tahap.kode}
                      className={`rounded px-2 py-1 border text-center cursor-pointer hover:ring-2 transition-all ${colorClass} ${
                        isActive ? 'ring-2' : ''
                      }`}
                      onClick={() => handleQuickFilter('tahapAudit', tahap.kode)}
                      title="Click to toggle filter"
                    >
                      <p className="text-xs font-semibold">{tahap.kode} <span className="font-bold">({count})</span></p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Direct/Associate */}
            <div className="flex items-center">
              <span className="text-xs font-semibold text-gray-600 uppercase whitespace-nowrap w-44 hidden lg:block">👥 Direct/Associate:</span>
              <div className="flex-1 grid grid-cols-2 gap-1.5">
                <div
                  className={`bg-cyan-50 rounded px-2 py-1 border border-cyan-200 text-center cursor-pointer hover:ring-2 hover:ring-cyan-400 transition-all ${
                    isQuickFilterActive('directOrAssociate', 'DIRECT') ? 'ring-2 ring-cyan-600' : ''
                  }`}
                  onClick={() => handleQuickFilter('directOrAssociate', 'DIRECT')}
                  title="Click to toggle filter"
                >
                  <p className="text-xs text-cyan-700 font-semibold">Direct <span className="font-bold">({(filteredCrmTargets || []).filter(t => t.directOrAssociate && t.directOrAssociate.toUpperCase() === 'DIRECT').length})</span></p>
                </div>
                <div
                  className={`bg-pink-50 rounded px-2 py-1 border border-pink-200 text-center cursor-pointer hover:ring-2 hover:ring-pink-400 transition-all ${
                    isQuickFilterActive('directOrAssociate', 'ASSOCIATE') ? 'ring-2 ring-pink-600' : ''
                  }`}
                  onClick={() => handleQuickFilter('directOrAssociate', 'ASSOCIATE')}
                  title="Click to toggle filter"
                >
                  <p className="text-xs text-pink-700 font-semibold">Associate <span className="font-bold">({(filteredCrmTargets || []).filter(t => t.directOrAssociate && t.directOrAssociate.toUpperCase() === 'ASSOCIATE').length})</span></p>
                </div>
              </div>
            </div>

            {/* Status Invoice */}
            <div className="flex items-center">
              <span className="text-xs font-semibold text-gray-600 uppercase whitespace-nowrap w-44 hidden lg:block">🧾 Status Invoice:</span>
              <div className="flex-1 grid grid-cols-2 gap-1.5">
                <div
                  className={`bg-teal-50 rounded px-2 py-1 border border-teal-200 text-center cursor-pointer hover:ring-2 hover:ring-teal-400 transition-all ${
                    isQuickFilterActive('statusInvoice', 'Terbit') ? 'ring-2 ring-teal-600' : ''
                  }`}
                  onClick={() => handleQuickFilter('statusInvoice', 'Terbit')}
                  title="Click to toggle filter"
                >
                  <p className="text-xs text-teal-700 font-semibold">Terbit <span className="font-bold">({(filteredCrmTargets || []).filter(t => t.statusInvoice && t.statusInvoice.toString().trim().toUpperCase() === 'TERBIT').length})</span></p>
                </div>
                <div
                  className={`bg-orange-50 rounded px-2 py-1 border border-orange-200 text-center cursor-pointer hover:ring-2 hover:ring-orange-400 transition-all ${
                    isQuickFilterActive('statusInvoice', 'Belum') ? 'ring-2 ring-orange-600' : ''
                  }`}
                  onClick={() => handleQuickFilter('statusInvoice', 'Belum')}
                  title="Click to toggle filter"
                >
                  <p className="text-xs text-orange-700 font-semibold">Belum Terbit <span className="font-bold">({(filteredCrmTargets || []).filter(t => !t.statusInvoice || t.statusInvoice.toString().trim().toUpperCase().includes('BELUM')).length})</span></p>
                </div>
              </div>
            </div>

            {/* Status Pembayaran */}
            <div className="flex items-center">
              <span className="text-xs font-semibold text-gray-600 uppercase whitespace-nowrap w-44 hidden lg:block">💰 Status Pembayaran:</span>
              <div className="flex-1 grid grid-cols-3 gap-1.5">
                <div
                  className={`bg-emerald-50 rounded px-2 py-1 border border-emerald-200 text-center cursor-pointer hover:ring-2 hover:ring-emerald-400 transition-all ${
                    isQuickFilterActive('statusPembayaran', 'Lunas') ? 'ring-2 ring-emerald-600' : ''
                  }`}
                  onClick={() => handleQuickFilter('statusPembayaran', 'Lunas')}
                  title="Click to toggle filter"
                >
                  <p className="text-xs text-emerald-700 font-semibold">Lunas <span className="font-bold">({(filteredCrmTargets || []).filter(t => {
                    if (!t.statusPembayaran) return false;
                    const normalized = t.statusPembayaran.toString().trim().toUpperCase();
                    return normalized === 'LUNAS';
                  }).length})</span></p>
                </div>
                <div
                  className={`bg-red-50 rounded px-2 py-1 border border-red-200 text-center cursor-pointer hover:ring-2 hover:ring-red-400 transition-all ${
                    isQuickFilterActive('statusPembayaran', 'Belum Lunas') ? 'ring-2 ring-red-600' : ''
                  }`}
                  onClick={() => handleQuickFilter('statusPembayaran', 'Belum Lunas')}
                  title="Click to toggle filter"
                >
                  <p className="text-xs text-red-700 font-semibold">Belum Lunas <span className="font-bold">({(filteredCrmTargets || []).filter(t => {
                    if (!t.statusPembayaran) return false;
                    const normalized = t.statusPembayaran.toString().trim().toUpperCase();
                    return normalized === 'BELUM LUNAS';
                  }).length})</span></p>
                </div>
                <div
                  className={`bg-yellow-50 rounded px-2 py-1 border border-yellow-200 text-center cursor-pointer hover:ring-2 hover:ring-yellow-400 transition-all ${
                    isQuickFilterActive('statusPembayaran', 'Sudah DP') ? 'ring-2 ring-yellow-600' : ''
                  }`}
                  onClick={() => handleQuickFilter('statusPembayaran', 'Sudah DP')}
                  title="Click to toggle filter"
                >
                  <p className="text-xs text-yellow-700 font-semibold">Sudah DP <span className="font-bold">({(filteredCrmTargets || []).filter(t => {
                    if (!t.statusPembayaran) return false;
                    const normalized = t.statusPembayaran.toString().trim().toUpperCase();
                    return normalized === 'SUDAH DP';
                  }).length})</span></p>
                </div>
              </div>
            </div>

            {/* Status Komisi */}
            <div className="flex items-center">
              <span className="text-xs font-semibold text-gray-600 uppercase whitespace-nowrap w-44 hidden lg:block">🎯 Status Komisi:</span>
              <div className="flex-1 grid grid-cols-4 gap-1.5">
                <div
                  className={`bg-indigo-50 rounded px-2 py-1 border border-indigo-200 text-center cursor-pointer hover:ring-2 hover:ring-indigo-400 transition-all ${
                    isQuickFilterActive('statusKomisi', 'Sudah Diajukan') ? 'ring-2 ring-indigo-600' : ''
                  }`}
                  onClick={() => handleQuickFilter('statusKomisi', 'Sudah Diajukan')}
                  title="Click to toggle filter"
                >
                  <p className="text-xs text-indigo-700 font-semibold">Sudah Diajukan <span className="font-bold">({(filteredCrmTargets || []).filter(t => {
                    if (!t.statusKomisi) return false;
                    const normalized = t.statusKomisi.toString().trim().toUpperCase();
                    return normalized === 'SUDAH DIAJUKAN';
                  }).length})</span></p>
                </div>
                <div
                  className={`bg-purple-50 rounded px-2 py-1 border border-purple-200 text-center cursor-pointer hover:ring-2 hover:ring-purple-400 transition-all ${
                    isQuickFilterActive('statusKomisi', 'Belum Diajukan') ? 'ring-2 ring-purple-600' : ''
                  }`}
                  onClick={() => handleQuickFilter('statusKomisi', 'Belum Diajukan')}
                  title="Click to toggle filter"
                >
                  <p className="text-xs text-purple-700 font-semibold">Belum Diajukan <span className="font-bold">({(filteredCrmTargets || []).filter(t => {
                    if (!t.statusKomisi) return false;
                    const normalized = t.statusKomisi.toString().trim().toUpperCase();
                    return normalized === 'BELUM DIAJUKAN';
                  }).length})</span></p>
                </div>
                <div
                  className={`bg-gray-50 rounded px-2 py-1 border border-gray-200 text-center cursor-pointer hover:ring-2 hover:ring-gray-400 transition-all ${
                    isQuickFilterActive('statusKomisi', 'Tidak Ada') ? 'ring-2 ring-gray-600' : ''
                  }`}
                  onClick={() => handleQuickFilter('statusKomisi', 'Tidak Ada')}
                  title="Click to toggle filter"
                >
                  <p className="text-xs text-gray-700 font-semibold">Tidak Ada <span className="font-bold">({(filteredCrmTargets || []).filter(t => {
                    if (!t.statusKomisi) return false;
                    const normalized = t.statusKomisi.toString().trim().toUpperCase();
                    return normalized === 'TIDAK ADA';
                  }).length})</span></p>
                </div>
                <div
                  className={`bg-slate-50 rounded px-2 py-1 border border-slate-200 text-center cursor-pointer hover:ring-2 hover:ring-slate-400 transition-all ${
                    isQuickFilterActive('statusKomisi', 'KOSONG') ? 'ring-2 ring-slate-600' : ''
                  }`}
                  onClick={() => handleQuickFilter('statusKomisi', 'KOSONG')}
                  title="Click to toggle filter"
                >
                  <p className="text-xs text-slate-700 font-semibold">Kosong <span className="font-bold">({(filteredCrmTargets || []).filter(t => !t.statusKomisi || t.statusKomisi.toString().trim() === '').length})</span></p>
                </div>
              </div>
            </div>

            {/* Trimming */}
            <div className="flex items-center">
              <span className="text-xs font-semibold text-gray-600 uppercase whitespace-nowrap w-44 hidden lg:block">📈 Trimming:</span>
              <div className="flex-1 grid grid-cols-2 gap-1.5">
                <div
                  className={`bg-green-50 rounded px-2 py-1 border border-green-200 text-center cursor-pointer hover:ring-2 hover:ring-green-400 transition-all ${
                    isQuickFilterActive('trimming', 'ADA') ? 'ring-2 ring-green-600' : ''
                  }`}
                  onClick={() => handleQuickFilter('trimming', 'ADA')}
                  title="Click to toggle filter"
                >
                  <p className="text-xs text-green-700 font-semibold">Ada Value <span className="font-bold">({(filteredCrmTargets || []).filter(t => t.trimmingValue && t.trimmingValue > 0).length})</span></p>
                </div>
                <div
                  className={`bg-slate-50 rounded px-2 py-1 border border-slate-200 text-center cursor-pointer hover:ring-2 hover:ring-slate-400 transition-all ${
                    isQuickFilterActive('trimming', 'KOSONG') ? 'ring-2 ring-slate-600' : ''
                  }`}
                  onClick={() => handleQuickFilter('trimming', 'KOSONG')}
                  title="Click to toggle filter"
                >
                  <p className="text-xs text-slate-700 font-semibold">Kosong <span className="font-bold">({(filteredCrmTargets || []).filter(t => !t.trimmingValue || t.trimmingValue === 0).length})</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>
          </div>
          )}
        </div>

        {/* View-Only Mode Banner */}
        {currentUser?.role === 'staff' && !canEdit && (
          <div className="mb-4 flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="text-amber-600 dark:text-amber-400">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                👁️ Mode View-Only - {currentUser?.name}
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                Anda hanya dapat melihat data milik PIC CRM <span className="font-bold">{currentUser?.name}</span>. Tidak dapat menambah, mengedit, menghapus, atau mengekspor data.
              </p>
            </div>
          </div>
        )}

        {/* Active Filter Indicator */}
        {quickFilters.length > 0 && (
          <div className="mb-4 flex flex-col sm:flex-row sm:items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-semibold text-blue-800 mt-1">
                Filter Aktif:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {quickFilters.map((filter, index) => {
                  const getFilterLabel = () => {
                    switch (filter.field) {
                      case 'status': return `Status: ${filter.value}`;
                      case 'directOrAssociate': return `Tipe: ${filter.value}`;
                      case 'kuadran': return `Kuadran: ${filter.value}`;
                      case 'luarKota': return `Lokasi: ${filter.value === 'LUAR' ? 'Luar Kota' : 'Dalam Kota'}`;
                      case 'catAkre': return `Akreditasi: ${filter.value}`;
                      case 'statusSertifikat': return `Sertifikat: ${filter.value === 'TERBIT' ? 'Terbit' : 'Belum'}`;
                      case 'tahapAudit': return `Tahap: ${filter.value}`;
                      case 'statusInvoice': return `Invoice: ${filter.value === 'Terbit' ? 'Terbit' : 'Belum'}`;
                      case 'statusPembayaran': return `Pembayaran: ${filter.value}`;
                      case 'statusKomisi': return `Komisi: ${filter.value === 'KOSONG' ? 'Kosong' : filter.value}`;
                      case 'trimming': return `Trimming: ${filter.value === 'ADA' ? 'Ada' : 'Kosong'}`;
                      default: return `${filter.field}: ${filter.value}`;
                    }
                  };
                  return (
                    <Badge
                      key={index}
                      className="bg-blue-600 text-white px-2 sm:px-3 py-1 text-[10px] sm:text-xs cursor-pointer hover:bg-blue-700"
                      onClick={() => clearQuickFilter(filter.field, filter.value)}
                      title="Klik untuk hapus filter ini"
                    >
                      {getFilterLabel()}
                      <X className="h-3 w-3 ml-1 inline" />
                    </Badge>
                  );
                })}
              </div>
              <span className="text-xs sm:text-sm text-gray-600 mt-1">
                <span className="font-bold text-blue-700">{filteredTargets.length}</span> data
              </span>
            </div>
            <Button
              onClick={() => clearQuickFilter()}
              variant="outline"
              size="sm"
              className="w-full sm:w-auto sm:ml-auto h-8 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 text-xs"
            >
              <X className="h-4 w-4 mr-1" />
              Hapus Semua Filter
            </Button>
          </div>
        )}

        {/* CRM DataTable */}
        <CrmDataTable
          data={filteredTargets}
          canEdit={canEdit}
          showExport={canEdit}
          onEdit={(target) => { setSelectedTarget(target); setIsEditDialogOpen(true); }}
          onDelete={async (id) => {
            await deleteTarget({ id: id as Id<"crmTargets"> });
            toast.success('Data berhasil dihapus');
          }}
          onBulkDelete={handleBulkDelete}
        />
      </div>

      {/* Edit Dialog - Optimized Component */}
      <EditCrmDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        target={selectedTarget}
        staffUsers={staffUsers}
        onSuccess={() => {
          // Optional: refresh data or show success message
        }}
      />

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete CRM Target</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedTarget?.namaPerusahaan}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" className='cursor-pointer' onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" className='cursor-pointer' onClick={handleDelete}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Excel-like Add Form Modal */}
      <Dialog open={showExcelFormModal} onOpenChange={setShowExcelFormModal}>
        <DialogContent className="max-w-[98vw] sm:max-w-[95vw] lg:max-w-[98vw] xl:max-w-[98vw] max-h-[90vh] sm:max-h-[85vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <FileSpreadsheet className="h-4 w-4 sm:h-5 sm:w-5" />
              Tambah Data CRM (Excel-like Form)
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Isi data CRM baru dalam format tabel seperti Excel. Kolom dengan tanda * wajib diisi: Nama Perusahaan, Provinsi, Kota, Alamat.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Instructions */}
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 sm:p-4">
              <p className="text-blue-700 dark:text-blue-300 font-medium text-xs sm:text-sm mb-2">
                📝 Petunjuk Pengisian:
              </p>
              <ul className="text-blue-600 dark:text-blue-400 text-xs sm:text-sm space-y-1">
                <li className="hidden sm:block">• Isi semua data langsung di tabel (horizontal scroll untuk melihat semua kolom)</li>
                <li className="sm:hidden">• Isi form di bawah untuk setiap baris data</li>
                <li>• Kolom wajib diisi: Nama Perusahaan, Provinsi, Kota, Alamat</li>
                <li>• Tambah baris baru dengan tombol "Tambah Baris"</li>
                <li className="hidden sm:block">• Scroll horizontal tabel untuk melihat semua kolom</li>
              </ul>
            </div>

            {/* Desktop: Excel-like Table */}
            <div className="hidden sm:block border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="p-2 border border-border text-left font-medium text-xs whitespace-nowrap min-w-[80px]">Tahun</th>
                      <th className="p-2 border border-border text-left font-medium text-xs whitespace-nowrap min-w-[100px]">Perusahaan *</th>
                      <th className="p-2 border border-border text-left font-medium text-xs whitespace-nowrap min-w-[100px]">Provinsi *</th>
                      <th className="p-2 border border-border text-left font-medium text-xs whitespace-nowrap min-w-[100px]">Kota *</th>
                      <th className="p-2 border border-border text-left font-medium text-xs whitespace-nowrap min-w-[150px]">Alamat *</th>
                      <th className="p-2 border border-border text-left font-medium text-xs whitespace-nowrap min-w-[100px]">Status</th>
                      <th className="p-2 border border-border text-left font-medium text-xs whitespace-nowrap min-w-[150px]">Alasan</th>
                      <th className="p-2 border border-border text-left font-medium text-xs whitespace-nowrap min-w-[100px]">PIC CRM</th>
                      <th className="p-2 border border-border text-left font-medium text-xs whitespace-nowrap min-w-[100px]">Sales</th>
                      <th className="p-2 border border-border text-left font-medium text-xs whitespace-nowrap min-w-[120px]">Associate</th>
                      <th className="p-2 border border-border text-left font-medium text-xs whitespace-nowrap min-w-[100px]">Direct/Assoc</th>
                      <th className="p-2 border border-border text-left font-medium text-xs whitespace-nowrap min-w-[100px]">Grup</th>
                      <th className="p-2 border border-border text-left font-medium text-xs whitespace-nowrap min-w-[100px]">Produk</th>
                      <th className="p-2 border border-border text-left font-medium text-xs whitespace-nowrap min-w-[100px]">STD</th>
                      <th className="p-2 border border-border text-left font-medium text-xs whitespace-nowrap min-w-[100px]">Category</th>
                      <th className="p-2 border border-border text-left font-medium text-xs whitespace-nowrap min-w-[100px]">Kuadran</th>
                      <th className="p-2 border border-border text-left font-medium text-xs whitespace-nowrap min-w-[100px]">Luar Kota</th>
                      <th className="p-2 border border-border text-left font-medium text-xs whitespace-nowrap min-w-[100px]">Akreditasi</th>
                      <th className="p-2 border border-border text-left font-medium text-xs whitespace-nowrap min-w-[100px]">Cat Akre</th>
                      <th className="p-2 border border-border text-left font-medium text-xs whitespace-nowrap min-w-[100px]">EA Code</th>
                      <th className="p-2 border border-border text-left font-medium text-xs whitespace-nowrap min-w-[100px]">Tahap Audit</th>
                      <th className="p-2 border border-border text-left font-medium text-xs whitespace-nowrap min-w-[100px]">IA Date</th>
                      <th className="p-2 border border-border text-left font-medium text-xs whitespace-nowrap min-w-[100px]">Exp Date</th>
                      <th className="p-2 border border-border text-left font-medium text-xs whitespace-nowrap min-w-[100px]">Harga Kontrak</th>
                      <th className="p-2 border border-border text-left font-medium text-xs whitespace-nowrap min-w-[100px]">Bulan TTD</th>
                      <th className="p-2 border border-border text-left font-medium text-xs whitespace-nowrap min-w-[100px]">Harga Update</th>
                      <th className="p-2 border border-border text-left font-medium text-xs whitespace-nowrap min-w-[100px] bg-muted/50">Trimming</th>
                      <th className="p-2 border border-border text-left font-medium text-xs whitespace-nowrap min-w-[100px] bg-muted/50">Loss</th>
                      <th className="p-2 border border-border text-left font-medium text-xs whitespace-nowrap min-w-[100px]">Cashback</th>
                      <th className="p-2 border border-border text-left font-medium text-xs whitespace-nowrap min-w-[120px]">Termin</th>
                      <th className="p-2 border border-border text-left font-medium text-xs whitespace-nowrap min-w-[120px]">Status Sertifikat</th>
                      <th className="p-2 border border-border text-left font-medium text-xs whitespace-nowrap min-w-[130px]">No. Sertifikat</th>
                      <th className="p-2 border border-border text-left font-medium text-xs whitespace-nowrap min-w-[120px]">Bulan Exp</th>
                      <th className="p-2 border border-border text-left font-medium text-xs whitespace-nowrap min-w-[100px]">Tgl Kunjungan</th>
                      <th className="p-2 border border-border text-left font-medium text-xs whitespace-nowrap min-w-[100px]">Status Kunjungan</th>
                      <th className="p-2 border border-border text-left font-medium text-xs whitespace-nowrap min-w-[120px]">Bulan Audit Sblm</th>
                      <th className="p-2 border border-border text-left font-medium text-xs whitespace-nowrap min-w-[120px]">Bulan Audit</th>
                      <th className="p-2 border border-border text-left font-medium text-xs whitespace-nowrap min-w-[120px]">Status Invoice</th>
                      <th className="p-2 border border-border text-left font-medium text-xs whitespace-nowrap min-w-[120px]">Status Pembayaran</th>
                      <th className="p-2 border border-border text-left font-medium text-xs whitespace-nowrap min-w-[140px]">Status Komisi</th>
                      <th className="p-2 border border-border text-center font-medium text-xs whitespace-nowrap min-w-[50px]">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {excelFormData.map((row, index) => (
                      <FormDataRow
                        key={index}
                        row={row}
                        index={index}
                        onFieldChange={handleExcelFieldChange}
                        onRemove={removeExcelFormRow}
                        totalRows={excelFormData.length}
                        staffUsers={staffUsers}
                        associates={associates || []}
                        tahapanOptions={tahapanOptions}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile: Card-based Form Layout */}
            <div className="sm:hidden space-y-4">
              {excelFormData.map((row, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3 bg-card shadow-sm">
                  {/* Row Header */}
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="font-semibold text-sm text-foreground">Data Baris {index + 1}</h3>
                    <button
                      onClick={() => removeExcelFormRow(index)}
                      disabled={excelFormData.length === 1}
                      className="text-red-500 hover:text-red-700 disabled:text-gray-300 disabled:cursor-not-allowed cursor-pointer p-1"
                      title="Hapus baris"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Required Fields */}
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-foreground">
                        Nama Perusahaan * <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        defaultValue={row.namaPerusahaan}
                        onChange={(e) => handleExcelFieldChange(index, 'namaPerusahaan', e.target.value)}
                        placeholder="Nama perusahaan"
                        className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-foreground">
                          Provinsi * <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          defaultValue={row.provinsi}
                          onChange={(e) => handleExcelFieldChange(index, 'provinsi', e.target.value)}
                          placeholder="Provinsi"
                          className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-foreground">
                          Kota * <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          defaultValue={row.kota}
                          onChange={(e) => handleExcelFieldChange(index, 'kota', e.target.value)}
                          placeholder="Kota"
                          className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-foreground">
                        Alamat * <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        defaultValue={row.alamat}
                        onChange={(e) => handleExcelFieldChange(index, 'alamat', e.target.value)}
                        placeholder="Alamat lengkap"
                        className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                      />
                    </div>
                  </div>

                  {/* Optional Fields - Collapsible */}
                  <details className="group">
                    <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground list-none flex items-center gap-2">
                      <span>Show More Fields</span>
                      <svg className="h-3 w-3 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </summary>
                    <div className="mt-3 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-foreground">Tahun</label>
                          <select
                            defaultValue={row.tahun || new Date().getFullYear().toString()}
                            onChange={(e) => handleExcelFieldChange(index, 'tahun', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                          >
                            <option value="">- Pilih -</option>
                            {Array.from({ length: 11 }, (_, i) => 2024 + i).map(year => (
                              <option key={year} value={year.toString()}>{year}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-foreground">Status</label>
                          <select
                            defaultValue={row.status}
                            onChange={(e) => handleExcelFieldChange(index, 'status', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                          >
                            <option value="">- Pilih -</option>
                            <option value="WAITING">WAITING</option>
                            <option value="PROSES">PROSES</option>
                            <option value="DONE">DONE</option>
                            <option value="SUSPEND">SUSPEND</option>
                            <option value="LOSS">LOSS</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-foreground">PIC CRM</label>
                          <select
                            defaultValue={row.picCrm}
                            onChange={(e) => handleExcelFieldChange(index, 'picCrm', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                          >
                            <option value="">- Pilih -</option>
                            {staffUsers.map(user => (
                              <option key={user._id} value={user.name}>
                                {user.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-foreground">Sales</label>
                          <input
                            type="text"
                            defaultValue={row.sales}
                            onChange={(e) => handleExcelFieldChange(index, 'sales', e.target.value)}
                            placeholder="NAC, ARH"
                            className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-medium text-foreground">Nama Associate</label>
                        <input
                          type="text"
                          defaultValue={row.namaAssociate}
                          onChange={(e) => handleExcelFieldChange(index, 'namaAssociate', e.target.value)}
                          placeholder="Nama Associate"
                          className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                        />
                      </div>
                    </div>
                  </details>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-4 border-t">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={addNewExcelFormRow}
                disabled={isSubmittingExcel}
                className="cursor-pointer"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tambah Baris
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowExcelFormModal(false);
                  setExcelFormData([{
                    tahun: currentYear,
                    bulanExpDate: '',
                    produk: '',
                    picCrm: '',
                    sales: '',
                    namaAssociate: '',
                    namaPerusahaan: '',
                    status: '',
                    alasan: '',
                    category: '',
                    kuadran: '',
                    luarKota: '',
                    provinsi: '',
                    kota: '',
                    alamat: '',
                    akreditasi: '',
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
                    nomorSertifikat: '',
                    tanggalKunjungan: '',
                    statusKunjungan: '',
                  }]);
                }}
                disabled={isSubmittingExcel}
                className="cursor-pointer"
              >
                Batal
              </Button>
              <Button
                onClick={submitExcelFormData}
                disabled={isSubmittingExcel}
                className="cursor-pointer"
              >
                {isSubmittingExcel ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Simpan {excelFormData.filter(row => row.namaPerusahaan.trim() !== '' && row.provinsi.trim() !== '' && row.kota.trim() !== '' && row.alamat.trim() !== '').length} Data
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border lg:hidden">
        <div className="flex gap-1 p-2 overflow-x-auto snap-x hide-scrollbar">
          {/* Date Filter Tab */}
          <button
            onClick={() => setActiveFilterSheet(activeFilterSheet === 'date' ? null : 'date')}
            className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors min-w-[70px] snap-start shrink-0 ${
              activeFilterSheet === 'date' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
            }`}
          >
            <CalendarClock className="h-5 w-5 mb-1" />
            <span className="text-[10px] font-medium">Date</span>
          </button>

          {/* PIC CRM Tab - Hide for staff */}
          {currentUser?.role !== 'staff' && (
            <button
              onClick={() => setActiveFilterSheet(activeFilterSheet === 'picCrm' ? null : 'picCrm')}
              className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors min-w-[70px] snap-start shrink-0 ${
                activeFilterSheet === 'picCrm' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              }`}
            >
              <Filter className="h-5 w-5 mb-1" />
              <span className="text-[10px] font-medium">PIC</span>
            </button>
          )}

          {/* Company Tab */}
          <button
            onClick={() => setActiveFilterSheet(activeFilterSheet === 'company' ? null : 'company')}
            className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors min-w-[70px] snap-start shrink-0 ${
              activeFilterSheet === 'company' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
            }`}
          >
            <Building className="h-5 w-5 mb-1" />
            <span className="text-[10px] font-medium">Company</span>
          </button>

          {/* Location Tab */}
          <button
            onClick={() => setActiveFilterSheet(activeFilterSheet === 'location' ? null : 'location')}
            className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors min-w-[70px] snap-start shrink-0 ${
              activeFilterSheet === 'location' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
            }`}
          >
            <MapPin className="h-5 w-5 mb-1" />
            <span className="text-[10px] font-medium">More</span>
          </button>

          {/* Statistics Tab */}
          <button
            onClick={() => setActiveFilterSheet(activeFilterSheet === 'statistics' ? null : 'statistics')}
            className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors min-w-[70px] snap-start shrink-0 ${
              activeFilterSheet === 'statistics' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
            }`}
          >
            <Shield className="h-5 w-5 mb-1" />
            <span className="text-[10px] font-medium">Statistics</span>
          </button>

          {/* Audit Sustain Tab */}
          <button
            onClick={() => setActiveFilterSheet(activeFilterSheet === 'auditSustain' ? null : 'auditSustain')}
            className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors min-w-[70px] snap-start shrink-0 ${
              activeFilterSheet === 'auditSustain' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
            }`}
          >
            <FileClock className="h-5 w-5 mb-1" />
            <span className="text-[10px] font-medium">Audit Sustain</span>
          </button>

          {/* Bulan Audit Tab */}
          <button
            onClick={() => setActiveFilterSheet(activeFilterSheet === 'bulanAudit' ? null : 'bulanAudit')}
            className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors min-w-[70px] snap-start shrink-0 ${
              activeFilterSheet === 'bulanAudit' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
            }`}
          >
            <Calendar className="h-5 w-5 mb-1" />
            <span className="text-[10px] font-medium">Bulan Audit</span>
          </button>

          {/* Reset Tab */}
          <button
            onClick={() => {
              resetAllFilters();
              setActiveFilterSheet(null);
            }}
            className="flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors hover:bg-red-50 hover:text-red-600 text-red-500 min-w-[70px] snap-start shrink-0"
          >
            <X className="h-5 w-5 mb-1" />
            <span className="text-[10px] font-medium">Reset</span>
          </button>
        </div>
        <div className="text-center pb-1">
          <p className="text-[9px] text-muted-foreground">Geser untuk melihat semua filter →</p>
        </div>
      </div>

      {/* Mobile Filter Sheet Overlay */}
      {activeFilterSheet && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setActiveFilterSheet(null)}
          />

          {/* Filter Sheet */}
          <div className="fixed bottom-16 left-0 right-0 z-40 lg:hidden max-h-[70vh] overflow-y-auto bg-background rounded-t-2xl border-t border-border shadow-2xl animate-in slide-in-from-bottom-10">
            {/* Handle bar */}
            <div className="flex justify-center border-b">
              <div className="w-12 h-1.5 bg-muted rounded-full" />
            </div>

            {/* Filter Content */}
            <div className="p-4 space-y-4">
              {/* Search is now in the DataTable toolbar */}

              {/* Date Filter */}
              {activeFilterSheet === 'date' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">Filter Date</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveFilterSheet(null)}
                      className="h-8 text-xs"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <FilterDateSection
                      filterTahun={filterTahun}
                      setFilterTahun={setFilterTahun}
                      filterFromBulanExp={filterFromBulanExp}
                      setFilterFromBulanExp={setFilterFromBulanExp}
                      filterToBulanExp={filterToBulanExp}
                      setFilterToBulanExp={setFilterToBulanExp}
                      tahunOptions={tahunOptions}
                      bulanOptions={bulanOptions}
                    />
                    <Button
                      onClick={() => setActiveFilterSheet(null)}
                      className="w-full"
                    >
                      OK
                    </Button>
                  </div>
                </div>
              )}

              {/* PIC CRM Filter - Hide for staff */}
              {activeFilterSheet === 'picCrm' && currentUser?.role !== 'staff' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">PIC CRM</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveFilterSheet(null)}
                      className="h-8 text-xs"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <FilterPicCrmSection
                      filterPicCrm={filterPicCrm}
                      setFilterPicCrm={setFilterPicCrm}
                      picCrmOptions={uniquePicCrms}
                    />
                    <Button
                      onClick={() => setActiveFilterSheet(null)}
                      className="w-full"
                    >
                      OK
                    </Button>
                  </div>
                </div>
              )}

              {/* Company Filter */}
              {activeFilterSheet === 'company' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">Company</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveFilterSheet(null)}
                      className="h-8 text-xs"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <FilterCompanySection
                      filterStatus={filterStatus}
                      setFilterStatus={setFilterStatus}
                      filterCategory={filterCategory}
                      setFilterCategory={setFilterCategory}
                      filterProvinsi={filterProvinsi}
                      setFilterProvinsi={setFilterProvinsi}
                      filterKota={filterKota}
                      setFilterKota={setFilterKota}
                      filterAlasan={filterAlasan}
                      setFilterAlasan={setFilterAlasan}
                      statusOptions={uniqueStatuses}
                      provinsiOptions={provinsiOptions}
                      kotaOptions={kotaOptions}
                      alasanOptions={alasanOptions}
                    />
                    <Button
                      onClick={() => setActiveFilterSheet(null)}
                      className="w-full"
                    >
                      OK
                    </Button>
                  </div>
                </div>
              )}

              {/* Location Filter */}
              {activeFilterSheet === 'location' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">More Filters</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveFilterSheet(null)}
                      className="h-8 text-xs"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {/* PIC Sales Filter */}
                    <FilterPicSalesSection
                      filterPicSales={filterPicSales}
                      setFilterPicSales={setFilterPicSales}
                      salesOptions={salesOptions}
                    />

                    {/* Sertifikat Filter */}
                    <FilterSertifikatSection
                      filterStandar={filterStandar}
                      setFilterStandar={setFilterStandar}
                      filterAkreditasi={filterAkreditasi}
                      setFilterAkreditasi={setFilterAkreditasi}
                      filterStatusSertifikatTerbit={filterStatusSertifikat}
                      setFilterStatusSertifikatTerbit={setFilterStatusSertifikat}
                      filterStatus={filterStatus}
                      setFilterStatus={setFilterStatus}
                      filterAlasan={filterAlasan}
                      setFilterAlasan={setFilterAlasan}
                      standarOptions={standarOptions}
                      alasanOptions={alasanOptions}
                    />

                    {/* Kunjungan Filter */}
                    <FilterKunjunganSection
                      filterFromKunjungan={filterFromKunjungan}
                      setFilterFromKunjungan={setFilterFromKunjungan}
                      filterToKunjungan={filterToKunjungan}
                      setFilterToKunjungan={setFilterToKunjungan}
                      filterStatusKunjungan={filterStatusKunjungan}
                      setFilterStatusKunjungan={setFilterStatusKunjungan}
                      bulanOptions={bulanOptions}
                    />
                    <Button
                      onClick={() => setActiveFilterSheet(null)}
                      className="w-full"
                    >
                      OK
                    </Button>
                  </div>
                </div>
              )}

              {/* Statistics Filter */}
              {activeFilterSheet === 'statistics' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">Statistics</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveFilterSheet(null)}
                      className="h-8 text-xs"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-3 max-h-[55vh] overflow-y-auto pb-2">
                    {/* Main Metrics */}
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-3 border border-purple-200">
                      <h4 className="text-xs font-bold text-purple-900 mb-2">📊 Main Metrics</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-white rounded-lg px-2 py-2 border border-blue-200 text-center">
                          <p className="text-base font-bold text-blue-600">{filteredCrmTargets?.length || 0}</p>
                          <p className="text-[8px] text-blue-700 font-medium uppercase">Records</p>
                        </div>
                        <div className="bg-white rounded-lg px-2 py-2 border border-purple-200 text-center">
                          <p className="text-base font-bold text-purple-600">{new Set((filteredCrmTargets || []).map(t => t.namaPerusahaan)).size}</p>
                          <p className="text-[8px] text-purple-700 font-medium uppercase">Companies</p>
                        </div>
                        <div className="bg-white rounded-lg px-2 py-2 border border-green-200 text-center">
                          <p className="text-base font-bold text-green-600">{new Set((filteredCrmTargets || []).filter(t => t.statusKunjungan === 'VISITED').map(t => t.namaPerusahaan)).size}</p>
                          <p className="text-[8px] text-green-700 font-medium uppercase">Visited</p>
                        </div>
                        <div className="bg-white rounded-lg px-2 py-2 border border-orange-200 text-center">
                          <p className="text-base font-bold text-orange-600">{new Set((filteredCrmTargets || []).filter(t => t.statusKunjungan === 'NOT YET').map(t => t.namaPerusahaan)).size}</p>
                          <p className="text-[8px] text-orange-700 font-medium uppercase">Not Yet</p>
                        </div>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="border rounded-lg p-3">
                      <h4 className="text-xs font-bold text-gray-700 mb-2">📋 Status</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {['DONE', 'PROSES', 'LOSS', 'SUSPEND', 'WAITING'].map((status) => {
                          const count = (filteredCrmTargets || []).filter(t => t.status === status).length;
                          const isActive = isQuickFilterActive('status', status);
                          return (
                            <div
                              key={status}
                              onClick={() => handleQuickFilter('status', status)}
                              className={`rounded-lg px-2 py-2 text-center cursor-pointer transition-all ${
                                isActive ? 'ring-2 ring-offset-1 shadow-md' : 'hover:shadow-md'
                              } ${
                                status === 'DONE' ? 'bg-purple-100 border-2 border-purple-300 ring-purple-500' :
                                status === 'PROSES' ? 'bg-blue-100 border-2 border-blue-300 ring-blue-500' :
                                status === 'LOSS' ? 'bg-red-100 border-2 border-red-300 ring-red-500' :
                                status === 'SUSPEND' ? 'bg-orange-100 border-2 border-orange-300 ring-orange-500' :
                                'bg-gray-100 border-2 border-gray-300 ring-gray-500'
                              }`}
                              title="Click to toggle filter"
                            >
                              <p className="text-base font-bold">{count}</p>
                              <p className="text-[8px] font-medium uppercase">{status}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Kuadran */}
                    <div className="border rounded-lg p-3">
                      <h4 className="text-xs font-bold text-gray-700 mb-2">🎯 Kuadran</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {['K1', 'K2', 'K3', 'K4'].map((kuadran) => {
                          const count = (filteredCrmTargets || []).filter(t => t.kuadran === kuadran).length;
                          const isActive = isQuickFilterActive('kuadran', kuadran);
                          return (
                            <div
                              key={kuadran}
                              onClick={() => handleQuickFilter('kuadran', kuadran)}
                              className={`bg-violet-100 border-2 border-violet-300 rounded-lg px-2 py-2 text-center cursor-pointer hover:shadow-md transition-all ${
                                isActive ? 'ring-2 ring-offset-1 ring-violet-500 shadow-md' : ''
                              }`}
                              title="Click to toggle filter"
                            >
                              <p className="text-base font-bold text-violet-700">{count}</p>
                              <p className="text-[8px] font-medium text-violet-600 uppercase">{kuadran}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Lokasi */}
                    <div className="border rounded-lg p-3">
                      <h4 className="text-xs font-bold text-gray-700 mb-2">📍 Lokasi</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { key: 'LUAR', label: 'Luar Kota', value: 'LUAR', color: 'amber' },
                          { key: 'DALAM', label: 'Dalam Kota', value: 'DALAM', color: 'yellow' },
                        ].map((loc) => {
                          const count = loc.key === 'LUAR'
                            ? (filteredCrmTargets || []).filter(t => t.luarKota && t.luarKota.toUpperCase().includes('LUAR')).length
                            : (filteredCrmTargets || []).filter(t => !t.luarKota || !t.luarKota.toUpperCase().includes('LUAR')).length;
                          const isActive = isQuickFilterActive('luarKota', loc.value);
                          return (
                            <div
                              key={loc.key}
                              onClick={() => handleQuickFilter('luarKota', loc.value)}
                              className={`bg-${loc.color}-100 border-2 border-${loc.color}-300 rounded-lg px-2 py-2 text-center cursor-pointer hover:shadow-md transition-all ${
                                isActive ? `ring-2 ring-offset-1 ring-${loc.color}-500 shadow-md` : ''
                              }`}
                              title="Click to toggle filter"
                            >
                              <p className={`text-base font-bold text-${loc.color}-700`}>{count}</p>
                              <p className={`text-[8px] font-medium text-${loc.color}-600 uppercase`}>{loc.label}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Kategori Akreditasi */}
                    <div className="border rounded-lg p-3">
                      <h4 className="text-xs font-bold text-gray-700 mb-2">🏅 Kategori Akreditasi</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { key: 'KAN', label: 'KAN', color: 'emerald' },
                          { key: 'NON AKRE', label: 'NON AKRE', color: 'slate' },
                          { key: 'INTERNASIONAL', label: 'INTERNASIONAL', color: 'blue' },
                        ].map((kat) => {
                          const count = (filteredCrmTargets || []).filter(t => t.catAkre && t.catAkre.toUpperCase() === kat.key).length;
                          const isActive = isQuickFilterActive('catAkre', kat.key);
                          return (
                            <div
                              key={kat.key}
                              onClick={() => handleQuickFilter('catAkre', kat.key)}
                              className={`bg-${kat.color}-100 border-2 border-${kat.color}-300 rounded-lg px-2 py-2 text-center cursor-pointer hover:shadow-md transition-all ${
                                isActive ? `ring-2 ring-offset-1 ring-${kat.color}-500 shadow-md` : ''
                              }`}
                              title="Click to toggle filter"
                            >
                              <p className={`text-base font-bold text-${kat.color === 'blue' ? 'blue-900' : kat.color + '-700'}`}>{count}</p>
                              <p className={`text-[8px] font-medium text-${kat.color === 'blue' ? 'blue-900' : kat.color + '-600'} uppercase`}>{kat.label}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Tahapan Audit */}
                    <div className="border rounded-lg p-3">
                      <h4 className="text-xs font-bold text-gray-700 mb-2">🔍 Tahapan Audit</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {masterTahapanData.tahapan.map((tahap: any) => {
                          const count = (filteredCrmTargets || []).filter(t => t.tahapAudit === tahap.kode).length;
                          const isActive = isQuickFilterActive('tahapAudit', tahap.kode);
                          return (
                            <div
                              key={tahap.kode}
                              onClick={() => handleQuickFilter('tahapAudit', tahap.kode)}
                              className={`bg-indigo-100 border-2 border-indigo-300 rounded-lg px-2 py-2 text-center cursor-pointer hover:shadow-md transition-all ${
                                isActive ? 'ring-2 ring-offset-1 ring-indigo-500 shadow-md' : ''
                              }`}
                              title="Click to toggle filter"
                            >
                              <p className="text-base font-bold text-indigo-700">{count}</p>
                              <p className="text-[8px] font-medium text-indigo-600 uppercase">{tahap.kode}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Status Terbit */}
                    <div className="border rounded-lg p-3">
                      <h4 className="text-xs font-bold text-gray-700 mb-2">📉 Loss Value</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { key: 'ADA', label: 'Ada Value', color: 'red' },
                          { key: 'KOSONG', label: 'Tidak Ada', color: 'slate' },
                        ].map((stat) => {
                          const count = stat.key === 'ADA'
                            ? (filteredCrmTargets || []).filter(t => t.lossValue && t.lossValue > 0).length
                            : (filteredCrmTargets || []).filter(t => !t.lossValue || t.lossValue === 0).length;
                          const isActive = isQuickFilterActive('lossValue', stat.key);
                          return (
                            <div
                              key={stat.key}
                              onClick={() => handleQuickFilter('lossValue', stat.key)}
                              className={`bg-${stat.color}-100 border-2 border-${stat.color}-300 rounded-lg px-2 py-2 text-center cursor-pointer hover:shadow-md transition-all ${
                                isActive ? `ring-2 ring-offset-1 ring-${stat.color}-500 shadow-md` : ''
                              }`}
                              title="Click to toggle filter"
                            >
                              <p className={`text-base font-bold text-${stat.color}-700`}>{count}</p>
                              <p className={`text-[8px] font-medium text-${stat.color}-600 uppercase`}>{stat.label}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Direct/Associate */}
                    <div className="border rounded-lg p-3">
                      <h4 className="text-xs font-bold text-gray-700 mb-2">👥 Direct/Associate</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { key: 'DIRECT', label: 'Direct', color: 'cyan' },
                          { key: 'ASSOCIATE', label: 'Associate', color: 'pink' },
                        ].map((type) => {
                          const count = (filteredCrmTargets || []).filter(t => t.directOrAssociate && t.directOrAssociate.toUpperCase() === type.key).length;
                          const isActive = isQuickFilterActive('directOrAssociate', type.key);
                          return (
                            <div
                              key={type.key}
                              onClick={() => handleQuickFilter('directOrAssociate', type.key)}
                              className={`bg-${type.color}-100 border-2 border-${type.color}-300 rounded-lg px-2 py-2 text-center cursor-pointer hover:shadow-md transition-all ${
                                isActive ? `ring-2 ring-offset-1 ring-${type.color}-500 shadow-md` : ''
                              }`}
                              title="Click to toggle filter"
                            >
                              <p className={`text-base font-bold text-${type.color}-700`}>{count}</p>
                              <p className={`text-[8px] font-medium text-${type.color}-600 uppercase`}>{type.label}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Status Invoice */}
                    <div className="border rounded-lg p-3">
                      <h4 className="text-xs font-bold text-gray-700 mb-2">🧾 Status Invoice</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { key: 'Terbit', label: 'Terbit', color: 'teal' },
                          { key: 'Belum', label: 'Belum', color: 'orange' },
                        ].map((stat) => {
                          const count = stat.key === 'Terbit'
                            ? (filteredCrmTargets || []).filter(t => t.statusInvoice && t.statusInvoice.toString().trim().toUpperCase() === 'TERBIT').length
                            : (filteredCrmTargets || []).filter(t => !t.statusInvoice || t.statusInvoice.toString().trim().toUpperCase().includes('BELUM')).length;
                          const isActive = isQuickFilterActive('statusInvoice', stat.key);
                          return (
                            <div
                              key={stat.key}
                              onClick={() => handleQuickFilter('statusInvoice', stat.key)}
                              className={`bg-${stat.color}-100 border-2 border-${stat.color}-300 rounded-lg px-2 py-2 text-center cursor-pointer hover:shadow-md transition-all ${
                                isActive ? `ring-2 ring-offset-1 ring-${stat.color}-500 shadow-md` : ''
                              }`}
                              title="Click to toggle filter"
                            >
                              <p className={`text-base font-bold text-${stat.color}-700`}>{count}</p>
                              <p className={`text-[8px] font-medium text-${stat.color}-600 uppercase`}>{stat.label}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Status Pembayaran */}
                    <div className="border rounded-lg p-3">
                      <h4 className="text-xs font-bold text-gray-700 mb-2">💰 Status Pembayaran</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { key: 'Lunas', label: 'Lunas', color: 'emerald', upperKey: 'LUNAS' },
                          { key: 'Belum Lunas', label: 'Belum Lunas', color: 'red', upperKey: 'BELUM LUNAS' },
                          { key: 'Sudah DP', label: 'Sudah DP', color: 'yellow', upperKey: 'SUDAH DP' },
                        ].map((stat) => {
                          const count = (filteredCrmTargets || []).filter(t => {
                            if (!t.statusPembayaran) return false;
                            const normalized = t.statusPembayaran.toString().trim().toUpperCase();
                            return normalized === stat.upperKey;
                          }).length;
                          const isActive = isQuickFilterActive('statusPembayaran', stat.key);
                          return (
                            <div
                              key={stat.key}
                              onClick={() => handleQuickFilter('statusPembayaran', stat.key)}
                              className={`bg-${stat.color}-100 border-2 border-${stat.color}-300 rounded-lg px-2 py-2 text-center cursor-pointer hover:shadow-md transition-all ${
                                isActive ? `ring-2 ring-offset-1 ring-${stat.color}-500 shadow-md` : ''
                              }`}
                              title="Click to toggle filter"
                            >
                              <p className={`text-base font-bold text-${stat.color}-700`}>{count}</p>
                              <p className={`text-[8px] font-medium text-${stat.color}-600 uppercase`}>{stat.label}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Status Komisi */}
                    <div className="border rounded-lg p-3">
                      <h4 className="text-xs font-bold text-gray-700 mb-2">🎯 Status Komisi</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { key: 'Sudah Diajukan', label: 'Sudah', color: 'indigo', upperKey: 'SUDAH DIAJUKAN' },
                          { key: 'Belum Diajukan', label: 'Belum', color: 'purple', upperKey: 'BELUM DIAJUKAN' },
                          { key: 'Tidak Ada', label: 'Tidak Ada', color: 'gray', upperKey: 'TIDAK ADA' },
                          { key: 'KOSONG', label: 'Kosong', color: 'slate', upperKey: 'KOSONG' },
                        ].map((stat) => {
                          const count = stat.key === 'KOSONG'
                            ? (filteredCrmTargets || []).filter(t => !t.statusKomisi || t.statusKomisi.toString().trim() === '').length
                            : (filteredCrmTargets || []).filter(t => {
                                if (!t.statusKomisi) return false;
                                const normalized = t.statusKomisi.toString().trim().toUpperCase();
                                return normalized === stat.upperKey;
                              }).length;
                          const isActive = isQuickFilterActive('statusKomisi', stat.key);
                          return (
                            <div
                              key={stat.key}
                              onClick={() => handleQuickFilter('statusKomisi', stat.key)}
                              className={`bg-${stat.color}-100 border-2 border-${stat.color}-300 rounded-lg px-2 py-2 text-center cursor-pointer hover:shadow-md transition-all ${
                                isActive ? `ring-2 ring-offset-1 ring-${stat.color}-500 shadow-md` : ''
                              }`}
                              title="Click to toggle filter"
                            >
                              <p className={`text-base font-bold text-${stat.color}-700`}>{count}</p>
                              <p className={`text-[8px] font-medium text-${stat.color}-600 uppercase`}>{stat.label}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Trimming */}
                    <div className="border rounded-lg p-3">
                      <h4 className="text-xs font-bold text-gray-700 mb-2">📈 Trimming</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { key: 'ADA', label: 'Ada Value', color: 'green' },
                          { key: 'KOSONG', label: 'Kosong', color: 'slate' },
                        ].map((stat) => {
                          const count = stat.key === 'ADA'
                            ? (filteredCrmTargets || []).filter(t => t.trimmingValue && t.trimmingValue > 0).length
                            : (filteredCrmTargets || []).filter(t => !t.trimmingValue || t.trimmingValue === 0).length;
                          const isActive = isQuickFilterActive('trimming', stat.key);
                          return (
                            <div
                              key={stat.key}
                              onClick={() => handleQuickFilter('trimming', stat.key)}
                              className={`bg-${stat.color}-100 border-2 border-${stat.color}-300 rounded-lg px-2 py-2 text-center cursor-pointer hover:shadow-md transition-all ${
                                isActive ? `ring-2 ring-offset-1 ring-${stat.color}-500 shadow-md` : ''
                              }`}
                              title="Click to toggle filter"
                            >
                              <p className={`text-base font-bold text-${stat.color}-700`}>{count}</p>
                              <p className={`text-[8px] font-medium text-${stat.color}-600 uppercase`}>{stat.label}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => setActiveFilterSheet(null)}
                    className="w-full sticky bottom-0"
                  >
                    OK
                  </Button>
                </div>
              )}

              {/* Audit Sustain Filter */}
              {activeFilterSheet === 'auditSustain' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">Audit Sustain</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveFilterSheet(null)}
                      className="h-8 text-xs"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <FilterBulanAuditSustain
                      filterTahunAuditSustain={filterTahunAuditSustain}
                      setFilterTahunAuditSustain={setFilterTahunAuditSustain}
                      filterFromBulanAuditSustain={filterFromBulanAuditSustain}
                      setFilterFromBulanAuditSustain={setFilterFromBulanAuditSustain}
                      filterToBulanAuditSustain={filterToBulanAuditSustain}
                      setFilterToBulanAuditSustain={setFilterToBulanAuditSustain}
                      tahunOptions={tahunAuditSustainOptions}
                      bulanOptions={bulanOptions}
                    />
                    <Button
                      onClick={() => setActiveFilterSheet(null)}
                      className="w-full"
                    >
                      OK
                    </Button>
                  </div>
                </div>
              )}

              {/* Bulan Audit Filter */}
              {activeFilterSheet === 'bulanAudit' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">Bulan Audit</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveFilterSheet(null)}
                      className="h-8 text-xs"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <FilterBulanAudit
                      filterTahunAudit={filterTahunAudit}
                      setFilterTahunAudit={setFilterTahunAudit}
                      filterFromBulanAudit={filterFromBulanAudit}
                      setFilterFromBulanAudit={setFilterFromBulanAudit}
                      filterToBulanAudit={filterToBulanAudit}
                      setFilterToBulanAudit={setFilterToBulanAudit}
                      tahunOptions={tahunAuditOptions}
                      bulanOptions={bulanOptions}
                    />
                    <Button
                      onClick={() => setActiveFilterSheet(null)}
                      className="w-full"
                    >
                      OK
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
