"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Pencil, Trash2, Upload, Download, Search, Filter, X, Save, FileSpreadsheet, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { getCurrentUser } from '@/lib/auth';
import indonesiaData from '@/data/indonesia-provinsi-kota.json';
import masterSalesData from '@/data/master-sales.json';
import masterAssociateData from '@/data/master-associate.json';
import masterStandarData from '@/data/master-standar.json';
import masterEaCodeData from '@/data/master-ea-code.json';
import masterAlasanData from '@/data/master-alasan.json';
import { InfinityLoader } from '@/components/ui/infinity-loader';
import { FilterSection } from '@/components/filters/FilterSection';
import { FilterDateSection } from '@/components/filters/FilterDateSection';
import { FilterPicCrmSection } from '@/components/filters/FilterPicCrmSection';
import { FilterCompanySection } from '@/components/filters/FilterCompanySection';
import { FilterPicSalesSection } from '@/components/filters/FilterPicSalesSection';
import { FilterSertifikatSection } from '@/components/filters/FilterSertifikatSection';
import { FilterKunjunganSection } from '@/components/filters/FilterKunjunganSection';
import { EditCrmDialog } from '@/components/crm-edit-dialog';

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
  hargaKontrak?: string;
  bulanTtdNotif?: string;
  hargaTerupdate?: string;
  trimmingValue?: string;
  lossValue?: string;
  cashback?: string;
  terminPembayaran?: string;
  statusSertifikat?: string;
  tanggalKunjungan?: string;
  statusKunjungan?: string;
}

interface FormDataRowProps {
  row: CrmFormData;
  index: number;
  onFieldChange: (index: number, field: keyof CrmFormData, value: string) => void;
  onRemove: (index: number) => void;
  totalRows: number;
  staffUsers: any[];
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
const FormDataRow = ({ row, index, onFieldChange, onRemove, totalRows, staffUsers }: FormDataRowProps) => {
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
          {masterAssociateData.associate.map((assoc: any) => (
            <option key={assoc.kode} value={assoc.nama}>{assoc.nama}</option>
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
        <select
          defaultValue={row.produk}
          onChange={(e) => handleChange('produk', e.target.value)}
          className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded"
        >
          <option value="">- Pilih -</option>
          <option value="XMS">XMS</option>
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
          <option value="IA">IA</option>
          <option value="RC">RC</option>
          <option value="SV1">SV1</option>
          <option value="SV2">SV2</option>
          <option value="SV3">SV3</option>
          <option value="SV4">SV4</option>
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
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPicCrm, setFilterPicCrm] = useState<string>('all');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showExcelFormModal, setShowExcelFormModal] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<CrmTarget | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [isImporting, setIsImporting] = useState(false);
  const itemsPerPage = 10;

  // Ref for select all checkbox
  const selectAllCheckboxRef = React.useRef<any>(null);

  // Comprehensive Filters
  const [expandedFilterSections, setExpandedFilterSections] = useState<string[]>(['date', 'details']);
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
  const [filterFromKunjungan, setFilterFromKunjungan] = useState<string>('all');
  const [filterToKunjungan, setFilterToKunjungan] = useState<string>('all');
  const [filterStatusKunjungan, setFilterStatusKunjungan] = useState<string>('all');
  const [filterPicSales, setFilterPicSales] = useState<string>('all');
  const [filterTipeProduk, setFilterTipeProduk] = useState<string>('all');

  // Fetch CRM targets
  const crmTargets = useQuery(api.crmTargets.getCrmTargets);
  const allUsers = useQuery(api.auth.getAllUsers);
  const staffUsers = allUsers?.filter(user => user.role === 'staff') || [];
  const deleteTarget = useMutation(api.crmTargets.deleteCrmTarget);
  const createTarget = useMutation(api.crmTargets.createCrmTarget);
  const updateTargetMutation = useMutation(api.crmTargets.updateCrmTarget);
  const deleteAllTargets = useMutation(api.crmTargets.deleteAllCrmTargets);

  // Filter options - Dynamic from crmTargets data
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
  const alasanOptions = [...new Set(crmTargets?.map(t => t.alasan).filter(Boolean) || [])].sort() as string[];
  // Get standar options from master-standar.json
  const standarOptions = masterStandarData.standar.map((s: any) => s.kode).sort();

  // Get provinsi options from Indonesia data
  const provinsiOptions = Object.keys(indonesiaData).sort();

  // Get unique provinsi values from actual data (for debugging)
  const provinsiFromData = [...new Set(crmTargets?.map(t => t.provinsi).filter(Boolean) || [])].sort();
 
  // Get kota options based on selected provinsi from Indonesia data
  const kotaOptions = filterProvinsi !== 'all' && (indonesiaData as any)[filterProvinsi]
    ? [...new Set((indonesiaData as any)[filterProvinsi].kabupaten_kota)].sort() as string[] // Remove duplicates with Set
    : [];

  // Tahapan Audit - Default options + dynamic from data
  const defaultTahapanAudit = ['IA', 'SV1', 'SV2', 'SV3', 'SV4', 'RC'];
  const tahapanAuditFromData = [...new Set(crmTargets?.map(t => t.tahapAudit).filter(Boolean) || [])];
  const tahapanAuditOptions = [...new Set([...defaultTahapanAudit, ...tahapanAuditFromData])].sort() as string[];

  // Sales options
  const salesOptions = [...new Set(crmTargets?.map(t => t.sales).filter(Boolean) || [])].sort() as string[];

  // Toggle filter section
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
    setFilterFromKunjungan('all');
    setFilterToKunjungan('all');
    setFilterStatusKunjungan('all');
    setFilterPicSales('all');
    setFilterTipeProduk('all');
    setSearchTerm('');
  };

  // Excel-like Form state (multiple rows)
  const [excelFormData, setExcelFormData] = useState<CrmFormData[]>([{
    tahun: currentYear,
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
  }]);
  const [isSubmittingExcel, setIsSubmittingExcel] = useState(false);

  // Filter and search
  const filteredTargets = crmTargets?.filter(target => {
    // Search filter
    const matchesSearch = searchTerm === '' ||
      target.namaPerusahaan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      target.sales.toLowerCase().includes(searchTerm.toLowerCase()) ||
      target.picCrm.toLowerCase().includes(searchTerm.toLowerCase());

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

      matchesBulanExp = bulanExpNum > 0 && bulanExpNum >= fromMonth && bulanExpNum <= toMonth;
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
      } else {
        matchesBulanTTD = false;
      }
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
      } else {
        matchesKunjungan = false;
      }
    }
    const matchesStatusKunjungan = filterStatusKunjungan === 'all' || target.statusKunjungan === filterStatusKunjungan;

    return matchesSearch && matchesTahun && matchesBulanExp && matchesPicCrm &&
           matchesPicSales && matchesStatus && matchesAlasan && matchesCategory && matchesProvinsi &&
           matchesKota && matchesTipeProduk && matchesStandar && matchesAkreditasi && matchesEaCode &&
           matchesTahapAudit && matchesBulanTTD && matchesStatusSertifikat &&
           matchesTermin && matchesKunjungan && matchesStatusKunjungan;
  }) || [];

  // Sort by updatedAt (newest first), then by createdAt (newest first)
  const sortedTargets = filteredTargets.sort((a, b) => {
    const dateA = Math.max(a.updatedAt || 0, a.createdAt || 0);
    const dateB = Math.max(b.updatedAt || 0, b.createdAt || 0);
    return dateB - dateA; // Sort descending (newest first)
  });

  // Pagination
  const totalPages = Math.ceil(sortedTargets.length / itemsPerPage);
  const paginatedTargets = sortedTargets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Check if all rows on current page are selected
  const isAllSelected = paginatedTargets.length > 0 &&
    paginatedTargets.every(target => selectedIds.has(target._id));

  // Check if some (but not all) rows on current page are selected
  const isSomeSelected = paginatedTargets.some(target => selectedIds.has(target._id));

  // Update indeterminate state when selection changes
  React.useEffect(() => {
    if (selectAllCheckboxRef.current) {
      selectAllCheckboxRef.current.indeterminate = isSomeSelected && !isAllSelected;
    }
  }, [isAllSelected, isSomeSelected]);

  // Get unique values for filters
  const uniqueStatuses = [...new Set(crmTargets?.map(t => t.status) || [])].sort();
  const uniquePicCrms = [...new Set(crmTargets?.map(t => t.picCrm) || [])].sort();

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

  // Handle checkbox selection
  const handleSelectRow = (id: string, checked: boolean) => {
    const newSelectedIds = new Set(selectedIds);
    if (checked) {
      newSelectedIds.add(id);
    } else {
      newSelectedIds.delete(id);
    }
    setSelectedIds(newSelectedIds);
  };

  // Handle select all on current page
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allPageIds = new Set(paginatedTargets.map(t => t._id));
      setSelectedIds(allPageIds);
    } else {
      setSelectedIds(new Set());
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    setIsBulkDeleting(true);
    try {
      let successCount = 0;
      let errorCount = 0;

      // Delete all selected items
      for (const id of selectedIds) {
        try {
          await deleteTarget({ id: id as Id<"crmTargets"> });
          successCount++;
        } catch (error) {
          console.error(`Failed to delete ${id}:`, error);
          errorCount++;
        }
      }

      // Show appropriate message
      if (successCount > 0 && errorCount === 0) {
        toast.success(`Successfully deleted ${successCount} CRM targets!`);
      } else if (successCount > 0 && errorCount > 0) {
        toast.success(`Deleted ${successCount} targets, ${errorCount} failed (already deleted)`);
      } else if (errorCount > 0) {
        toast.error(`Failed to delete ${errorCount} targets (they may have been already deleted)`);
      }

      setSelectedIds(new Set());
      setIsBulkDeleteDialogOpen(false);
    } catch (error) {
      toast.error('Error deleting CRM Targets');
      console.error(error);
    } finally {
      setIsBulkDeleting(false);
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
            namaPerusahaan: row.namaPerusahaan,
            status: row.status || 'WAITING',
            alasan: row.alasan || undefined,
            category: row.category || undefined,
            kuadran: row.kuadran || undefined,
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
            tanggalKunjungan: row.tanggalKunjungan || undefined,
            statusKunjungan: row.statusKunjungan || undefined,
            created_by: currentUser?._id,
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
    

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        
        

        // Show initial loading toast
        toast.loading('📂 Reading Excel file...', { id: 'import-toast', duration: Infinity });

        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        

        const workbook = XLSX.read(data, { type: 'array' });
        

        // Update progress
        toast.loading('📊 Parsing Excel data...', { id: 'import-toast', duration: Infinity });

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

        // Get headers from first row
        const headers = jsonData[0].map((h: any) => String(h).trim());
        
        const targets: any[] = [];

        // Update progress
        toast.loading(`🔄 Processing ${jsonData.length - 1} rows...`, { id: 'import-toast', duration: Infinity });

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
            namaPerusahaan: obj['namaPerusahaan'] || obj['NAMA PERUSAHAAN'] || '',
            status: obj['status'] || obj['STATUS'] || '',
            alasan: obj['alasan'] || obj['ALASAN'] || undefined,
            category: obj['category'] || obj['CATEGORY'] || undefined,
            kuadran: obj['kuadran'] || obj['KUADRAN'] || undefined,
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
            tanggalKunjungan: parseDate(obj['tanggalKunjungan'] || obj['TANGGAL KUNJUNGAN']),
            statusKunjungan: obj['statusKunjungan'] || obj['STATUS KUNJUNGAN'] || undefined,
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

    // Handle month names (Jan-2024, January 2024, etc.)
    const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const monthNameMatch = cleaned.match(/^([a-zA-Z]+)[\/\-\s]*(\d{4})$/i);
    if (monthNameMatch) {
      const [, monthName, year] = monthNameMatch;
      const monthIndex = monthNames.findIndex(m => monthName.toLowerCase().startsWith(m));
      if (monthIndex !== -1) {
        return `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`;
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

  // Handle Excel export
  const handleExcelExport = () => {
    if (!crmTargets || crmTargets.length === 0) {
      toast.error('No data to export');
      return;
    }

    // Define Excel headers
    const headers = [
      'TAHUN',
      'BULAN EXP DATE',
      'PRODUK',
      'PIC CRM',
      'SALES',
      'NAMA ASSOSIATE',
      'DIRECT OR ASSOCIATE',
      'NAMA PERUSAHAAN',
      'STATUS',
      'ALASAN',
      'CATEGORY',
      'KUADRAN',
      'PROVINSI',
      'KOTA',
      'ALAMAT',
      'AKREDITASI',
      'CAT AKRE',
      'EA CODE',
      'STD',
      'IA DATE',
      'EXP DATE',
      'TAHAP AUDIT',
      'HARGA KONTRAK',
      'BULAN TTD NOTIF',
      'HARGA TERUPDATE',
      'TRIMMING VALUE',
      'LOSS VALUE',
      'CASHBACK',
      'TERMIN PEMBAYARAN',
      'STATUS SERTIFIKAT',
      'TANGGAL KUNJUNGAN',
      'STATUS KUNJUNGAN',
    ];

    // Convert data to Excel format
    const excelData = [
      headers,
      ...crmTargets.map(target => [
        target.tahun || '',
        target.bulanExpDate || '',
        target.produk || '',
        target.picCrm || '',
        target.sales || '',
        target.namaAssociate || '',
        target.directOrAssociate || '',
        target.namaPerusahaan,
        target.status || '',
        target.alasan || '',
        target.category || '',
        target.kuadran || '',
        target.provinsi || '',
        target.kota || '',
        target.alamat || '',
        target.akreditasi || '',
        target.catAkre || '',
        target.eaCode || '',
        target.std || '',
        target.iaDate || '',
        target.expDate || '',
        target.tahapAudit || '',
        target.hargaKontrak || '',
        target.bulanTtdNotif || '',
        target.hargaTerupdate || '',
        target.trimmingValue || '',
        target.lossValue || '',
        target.cashback || '',
        target.terminPembayaran || '',
        target.statusSertifikat || '',
        target.tanggalKunjungan || '',
        target.statusKunjungan || '',
      ])
    ];

    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(excelData);

    // Set column widths
    const colWidths = [
      { wch: 10 }, // TAHUN
      { wch: 15 }, // BULAN EXP DATE
      { wch: 10 }, // PRODUK
      { wch: 10 }, // PIC CRM
      { wch: 10 }, // SALES
      { wch: 15 }, // NAMA ASSOSIATE
      { wch: 18 }, // DIRECT OR ASSOCIATE
      { wch: 40 }, // NAMA PERUSAHAAN
      { wch: 12 }, // STATUS
      { wch: 30 }, // ALASAN
      { wch: 10 }, // CATEGORY
      { wch: 10 }, // KUADRAN
      { wch: 15 }, // PROVINSI
      { wch: 20 }, // KOTA
      { wch: 50 }, // ALAMAT
      { wch: 12 }, // AKREDITASI
      { wch: 10 }, // CAT AKRE
      { wch: 10 }, // EA CODE
      { wch: 10 }, // STD
      { wch: 12 }, // IA DATE
      { wch: 12 }, // EXP DATE
      { wch: 12 }, // TAHAP AUDIT
      { wch: 15 }, // HARGA KONTRAK
      { wch: 15 }, // BULAN TTD NOTIF
      { wch: 15 }, // HARGA TERUPDATE
      { wch: 15 }, // TRIMMING VALUE
      { wch: 12 }, // LOSS VALUE
      { wch: 12 }, // CASHBACK
      { wch: 18 }, // TERMIN PEMBAYARAN
      { wch: 15 }, // STATUS SERTIFIKAT
      { wch: 15 }, // TANGGAL KUNJUNGAN
      { wch: 15 }, // STATUS KUNJUNGAN
    ];
    worksheet['!cols'] = colWidths;

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'CRM Data');

    // Generate file name with timestamp
    const fileName = `crm-data-${new Date().toISOString().split('T')[0]}.xlsx`;

    // Download file
    XLSX.writeFile(workbook, fileName);

    toast.success(`Successfully exported ${crmTargets.length} records to Excel!`);
  };

  if (crmTargets === undefined) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <InfinityLoader size="md" />
        <p className="mt-4 text-sm font-medium bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Loading CRM Management...
        </p>
      </div>
    );
  }

  return (
    <div className="lg:flex lg:flex-row gap-6 py-4 lg:py-8 px-4 lg:px-6">
      {/* LEFT SIDEBAR - FILTERS */}
      <div className="hidden lg:block lg:w-80 flex-shrink-0">
        <div className="sticky top-6 space-y-4">
          {/* Filter Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={resetAllFilters}
                  className="h-7 text-xs bg-red-600 hover:bg-red-700 cursor-pointer"
                >
                  Reset Filters
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Search */}
              <div>
                <Label className="mb-2 block">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Company, Sales, PIC..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Section Date */}
              <FilterSection
                title="Filter Date"
                isExpanded={expandedFilterSections.includes('date')}
                onToggle={() => toggleFilterSection('date')}
              >
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
              </FilterSection>

              {/* Section Details - PIC CRM */}
              <FilterSection
                title="Filter PIC CRM"
                isExpanded={expandedFilterSections.includes('details')}
                onToggle={() => toggleFilterSection('details')}
              >
                <FilterPicCrmSection
                  filterPicCrm={filterPicCrm}
                  setFilterPicCrm={setFilterPicCrm}
                  picCrmOptions={uniquePicCrms}
                />
              </FilterSection>

              {/* Section Company - Status, Category, Provinsi, Kota, Alasan */}
              <FilterSection
                title="Filter Company"
                isExpanded={expandedFilterSections.includes('lokasi')}
                onToggle={() => toggleFilterSection('lokasi')}
              >
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
              </FilterSection>

              {/* Section PIC Sales */}
              <FilterSection
                title="Filter PIC Sales"
                isExpanded={expandedFilterSections.includes('picSales')}
                onToggle={() => toggleFilterSection('picSales')}
              >
                <FilterPicSalesSection
                  filterPicSales={filterPicSales}
                  setFilterPicSales={setFilterPicSales}
                  salesOptions={salesOptions}
                />
              </FilterSection>

              {/* Section Sertifikat */}
              <FilterSection
                title="Filter Sertifikat"
                isExpanded={expandedFilterSections.includes('sertifikat')}
                onToggle={() => toggleFilterSection('sertifikat')}
              >
                <FilterSertifikatSection
                  filterStandar={filterStandar}
                  setFilterStandar={setFilterStandar}
                  filterAkreditasi={filterAkreditasi}
                  setFilterAkreditasi={setFilterAkreditasi}
                  filterStatusSertifikatTerbit={filterStatusSertifikat}
                  setFilterStatusSertifikatTerbit={setFilterStatusSertifikat}
                  filterStatus={filterStatus}
                  setFilterStatus={setFilterStatus}
                  standarOptions={standarOptions}
                />
              </FilterSection>

              {/* Section Jadwal Kunjungan */}
              <FilterSection
                title="Filter Jadwal Kunjungan"
                isExpanded={expandedFilterSections.includes('jadwal')}
                onToggle={() => toggleFilterSection('jadwal')}
              >
                <FilterKunjunganSection
                  filterFromKunjungan={filterFromKunjungan}
                  setFilterFromKunjungan={setFilterFromKunjungan}
                  filterToKunjungan={filterToKunjungan}
                  setFilterToKunjungan={setFilterToKunjungan}
                  filterStatusKunjungan={filterStatusKunjungan}
                  setFilterStatusKunjungan={setFilterStatusKunjungan}
                  bulanOptions={bulanOptions}
                />
              </FilterSection>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* MOBILE FILTERS */}
      <div className="lg:hidden mb-4">
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="mb-2 block">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Company, Sales, PIC..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label className="mb-2 block">Status</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={filterStatus === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterStatus("all")}
                    className={`flex items-center gap-1 text-xs h-8 px-2 cursor-pointer ${
                      filterStatus === "all"
                        ? "bg-primary text-primary-foreground border-primary"
                        : ""
                    }`}
                  >
                    All Status
                  </Button>
                  {uniqueStatuses.map((status) => {
                    const statusUpper = status?.toUpperCase() || '';
                    let statusColor = '';

                    switch (statusUpper) {
                      case 'PROSES':
                        statusColor = 'bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-300';
                        break;
                      case 'LANJUT':
                        statusColor = 'bg-green-100 hover:bg-green-200 text-green-700 border-green-300';
                        break;
                      case 'LOSS':
                        statusColor = 'bg-red-100 hover:bg-red-200 text-red-700 border-red-300';
                        break;
                      case 'SUSPEND':
                        statusColor = 'bg-orange-100 hover:bg-orange-200 text-orange-700 border-orange-300';
                        break;
                      case 'WAITING':
                        statusColor = 'bg-gray-200 hover:bg-gray-300 text-gray-700 border-gray-300';
                        break;
                      case 'DONE':
                        statusColor = 'bg-purple-100 hover:bg-purple-200 text-purple-700 border-purple-300';
                        break;
                      default:
                        statusColor = 'bg-gray-200 hover:bg-gray-300 text-gray-700 border-gray-300';
                    }

                    return (
                      <Button
                        key={status}
                        size="sm"
                        onClick={() => setFilterStatus(status)}
                        className={`flex items-center gap-1 text-xs h-8 px-2 border cursor-pointer ${
                          filterStatus === status
                            ? 'bg-black hover:bg-gray-800 text-white border-black'
                            : statusColor
                        }`}
                      >
                        {status}
                      </Button>
                    );
                  })}
                </div>
              </div>
              <div>
                <Label className="mb-2 block">PIC CRM</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={filterPicCrm === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterPicCrm("all")}
                    className="flex items-center gap-1 text-xs h-8 px-2 cursor-pointer"
                  >
                    All PIC
                  </Button>
                  {uniquePicCrms.map((pic) => (
                    <Button
                      key={pic}
                      variant={filterPicCrm === pic ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterPicCrm(pic)}
                      className="flex items-center gap-1 text-xs h-8 px-2 cursor-pointer"
                    >
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex-shrink-0"></div>
                      {pic}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 min-w-0 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">CRM Data Management</h1>
            <p className="text-muted-foreground mt-1">
              {selectedIds.size > 0
                ? `${selectedIds.size} item${selectedIds.size > 1 ? 's' : ''} selected`
                : `${filteredTargets.length} records found`
              }
            </p>
          </div>
          <div className="flex gap-2">
            {selectedIds.size > 0 && (
              <Button
                onClick={() => setIsBulkDeleteDialogOpen(true)}
                variant="destructive"
                size="sm"
                className='cursor-pointer'
                disabled={isImporting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete ({selectedIds.size})
              </Button>
            )}
            <Button onClick={handleExcelExport} variant="outline" size="sm" disabled={isImporting || selectedIds.size > 0}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" asChild disabled={isImporting || selectedIds.size > 0}>
              <label htmlFor="excel-upload" className={`cursor-pointer ${isImporting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <Upload className="h-4 w-4 mr-2" />
                {isImporting ? '...' : 'Import'}
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
            <Button onClick={() => setShowExcelFormModal(true)} size="sm" disabled={isImporting || selectedIds.size > 0} className='h-7 text-xs bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 cursor-pointer'>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="text-xs">Total Records</CardDescription>
              <CardTitle className="text-2xl">{crmTargets?.length || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="text-xs">Filtered Results</CardDescription>
              <CardTitle className="text-2xl">{filteredTargets.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="text-xs">Visited</CardDescription>
              <CardTitle className="text-2xl text-green-600">
                {crmTargets?.filter(t => t.tanggalKunjungan).length || 0}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="text-xs">Pending Visit</CardDescription>
              <CardTitle className="text-2xl text-orange-600">
                {crmTargets?.filter(t => !t.tanggalKunjungan).length || 0}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto relative">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 sticky left-0 bg-white z-10">
                      <Checkbox
                        ref={selectAllCheckboxRef}
                        checked={isAllSelected}
                        className='cursor-pointer'
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead className="w-12 sticky left-[1.5rem] bg-white z-10 ">No</TableHead>
                    <TableHead className="sticky left-[3.5rem] bg-white z-10 border-r border-border min-w-[200px]">Company</TableHead>
                    <TableHead>Bulan Exp</TableHead>
                    <TableHead>Produk</TableHead>
                    <TableHead>PIC CRM</TableHead>
                    <TableHead>Sales</TableHead>
                    <TableHead>Nama Associate</TableHead>
                    <TableHead>Direct/Assoc</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Alasan</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Kuadran</TableHead>
                    <TableHead>Provinsi</TableHead>
                    <TableHead>Kota</TableHead>
                    <TableHead>Alamat</TableHead>
                    <TableHead>Akreditasi</TableHead>
                    <TableHead>Cat Akre</TableHead>
                    <TableHead>EA Code</TableHead>
                    <TableHead>STD</TableHead>
                    <TableHead>IA Date</TableHead>
                    <TableHead>Exp Date</TableHead>
                    <TableHead>Tahap Audit</TableHead>
                    <TableHead>Harga Kontrak</TableHead>
                    <TableHead>Bulan TTD</TableHead>
                    <TableHead>Harga Update</TableHead>
                    <TableHead>Trimming</TableHead>
                    <TableHead>Loss</TableHead>
                    <TableHead>Cashback</TableHead>
                    <TableHead>Termin</TableHead>
                    <TableHead>Status Sertifikat</TableHead>
                    <TableHead>Tgl Kunjungan</TableHead>
                    <TableHead>Status Kunjungan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTargets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={34} className="text-center py-8">
                        No data found
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedTargets.map((target, index) => (
                      <TableRow
                        key={target._id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => {
                          setSelectedTarget(target);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()} className="sticky left-0 bg-white z-10 border-border">
                          <Checkbox
                            checked={selectedIds.has(target._id)}
                            onCheckedChange={(checked) => handleSelectRow(target._id, checked === true)}
                            aria-label={`Select ${target.namaPerusahaan}`}
                            className='cursor-pointer'
                          />
                        </TableCell>
                        <TableCell className="font-medium sticky left-[1.5rem] bg-white z-10 border-border">{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                        <TableCell className="font-medium sticky left-[3rem] bg-white z-10 border-r border-border min-w-[200px]">{target.namaPerusahaan}</TableCell>
                        <TableCell>{target.bulanExpDate || '-'}</TableCell>
                        <TableCell>{target.produk || '-'}</TableCell>
                        <TableCell>{target.picCrm}</TableCell>
                        <TableCell>{target.sales}</TableCell>
                        <TableCell>{target.namaAssociate || '-'}</TableCell>
                        <TableCell>{target.directOrAssociate || '-'}</TableCell>
                        <TableCell>
                          <Badge
                            variant={getStatusBadgeVariant(target.status)}
                            className={getStatusBadgeColor(target.status)}
                          >
                            {target.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{target.alasan || '-'}</TableCell>
                        <TableCell>
                          {target.category ? (
                            <Badge
                              variant="outline"
                              className={getCategoryBadgeStyle(target.category)}
                            >
                              {target.category}
                            </Badge>
                          ) : '-'}
                        </TableCell>
                        <TableCell>{target.kuadran || '-'}</TableCell>
                        <TableCell>{target.provinsi || '-'}</TableCell>
                        <TableCell>{target.kota || '-'}</TableCell>
                        <TableCell className="max-w-xs truncate" title={target.alamat}>{target.alamat || '-'}</TableCell>
                        <TableCell>{target.akreditasi || '-'}</TableCell>
                        <TableCell>{target.catAkre || '-'}</TableCell>
                        <TableCell>{target.eaCode || '-'}</TableCell>
                        <TableCell>{target.std || '-'}</TableCell>
                        <TableCell>{target.iaDate || '-'}</TableCell>
                        <TableCell>{target.expDate || '-'}</TableCell>
                        <TableCell>{target.tahapAudit || '-'}</TableCell>
                        <TableCell>
                          {target.hargaKontrak ? `Rp ${target.hargaKontrak.toLocaleString('id-ID')}` : '-'}
                        </TableCell>
                        <TableCell title={target.bulanTtdNotif || ''}>
                          {formatDateToDayMonth(target.bulanTtdNotif)}
                        </TableCell>
                        <TableCell>
                          {target.hargaTerupdate ? `Rp ${target.hargaTerupdate.toLocaleString('id-ID')}` : '-'}
                        </TableCell>
                        <TableCell>
                          {target.trimmingValue ? `Rp ${target.trimmingValue.toLocaleString('id-ID')}` : '-'}
                        </TableCell>
                        <TableCell>
                          {target.lossValue ? `Rp ${target.lossValue.toLocaleString('id-ID')}` : '-'}
                        </TableCell>
                        <TableCell>
                          {target.cashback ? `Rp ${target.cashback.toLocaleString('id-ID')}` : '-'}
                        </TableCell>
                        <TableCell>{target.terminPembayaran || '-'}</TableCell>
                        <TableCell>{target.statusSertifikat || '-'}</TableCell>
                        <TableCell>{formatTanggalKunjungan(target.tanggalKunjungan)}</TableCell>
                        <TableCell>
                          {target.statusKunjungan ? (
                            <Badge
                              variant="outline"
                              className={getStatusKunjunganBadgeStyle(target.statusKunjungan)}
                            >
                              {target.statusKunjungan}
                            </Badge>
                          ) : '-'}
                        </TableCell>

                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredTargets.length)} of {filteredTargets.length} results
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
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

      {/* Bulk Delete Dialog */}
      <Dialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Multiple CRM Targets</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedIds.size} item{selectedIds.size > 1 ? 's' : ''}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" className='cursor-pointer' onClick={() => setIsBulkDeleteDialogOpen(false)} disabled={isBulkDeleting}>Cancel</Button>
            <Button variant="destructive" className='cursor-pointer' onClick={handleBulkDelete} disabled={isBulkDeleting}>
              {isBulkDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </>
              ) : (
                <>Delete {selectedIds.size} Item{selectedIds.size > 1 ? 's' : ''}</>
              )}
            </Button>
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
                      <th className="p-2 border border-border text-left font-medium text-xs whitespace-nowrap min-w-[100px]">Produk</th>
                      <th className="p-2 border border-border text-left font-medium text-xs whitespace-nowrap min-w-[100px]">STD</th>
                      <th className="p-2 border border-border text-left font-medium text-xs whitespace-nowrap min-w-[100px]">Category</th>
                      <th className="p-2 border border-border text-left font-medium text-xs whitespace-nowrap min-w-[100px]">Kuadran</th>
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
                      <th className="p-2 border border-border text-left font-medium text-xs whitespace-nowrap min-w-[120px]">Bulan Exp</th>
                      <th className="p-2 border border-border text-left font-medium text-xs whitespace-nowrap min-w-[100px]">Tgl Kunjungan</th>
                      <th className="p-2 border border-border text-left font-medium text-xs whitespace-nowrap min-w-[100px]">Status Kunjungan</th>
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
    </div>
  );
}
