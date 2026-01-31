"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Search, Filter, BarChart3, ChevronDown, ChevronRight, Users, X } from 'lucide-react';
import indonesiaData from '@/data/indonesia-provinsi-kota.json';
import masterSalesData from '@/data/master-sales.json';
import masterStandarData from '@/data/master-standar.json';
import masterEaCodeData from '@/data/master-ea-code.json';
import { ChartCardCrmData } from '@/components/chart-card-crm-data';
import { ChartCardPencapaianMonthly } from '@/components/chart-card-pencapaian-monthly'
import { ChartCardKuadranMonthly } from '@/components/chart-card-kuadran-monthly';
import { ChartCardAssociateMonthly } from '@/components/chart-card-associate-monthly';
import { ChartCardStandarDistribution } from '@/components/chart-card-standar-distribution';
import { ChartCardEaCodeDistribution } from '@/components/chart-card-ea-code-distribution';
import { InfinityLoader } from '@/components/ui/infinity-loader';
import { DashboardSkeleton } from '@/components/dashboard-skeleton';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Legend, LabelList } from 'recharts';
import {
  FilterSection,
  FilterDateSection,
  FilterPicCrmSection,
  FilterCompanySection,
  FilterPicSalesSection,
  FilterSertifikatSection,
  FilterPembayaranSection,
  FilterKunjunganSection,
} from '@/components/filters';

interface CrmTarget {
  _id: Id<"crmTargets">;
  tahun?: string;
  bulanExpDate: string;
  produk: string;
  picCrm: string;
  sales: string;
  namaAssociate: string;
  namaPerusahaan: string;
  status: string;
  alasan?: string;
  category?: string;
  provinsi: string;
  kota: string;
  alamat: string;
  akreditasi?: string;
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

export default function CrmDataManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPicCrm, setFilterPicCrm] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedChartType, setSelectedChartType] = useState<string>('area');
  const [selectedAssociateChartType, setSelectedAssociateChartType] = useState<string>('area');
  const [selectedTopAssociateChartType, setSelectedTopAssociateChartType] = useState<string>('bar');
  const [selectedStandarChartType, setSelectedStandarChartType] = useState<string>('bar');
  const [selectedEaCodeChartType, setSelectedEaCodeChartType] = useState<string>('bar');
  const [activeFilterSheet, setActiveFilterSheet] = useState<string | null>(null);

  // Comprehensive Filters
  const [expandedFilterSections, setExpandedFilterSections] = useState<string[]>(['date', 'details', 'picSales', 'sertifikat', 'pembayaran', 'jadwal']);
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
  const [filterFromBulanTTD, setFilterFromBulanTTD] = useState<string>('1');
  const [filterToBulanTTD, setFilterToBulanTTD] = useState<string>('12');
  const [filterStatusSertifikat, setFilterStatusSertifikat] = useState<string>('Terbit');
  const [filterTermin, setFilterTermin] = useState<string>('all');
  const [filterTipeProduk, setFilterTipeProduk] = useState<string>('all');
  const [filterPicSales, setFilterPicSales] = useState<string>('all');
  const [filterFromKunjungan, setFilterFromKunjungan] = useState<string>('all');
  const [filterToKunjungan, setFilterToKunjungan] = useState<string>('all');
  const [filterStatusKunjungan, setFilterStatusKunjungan] = useState<string>('all');

  // State untuk deferred chart loading
  const [chartsVisible, setChartsVisible] = useState(false);

  // Fetch CRM targets
  const crmTargets = useQuery(api.crmTargets.getCrmTargets);
  const allUsers = useQuery(api.auth.getAllUsers);
  const staffUsers = allUsers?.filter(user => user.role === 'staff') || [];

  // Defer chart loading setelah initial render
  useEffect(() => {
    const timer = setTimeout(() => {
      setChartsVisible(true);
    }, 100); // Delay 100ms setelah initial render
    return () => clearTimeout(timer);
  }, []);

  // Filter options - Dynamic from crmTargets data
  const tahunOptions = ['2024', '2025', '2026', '2027', '2028', '2029', '2030', '2031', '2032', '2033', '2034'];
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
  const standarOptions = [...new Set(crmTargets?.map(t => t.std).filter(Boolean) || [])].sort() as string[];

  // Get unique produk values for Tipe Produk filter
  const produkOptions = [...new Set(crmTargets?.map(t => t.produk).filter(Boolean) || [])].sort() as string[];

  // Get sales options from master-sales.json
  const salesOptions = masterSalesData.map((sales: any) => sales.nama).sort();

  // Get provinsi options from Indonesia data
  const provinsiOptions = Object.keys(indonesiaData).sort();

  // Get unique provinsi values from actual data (for debugging)
  const provinsiFromData = [...new Set(crmTargets?.map(t => t.provinsi).filter(Boolean) || [])].sort();
  console.log('Provinsi from JSON (first 5):', provinsiOptions.slice(0, 5));
  console.log('Provinsi from Data (first 5):', provinsiFromData.slice(0, 5));
  console.log('Sample data provinsi values:', crmTargets?.slice(0, 3).map(t => ({ provinsi: t.provinsi, kota: t.kota })));

  // Get kota options based on selected provinsi from Indonesia data
  const kotaOptions = filterProvinsi !== 'all' && (indonesiaData as any)[filterProvinsi]
    ? [...new Set((indonesiaData as any)[filterProvinsi].kabupaten_kota)].sort() as string[]
    : [];

  // Tahapan Audit - Default options + dynamic from data
  const defaultTahapanAudit = ['IA', 'SV1', 'SV2', 'SV3', 'SV4', 'RC'];
  const tahapanAuditFromData = [...new Set(crmTargets?.map(t => t.tahapAudit).filter(Boolean) || [])];
  const tahapanAuditOptions = [...new Set([...defaultTahapanAudit, ...tahapanAuditFromData])].sort() as string[];

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
    setFilterFromBulanTTD('1');
    setFilterToBulanTTD('12');
    setFilterStatusSertifikat('Terbit');
    setFilterTermin('all');
    setFilterTipeProduk('all');
    setFilterPicSales('all');
    setFilterFromKunjungan('all');
    setFilterToKunjungan('all');
    setFilterStatusKunjungan('all');
    setSearchTerm('');
  };

  // Filter and search - OPTIMIZED with useMemo
  const filteredTargets = useMemo(() => {
    if (!crmTargets) return [];

    return crmTargets.filter(target => {
    // Search filter
    const matchesSearch = searchTerm === '' ||
      target.namaPerusahaan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      target.sales.toLowerCase().includes(searchTerm.toLowerCase()) ||
      target.picCrm.toLowerCase().includes(searchTerm.toLowerCase());

    // Date section filters
    const matchesTahun = filterTahun === 'all' || target.tahun === filterTahun;

    let matchesBulanExp = true;
    // Skip Bulan EXP filter for DONE status (DONE uses bulanTtdNotif instead)
    const isNotDoneStatus = target.status !== 'DONE';

    if (isNotDoneStatus && (filterFromBulanExp !== 'all' || filterToBulanExp !== 'all')) {
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
    // DONE status always passes Bulan EXP filter

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
    const matchesStandar = filterStandar === 'all' || target.std === filterStandar;
    const matchesAkreditasi = filterAkreditasi === 'all' || target.akreditasi === filterAkreditasi;
    const matchesEaCode = filterEaCode === '' || (target.eaCode || '').toLowerCase().includes(filterEaCode.toLowerCase());
    const matchesTahapAudit = filterTahapAudit === 'all' || target.tahapAudit === filterTahapAudit;
    const matchesStatusSertifikat = filterStatusSertifikat === 'all' || (target.statusSertifikat || '').trim().toLowerCase() === filterStatusSertifikat.toLowerCase();
    const matchesTermin = filterTermin === 'all' || target.terminPembayaran === filterTermin;

    // Tipe Produk filter
    let matchesTipeProduk = true;
    if (filterTipeProduk !== 'all') {
      const produkUpper = (target.produk || '').toUpperCase();
      if (filterTipeProduk === 'XMS') {
        matchesTipeProduk = produkUpper.includes('ISO');
      } else if (filterTipeProduk === 'SUSTAIN') {
        matchesTipeProduk = produkUpper.includes('ISPO');
      }
    }

    let matchesBulanTTD = true;
    // Only apply bulan TTD Notif filter for DONE status
    const isDoneStatus = target.status === 'DONE';

    if (isDoneStatus) {
      const ttdDate = target.bulanTtdNotif;
      if (ttdDate) {
        // Data has bulanTtdNotif, check if year and month match the filter
        const dateObj = new Date(ttdDate);
        const ttdYear = dateObj.getFullYear();
        const ttdMonth = dateObj.getMonth() + 1;

        // Check year match
        const yearMatches = filterTahun === 'all' || ttdYear.toString() === filterTahun;

        if (yearMatches) {
          // Year matches, now check month filter
          if (filterFromBulanTTD !== 'all' || filterToBulanTTD !== 'all') {
            const fromMonth = filterFromBulanTTD !== 'all' ? parseInt(filterFromBulanTTD) : 1;
            const toMonth = filterToBulanTTD !== 'all' ? parseInt(filterToBulanTTD) : 12;
            matchesBulanTTD = ttdMonth >= fromMonth && ttdMonth <= toMonth;
          }
          // If filter is 'all', include all data with bulanTtdNotif (year already matched)
        } else {
          // Year doesn't match
          matchesBulanTTD = false;
        }
      } else {
        // DONE status without bulanTtdNotif should be excluded
        matchesBulanTTD = false;
      }
    }
    // PROSES, SUSPEND, LOSS, WAITING status always pass bulan TTD Notif filter

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
           matchesKota && matchesStandar && matchesAkreditasi && matchesEaCode &&
           matchesTahapAudit && matchesBulanTTD && matchesStatusSertifikat &&
           matchesTermin && matchesTipeProduk && matchesKunjungan && matchesStatusKunjungan;
    });
  }, [
    crmTargets,
    searchTerm,
    filterTahun,
    filterFromBulanExp,
    filterToBulanExp,
    filterPicCrm,
    filterPicSales,
    filterStatus,
    filterAlasan,
    filterCategory,
    filterProvinsi,
    filterKota,
    filterStandar,
    filterAkreditasi,
    filterEaCode,
    filterTahapAudit,
    filterFromBulanTTD,
    filterToBulanTTD,
    filterStatusSertifikat,
    filterTermin,
    filterTipeProduk,
    filterFromKunjungan,
    filterToKunjungan,
    filterStatusKunjungan
  ]);

  // Pagination
  const totalPages = Math.ceil(filteredTargets.length / itemsPerPage);

  // Get paginated data
  const paginatedTargets = filteredTargets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Get unique values for filters - OPTIMIZED with useMemo
  const uniqueStatuses = useMemo(() =>
    [...new Set(crmTargets?.map(t => t.status) || [])].sort(),
    [crmTargets]
  );

  const uniquePicCrms = useMemo(() =>
    [...new Set(crmTargets?.map(t => t.picCrm) || [])].sort(),
    [crmTargets]
  );

  // Calculate lanjutContracts with useMemo for performance
  // Filter: Status DONE, Sertifikat Terbit, Ada bulanTtdNotif, Tahun dari bulanTtdNotif sesuai filter
  const lanjutContracts = useMemo(() => {
    if (!crmTargets) return 0;

    // DEBUG: Group all DONE data
    const allDoneData = crmTargets.filter(t => t.status === 'DONE');

    console.log('=== DEBUG lanjutContracts ===');
    console.log(`Filter Tahun: ${filterTahun}`);
    console.log(`Total SEMUA data DONE: ${allDoneData.length}`);

    // Group 1: DONE yang TIDAK punya bulanTtdNotif
    const noBulanTtd = allDoneData.filter(t => !t.bulanTtdNotif || t.bulanTtdNotif === '');
    const totalNoBulanTtd = Math.round(noBulanTtd.reduce((sum, t) => sum + (t.hargaTerupdate || 0), 0));
    console.log(`\n1. DONE TANPA bulanTtdNotif: ${noBulanTtd.length} data`);
    console.log(`   Total: Rp ${totalNoBulanTtd.toLocaleString('id-ID')}`);
    if (noBulanTtd.length > 0) {
      console.log('   Contoh data:', noBulanTtd.slice(0, 3).map(t => ({
        nama: t.namaPerusahaan,
        sertifikat: t.statusSertifikat,
        hargaTerupdate: t.hargaTerupdate
      })));
    }

    // Group 2: DONE dengan bulanTtdNotif tapi statusSertifikat BUKAN "Terbit"
    const withBulanTtdNotTerbit = allDoneData.filter(t => {
      const hasBulanTtdNotif = t.bulanTtdNotif && t.bulanTtdNotif !== '';
      const isSertifikatTerbit = (t.statusSertifikat || '').trim().toLowerCase() === 'terbit';
      return hasBulanTtdNotif && !isSertifikatTerbit;
    });
    const totalNotTerbit = Math.round(withBulanTtdNotTerbit.reduce((sum, t) => sum + (t.hargaTerupdate || 0), 0));
    console.log(`\n2. DONE dengan bulanTtdNotif tapi statusSertifikat BUKAN "Terbit": ${withBulanTtdNotTerbit.length} data`);
    console.log(`   Total: Rp ${totalNotTerbit.toLocaleString('id-ID')}`);
    if (withBulanTtdNotTerbit.length > 0) {
      console.log('   Contoh data:', withBulanTtdNotTerbit.slice(0, 3).map(t => ({
        nama: t.namaPerusahaan,
        sertifikat: t.statusSertifikat,
        ttdNotif: t.bulanTtdNotif,
        hargaTerupdate: t.hargaTerupdate
      })));
    }

    // Group 3: DONE dengan bulanTtdNotif, statusSertifikat "Terbit", tapi TAHUN TIDAK SESUAI
    const wrongYear = allDoneData.filter(t => {
      const hasBulanTtdNotif = t.bulanTtdNotif && t.bulanTtdNotif !== '';
      const isSertifikatTerbit = (t.statusSertifikat || '').trim().toLowerCase() === 'terbit';
      if (filterTahun !== 'all' && hasBulanTtdNotif && isSertifikatTerbit) {
        const ttdDate = new Date(t.bulanTtdNotif);
        const ttdYear = ttdDate.getFullYear();
        return ttdYear.toString() !== filterTahun;
      }
      return false;
    });
    const totalWrongYear = Math.round(wrongYear.reduce((sum, t) => sum + (t.hargaTerupdate || 0), 0));
    console.log(`\n3. DONE dengan bulanTtdNotif, Sertifikat "Terbit", tapi TAHUN TIDAK SESUAI: ${wrongYear.length} data`);
    console.log(`   Total: Rp ${totalWrongYear.toLocaleString('id-ID')}`);
    if (wrongYear.length > 0) {
      console.log('   Contoh data:', wrongYear.slice(0, 3).map(t => ({
        nama: t.namaPerusahaan,
        ttdNotif: t.bulanTtdNotif,
        tahunTTD: new Date(t.bulanTtdNotif).getFullYear(),
        hargaTerupdate: t.hargaTerupdate
      })));
    }

    // Group 4: YANG LOLOS FILTER (Done, Terbit, Ada bulanTtdNotif, Tahun sesuai)
    const doneDataWithTerbit = crmTargets.filter(t => {
      const isDone = t.status === 'DONE';
      const isSertifikatTerbit = (t.statusSertifikat || '').trim().toLowerCase() === 'terbit';
      const hasBulanTtdNotif = t.bulanTtdNotif && t.bulanTtdNotif !== '';

      // Check tahun dari bulanTtdNotif
      let matchesTahun = false;
      if (hasBulanTtdNotif) {
        if (filterTahun === 'all') {
          matchesTahun = true;
        } else {
          const ttdDate = new Date(t.bulanTtdNotif);
          const ttdYear = ttdDate.getFullYear();
          matchesTahun = ttdYear.toString() === filterTahun;
        }
      }

      return isDone && isSertifikatTerbit && hasBulanTtdNotif && matchesTahun;
    });
    const total = Math.round(doneDataWithTerbit.reduce((sum, t) => sum + (t.hargaTerupdate || 0), 0));
    console.log(`\n4. YANG LOLOS FILTER (Done + Terbit + Ada TTD + Tahun sesuai): ${doneDataWithTerbit.length} data`);
    console.log(`   Total: Rp ${total.toLocaleString('id-ID')}`);
    console.log('========================\n');

    return total;
  }, [crmTargets, filterTahun]);

  // Helper function to get status badge variant
  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    const statusUpper = status?.toUpperCase() || '';

    switch (statusUpper) {
      case 'PROSES':
        return 'default';
      case 'DONE':
        return 'secondary';
      case 'LOSS':
        return 'destructive';
      case 'SUSPEND':
        return 'outline';
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
      case 'DONE':
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

  // Format date helper
  const formatDateToDayMonth = (dateString: string | undefined): string => {
    if (!dateString) return '-';

    try {
      const date = new Date(dateString);
      const day = date.getDate();
      const monthNamesIndo = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const month = monthNamesIndo[date.getMonth()];
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    } catch (error) {
      return dateString;
    }
  };

  const formatTanggalKunjungan = (dateString: string | undefined): string => {
    if (!dateString) return '-';

    try {
      const date = new Date(dateString);
      const day = date.getDate();
      const monthNamesIndo = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const month = monthNamesIndo[date.getMonth()];
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    } catch (error) {
      return dateString;
    }
  };

  if (crmTargets === undefined) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <InfinityLoader size="md" />
        <p className="mt-4 text-sm font-medium bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Loading CRM Data...
        </p>
      </div>
    );
  }

  return (
    <div className="lg:flex lg:flex-row gap-6 py-4 lg:py-8 px-4 lg:px-6 pb-20 lg:pb-8">
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
                  filterFromBulanTTD={filterFromBulanTTD}
                  setFilterFromBulanTTD={setFilterFromBulanTTD}
                  filterToBulanTTD={filterToBulanTTD}
                  setFilterToBulanTTD={setFilterToBulanTTD}
                  tahunOptions={tahunOptions}
                  bulanOptions={bulanOptions}
                />
              </FilterSection>

              {/* Section Sertifikat */}
              <FilterSection
                title="Filter Sertifikat"
                isExpanded={expandedFilterSections.includes('sertifikat')}
                onToggle={() => toggleFilterSection('sertifikat')}
              >
                <FilterSertifikatSection
                  filterTipeProduk={filterTipeProduk}
                  setFilterTipeProduk={setFilterTipeProduk}
                  filterStandar={filterStandar}
                  setFilterStandar={setFilterStandar}
                  filterAkreditasi={filterAkreditasi}
                  setFilterAkreditasi={setFilterAkreditasi}
                  filterStatusSertifikat={filterStatusSertifikat}
                  setFilterStatusSertifikat={setFilterStatusSertifikat}
                  standarOptions={standarOptions}
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

      {/* MOBILE FILTERS - Bottom Tab Bar */}
      <div className="lg:hidden">
        {/* Bottom Tab Bar */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border lg:hidden safe-area-bottom">
          <div className="flex items-center justify-around px-2 py-1">
            {/* Date Filter */}
            <button
              onClick={() => setActiveFilterSheet(activeFilterSheet === 'date' ? null : 'date')}
              className={`flex flex-col items-center justify-center py-1 px-2 min-w-0 flex-1 ${
                activeFilterSheet === 'date' ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Filter className="h-5 w-5 mb-0.5" />
              <span className="text-[10px] font-medium leading-none">Date</span>
            </button>

            {/* Status */}
            <button
              onClick={() => setActiveFilterSheet(activeFilterSheet === 'status' ? null : 'status')}
              className={`flex flex-col items-center justify-center py-1 px-2 min-w-0 flex-1 ${
                activeFilterSheet === 'status' ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <BarChart3 className="h-5 w-5 mb-0.5" />
              <span className="text-[10px] font-medium leading-none">Status</span>
            </button>

            {/* PIC CRM */}
            <button
              onClick={() => setActiveFilterSheet(activeFilterSheet === 'picCrm' ? null : 'picCrm')}
              className={`flex flex-col items-center justify-center py-1 px-2 min-w-0 flex-1 ${
                activeFilterSheet === 'picCrm' ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Users className="h-5 w-5 mb-0.5" />
              <span className="text-[10px] font-medium leading-none">PIC</span>
            </button>

            {/* More Filters */}
            <button
              onClick={() => setActiveFilterSheet(activeFilterSheet === 'more' ? null : 'more')}
              className={`flex flex-col items-center justify-center py-1 px-2 min-w-0 flex-1 ${
                activeFilterSheet === 'more' ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <ChevronDown className="h-5 w-5 mb-0.5" />
              <span className="text-[10px] font-medium leading-none">More</span>
            </button>

            {/* Reset */}
            <button
              onClick={() => {
                resetAllFilters();
                setActiveFilterSheet(null);
              }}
              className="flex flex-col items-center justify-center py-1 px-2 min-w-0 flex-1 text-red-600"
            >
              <X className="h-5 w-5 mb-0.5" />
              <span className="text-[10px] font-medium leading-none">Reset</span>
            </button>
          </div>
        </div>

        {/* Action Sheet Overlay */}
        {activeFilterSheet && (
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setActiveFilterSheet(null)}
          >
            <div
              className="absolute bottom-[53px] left-0 right-0 bg-background border-t border-border rounded-t-2xl shadow-2xl max-h-[70vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Handle Bar */}
              <div className="flex justify-center py-2 border-b border-border/50 sticky top-0 bg-background z-10">
                <div className="w-10 h-1 bg-muted-foreground/30 rounded-full"></div>
              </div>

              {/* Date Filter Sheet */}
              {activeFilterSheet === 'date' && (
                <div className="p-4 space-y-4">
                  <h3 className="text-sm font-semibold mb-3">Filter Date</h3>

                  {/* Tahun */}
                  <div>
                    <Label className="mb-1.5 block text-xs">Tahun</Label>
                    <Select value={filterTahun} onValueChange={setFilterTahun}>
                      <SelectTrigger className="w-full h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Tahun</SelectItem>
                        {tahunOptions.map(tahun => (
                          <SelectItem key={tahun} value={tahun}>{tahun}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* From/To Bulan Exp */}
                  <div className="space-y-2">
                    <Label className="mb-1.5 block text-xs">Bulan Exp Date Range</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="mb-1 block text-[10px] text-muted-foreground">From</Label>
                        <Select value={filterFromBulanExp} onValueChange={setFilterFromBulanExp}>
                          <SelectTrigger className="w-full h-9 text-xs">
                            <SelectValue placeholder="From" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            {bulanOptions.map(bulan => (
                              <SelectItem key={bulan.value} value={bulan.value}>{bulan.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="mb-1 block text-[10px] text-muted-foreground">To</Label>
                        <Select value={filterToBulanExp} onValueChange={setFilterToBulanExp}>
                          <SelectTrigger className="w-full h-9 text-xs">
                            <SelectValue placeholder="To" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            {bulanOptions.map(bulan => (
                              <SelectItem key={bulan.value} value={bulan.value}>{bulan.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* From/To Bulan TTD */}
                  <div className="space-y-2">
                    <Label className="mb-1.5 block text-xs">Bulan TTD Range</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="mb-1 block text-[10px] text-muted-foreground">From</Label>
                        <Select value={filterFromBulanTTD} onValueChange={setFilterFromBulanTTD}>
                          <SelectTrigger className="w-full h-9 text-xs">
                            <SelectValue placeholder="From" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            {bulanOptions.map(bulan => (
                              <SelectItem key={bulan.value} value={bulan.value}>{bulan.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="mb-1 block text-[10px] text-muted-foreground">To</Label>
                        <Select value={filterToBulanTTD} onValueChange={setFilterToBulanTTD}>
                          <SelectTrigger className="w-full h-9 text-xs">
                            <SelectValue placeholder="To" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            {bulanOptions.map(bulan => (
                              <SelectItem key={bulan.value} value={bulan.value}>{bulan.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveFilterSheet(null)}
                    className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium text-sm mt-2"
                  >
                    Done
                  </button>
                </div>
              )}

              {/* Status Sheet */}
              {activeFilterSheet === 'status' && (
                <div className="p-4 space-y-2">
                  <h3 className="text-sm font-semibold mb-3">Filter by Status</h3>
                  <button
                    onClick={() => { setFilterStatus('all'); setActiveFilterSheet(null); }}
                    className={`w-full text-left py-3 px-4 rounded-lg font-medium text-sm ${
                      filterStatus === 'all'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    All Status
                  </button>
                  {uniqueStatuses.map((status) => {
                    const statusUpper = status?.toUpperCase() || '';
                    let statusColor = '';

                    switch (statusUpper) {
                      case 'PROSES':
                        statusColor = 'bg-blue-100 hover:bg-blue-200 text-blue-700';
                        break;
                      case 'LANJUT':
                        statusColor = 'bg-green-100 hover:bg-green-200 text-green-700';
                        break;
                      case 'LOSS':
                        statusColor = 'bg-red-100 hover:bg-red-200 text-red-700';
                        break;
                      case 'SUSPEND':
                        statusColor = 'bg-orange-100 hover:bg-orange-200 text-orange-700';
                        break;
                      case 'WAITING':
                        statusColor = 'bg-gray-200 hover:bg-gray-300 text-gray-700';
                        break;
                      case 'DONE':
                        statusColor = 'bg-purple-100 hover:bg-purple-200 text-purple-700';
                        break;
                      default:
                        statusColor = 'bg-gray-200 hover:bg-gray-300 text-gray-700';
                    }

                    return (
                      <button
                        key={status}
                        onClick={() => { setFilterStatus(status); setActiveFilterSheet(null); }}
                        className={`w-full text-left py-3 px-4 rounded-lg font-medium text-sm ${
                          filterStatus === status
                            ? 'bg-primary text-primary-foreground'
                            : statusColor
                        }`}
                      >
                        {status}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* PIC CRM Sheet */}
              {activeFilterSheet === 'picCrm' && (
                <div className="p-4 space-y-2">
                  <h3 className="text-sm font-semibold mb-3">Filter by PIC CRM</h3>
                  <button
                    onClick={() => { setFilterPicCrm('all'); setActiveFilterSheet(null); }}
                    className={`w-full text-left py-3 px-4 rounded-lg font-medium text-sm flex items-center gap-2 ${
                      filterPicCrm === 'all'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    <Users className="h-4 w-4" />
                    All PIC
                  </button>
                  {uniquePicCrms.map((pic) => (
                    <button
                      key={pic}
                      onClick={() => { setFilterPicCrm(pic); setActiveFilterSheet(null); }}
                      className={`w-full text-left py-3 px-4 rounded-lg font-medium text-sm flex items-center gap-2 ${
                        filterPicCrm === pic
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
                      {pic}
                    </button>
                  ))}
                </div>
              )}

              {/* More Filters Sheet - Complete with Sections */}
              {activeFilterSheet === 'more' && (
                <div className="space-y-3">
                  {/* PIC Sales Section */}
                  <div className="border rounded-lg overflow-hidden mx-4 mt-4">
                    <button
                      onClick={() => {
                        const newSections = expandedFilterSections.includes('picSales')
                          ? expandedFilterSections.filter(s => s !== 'picSales')
                          : [...expandedFilterSections, 'picSales'];
                        setExpandedFilterSections(newSections);
                      }}
                      className="w-full flex items-center justify-between p-3 bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                    >
                      <span className="font-medium text-xs">Filter PIC Sales</span>
                      {expandedFilterSections.includes('picSales') ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    {expandedFilterSections.includes('picSales') && (
                      <div className="p-3 border-t">
                        <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                          <button
                            onClick={() => setFilterPicSales('all')}
                            className={`py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1 ${
                              filterPicSales === 'all'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted hover:bg-muted/80'
                            }`}
                          >
                            <Users className="h-3 w-3" />
                            All Sales
                          </button>
                          {salesOptions.slice(0, 20).map((sales) => (
                            <button
                              key={sales}
                              onClick={() => setFilterPicSales(sales)}
                              className={`py-2 px-2 rounded-lg text-xs font-medium flex items-center gap-1 ${
                                filterPicSales === sales
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted hover:bg-muted/80'
                              }`}
                            >
                              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex-shrink-0"></div>
                              <span className="truncate">{sales}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Details Section */}
                  <div className="border rounded-lg overflow-hidden mx-4">
                    <button
                      onClick={() => {
                        const newSections = expandedFilterSections.includes('details')
                          ? expandedFilterSections.filter(s => s !== 'details')
                          : [...expandedFilterSections, 'details'];
                        setExpandedFilterSections(newSections);
                      }}
                      className="w-full flex items-center justify-between p-3 bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                    >
                      <span className="font-medium text-xs">Filter Details</span>
                      {expandedFilterSections.includes('details') ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    {expandedFilterSections.includes('details') && (
                      <div className="p-3 space-y-3 border-t">
                        {/* Alasan */}
                        <div>
                          <Label className="mb-1.5 block text-xs">Alasan</Label>
                          <Select value={filterAlasan} onValueChange={setFilterAlasan}>
                            <SelectTrigger className="w-full h-9 text-xs">
                              <SelectValue placeholder="All Alasan" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Alasan</SelectItem>
                              {alasanOptions.map((alasan) => (
                                <SelectItem key={alasan} value={alasan}>{alasan}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Category */}
                        <div>
                          <Label className="mb-1.5 block text-xs">Category</Label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => setFilterCategory('all')}
                              className={`py-2 px-3 rounded-lg text-xs font-medium ${
                                filterCategory === 'all'
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted hover:bg-muted/80'
                              }`}
                            >
                              All
                            </button>
                            {['GOLD', 'SILVER', 'BRONZE'].map((category) => {
                              let categoryColor = '';
                              switch (category) {
                                case 'GOLD':
                                  categoryColor = 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800';
                                  break;
                                case 'SILVER':
                                  categoryColor = 'bg-gray-100 hover:bg-gray-200 text-gray-800';
                                  break;
                                case 'BRONZE':
                                  categoryColor = 'bg-orange-100 hover:bg-orange-200 text-orange-800';
                                  break;
                              }
                              return (
                                <button
                                  key={category}
                                  onClick={() => setFilterCategory(category)}
                                  className={`py-2 px-3 rounded-lg text-xs font-medium ${
                                    filterCategory === category
                                      ? 'bg-primary text-primary-foreground'
                                      : categoryColor
                                  }`}
                                >
                                  {category}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Lokasi Section */}
                  <div className="border rounded-lg overflow-hidden mx-4">
                    <button
                      onClick={() => {
                        const newSections = expandedFilterSections.includes('lokasi')
                          ? expandedFilterSections.filter(s => s !== 'lokasi')
                          : [...expandedFilterSections, 'lokasi'];
                        setExpandedFilterSections(newSections);
                      }}
                      className="w-full flex items-center justify-between p-3 bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                    >
                      <span className="font-medium text-xs">Filter Lokasi</span>
                      {expandedFilterSections.includes('lokasi') ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    {expandedFilterSections.includes('lokasi') && (
                      <div className="p-3 space-y-3 border-t">
                        {/* Provinsi */}
                        <div>
                          <Label className="mb-1.5 block text-xs">Provinsi</Label>
                          <Select
                            value={filterProvinsi}
                            onValueChange={(val) => {
                              setFilterProvinsi(val);
                              setFilterKota('all');
                            }}
                          >
                            <SelectTrigger className="w-full h-9 text-xs">
                              <SelectValue placeholder="All Provinsi" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Provinsi</SelectItem>
                              {provinsiOptions.slice(0, 30).map((provinsi) => (
                                <SelectItem key={provinsi} value={provinsi}>{provinsi}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Kota */}
                        {filterProvinsi !== 'all' && (
                          <div>
                            <Label className="mb-1.5 block text-xs">Kota</Label>
                            <Select value={filterKota} onValueChange={setFilterKota}>
                              <SelectTrigger className="w-full h-9 text-xs">
                                <SelectValue placeholder="All Kota" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Kota</SelectItem>
                                {kotaOptions.map((kota) => (
                                  <SelectItem key={kota} value={kota}>{kota}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Sertifikat Section */}
                  <div className="border rounded-lg overflow-hidden mx-4">
                    <button
                      onClick={() => {
                        const newSections = expandedFilterSections.includes('sertifikat')
                          ? expandedFilterSections.filter(s => s !== 'sertifikat')
                          : [...expandedFilterSections, 'sertifikat'];
                        setExpandedFilterSections(newSections);
                      }}
                      className="w-full flex items-center justify-between p-3 bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                    >
                      <span className="font-medium text-xs">Filter Sertifikat</span>
                      {expandedFilterSections.includes('sertifikat') ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    {expandedFilterSections.includes('sertifikat') && (
                      <div className="p-3 space-y-3 border-t">
                        {/* Standar */}
                        <div>
                          <Label className="mb-1.5 block text-xs">Standar</Label>
                          <Select value={filterStandar} onValueChange={setFilterStandar}>
                            <SelectTrigger className="w-full h-9 text-xs">
                              <SelectValue placeholder="All Standar" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Standar</SelectItem>
                              {standarOptions.map((standar) => (
                                <SelectItem key={standar} value={standar}>{standar}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Akreditasi */}
                        <div>
                          <Label className="mb-1.5 block text-xs">Akreditasi</Label>
                          <div className="grid grid-cols-3 gap-2">
                            <button
                              onClick={() => setFilterAkreditasi('all')}
                              className={`py-2 px-3 rounded-lg text-xs font-medium ${
                                filterAkreditasi === 'all'
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted hover:bg-muted/80'
                              }`}
                            >
                              All
                            </button>
                            {['KAN', 'NON AKRE'].map((akreditasi) => (
                              <button
                                key={akreditasi}
                                onClick={() => setFilterAkreditasi(akreditasi)}
                                className={`py-2 px-3 rounded-lg text-xs font-medium ${
                                  filterAkreditasi === akreditasi
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted hover:bg-muted/80'
                                }`}
                              >
                                {akreditasi}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* EA Code */}
                        <div>
                          <Label className="mb-1.5 block text-xs">EA Code</Label>
                          <Input
                            placeholder="Search EA Code..."
                            value={filterEaCode}
                            onChange={(e) => setFilterEaCode(e.target.value)}
                            className="h-9"
                          />
                        </div>

                        {/* Tahapan Audit */}
                        <div>
                          <Label className="mb-1.5 block text-xs">Tahapan Audit</Label>
                          <Select value={filterTahapAudit} onValueChange={setFilterTahapAudit}>
                            <SelectTrigger className="w-full h-9 text-xs">
                              <SelectValue placeholder="All Tahapan" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Tahapan</SelectItem>
                              {tahapanAuditOptions.map((tahap) => (
                                <SelectItem key={tahap} value={tahap}>{tahap}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Status Sertifikat */}
                        <div>
                          <Label className="mb-1.5 block text-xs">Status Sertifikat</Label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => setFilterStatusSertifikat('all')}
                              className={`py-2 px-3 rounded-lg text-xs font-medium ${
                                filterStatusSertifikat === 'all'
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted hover:bg-muted/80'
                              }`}
                            >
                              All
                            </button>
                            {['Terbit', 'Belum Terbit'].map((status) => (
                              <button
                                key={status}
                                onClick={() => setFilterStatusSertifikat(status)}
                                className={`py-2 px-3 rounded-lg text-xs font-medium ${
                                  filterStatusSertifikat === status
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted hover:bg-muted/80'
                                }`}
                              >
                                {status}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Pembayaran Section */}
                  <div className="border rounded-lg overflow-hidden mx-4">
                    <button
                      onClick={() => {
                        const newSections = expandedFilterSections.includes('pembayaran')
                          ? expandedFilterSections.filter(s => s !== 'pembayaran')
                          : [...expandedFilterSections, 'pembayaran'];
                        setExpandedFilterSections(newSections);
                      }}
                      className="w-full flex items-center justify-between p-3 bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                    >
                      <span className="font-medium text-xs">Filter Pembayaran</span>
                      {expandedFilterSections.includes('pembayaran') ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    {expandedFilterSections.includes('pembayaran') && (
                      <div className="p-3 space-y-3 border-t">
                        {/* Termin */}
                        <div>
                          <Label className="mb-1.5 block text-xs">Termin</Label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => setFilterTermin('all')}
                              className={`py-2 px-3 rounded-lg text-xs font-medium ${
                                filterTermin === 'all'
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted hover:bg-muted/80'
                              }`}
                            >
                              All
                            </button>
                            {['DP', 'Lunas Diawal', 'Lunas Diakhir'].map((termin) => (
                              <button
                                key={termin}
                                onClick={() => setFilterTermin(termin)}
                                className={`py-2 px-3 rounded-lg text-xs font-medium ${
                                  filterTermin === termin
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted hover:bg-muted/80'
                                }`}
                              >
                                {termin}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Tipe Produk */}
                        <div>
                          <Label className="mb-1.5 block text-xs">Tipe Produk</Label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => setFilterTipeProduk('all')}
                              className={`py-2 px-3 rounded-lg text-xs font-medium ${
                                filterTipeProduk === 'all'
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted hover:bg-muted/80'
                              }`}
                            >
                              All
                            </button>
                            {['XMS', 'SUSTAIN'].map((tipe) => {
                              let tipeColor = '';
                              switch (tipe) {
                                case 'XMS':
                                  tipeColor = 'bg-blue-100 hover:bg-blue-200 text-blue-700';
                                  break;
                                case 'SUSTAIN':
                                  tipeColor = 'bg-green-100 hover:bg-green-200 text-green-700';
                                  break;
                              }
                              return (
                                <button
                                  key={tipe}
                                  onClick={() => setFilterTipeProduk(tipe)}
                                  className={`py-2 px-3 rounded-lg text-xs font-medium ${
                                    filterTipeProduk === tipe
                                      ? 'bg-primary text-primary-foreground'
                                      : tipeColor
                                  }`}
                                >
                                  {tipe}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Jadwal Kunjungan Section */}
                  <div className="border rounded-lg overflow-hidden mx-4 mb-4">
                    <button
                      onClick={() => {
                        const newSections = expandedFilterSections.includes('jadwal')
                          ? expandedFilterSections.filter(s => s !== 'jadwal')
                          : [...expandedFilterSections, 'jadwal'];
                        setExpandedFilterSections(newSections);
                      }}
                      className="w-full flex items-center justify-between p-3 bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                    >
                      <span className="font-medium text-xs">Filter Jadwal Kunjungan</span>
                      {expandedFilterSections.includes('jadwal') ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    {expandedFilterSections.includes('jadwal') && (
                      <div className="p-3 space-y-3 border-t">
                        {/* Jadwal Kunjungan */}
                        <div>
                          <Label className="mb-1.5 block text-xs">Jadwal Kunjungan</Label>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="mb-1 block text-[10px] text-muted-foreground">From</Label>
                              <Select value={filterFromKunjungan} onValueChange={setFilterFromKunjungan}>
                                <SelectTrigger className="w-full h-9 text-xs">
                                  <SelectValue placeholder="From" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">All</SelectItem>
                                  {bulanOptions.map(bulan => (
                                    <SelectItem key={bulan.value} value={bulan.value}>{bulan.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="mb-1 block text-[10px] text-muted-foreground">To</Label>
                              <Select value={filterToKunjungan} onValueChange={setFilterToKunjungan}>
                                <SelectTrigger className="w-full h-9 text-xs">
                                  <SelectValue placeholder="To" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">All</SelectItem>
                                  {bulanOptions.map(bulan => (
                                    <SelectItem key={bulan.value} value={bulan.value}>{bulan.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>

                        {/* Status Kunjungan */}
                        <div>
                          <Label className="mb-1.5 block text-xs">Status Kunjungan</Label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => setFilterStatusKunjungan('all')}
                              className={`py-2 px-3 rounded-lg text-xs font-medium ${
                                filterStatusKunjungan === 'all'
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted hover:bg-muted/80'
                              }`}
                            >
                              All
                            </button>
                            {['VISITED', 'NOT YET'].map((status) => {
                              let statusColor = '';
                              switch (status) {
                                case 'VISITED':
                                  statusColor = 'bg-green-100 hover:bg-green-200 text-green-700';
                                  break;
                                case 'NOT YET':
                                  statusColor = 'bg-gray-200 hover:bg-gray-300 text-gray-700';
                                  break;
                              }
                              return (
                                <button
                                  key={status}
                                  onClick={() => setFilterStatusKunjungan(status)}
                                  className={`py-2 px-3 rounded-lg text-xs font-medium ${
                                    filterStatusKunjungan === status
                                      ? 'bg-primary text-primary-foreground'
                                      : statusColor
                                  }`}
                                >
                                  {status}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setActiveFilterSheet(null)}
                    className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium text-sm mx-4 mb-4"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 min-w-0 space-y-6">
        {/* Loading State - Show Skeleton */}
        {(crmTargets === undefined || crmTargets === null) && (
          <DashboardSkeleton />
        )}

        {/* Actual Content - Only render when data is loaded */}
        {crmTargets && (
          <>
            {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              CRM Dashboard Pencapaian
              {filterTahun !== 'all' && (
                <span className="ml-3 text-lg sm:text-2xl font-semibold text-primary">
                  {filterTahun}
                </span>
              )}
            </h1>
            <p className="text-muted-foreground mt-1">
              {filteredTargets.length} records found
            </p>
          </div>
          {/* Filter Tagline - Desktop Only */}
          <div className="hidden lg:block">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-muted-foreground">Active Filters:</span>

              {/* Tahun */}
              {filterTahun !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  <span className="font-semibold">Tahun:</span> {filterTahun}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => setFilterTahun(currentYear)}
                  />
                </Badge>
              )}

              {/* Bulan Exp Range */}
              {(filterFromBulanExp !== 'all' || filterToBulanExp !== 'all') && (
                <Badge variant="secondary" className="gap-1">
                  <span className="font-semibold">Bulan Exp:</span>
                  {filterFromBulanExp !== 'all' ? bulanOptions.find(b => b.value === filterFromBulanExp)?.label : 'All'}
                  {filterFromBulanExp !== 'all' && filterToBulanExp !== 'all' ? ' - ' : ''}
                  {filterToBulanExp !== 'all' ? bulanOptions.find(b => b.value === filterToBulanExp)?.label : ''}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => {
                      setFilterFromBulanExp('all');
                      setFilterToBulanExp('all');
                    }}
                  />
                </Badge>
              )}

              {/* Bulan TTD Range */}
              {(filterFromBulanTTD !== '1' || filterToBulanTTD !== '12') && (
                <Badge variant="secondary" className="gap-1">
                  <span className="font-semibold">Bulan TTD:</span>
                  {bulanOptions.find(b => b.value === filterFromBulanTTD)?.label}
                  {filterFromBulanTTD !== filterToBulanTTD ? ` - ${bulanOptions.find(b => b.value === filterToBulanTTD)?.label}` : ''}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => {
                      setFilterFromBulanTTD('1');
                      setFilterToBulanTTD('12');
                    }}
                  />
                </Badge>
              )}

              {/* Status */}
              {filterStatus !== 'all' && (
                <Badge
                  variant="secondary"
                  className={`${getStatusBadgeColor(filterStatus)} gap-1`}
                >
                  <span className="font-semibold">Status:</span> {filterStatus}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-white"
                    onClick={() => setFilterStatus('all')}
                  />
                </Badge>
              )}

              {/* PIC CRM */}
              {filterPicCrm !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  <span className="font-semibold">PIC CRM:</span> {filterPicCrm}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => setFilterPicCrm('all')}
                  />
                </Badge>
              )}

              {/* PIC Sales */}
              {filterPicSales !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  <span className="font-semibold">Sales:</span> {filterPicSales}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => setFilterPicSales('all')}
                  />
                </Badge>
              )}

              {/* Alasan */}
              {filterAlasan !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  <span className="font-semibold">Alasan:</span> {filterAlasan}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => setFilterAlasan('all')}
                  />
                </Badge>
              )}

              {/* Category */}
              {filterCategory !== 'all' && (
                <Badge
                  variant="secondary"
                  className={`${getCategoryBadgeStyle(filterCategory)} gap-1`}
                >
                  <span className="font-semibold">Category:</span> {filterCategory}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-white"
                    onClick={() => setFilterCategory('all')}
                  />
                </Badge>
              )}

              {/* Provinsi */}
              {filterProvinsi !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  <span className="font-semibold">Provinsi:</span> {filterProvinsi}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => {
                      setFilterProvinsi('all');
                      setFilterKota('all');
                    }}
                  />
                </Badge>
              )}

              {/* Kota */}
              {filterKota !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  <span className="font-semibold">Kota:</span> {filterKota}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => setFilterKota('all')}
                  />
                </Badge>
              )}

              {/* Standar */}
              {filterStandar !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  <span className="font-semibold">Standar:</span> {filterStandar}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => setFilterStandar('all')}
                  />
                </Badge>
              )}

              {/* Akreditasi */}
              {filterAkreditasi !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  <span className="font-semibold">Akreditasi:</span> {filterAkreditasi}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => setFilterAkreditasi('all')}
                  />
                </Badge>
              )}

              {/* EA Code */}
              {filterEaCode && (
                <Badge variant="secondary" className="gap-1">
                  <span className="font-semibold">EA Code:</span> {filterEaCode}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => setFilterEaCode('')}
                  />
                </Badge>
              )}

              {/* Tahap Audit */}
              {filterTahapAudit !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  <span className="font-semibold">Tahap:</span> {filterTahapAudit}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => setFilterTahapAudit('all')}
                  />
                </Badge>
              )}

              {/* Status Sertifikat */}
              {filterStatusSertifikat !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  <span className="font-semibold">Sertifikat:</span> {filterStatusSertifikat}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => setFilterStatusSertifikat('all')}
                  />
                </Badge>
              )}

              {/* Termin */}
              {filterTermin !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  <span className="font-semibold">Termin:</span> {filterTermin}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => setFilterTermin('all')}
                  />
                </Badge>
              )}

              {/* Tipe Produk */}
              {filterTipeProduk !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  <span className="font-semibold">Produk:</span> {filterTipeProduk}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => setFilterTipeProduk('all')}
                  />
                </Badge>
              )}

              {/* Jadwal Kunjungan Range */}
              {(filterFromKunjungan !== 'all' || filterToKunjungan !== 'all') && (
                <Badge variant="secondary" className="gap-1">
                  <span className="font-semibold">Kunjungan:</span>
                  {filterFromKunjungan !== 'all' ? bulanOptions.find(b => b.value === filterFromKunjungan)?.label : 'All'}
                  {filterFromKunjungan !== 'all' && filterToKunjungan !== 'all' ? ' - ' : ''}
                  {filterToKunjungan !== 'all' ? bulanOptions.find(b => b.value === filterToKunjungan)?.label : ''}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => {
                      setFilterFromKunjungan('all');
                      setFilterToKunjungan('all');
                    }}
                  />
                </Badge>
              )}

              {/* Status Kunjungan */}
              {filterStatusKunjungan !== 'all' && (
                <Badge
                  variant="secondary"
                  className={`${getStatusKunjunganBadgeStyle(filterStatusKunjungan)} gap-1`}
                >
                  <span className="font-semibold">Status Kunjungan:</span> {filterStatusKunjungan}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-white"
                    onClick={() => setFilterStatusKunjungan('all')}
                  />
                </Badge>
              )}

              {/* Reset All Filters Button */}
              {(filterTahun !== 'all' ||
                filterFromBulanExp !== 'all' || filterToBulanExp !== 'all' ||
                filterFromBulanTTD !== 'all' || filterToBulanTTD !== 'all' ||
                filterStatus !== 'all' ||
                filterPicCrm !== 'all' ||
                filterPicSales !== 'all' ||
                filterAlasan !== 'all' ||
                filterCategory !== 'all' ||
                filterProvinsi !== 'all' ||
                filterKota !== 'all' ||
                filterStandar !== 'all' ||
                filterAkreditasi !== 'all' ||
                filterEaCode !== '' ||
                filterTahapAudit !== 'all' ||
                filterStatusSertifikat !== 'all' ||
                filterTermin !== 'all' ||
                filterTipeProduk !== 'all' ||
                filterFromKunjungan !== 'all' || filterToKunjungan !== 'all' ||
                filterStatusKunjungan !== 'all' ||
                searchTerm !== '') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetAllFilters}
                  className="h-7 text-xs cursor-pointer bg-destructive text-destructive-foreground text-white hover:text-red-500"
                >
                  Reset All
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Total Target Card - Combined MRC & DHA */}
        <Card>
          <CardContent className="px-6">
            {(() => {
              // Calculate TOTAL from ALL data (without filters) - this stays constant
              const allData = (crmTargets || []);

              const totalAllContracts = Math.round(allData.reduce((sum, t) => sum + (t.hargaKontrak || 0), 0));

              // Calculate total amount by status from hargaTerupdate (except WAITING uses hargaKontrak)
              const totalDoneAmount = Math.round(allData.filter(t => t.status === 'DONE').reduce((sum, t) => sum + (t.hargaTerupdate || 0), 0));
              const totalProsesAmount = Math.round(allData.filter(t => t.status === 'PROSES').reduce((sum, t) => sum + (t.hargaTerupdate || 0), 0));
              const totalSuspendAmount = Math.round(allData.filter(t => t.status === 'SUSPEND').reduce((sum, t) => sum + (t.hargaTerupdate || 0), 0));
              const totalLossAmount = Math.round(allData.filter(t => t.status === 'LOSS').reduce((sum, t) => sum + (t.hargaTerupdate || 0), 0));
              const totalWaitingAmount = Math.round(allData.filter(t => t.status === 'WAITING').reduce((sum, t) => sum + (t.hargaKontrak || 0), 0));

              // Calculate total unique companies
              const allCompanies = new Set(allData.map(t => t.namaPerusahaan));
              const totalAllCompanies = allCompanies.size;

              // Calculate FILTERED data - this changes based on filters
              const filteredData = (filteredTargets || []);

              // Calculate total unique companies from filtered data
              const filteredCompanies = new Set(filteredData.map(t => t.namaPerusahaan));
              const totalFilteredCompanies = filteredCompanies.size;

              const totalFilteredContracts = Math.round(filteredData.reduce((sum, t) => sum + (t.hargaKontrak || 0), 0));

              const lossContracts = Math.round(filteredData
                .filter(t => t.status === 'LOSS')
                .reduce((sum, t) => sum + (t.hargaTerupdate || 0), 0));
              const suspendContracts = Math.round(filteredData
                .filter(t => t.status === 'SUSPEND')
                .reduce((sum, t) => sum + (t.hargaTerupdate || 0), 0));
              const prosesContracts = Math.round(filteredData
                .filter(t => t.status === 'PROSES')
                .reduce((sum, t) => sum + (t.hargaTerupdate || 0), 0));
              const waitingContracts = Math.round(filteredData
                .filter(t => t.status === 'WAITING')
                .reduce((sum, t) => sum + (t.hargaKontrak || 0), 0));

              // Calculate Total Nilai Kontrak based on:
              // 1. hargaKontrak
              // 2. statusSertifikat = "Terbit" (always fixed)
              // 3. tahun (year filter)
              const totalNilaiKontrak = Math.round(
                allData
                  .filter(t => {
                    // Filter by tahun
                    const matchesTahun = filterTahun === 'all' || t.tahun === filterTahun;
                    // Filter by statusSertifikat = "Terbit"
                    const matchesStatus = (t.statusSertifikat || '').trim().toLowerCase() === 'terbit';
                    return matchesTahun && matchesStatus;
                  })
                  .reduce((sum, t) => sum + (t.hargaKontrak || 0), 0)
              );

              // Calculate percentage based on Total Nilai Kontrak (Terbit)
              const achievementPercentage = totalNilaiKontrak > 0
                ? Math.round((lanjutContracts / (totalNilaiKontrak * 0.9)) * 100)
                : 0;

              // Determine which progress bar to show based on status filter
              const getProgressConfig = () => {
                // Percentage is calculated from Total Nilai Kontrak (Terbit)
                if (filterStatus === 'DONE' || filterStatus === 'all') {
                  return {
                    label: 'Pencapaian Kontrak Lanjut / Done',
                    value: lanjutContracts,
                    color: 'green',
                    percentage: totalNilaiKontrak > 0 ? Math.round((lanjutContracts / (totalNilaiKontrak * 0.9)) * 100) : 0
                  };
                } else if (filterStatus === 'LOSS') {
                  return {
                    label: 'Pencapaian Kontrak Loss',
                    value: lossContracts,
                    color: 'red',
                    percentage: totalNilaiKontrak > 0 ? Math.round((lossContracts / totalNilaiKontrak) * 100) : 0
                  };
                } else if (filterStatus === 'SUSPEND') {
                  return {
                    label: 'Pencapaian Kontrak Suspend',
                    value: suspendContracts,
                    color: 'orange',
                    percentage: totalNilaiKontrak > 0 ? Math.round((suspendContracts / totalNilaiKontrak) * 100) : 0
                  };
                } else if (filterStatus === 'PROSES') {
                  return {
                    label: 'Pencapaian Kontrak Proses',
                    value: prosesContracts,
                    color: 'blue',
                    percentage: totalNilaiKontrak > 0 ? Math.round((prosesContracts / totalNilaiKontrak) * 100) : 0
                  };
                } else if (filterStatus === 'WAITING') {
                  return {
                    label: 'Pencapaian Kontrak Waiting',
                    value: waitingContracts,
                    color: 'gray',
                    percentage: totalNilaiKontrak > 0 ? Math.round((waitingContracts / totalNilaiKontrak) * 100) : 0
                  };
                } else {
                  // Default: show DONE
                  return {
                    label: 'Pencapaian Kontrak Done',
                    value: lanjutContracts,
                    color: 'green',
                    percentage: totalNilaiKontrak > 0 ? Math.round((lanjutContracts / totalNilaiKontrak) * 100) : 0
                  };
                }
              };

              const progressConfig = getProgressConfig();

              const colorClasses: { [key: string]: { bg: string; text: string } } = {
                green: {
                  bg: 'bg-gradient-to-r from-green-500 to-green-600',
                  text: 'text-green-600'
                },
                red: {
                  bg: 'bg-gradient-to-r from-red-500 to-red-600',
                  text: 'text-red-600'
                },
                orange: {
                  bg: 'bg-gradient-to-r from-orange-500 to-orange-600',
                  text: 'text-orange-600'
                },
                blue: {
                  bg: 'bg-gradient-to-r from-blue-500 to-blue-600',
                  text: 'text-blue-600'
                },
                gray: {
                  bg: 'bg-gradient-to-r from-gray-500 to-gray-600',
                  text: 'text-gray-600'
                }
              };

              return (
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                        <BarChart3 className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold">Total Target ( Contract Base )</h3>
                        <p className="text-sm text-muted-foreground">Combined MRC & DHA (All Data)</p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
                      

                      {/* Total Sertifikat Card */}
                      <div className="flex items-center gap-2 bg-gradient-to-r from-green-50 to-emerald-50 px-3 py-2 rounded-lg border border-green-200">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-white">📜</span>
                        </div>
                        <div>
                          <p className="text-[10px] text-green-600 font-bold leading-tight">Total Sertifikat</p>
                          <p className="text-lg font-bold text-green-700 leading-tight">{allData.length}</p>
                        </div>
                      </div>

                      {/* Total Perusahaan Card */}
                      <div className="flex items-center gap-2 bg-gradient-to-r from-orange-50 to-amber-50 px-3 py-2 rounded-lg border border-orange-200">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-r from-orange-500 to-amber-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-white">🏢</span>
                        </div>
                        <div>
                          <p className="text-[10px] text-orange-600 font-bold leading-tight">Total Perusahaan</p>
                          <p className="text-lg font-bold text-orange-700 leading-tight">{totalAllCompanies}</p>
                        </div>
                      </div>

                      {/* Total Nilai Kontrak - Filtered by Status Sertifikat = Terbit */}
                      <div className="text-right">
                        <p className="text-3xl font-bold text-primary">Rp {Math.round(totalNilaiKontrak * 0.9).toLocaleString('id-ID')}</p>
                        <p className="text-sm text-muted-foreground">
                          Total Nilai Kontrak
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar - Dynamic based on status filter */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{progressConfig.label}</span>
                      <span className={`text-sm font-bold ${colorClasses[progressConfig.color].text}`}>
                        {progressConfig.percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                      <div
                        className={`${colorClasses[progressConfig.color].bg} h-4 rounded-full transition-all duration-700 ease-out flex items-center justify-end pr-2`}
                        style={{ width: `${Math.min(progressConfig.percentage, 100)}%` }}
                      >
                        {progressConfig.percentage > 10 && (
                          <span className="text-[10px] font-bold text-white">{progressConfig.percentage}%</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        Rp {progressConfig.value.toLocaleString('id-ID')} dari Rp {Math.round(totalNilaiKontrak * 0.9).toLocaleString('id-ID')} (Total Nilai Kontrak)
                        {filterStatus !== 'all' && filterStatus !== 'DONE' && (
                          <span className="ml-2">• Filter: {filterStatus}</span>
                        )}
                        {/* <span className="ml-2">• {totalFilteredCompanies} dari {totalAllCompanies} Perusahaan</span> */}
                      </span>
                    </div>
                  </div>

                  {/* Detailed Breakdown */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-4 border-t">
                    {/* DONE */}
                    <div className="flex flex-row items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-green-50 rounded-lg border border-green-200">
                      {/* Left - Percentage Circle */}
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-green-500 flex items-center justify-center">
                          <span className="text-white text-xs sm:text-sm font-bold">{totalNilaiKontrak > 0 ? Math.round((lanjutContracts / (totalNilaiKontrak * 0.9)) * 100) : 0}%</span>
                        </div>
                      </div>
                      {/* Right - Info */}
                      <div className="flex-1 min-w-0 text-left">
                        <span className="text-[10px] sm:text-xs text-green-600 font-medium">DONE</span>
                        <div className="text-xs sm:text-sm font-bold text-green-700 truncate">Rp {Math.round(lanjutContracts).toLocaleString('id-ID')}</div>
                        <span className="text-[9px] sm:text-[10px] text-green-600">
                          {filteredData.filter(t => t.status === 'DONE').length} Sertifikat (base on TTD NOTIF)
                        </span>
                      </div>
                    </div>

                    {/* PROSES */}
                    <div className="flex flex-row items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-blue-500 flex items-center justify-center">
                          <span className="text-white text-xs sm:text-sm font-bold">{totalNilaiKontrak > 0 ? Math.round((prosesContracts / totalNilaiKontrak) * 100) : 0}%</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <span className="text-[10px] sm:text-xs text-blue-600 font-medium">PROSES</span>
                        <div className="text-xs sm:text-sm font-bold text-blue-700 truncate">Rp {Math.round(prosesContracts).toLocaleString('id-ID')}</div>
                        <span className="text-[9px] sm:text-[10px] text-blue-600">
                          {filteredData.filter(t => t.status === 'PROSES').length} Sertifikat  (base on EXP)
                        </span>
                      </div>
                    </div>

                    {/* SUSPEND */}
                    <div className="flex flex-row items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-orange-500 flex items-center justify-center">
                          <span className="text-white text-xs sm:text-sm font-bold">{totalNilaiKontrak > 0 ? Math.round((suspendContracts / totalNilaiKontrak) * 100) : 0}%</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <span className="text-[10px] sm:text-xs text-orange-600 font-medium">SUSPEND</span>
                        <div className="text-xs sm:text-sm font-bold text-orange-700 truncate">Rp {Math.round(suspendContracts).toLocaleString('id-ID')}</div>
                        <span className="text-[9px] sm:text-[10px] text-orange-600">
                          {filteredData.filter(t => t.status === 'SUSPEND').length} Sertifikat  (base on EXP)
                        </span>
                      </div>
                    </div>

                    {/* LOSS */}
                    <div className="flex flex-row items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-red-500 flex items-center justify-center">
                          <span className="text-white text-xs sm:text-sm font-bold">{totalNilaiKontrak > 0 ? Math.round((lossContracts / totalNilaiKontrak) * 100) : 0}%</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <span className="text-[10px] sm:text-xs text-red-600 font-medium">LOSS</span>
                        <div className="text-xs sm:text-sm font-bold text-red-700 truncate">Rp {Math.round(lossContracts).toLocaleString('id-ID')}</div>
                        <span className="text-[9px] sm:text-[10px] text-red-600">
                          {filteredData.filter(t => t.status === 'LOSS').length} Sertifikat  (base on EXP)
                        </span>
                      </div>
                    </div>

                    {/* WAITING */}
                    <div className="flex flex-row items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-gray-500 flex items-center justify-center">
                          <span className="text-white text-xs sm:text-sm font-bold">{totalNilaiKontrak > 0 ? Math.round((waitingContracts / totalNilaiKontrak) * 100) : 0}%</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <span className="text-[10px] sm:text-xs text-gray-600 font-medium">WAITING</span>
                        <div className="text-xs sm:text-sm font-bold text-gray-700 truncate">Rp {Math.round(waitingContracts).toLocaleString('id-ID')}</div>
                        <span className="text-[9px] sm:text-[10px] text-gray-600">
                          {filteredData.filter(t => t.status === 'WAITING').length} Sertifikat  (base on EXP)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* Pencapaian Chart - Monthly Breakdown */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Breakdown Target VS Pencapaian (Per Bulan)
                </CardTitle>
                <CardDescription className="mt-1">
                  Analitycs {filterStatus !== 'all' && `- Status: ${filterStatus.toUpperCase()}`}
                </CardDescription>
              </div>
              <Select value={selectedChartType} onValueChange={setSelectedChartType}>
                <SelectTrigger className="w-32 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="area">Area</SelectItem>
                  <SelectItem value="bar">Bar</SelectItem>
                  <SelectItem value="line">Line</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {(() => {
              // Filter data based on status filter
              let filteredByStatus = (filteredTargets || []);

              // When filterStatus is 'all', only show DONE contracts
              // Otherwise, filter by the selected status
              if (filterStatus === 'all') {
                filteredByStatus = filteredByStatus.filter(t => t.status === 'DONE');
              } else {
                const statusUpper = filterStatus?.toUpperCase() || '';
                filteredByStatus = filteredByStatus.filter(t => {
                  return t.status === statusUpper;
                });
              }

              // Group by month for TARGET (from bulanExpDate + hargaKontrak)
              // IMPORTANT: Target should match totalNilaiKontrak calculation (tahun + statusSertifikat = "Terbit")
              const monthlyTargetData: { [key: string]: { total: number; count: number } } = {};

              // Get data for TARGET - same filter as totalNilaiKontrak (use crmTargets, not filteredTargets)
              const targetData = (crmTargets || []).filter(t => {
                const matchesTahun = filterTahun === 'all' || t.tahun === filterTahun;
                const matchesStatus = (t.statusSertifikat || '').trim().toLowerCase() === 'terbit';
                return matchesTahun && matchesStatus;
              });

              targetData.forEach(target => {
                // Extract month from bulanExpDate
                let bulan = 'Unknown';
                if (target.bulanExpDate) {
                  // Try YYYY-MM-DD format first
                  const dateMatch = target.bulanExpDate.match(/^(\d{4})-(\d{2})/);
                  if (dateMatch) {
                    const monthNum = parseInt(dateMatch[2]);
                    bulan = monthNum.toString();
                  } else {
                    // Try month name format (Januari, Februari, etc)
                    const monthMap: { [key: string]: string } = {
                      'januari': '1', 'jan': '1', 'februari': '2', 'feb': '2', 'maret': '3', 'mar': '3',
                      'april': '4', 'apr': '4', 'mei': '5', 'may': '5', 'juni': '6', 'jun': '6',
                      'juli': '7', 'jul': '7', 'agustus': '8', 'aug': '8', 'september': '9', 'sep': '9',
                      'oktober': '10', 'oct': '10', 'november': '11', 'nov': '11', 'desember': '12', 'dec': '12'
                    };
                    const mapped = monthMap[target.bulanExpDate.toLowerCase()];
                    if (mapped) {
                      bulan = mapped;
                    }
                  }
                }

                // Use hargaKontrak for TARGET
                const amount = target.hargaKontrak || 0;

                if (!monthlyTargetData[bulan]) {
                  monthlyTargetData[bulan] = {
                    total: 0,
                    count: 0
                  };
                }

                monthlyTargetData[bulan].total += amount;
                monthlyTargetData[bulan].count += 1;
              });

              // Group by month for PENCAPAIAN (from bulanTtdNotif + hargaTerupdate)
              const monthlyPencapaianData: { [key: string]: { total: number; count: number } } = {};

              filteredByStatus.forEach(target => {
                // Extract month from bulanTtdNotif (format: YYYY-MM-DD)
                let bulan = 'Unknown';
                if (target.bulanTtdNotif) {
                  const dateMatch = target.bulanTtdNotif.match(/^(\d{4})-(\d{2})/);
                  if (dateMatch) {
                    const monthNum = parseInt(dateMatch[2]);
                    bulan = monthNum.toString();
                  }
                }

                // Use hargaTerupdate for PENCAPAIAN
                const amount = target.hargaTerupdate || 0;

                if (!monthlyPencapaianData[bulan]) {
                  monthlyPencapaianData[bulan] = {
                    total: 0,
                    count: 0
                  };
                }

                monthlyPencapaianData[bulan].total += amount;
                monthlyPencapaianData[bulan].count += 1;
              });

              // Get all unique months from both datasets
              const allMonths = new Set([
                ...Object.keys(monthlyTargetData),
                ...Object.keys(monthlyPencapaianData)
              ]);

              // Convert to array and sort by month number
              const sortedMonths = Array.from(allMonths)
                .filter(bulan => bulan !== 'Unknown')
                .sort((a, b) => {
                  const orderA = parseInt(a) || 999;
                  const orderB = parseInt(b) || 999;
                  return orderA - orderB;
                });

              // Calculate grand totals
              // Target: from data with same filter as totalNilaiKontrak (tahun + statusSertifikat = "Terbit")
              const grandTotalTarget = Math.round(targetData.reduce((sum, t) => {
                return sum + (t.hargaKontrak || 0);
              }, 0));

              // Pencapaian: from filtered data (by status)
              const grandTotalPencapaian = Math.round(filteredByStatus.reduce((sum, t) => {
                return sum + (t.hargaTerupdate || 0);
              }, 0));

              // Calculate total unique companies from filtered by status data
              const filteredByStatusCompanies = new Set(filteredByStatus.map(t => t.namaPerusahaan));
              const totalFilteredCompanies = filteredByStatusCompanies.size;

              // Determine status color - SAME LOGIC as Total Target progress bar
              const getStatusColor = () => {
                if (filterStatus === 'DONE' || filterStatus === 'all') {
                  return 'green';
                } else if (filterStatus === 'LOSS') {
                  return 'red';
                } else if (filterStatus === 'SUSPEND') {
                  return 'orange';
                } else if (filterStatus === 'PROSES') {
                  return 'blue';
                } else if (filterStatus === 'WAITING') {
                  return 'gray';
                } else {
                  return 'green'; // Default
                }
              };

              const statusColor = getStatusColor();

              // Month name mapping
              const monthNames: { [key: string]: string } = {
                '1': 'Januari', '2': 'Februari', '3': 'Maret', '4': 'April',
                '5': 'Mei', '6': 'Juni', '7': 'Juli', '8': 'Agustus',
                '9': 'September', '10': 'Oktober', '11': 'November', '12': 'Desember'
              };

              // Create chart data with 2 series: Target and Pencapaian
              const chartData: any[] = [];

              sortedMonths.forEach(bulan => {
                const monthName = monthNames[bulan] || bulan;
                // IMPORTANT: Use bulan (number like '1', '2') to get data from monthlyTargetData, not monthName
                const targetValue = monthlyTargetData[bulan]?.total || 0;
                const pencapaianValue = monthlyPencapaianData[bulan]?.total || 0;

                // Add Target data point - Use 90% for consistency with Total Target card
                chartData.push({
                  bulanExpDate: monthName, // Display name
                  hargaKontrak: Math.round(targetValue * 0.9), // 90% from total
                  namaPerusahaan: `Target ${monthName}`,
                  picCrm: 'Target',
                  sales: 'Target',
                  status: 'TARGET',
                  bulanTtdNotif: undefined,
                  category: undefined,
                  provinsi: undefined,
                  kota: undefined,
                  alamat: undefined,
                  akreditasi: undefined,
                  eaCode: undefined,
                  std: undefined,
                  iaDate: undefined,
                  expDate: undefined,
                  tahapAudit: undefined,
                  _id: '' as any,
                  tahun: filterTahun !== 'all' ? filterTahun : undefined,
                  createdAt: 0,
                  updatedAt: 0
                });

                // Add Pencapaian data point
                chartData.push({
                  bulanExpDate: monthName, // Display name
                  hargaKontrak: pencapaianValue,
                  namaPerusahaan: `Pencapaian ${monthName}`,
                  picCrm: 'Pencapaian',
                  sales: 'Pencapaian',
                  status: 'PENCAPAIAN',
                  bulanTtdNotif: undefined,
                  category: undefined,
                  provinsi: undefined,
                  kota: undefined,
                  alamat: undefined,
                  akreditasi: undefined,
                  eaCode: undefined,
                  std: undefined,
                  iaDate: undefined,
                  expDate: undefined,
                  tahapAudit: undefined,
                  _id: '' as any,
                  tahun: filterTahun !== 'all' ? filterTahun : undefined,
                  createdAt: 0,
                  updatedAt: 0
                });
              });

              // Color classes - MATCHES Total Target progress bar colors
              const colorClasses: { [key: string]: { bg: string; border: string; text: string; textLight: string; bgBadge: string; textBadge: string; bgFooter: string; borderFooter: string; textFooter: string } } = {
                green: {
                  bg: 'from-green-50 to-green-100',
                  border: 'border-green-200',
                  text: 'text-green-700',
                  textLight: 'text-green-600',
                  bgBadge: 'bg-green-100',
                  textBadge: 'text-green-800',
                  bgFooter: 'from-green-50 to-green-100',
                  borderFooter: 'border-green-200',
                  textFooter: 'text-green-900'
                },
                red: {
                  bg: 'from-red-50 to-red-100',
                  border: 'border-red-200',
                  text: 'text-red-700',
                  textLight: 'text-red-600',
                  bgBadge: 'bg-red-100',
                  textBadge: 'text-red-800',
                  bgFooter: 'from-red-50 to-red-100',
                  borderFooter: 'border-red-200',
                  textFooter: 'text-red-900'
                },
                orange: {
                  bg: 'from-orange-50 to-orange-100',
                  border: 'border-orange-200',
                  text: 'text-orange-700',
                  textLight: 'text-orange-600',
                  bgBadge: 'bg-orange-100',
                  textBadge: 'text-orange-800',
                  bgFooter: 'from-orange-50 to-orange-100',
                  borderFooter: 'border-orange-200',
                  textFooter: 'text-orange-900'
                },
                blue: {
                  bg: 'from-blue-50 to-blue-100',
                  border: 'border-blue-200',
                  text: 'text-blue-700',
                  textLight: 'text-blue-600',
                  bgBadge: 'bg-blue-100',
                  textBadge: 'text-blue-800',
                  bgFooter: 'from-blue-50 to-blue-100',
                  borderFooter: 'border-blue-200',
                  textFooter: 'text-blue-900'
                },
                gray: {
                  bg: 'from-gray-50 to-gray-100',
                  border: 'border-gray-200',
                  text: 'text-gray-700',
                  textLight: 'text-gray-600',
                  bgBadge: 'bg-gray-100',
                  textBadge: 'text-gray-800',
                  bgFooter: 'from-gray-50 to-gray-100',
                  borderFooter: 'border-gray-200',
                  textFooter: 'text-gray-900'
                }
              };

              const colors = colorClasses[statusColor as keyof typeof colorClasses] || colorClasses.green;

              return (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                    {/* Target Card */}
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-600 font-medium">Total Target</p>
                      <p className="text-2xl font-bold text-blue-700 mt-1">
                        Rp {Math.round(grandTotalTarget * 0.9).toLocaleString('id-ID')}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">( 90% dari total Rp {Math.round(grandTotalTarget).toLocaleString('id-ID')} )</p>
                    </div>

                    {/* Pencapaian Card */}
                    <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                      <p className="text-sm text-green-600 font-medium">Total Pencapaian</p>
                      <p className="text-2xl font-bold text-green-700 mt-1">
                        Rp {grandTotalPencapaian.toLocaleString('id-ID')}
                      </p>
                      <p className="text-xs text-green-600 mt-1">Dari hargaTerupdate</p>
                    </div>

                    {/* Companies Card */}
                    <div className="p-4 bg-white rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-600 font-medium">Total Perusahaan</p>
                      <p className="text-2xl font-bold text-primary mt-1">
                        {totalFilteredCompanies}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Perusahaan</p>
                    </div>
                  </div>

                  {/* Chart - Target vs Pencapaian */}
                  <ChartCardPencapaianMonthly
                    title={`Target vs Pencapaian Per Bulan${filterStatus !== 'all' ? ` - ${filterStatus.toUpperCase()}` : ''}`}
                    data={chartData}
                    statusColor={statusColor}
                    chartType={selectedChartType}
                    isFullWidth={true}
                  />

                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* Kuadran Analytics - Monthly Trend */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Kuadran Analytics - Monthly Trend
                </CardTitle>
                <CardDescription className="mt-1">
                  Distribusi kuadran per bulan berdasarkan bulan EXP ( hargaTerupdate )
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {(() => {
              // Filter data that has kuadran field
              const dataWithKuadran = (filteredTargets || []).filter(t => t.kuadran);

              // Group by Bulan TTD Notif and Kuadran
              const monthlyKuadranData: { [key: string]: { [key: string]: { total: number; count: number } } } = {};

              dataWithKuadran.forEach(target => {
                // Extract month from bulanTtdNotif (format: YYYY-MM-DD)
                let bulan = 'Unknown';
                if (target.bulanTtdNotif) {
                  const dateMatch = target.bulanTtdNotif.match(/^(\d{4})-(\d{2})/);
                  if (dateMatch) {
                    const monthNum = parseInt(dateMatch[2]);
                    bulan = monthNum.toString();
                  }
                }

                const kuadran = target.kuadran || 'Unknown';
                const amount = target.hargaTerupdate || 0;

                if (!monthlyKuadranData[bulan]) {
                  monthlyKuadranData[bulan] = {};
                }
                if (!monthlyKuadranData[bulan][kuadran]) {
                  monthlyKuadranData[bulan][kuadran] = {
                    total: 0,
                    count: 0
                  };
                }

                monthlyKuadranData[bulan][kuadran].total += amount;
                monthlyKuadranData[bulan][kuadran].count += 1;
              });

              // Sort months by month number
              const sortedMonths = Object.keys(monthlyKuadranData)
                .filter(bulan => bulan !== 'Unknown')
                .sort((a, b) => {
                  const orderA = parseInt(a) || 999;
                  const orderB = parseInt(b) || 999;
                  return orderA - orderB;
                });

              // Define kuadran order and colors
              const kuadranOrder = ['K1', 'K2', 'K3', 'K4'];

              // Month name mapping
              const monthNames: { [key: string]: string } = {
                '1': 'Januari', '2': 'Februari', '3': 'Maret', '4': 'April',
                '5': 'Mei', '6': 'Juni', '7': 'Juli', '8': 'Agustus',
                '9': 'September', '10': 'Oktober', '11': 'November', '12': 'Desember'
              };

              const kuadranColors: { [key: string]: { color: string; bg: string; border: string; gradient: string } } = {
                'K1': {
                  color: '#3B82F6', // Blue
                  bg: 'bg-blue-50',
                  border: 'border-blue-500',
                  gradient: 'from-blue-500 to-blue-600'
                },
                'K2': {
                  color: '#10B981', // Green
                  bg: 'bg-green-50',
                  border: 'border-green-500',
                  gradient: 'from-green-500 to-green-600'
                },
                'K3': {
                  color: '#F59E0B', // Orange
                  bg: 'bg-orange-50',
                  border: 'border-orange-500',
                  gradient: 'from-orange-500 to-orange-600'
                },
                'K4': {
                  color: '#8B5CF6', // Purple
                  bg: 'bg-purple-50',
                  border: 'border-purple-500',
                  gradient: 'from-purple-500 to-purple-600'
                }
              };

              return (
                <div className="space-y-6">
                  {/* Summary Cards per Kuadran */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {kuadranOrder.map(kuadran => {
                      const kuadranTotal = Object.values(monthlyKuadranData).reduce((sum, month) => {
                        return sum + (month[kuadran]?.total || 0);
                      }, 0);
                      const kuadranCount = Object.values(monthlyKuadranData).reduce((sum, month) => {
                        return sum + (month[kuadran]?.count || 0);
                      }, 0);

                      // Calculate unique companies per kuadran
                      const kuadranCompanies = new Set(
                        dataWithKuadran
                          .filter(t => t.kuadran === kuadran)
                          .map(t => t.namaPerusahaan)
                      );
                      const kuadranCompanyCount = kuadranCompanies.size;

                      const colors = kuadranColors[kuadran] || kuadranColors['K1'];
                      const grandTotal = Object.values(monthlyKuadranData).reduce((sum, month) => {
                        return sum + Object.values(month).reduce((s, k) => s + k.total, 0);
                      }, 0);
                      const percentage = grandTotal > 0 ? Math.round((kuadranTotal / grandTotal) * 100) : 0;

                      return (
                        <div key={kuadran} className={`bg-gradient-to-br ${colors.bg} rounded-lg border ${colors.border} p-4`}>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-xl font-bold" style={{ color: colors.color }}>{kuadran}</h4>
                            <div className={`h-8 w-8 rounded-full bg-gradient-to-r ${colors.gradient} flex items-center justify-center`}>
                              <span className="text-white text-xs font-bold">{percentage}%</span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-semibold" style={{ color: colors.color }}>
                              Rp {kuadranTotal.toLocaleString('id-ID')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {kuadranCount} Sertifikat . {kuadranCompanyCount} Perusahaan
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Chart - Monthly Trend by Kuadran */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Chart Kuadran</h3>
                      <Select value={selectedChartType} onValueChange={setSelectedChartType}>
                        <SelectTrigger className="w-32 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="area">Area</SelectItem>
                          <SelectItem value="bar">Bar</SelectItem>
                          <SelectItem value="line">Line</SelectItem>
                          <SelectItem value="pie">Pie</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Chart Visualization */}
                    <ChartCardKuadranMonthly
                      title={`Distribusi Kuadran ${filterStatus !== 'all' ? ` - ${filterStatus.toUpperCase()}` : ''}`}
                      data={dataWithKuadran}
                      chartType={selectedChartType}
                    />
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* Associate Category Analytics - Monthly Trend */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Associate Category Analytics - Monthly Trend
                </CardTitle>
                <CardDescription className="mt-1">
                  Distribusi Direct vs Associate per bulan (Januari - Desember)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {(() => {
              // Filter data by tahun from bulanTtdNotif, status DONE, statusSertifikat, and directOrAssociate field
              const dataWithAssociate = (crmTargets || []).filter(t => {
                const isDone = t.status === 'DONE';
                const isSertifikatTerbit = (t.statusSertifikat || '').trim().toLowerCase() === 'terbit';
                const hasBulanTtdNotif = t.bulanTtdNotif && t.bulanTtdNotif !== '';
                const hasAssociate = t.directOrAssociate;

                // Check tahun dari bulanTtdNotif
                let matchesTahun = false;
                if (hasBulanTtdNotif) {
                  if (filterTahun === 'all') {
                    matchesTahun = true;
                  } else {
                    const ttdDate = new Date(t.bulanTtdNotif);
                    const ttdYear = ttdDate.getFullYear();
                    matchesTahun = ttdYear.toString() === filterTahun;
                  }
                }

                return isDone && isSertifikatTerbit && hasBulanTtdNotif && hasAssociate && matchesTahun;
              });

              return (
                <div className="space-y-6">
                  {/* Summary Cards per Associate Type */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {['Direct', 'Associate'].map(assocType => {
                      const assocTotal = dataWithAssociate
                        .filter(t => t.directOrAssociate === assocType)
                        .reduce((sum, t) => sum + (t.hargaTerupdate || 0), 0);
                      const assocCount = dataWithAssociate.filter(t => t.directOrAssociate === assocType).length;

                      // Calculate unique companies per associate type
                      const assocCompanies = new Set(
                        dataWithAssociate
                          .filter(t => t.directOrAssociate === assocType)
                          .map(t => t.namaPerusahaan)
                      );
                      const assocCompanyCount = assocCompanies.size;

                      const colors = assocType === 'Direct'
                        ? { color: '#3B82F6', bg: 'bg-blue-50', border: 'border-blue-500', gradient: 'from-blue-500 to-blue-600' }
                        : { color: '#10B981', bg: 'bg-green-50', border: 'border-green-500', gradient: 'from-green-500 to-green-600' };

                      const grandTotal = dataWithAssociate.reduce((sum, t) => sum + (t.hargaTerupdate || 0), 0);
                      const percentage = grandTotal > 0 ? Math.round((assocTotal / grandTotal) * 100) : 0;

                      return (
                        <div key={assocType} className={`bg-gradient-to-br ${colors.bg} rounded-lg border ${colors.border} p-4`}>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-lg font-bold" style={{ color: colors.color }}>{assocType}</h4>
                            <div className={`h-8 w-8 rounded-full bg-gradient-to-r ${colors.gradient} flex items-center justify-center`}>
                              <span className="text-white text-xs font-bold">{percentage}%</span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-semibold" style={{ color: colors.color }}>
                              Rp {assocTotal.toLocaleString('id-ID')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {assocCount} Sertifikat . {assocCompanyCount} Perusahaan
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Chart - Monthly Trend by Associate Type */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Trend Direct vs Associate Per Bulan</h3>
                      <Select value={selectedAssociateChartType} onValueChange={setSelectedAssociateChartType}>
                        <SelectTrigger className="w-32 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="area">Area</SelectItem>
                          <SelectItem value="bar">Bar</SelectItem>
                          <SelectItem value="line">Line</SelectItem>
                          <SelectItem value="pie">Pie</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Chart Visualization */}
                    <ChartCardAssociateMonthly
                      title={`Distribusi Direct vs Associate Per Bulan${filterTahun !== 'all' ? ` - ${filterTahun}` : ''}`}
                      data={dataWithAssociate}
                      chartType={selectedAssociateChartType}
                    />
                  </div>

                  {/* Top 10 Associates */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Top 10 Associate</h3>
                      <Select value={selectedTopAssociateChartType} onValueChange={setSelectedTopAssociateChartType}>
                        <SelectTrigger className="w-32 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="area">Area</SelectItem>
                          <SelectItem value="bar">Bar</SelectItem>
                          <SelectItem value="line">Line</SelectItem>
                          <SelectItem value="pie">Pie</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Calculate Top 10 Associates */}
                    <div className="relative overflow-hidden rounded-xl border border-purple-200/50 shadow-lg bg-gradient-to-br from-purple-50/50 to-blue-50/30 p-6">
                      {/* Futuristic background overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/15 via-violet-400/10 to-transparent opacity-80 pointer-events-none rounded-xl"></div>
                      <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/5 via-transparent to-blue-500/5 pointer-events-none rounded-xl"></div>

                      <div className="relative z-10">
                    {(() => {
                      // Group by namaAssociate and get totals
                      const associateTotals: { [key: string]: { total: number; count: number; companies: Set<string> } } = {};

                      dataWithAssociate.forEach(target => {
                        const associate = target.namaAssociate || 'Unknown';
                        const amount = target.hargaTerupdate || 0;
                        const company = target.namaPerusahaan;

                        if (!associateTotals[associate]) {
                          associateTotals[associate] = {
                            total: 0,
                            count: 0,
                            companies: new Set()
                          };
                        }

                        associateTotals[associate].total += amount;
                        associateTotals[associate].count += 1;
                        if (company) {
                          associateTotals[associate].companies.add(company);
                        }
                      });

                      // Sort and get top 10
                      const top10Associates = Object.entries(associateTotals)
                        .map(([name, data]) => ({
                          name,
                          total: data.total,
                          count: data.count,
                          companyCount: data.companies.size
                        }))
                        .sort((a, b) => b.total - a.total)
                        .slice(0, 10);

                      // Generate colors for top 10 - Purple gradient
                      const top10Colors = [
                        '#8B5CF6', // Purple 500
                        '#7C3AED', // Violet 600
                        '#6D28D9', // Violet 700
                        '#A78BFA', // Violet 400
                        '#8B5CF6', // Purple 500
                        '#7C3AED', // Violet 600
                        '#6D28D9', // Violet 700
                        '#A78BFA', // Violet 400
                        '#8B5CF6', // Purple 500
                        '#7C3AED', // Violet 600
                      ];

                      const hasData = top10Associates.length > 0;

                      if (!hasData) {
                        return (
                          <div className="text-center py-8 text-muted-foreground">
                            <p>Tidak ada data associate</p>
                          </div>
                        );
                      }

                      return (
                        <div className="h-[400px]">
                          <ResponsiveContainer width="100%" height="100%">
                            {(() => {
                              switch (selectedTopAssociateChartType) {
                                case 'bar':
                                  return (
                                    <BarChart data={top10Associates} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                      <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 600 }} className="fill-foreground" />
                                      <YAxis tick={{ fontSize: 9 }} className="fill-muted-foreground" width={60} />
                                      <Tooltip
                                        content={({ active, payload }) => {
                                          if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                              <div className="bg-background border rounded-lg shadow-lg p-2">
                                                <p className="font-semibold text-sm mb-1">{data.name}</p>
                                                <p className="text-xs text-muted-foreground">{data.count} Sertifikat . {data.companyCount} Perusahaan</p>
                                                <p className="text-sm font-bold">Rp {data.total.toLocaleString('id-ID')}</p>
                                              </div>
                                            );
                                          }
                                          return null;
                                        }}
                                      />
                                      <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                                        {top10Associates.map((assoc, index) => (
                                          <Cell key={`cell-${index}`} fill={top10Colors[index]} />
                                        ))}
                                        <LabelList
                                          dataKey="total"
                                          position="top"
                                          fontSize={13}
                                          fontWeight="bold"
                                          formatter={(value: number) => {
                                            if (value >= 1000000000) return (value / 1000000000).toFixed(1) + 'M';
                                            else if (value >= 1000000) return (value / 1000000).toFixed(1) + 'Jt';
                                            else return (value / 1000).toFixed(0) + 'rb';
                                          }}
                                        />
                                      </Bar>
                                    </BarChart>
                                  );

                                case 'line':
                                  return (
                                    <LineChart data={top10Associates} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                      <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 600 }} className="fill-foreground" />
                                      <YAxis tick={{ fontSize: 9 }} className="fill-muted-foreground" width={60} />
                                      <Tooltip
                                        content={({ active, payload }) => {
                                          if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                              <div className="bg-background border rounded-lg shadow-lg p-2">
                                                <p className="font-semibold text-sm mb-1">{data.name}</p>
                                                <p className="text-xs text-muted-foreground">{data.count} Sertifikat . {data.companyCount} Perusahaan</p>
                                                <p className="text-sm font-bold">Rp {data.total.toLocaleString('id-ID')}</p>
                                              </div>
                                            );
                                          }
                                          return null;
                                        }}
                                      />
                                      <Line
                                        type="monotone"
                                        dataKey="total"
                                        stroke="#3B82F6"
                                        strokeWidth={3}
                                        dot={{ fill: '#3B82F6', strokeWidth: 2, r: 6 }}
                                        activeDot={{ r: 8 }}
                                      >
                                        <LabelList
                                          dataKey="total"
                                          position="top"
                                          fontSize={13}
                                          fontWeight="bold"
                                          fill="#3B82F6"
                                          formatter={(value: number) => {
                                            if (value >= 1000000000) return (value / 1000000000).toFixed(1) + 'M';
                                            else if (value >= 1000000) return (value / 1000000).toFixed(1) + 'Jt';
                                            else return (value / 1000).toFixed(0) + 'rb';
                                          }}
                                        />
                                      </Line>
                                    </LineChart>
                                  );

                                case 'pie':
                                  const pieData = top10Associates.map((assoc, index) => ({
                                    name: assoc.name,
                                    value: assoc.total,
                                    count: assoc.count,
                                    companyCount: assoc.companyCount,
                                    color: top10Colors[index]
                                  }));

                                  return (
                                    <PieChart width={400} height={400}>
                                      <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={true}
                                        label={(entry) => {
                                          const value = entry.value;
                                          let label = '';
                                          if (value >= 1000000000) label = (value / 1000000000).toFixed(1) + 'M';
                                          else if (value >= 1000000) label = (value / 1000000).toFixed(1) + 'Jt';
                                          else label = (value / 1000).toFixed(0) + 'rb';
                                          return `${entry.name}`;
                                        }}
                                        outerRadius={120}
                                        dataKey="value"
                                      >
                                        {pieData.map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                      </Pie>
                                      <Tooltip
                                        content={({ active, payload }) => {
                                          if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                              <div className="bg-background border rounded-lg shadow-lg p-2">
                                                <p className="font-semibold text-sm mb-1">{data.name}</p>
                                                <p className="text-xs text-muted-foreground">{data.count} Sertifikat . {data.companyCount} Perusahaan</p>
                                                <p className="text-sm font-bold">Rp {data.value.toLocaleString('id-ID')}</p>
                                              </div>
                                            );
                                          }
                                          return null;
                                        }}
                                      />
                                    </PieChart>
                                  );

                                default: // area
                                  return (
                                    <AreaChart data={top10Associates} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                                      <defs>
                                        <linearGradient id="colorTopAssociate" x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                                          <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1}/>
                                        </linearGradient>
                                      </defs>
                                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                      <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 600 }} className="fill-foreground" />
                                      <YAxis tick={{ fontSize: 9 }} className="fill-muted-foreground" width={60} />
                                      <Tooltip
                                        content={({ active, payload }) => {
                                          if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                              <div className="bg-background border rounded-lg shadow-lg p-2">
                                                <p className="font-semibold text-sm mb-1">{data.name}</p>
                                                <p className="text-xs text-muted-foreground">{data.count} Sertifikat . {data.companyCount} Perusahaan</p>
                                                <p className="text-sm font-bold">Rp {data.total.toLocaleString('id-ID')}</p>
                                              </div>
                                            );
                                          }
                                          return null;
                                        }}
                                      />
                                      <Area
                                        type="monotone"
                                        dataKey="total"
                                        stroke="#3B82F6"
                                        strokeWidth={2}
                                        fill="url(#colorTopAssociate)"
                                      >
                                        <LabelList
                                          dataKey="total"
                                          position="top"
                                          fontSize={13}
                                          fontWeight="bold"
                                          fill="#3B82F6"
                                          formatter={(value: number) => {
                                            if (value >= 1000000000) return (value / 1000000000).toFixed(1) + 'M';
                                            else if (value >= 1000000) return (value / 1000000).toFixed(1) + 'Jt';
                                            else return (value / 1000).toFixed(0) + 'rb';
                                          }}
                                        />
                                      </Area>
                                    </AreaChart>
                                  );
                              }
                            })()}
                          </ResponsiveContainer>
                        </div>
                      );
                    })()}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* Sales Performance Analytics */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Sales Performance Analytics - By Sales Person
                </CardTitle>
                <CardDescription className="mt-1">
                  Performa semua sales berdasarkan bulan TTD Notif (status DONE & sertifikat terbit)
                </CardDescription>
              </div>
              <Select value={selectedTopAssociateChartType} onValueChange={setSelectedTopAssociateChartType}>
                <SelectTrigger className="w-32 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">Bar</SelectItem>
                  <SelectItem value="line">Line</SelectItem>
                  <SelectItem value="pie">Pie</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative overflow-hidden rounded-xl border border-orange-200/50 shadow-lg bg-gradient-to-br from-orange-50/50 to-amber-50/30 p-6">
              {/* Futuristic background overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/15 via-amber-400/10 to-transparent opacity-80 pointer-events-none rounded-xl"></div>
              <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/5 via-transparent to-amber-500/5 pointer-events-none rounded-xl"></div>

              <div className="relative z-10">
                {(() => {
                  // Create lookup map for sales names from master-sales.json
                  const salesLookupMap: { [key: string]: string } = {};
                  masterSalesData.forEach((sales: any) => {
                    salesLookupMap[sales.nama] = `${sales.nama} ${sales.nama_lengkap}`;
                  });

                  // Filter data for Sales Performance Analytics - based on bulanTtdNotif, tahun, sertifikat terbit, and status DONE
                  const dataWithSalesTtdNotif = (crmTargets || []).filter(t => {
                    const matchesStatus = (t.statusSertifikat || '').trim().toLowerCase() === 'terbit';
                    const matchesDoneStatus = t.status === 'DONE';

                    // Parse bulanTtdNotif to get month and year
                    let ttdMonth = 0;
                    let ttdYear = null;

                    if (t.bulanTtdNotif) {
                      // Try to parse as date (format: YYYY-MM-DD)
                      const dateParts = t.bulanTtdNotif.split('-');
                      if (dateParts.length === 3) {
                        const year = parseInt(dateParts[0]);
                        const month = parseInt(dateParts[1]);

                        if (!isNaN(month) && month >= 1 && month <= 12 && !isNaN(year)) {
                          ttdMonth = month;
                          ttdYear = year;
                        }
                      }
                    }

                    // Filter by tahun from bulanTtdNotif
                    const matchesTahun = filterTahun === 'all' || (ttdYear && ttdYear.toString() === filterTahun);

                    // Filter by bulan range from bulanTtdNotif
                    let matchesBulanTtdNotif = true;
                    if (ttdMonth > 0) {
                      const fromMonth = parseInt(filterFromBulanTTD) || 1;
                      const toMonth = parseInt(filterToBulanTTD) || 12;
                      matchesBulanTtdNotif = ttdMonth >= fromMonth && ttdMonth <= toMonth;
                    } else {
                      // If no bulanTtdNotif, exclude the data
                      matchesBulanTtdNotif = false;
                    }

                    return matchesStatus && matchesDoneStatus && matchesTahun && matchesBulanTtdNotif;
                  });

                  // Group by sales and get totals
                  const salesTotals: { [key: string]: { total: number; count: number; companies: Set<string> } } = {};

                  dataWithSalesTtdNotif.forEach(target => {
                    const sales = target.sales || 'Unknown';
                    const amount = target.hargaTerupdate || 0;
                    const company = target.namaPerusahaan;

                    if (!salesTotals[sales]) {
                      salesTotals[sales] = {
                        total: 0,
                        count: 0,
                        companies: new Set()
                      };
                    }

                    salesTotals[sales].total += amount;
                    salesTotals[sales].count += 1;
                    if (company) {
                      salesTotals[sales].companies.add(company);
                    }
                  });

                  // Sort all sales (not just top 10)
                  const allSales = Object.entries(salesTotals)
                    .map(([name, data]) => ({
                      name,
                      displayName: salesLookupMap[name] || name,
                      total: data.total,
                      count: data.count,
                      companyCount: data.companies.size
                    }))
                    .sort((a, b) => b.total - a.total);

                  // Generate colors for all sales - Orange tua solid
                  const generateSalesColors = (index: number) => {
                    return '#C2410C'; // Orange 700 (orange tua) - same color for all
                  };

                  const hasData = allSales.length > 0;

                  if (!hasData) {
                    return (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>Tidak ada data sales</p>
                      </div>
                    );
                  }

                  return (
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        {(() => {
                          switch (selectedTopAssociateChartType) {
                            case 'bar':
                              return (
                                <BarChart data={allSales} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                  <XAxis
                                    dataKey="displayName"
                                    tick={{ fontSize: 11, fontWeight: 600 }}
                                    className="fill-foreground"
                                    angle={-45}
                                    textAnchor="end"
                                    height={80}
                                  />
                                  <YAxis tick={{ fontSize: 9 }} className="fill-muted-foreground" width={80} />
                                  <Tooltip
                                    content={({ active, payload }) => {
                                      if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        return (
                                          <div className="bg-background border rounded-lg shadow-lg p-2">
                                            <p className="font-semibold text-sm mb-1">{data.displayName}</p>
                                            <p className="text-xs text-muted-foreground">{data.count} Sertifikat . {data.companyCount} Perusahaan</p>
                                            <p className="text-sm font-bold">Rp {data.total.toLocaleString('id-ID')}</p>
                                          </div>
                                        );
                                      }
                                      return null;
                                    }}
                                  />
                                  <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                                    {allSales.map((sales, index) => (
                                      <Cell key={`cell-${index}`} fill={generateSalesColors(index)} />
                                    ))}
                                    <LabelList
                                      dataKey="total"
                                      position="top"
                                      fontSize={13}
                                      fontWeight="bold"
                                      formatter={(value: number) => {
                                        if (value >= 1000000000) return (value / 1000000000).toFixed(1) + 'M';
                                        else if (value >= 1000000) return (value / 1000000).toFixed(1) + 'Jt';
                                        else return (value / 1000).toFixed(0) + 'rb';
                                      }}
                                    />
                                  </Bar>
                                </BarChart>
                              );

                            case 'line':
                              return (
                                <LineChart data={allSales} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                  <XAxis
                                    dataKey="displayName"
                                    tick={{ fontSize: 11, fontWeight: 600 }}
                                    className="fill-foreground"
                                    angle={-45}
                                    textAnchor="end"
                                    height={80}
                                  />
                                  <YAxis tick={{ fontSize: 9 }} className="fill-muted-foreground" width={80} />
                                  <Tooltip
                                    content={({ active, payload }) => {
                                      if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        return (
                                          <div className="bg-background border rounded-lg shadow-lg p-2">
                                            <p className="font-semibold text-sm mb-1">{data.displayName}</p>
                                            <p className="text-xs text-muted-foreground">{data.count} Sertifikat . {data.companyCount} Perusahaan</p>
                                            <p className="text-sm font-bold">Rp {data.total.toLocaleString('id-ID')}</p>
                                          </div>
                                        );
                                      }
                                      return null;
                                    }}
                                  />
                                  <Line
                                    type="monotone"
                                    dataKey="total"
                                    stroke="#F97316"
                                    strokeWidth={3}
                                    dot={{ fill: '#F97316', strokeWidth: 2, r: 6 }}
                                    activeDot={{ r: 8 }}
                                  >
                                    <LabelList
                                      dataKey="total"
                                      position="top"
                                      fontSize={13}
                                      fontWeight="bold"
                                      fill="#F97316"
                                      formatter={(value: number) => {
                                        if (value >= 1000000000) return (value / 1000000000).toFixed(1) + 'M';
                                        else if (value >= 1000000) return (value / 1000000).toFixed(1) + 'Jt';
                                        else return (value / 1000).toFixed(0) + 'rb';
                                      }}
                                    />
                                  </Line>
                                </LineChart>
                              );

                            case 'pie':
                              const pieData = allSales.map((sales, index) => ({
                                name: sales.displayName,
                                value: sales.total,
                                count: sales.count,
                                companyCount: sales.companyCount,
                                color: generateSalesColors(index)
                              }));

                              return (
                                <PieChart width={400} height={400}>
                                  <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={true}
                                    label={(entry) => {
                                      const value = entry.value;
                                      let label = '';
                                      if (value >= 1000000000) label = (value / 1000000000).toFixed(1) + 'M';
                                      else if (value >= 1000000) label = (value / 1000000).toFixed(1) + 'Jt';
                                      else label = (value / 1000).toFixed(0) + 'rb';
                                      return `${entry.name}`;
                                    }}
                                    outerRadius={120}
                                    dataKey="value"
                                  >
                                    {pieData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                  </Pie>
                                  <Tooltip
                                    content={({ active, payload }) => {
                                      if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        return (
                                          <div className="bg-background border rounded-lg shadow-lg p-2">
                                            <p className="font-semibold text-sm mb-1">{data.name}</p>
                                            <p className="text-xs text-muted-foreground">{data.count} Sertifikat . {data.companyCount} Perusahaan</p>
                                            <p className="text-sm font-bold">Rp {data.value.toLocaleString('id-ID')}</p>
                                          </div>
                                        );
                                      }
                                      return null;
                                    }}
                                  />
                                </PieChart>
                              );

                            default:
                              return <BarChart data={allSales} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="displayName" /><YAxis /><Bar dataKey="total" fill="#C2410C" /></BarChart>;
                          }
                        })()}
                      </ResponsiveContainer>
                    </div>
                  );
                })()}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tahapan Audit Distribution Analytics */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Distribusi Tahapan Audit 
                </CardTitle>
                <CardDescription className="mt-1">
                  Distribusi tahapan audit berdasarkan total harga kontrak (bulan EXP)
                </CardDescription>
              </div>
              <Select value={selectedTopAssociateChartType} onValueChange={setSelectedTopAssociateChartType}>
                <SelectTrigger className="w-32 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">Bar</SelectItem>
                  <SelectItem value="line">Line</SelectItem>
                  <SelectItem value="pie">Pie</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative overflow-hidden rounded-xl border border-teal-200/50 shadow-lg bg-gradient-to-br from-teal-50/50 to-cyan-50/30 p-6">
              {/* Futuristic background overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500/15 via-cyan-400/10 to-transparent opacity-80 pointer-events-none rounded-xl"></div>
              <div className="absolute inset-0 bg-gradient-to-tr from-teal-500/5 via-transparent to-cyan-500/5 pointer-events-none rounded-xl"></div>

              <div className="relative z-10">
                {(() => {
                  // Import master-tahapan.json for legend
                  const masterTahapanData = require('@/data/master-tahapan.json');

                  // Filter data: HANYA filter tahun dan statusSertifikat dari ALL data (tanpa filter lain)
                  const dataForTahapan = (crmTargets || []).filter(t => {
                    const matchesTahun = filterTahun === 'all' || t.tahun === filterTahun;
                    const matchesStatus = (t.statusSertifikat || '').trim().toLowerCase() === 'terbit';
                    return matchesTahun && matchesStatus;
                  });

                  // Group by tahapAudit and get totals
                  const tahapTotals: { [key: string]: { total: number; count: number; companies: Set<string> } } = {};

                  dataForTahapan.forEach(target => {
                    const tahap = target.tahapAudit || 'Unknown';
                    const amount = target.hargaKontrak || 0;
                    const company = target.namaPerusahaan;

                    if (!tahapTotals[tahap]) {
                      tahapTotals[tahap] = {
                        total: 0,
                        count: 0,
                        companies: new Set()
                      };
                    }

                    tahapTotals[tahap].total += amount;
                    tahapTotals[tahap].count += 1;
                    if (company) {
                      tahapTotals[tahap].companies.add(company);
                    }
                  });

                  // Sort and get all tahapan with their display names from master
                  const allTahapan = Object.entries(tahapTotals)
                    .map(([kode, data]) => {
                      // Find display name from master-tahapan.json
                      const masterTahap = masterTahapanData.tahapan?.find((t: any) => t.kode === kode);
                      const displayName = masterTahap?.nama || kode;

                      return {
                        kode,
                        displayName,
                        total: data.total,
                        count: data.count,
                        companyCount: data.companies.size
                      };
                    })
                    .sort((a, b) => b.total - a.total);

                  // Generate colors for tahapan - Teal solid
                  const generateTahapColors = (index: number) => {
                    return '#7de9e0'; // Teal 600 (teal tua) - same color for all
                  };

                  const hasData = allTahapan.length > 0;

                  if (!hasData) {
                    return (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>Tidak ada data tahapan audit</p>
                      </div>
                    );
                  }

                  return (
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        {(() => {
                          switch (selectedTopAssociateChartType) {
                            case 'bar':
                              return (
                                <BarChart data={allTahapan} layout="vertical" margin={{ top: 5, right: 120, left:0, bottom: 5 }}>
                                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                  <XAxis type="number" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                                  <YAxis
                                    type="category"
                                    dataKey="displayName"
                                    tick={{ fontSize: 13, fontWeight: 700 }}
                                    className="fill-foreground"
                                    width={90}
                                  />
                                  <Tooltip
                                    content={({ active, payload }) => {
                                      if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        return (
                                          <div className="bg-background border rounded-lg shadow-lg p-2">
                                            <p className="font-semibold text-sm mb-1">{data.displayName}</p>
                                            <p className="text-xs text-muted-foreground">{data.count} Sertifikat . {data.companyCount} Perusahaan</p>
                                            <p className="text-sm font-bold">Rp {data.total.toLocaleString('id-ID')}</p>
                                          </div>
                                        );
                                      }
                                      return null;
                                    }}
                                  />
                                  <defs>
                                    {allTahapan.map((entry, index) => {
                                      const colors = [
                                        ['#0D9488', '#02423b'],  // Teal
                                        ['#06B6D4', '#055e6b'],  // Cyan
                                        ['#8B5CF6', '#1e0569'],  // Purple
                                        ['#D946EF', '#5a0468'],  // Fuchsia
                                        ['#F59E0B', '#4d3c05'],  // Yellow
                                        ['#EF4444', '#5c0606'],  // Red
                                        // Tambahkan warna lain sesuai kebutuhan
                                      ];
                                      const [startColor, endColor] = colors[index % colors.length];
                                      
                                      return (
                                        <linearGradient key={`gradient-${index}`} id={`gradient${index}`} x1="0" y1="0" x2="1" y2="0">
                                          <stop offset="0%" stopColor={startColor} stopOpacity={0.8} />
                                          <stop offset="100%" stopColor={endColor} stopOpacity={1} />
                                        </linearGradient>
                                      );
                                    })}
                                  </defs>
                                  <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                                    <LabelList
                                      dataKey="total"
                                      position="right"
                                      fontSize={15}
                                      fontWeight="bold"
                                      fill="#04434e"  // Warna text label (slate-700)
                                      formatter={(value: number) => {
                                        const rounded = Math.round(value / 1000) * 1000;
                                        const dataPoint = allTahapan.find(d => d.total === value);
                                        const count = dataPoint?.count || 0;
                                        return `${rounded.toLocaleString('id-ID')} (${count})`;
                                      }}
                                    />
                                    {allTahapan.map((entry, index) => (
                                      <Cell 
                                        key={`cell-${index}`} 
                                        fill={`url(#gradient${index})`} 
                                      />
                                    ))}
                                  </Bar>
                                </BarChart>
                              );

                            case 'line':
                              return (
                                <LineChart data={allTahapan} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                  <XAxis
                                    dataKey="displayName"
                                    tick={{ fontSize: 13, fontWeight: 700 }}
                                    className="fill-foreground"
                                  />
                                  <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" width={80} />
                                  <Tooltip
                                    content={({ active, payload }) => {
                                      if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        return (
                                          <div className="bg-background border rounded-lg shadow-lg p-2">
                                            <p className="font-semibold text-sm mb-1">{data.displayName}</p>
                                            <p className="text-xs text-muted-foreground">{data.count} Sertifikat . {data.companyCount} Perusahaan</p>
                                            <p className="text-sm font-bold">Rp {data.total.toLocaleString('id-ID')}</p>
                                          </div>
                                        );
                                      }
                                      return null;
                                    }}
                                  />
                                  <Line
                                    type="monotone"
                                    dataKey="total"
                                    stroke="#0D9488"
                                    strokeWidth={3}
                                    dot={{ fill: '#0D9488', strokeWidth: 2, r: 6 }}
                                    activeDot={{ r: 8 }}
                                  >
                                    <LabelList
                                      dataKey="total"
                                      position="top"
                                      fontSize={13}
                                      fontWeight="bold"
                                      fill="#0D9488"
                                      formatter={(value: number) => {
                                        if (value >= 1000000000) return (value / 1000000000).toFixed(1) + 'M';
                                        else if (value >= 1000000) return (value / 1000000).toFixed(1) + 'Jt';
                                        else return (value / 1000).toFixed(0) + 'rb';
                                      }}
                                    />
                                  </Line>
                                </LineChart>
                              );

                            case 'pie':
                              const pieData = allTahapan.map((tahap, index) => ({
                                name: tahap.displayName,
                                value: tahap.total,
                                count: tahap.count,
                                companyCount: tahap.companyCount,
                                color: generateTahapColors(index)
                              }));

                              return (
                                <PieChart width={400} height={400}>
                                  <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={true}
                                    label={(entry) => {
                                      const value = entry.value;
                                      let label = '';
                                      if (value >= 1000000000) label = (value / 1000000000).toFixed(1) + 'M';
                                      else if (value >= 1000000) label = (value / 1000000).toFixed(1) + 'Jt';
                                      else label = (value / 1000).toFixed(0) + 'rb';
                                      return `${entry.name}`;
                                    }}
                                    outerRadius={120}
                                    dataKey="value"
                                  >
                                    {pieData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                  </Pie>
                                  <Tooltip
                                    content={({ active, payload }) => {
                                      if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        return (
                                          <div className="bg-background border rounded-lg shadow-lg p-2">
                                            <p className="font-semibold text-sm mb-1">{data.name}</p>
                                            <p className="text-xs text-muted-foreground">{data.count} Sertifikat . {data.companyCount} Perusahaan</p>
                                            <p className="text-sm font-bold">Rp {data.value.toLocaleString('id-ID')}</p>
                                          </div>
                                        );
                                      }
                                      return null;
                                    }}
                                  />
                                </PieChart>
                              );

                            default:
                              return <BarChart data={allTahapan} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="displayName" /><YAxis /><Bar dataKey="total" fill="#0D9488" /></BarChart>;
                          }
                        })()}
                      </ResponsiveContainer>
                    </div>
                  );
                })()}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Standar Distribution Analytics */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Chart Standar
                </CardTitle>
                <CardDescription className="mt-1">
                  Distribusi standar berdasarkan jumlah sertifikat
                </CardDescription>
              </div>
              <Select value={selectedStandarChartType} onValueChange={setSelectedStandarChartType}>
                <SelectTrigger className="w-32 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="area">Area</SelectItem>
                  <SelectItem value="bar">Bar</SelectItem>
                  <SelectItem value="line">Line</SelectItem>
                  <SelectItem value="pie">Pie</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {(() => {
              // Filter data: HANYA filter tahun dari ALL data (tanpa filter statusSertifikat)
              const dataForStandar = (crmTargets || []).filter(t => {
                const matchesTahun = filterTahun === 'all' || t.tahun === filterTahun;
                return matchesTahun;
              });

              // Get list of valid codes from master standar
              const validStandarCodes = new Set(masterStandarData.standar.map((s: any) => s.kode));

              // Group by std and get counts - HANYA yang ada di master standar
              const standarTotals: { [key: string]: { count: number; companies: Set<string> } } = {};

              dataForStandar.forEach(target => {
                const stdCode = target.std;

                // Skip jika tidak ada std atau tidak ada di master standar
                if (!stdCode || !validStandarCodes.has(stdCode)) {
                  return;
                }

                const company = target.namaPerusahaan;

                if (!standarTotals[stdCode]) {
                  standarTotals[stdCode] = {
                    count: 0,
                    companies: new Set()
                  };
                }

                standarTotals[stdCode].count += 1;
                if (company) {
                  standarTotals[stdCode].companies.add(company);
                }
              });

              // Sort and get all standar
              const allStandar = Object.entries(standarTotals)
                .map(([std, data]) => ({
                  std,
                  count: data.count,
                  companyCount: data.companies.size
                }))
                .sort((a, b) => b.count - a.count);

              return (
                <ChartCardStandarDistribution
                  title="Distribusi Standar"
                  data={allStandar}
                  chartType={selectedStandarChartType}
                />
              );
            })()}
          </CardContent>
        </Card>

        {/* EA Code Distribution Analytics */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  EA Code Distribution
                </CardTitle>
                <CardDescription className="mt-1">
                  Distribusi EA code berdasarkan jumlah sertifikat
                </CardDescription>
              </div>
              <Select value={selectedEaCodeChartType} onValueChange={setSelectedEaCodeChartType}>
                <SelectTrigger className="w-32 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="area">Area</SelectItem>
                  <SelectItem value="bar">Bar</SelectItem>
                  <SelectItem value="line">Line</SelectItem>
                  <SelectItem value="pie">Pie</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {(() => {
              // Filter data: HANYA filter tahun dari ALL data (tanpa filter statusSertifikat)
              const dataForEaCode = (crmTargets || []).filter(t => {
                const matchesTahun = filterTahun === 'all' || t.tahun === filterTahun;
                return matchesTahun;
              });

              // Get list of valid EA codes from master ea code - normalized
              const validEaCodes = new Set(
                masterEaCodeData.ea_code.map((e: any) => {
                  // Normalize: trim, remove extra spaces, ensure consistent spacing
                  return e.ea_code
                    .trim()
                    .replace(/\s*,\s*/g, ', ')  // Normalize comma spacing
                    .replace(/\s+/g, ' ');       // Remove extra spaces
                })
              );

              // Group by eaCode and get counts - HANYA yang ada di master ea code
              const eaCodeTotals: { [key: string]: { count: number; companies: Set<string> } } = {};

              dataForEaCode.forEach(target => {
                const rawEaCode = target.eaCode;

                if (!rawEaCode) {
                  return;
                }

                // Normalize eaCode dari data untuk matching
                const normalizedEaCode = rawEaCode
                  .trim()
                  .replace(/\s*,\s*/g, ', ')  // Normalize comma spacing
                  .replace(/\s+/g, ' ');       // Remove extra spaces

                // Skip jika tidak ada di master ea code
                if (!validEaCodes.has(normalizedEaCode)) {
                  return;
                }

                // Gunakan normalized eaCode sebagai key
                const company = target.namaPerusahaan;

                if (!eaCodeTotals[normalizedEaCode]) {
                  eaCodeTotals[normalizedEaCode] = {
                    count: 0,
                    companies: new Set()
                  };
                }

                eaCodeTotals[normalizedEaCode].count += 1;
                if (company) {
                  eaCodeTotals[normalizedEaCode].companies.add(company);
                }
              });

              // Sort and get all EA codes - urutkan dari yang terbanyak
              const allEaCodes = Object.entries(eaCodeTotals)
                .map(([eaCode, data]) => ({
                  eaCode,
                  count: data.count,
                  companyCount: data.companies.size
                }))
                .sort((a, b) => b.count - a.count);

              return (
                <ChartCardEaCodeDistribution
                  title="Distribusi EA Code"
                  data={allEaCodes}
                  chartType={selectedEaCodeChartType}
                />
              );
            })()}
          </CardContent>
        </Card>

        {/* Disclaimer - Pencapaian PIC CRM Contract Base */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800 font-medium text-center">
            ⚠️ <strong>Disclaimer:</strong> Dibawah ini adalah pencapaian berdasarkan PIC CRM ( Contract Base )
          </p>
        </div>

        {/* Staff Performance Cards - MRC & DHA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* MRC Card - Only show when filterPicCrm is 'all' or 'MRC' */}
          {(filterPicCrm === 'all' || filterPicCrm === 'MRC') && (
            <Card>
              <CardContent className="">
                {(() => {
                  // Get MRC data from filteredTargets - applies all filters including Bulan TTD Notif
                  const mrcData = (filteredTargets || []).filter(t => (t.picCrm || '').toUpperCase() === 'MRC');
                  const mrcTotal = mrcData.length;
                  const mrcLanjut = mrcData.filter(t => t.status === 'DONE').length;
                  const mrcLoss = mrcData.filter(t => t.status === 'LOSS').length;
                  const mrcSuspend = mrcData.filter(t => t.status === 'SUSPEND').length;
                  const mrcProses = mrcData.filter(t => t.status === 'PROSES').length;
                  const mrcWaiting = mrcData.filter(t => t.status === 'WAITING').length;
                  const mrcTotalAmount = Math.round(mrcData.reduce((sum, t) => sum + (t.hargaKontrak || 0), 0));

                  // Calculate total by status from hargaTerupdate (except WAITING uses hargaKontrak)
                  const mrcDoneAmount = Math.round(mrcData.filter(t => t.status === 'DONE').reduce((sum, t) => sum + (t.hargaTerupdate || 0), 0));
                  const mrcProsesAmount = Math.round(mrcData.filter(t => t.status === 'PROSES').reduce((sum, t) => sum + (t.hargaTerupdate || 0), 0));
                  const mrcSuspendAmount = Math.round(mrcData.filter(t => t.status === 'SUSPEND').reduce((sum, t) => sum + (t.hargaTerupdate || 0), 0));
                  const mrcLossAmount = Math.round(mrcData.filter(t => t.status === 'LOSS').reduce((sum, t) => sum + (t.hargaTerupdate || 0), 0));
                  const mrcWaitingAmount = Math.round(mrcData.filter(t => t.status === 'WAITING').reduce((sum, t) => sum + (t.hargaKontrak || 0), 0));
                  const mrcLanjutAmount = Math.round(mrcData.filter(t => t.status === 'DONE').reduce((sum, t) => sum + (t.hargaKontrak || 0), 0));
                  const targetVisits = 100; // Sesuaikan dengan target tahunan

                  return (
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Left Side - Profile Photo */}
                      <div className="flex-shrink-0 flex justify-center">
                        <div className="relative">
                          <img
                            src="/images/mercy.jpeg"
                            onError={(e) => (e.currentTarget.src = "https://api.dicebear.com/7.x/avataaars/svg?seed=MRC")}
                            className="w-32 h-32 sm:w-60 sm:h-auto rounded-full object-cover border-2 border-background shadow-lg"
                            style={{ maxHeight: '300px' }}
                            alt="MRC"
                          />
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background"></div>
                        </div>
                      </div>

                      {/* Right Side - Info & Stats */}
                      <div className="flex-1 space-y-2">
                        {/* Profile Info */}
                        <div className="text-center sm:text-left">
                          <p className="font-bold text-xl">MRC</p>
                          <p className="text-sm text-muted-foreground">PIC CRM</p>
                        </div>

                        {/* Performance Overview */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Total Nilai Kontrak</span>
                            <span className="text-sm font-bold text-primary">Rp {Math.round(mrcTotalAmount * 0.9).toLocaleString('id-ID')}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${mrcTotalAmount > 0 ? Math.min((mrcLanjutAmount / mrcTotalAmount) * 100, 100) : 0}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Kontrak Lanjut: Rp {mrcLanjutAmount.toLocaleString('id-ID')}</span>
                            <span>{mrcTotalAmount > 0 ? Math.round((mrcLanjutAmount / mrcTotalAmount) * 100) : 0}%</span>
                          </div>
                        </div>

                        {/* Detailed Statistics */}
                        <div className="space-y-1">
                          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Performance Breakdown</div>
                          <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 text-xs">
                            <div className="flex justify-between items-center">
                              <span className="text-green-600">✓ Lanjut</span>
                              <div className="text-right">
                                <div className="font-medium">{mrcLanjut}</div>
                                <div className="text-[9px] text-green-600">Rp {mrcDoneAmount.toLocaleString('id-ID')}</div>
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-red-600">✗ Loss</span>
                              <div className="text-right">
                                <div className="font-medium">{mrcLoss}</div>
                                <div className="text-[9px] text-red-600">Rp {mrcLossAmount.toLocaleString('id-ID')}</div>
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-orange-600">⏸ Suspend</span>
                              <div className="text-right">
                                <div className="font-medium">{mrcSuspend}</div>
                                <div className="text-[9px] text-orange-600">Rp {mrcSuspendAmount.toLocaleString('id-ID')}</div>
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-blue-600">⏸ Proses</span>
                              <div className="text-right">
                                <div className="font-medium">{mrcProses}</div>
                                <div className="text-[9px] text-blue-600">Rp {mrcProsesAmount.toLocaleString('id-ID')}</div>
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">⏳ Waiting</span>
                              <div className="text-right">
                                <div className="font-medium">{mrcWaiting}</div>
                                <div className="text-[9px] text-gray-600">Rp {mrcWaitingAmount.toLocaleString('id-ID')}</div>
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-purple-600">📊 Visits</span>
                              <span className="font-medium">{mrcData.filter(t => t.tanggalKunjungan).length}/{mrcTotal}</span>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}

          {/* DHA Card - Only show when filterPicCrm is 'all' or 'DHA' */}
          {(filterPicCrm === 'all' || filterPicCrm === 'DHA') && (
            <Card>
              <CardContent className="">
                {(() => {
                  // Get DHA data from filteredTargets - applies all filters including Bulan TTD Notif
                  const dhaData = (filteredTargets || []).filter(t => (t.picCrm || '').toUpperCase() === 'DHA');
                const dhaTotal = dhaData.length;
                const dhaLanjut = dhaData.filter(t => t.status === 'DONE').length;
                const dhaLoss = dhaData.filter(t => t.status === 'LOSS').length;
                const dhaSuspend = dhaData.filter(t => t.status === 'SUSPEND').length;
                const dhaProses = dhaData.filter(t => t.status === 'PROSES').length;
                const dhaWaiting = dhaData.filter(t => t.status === 'WAITING').length;
                const dhaTotalAmount = Math.round(dhaData.reduce((sum, t) => sum + (t.hargaKontrak || 0), 0));

                // Calculate total by status from hargaTerupdate (except WAITING uses hargaKontrak)
                const dhaDoneAmount = Math.round(dhaData.filter(t => t.status === 'DONE').reduce((sum, t) => sum + (t.hargaTerupdate || 0), 0));
                const dhaProsesAmount = Math.round(dhaData.filter(t => t.status === 'PROSES').reduce((sum, t) => sum + (t.hargaTerupdate || 0), 0));
                const dhaSuspendAmount = Math.round(dhaData.filter(t => t.status === 'SUSPEND').reduce((sum, t) => sum + (t.hargaTerupdate || 0), 0));
                const dhaLossAmount = Math.round(dhaData.filter(t => t.status === 'LOSS').reduce((sum, t) => sum + (t.hargaTerupdate || 0), 0));
                const dhaWaitingAmount = Math.round(dhaData.filter(t => t.status === 'WAITING').reduce((sum, t) => sum + (t.hargaKontrak || 0), 0));
                const dhaLanjutAmount = Math.round(dhaData.filter(t => t.status === 'DONE').reduce((sum, t) => sum + (t.hargaKontrak || 0), 0));
                const targetVisits = 100; // Sesuaikan dengan target tahunan

                  return (
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Left Side - Profile Photo */}
                      <div className="flex-shrink-0 flex justify-center">
                        <div className="relative">
                          <img
                            src="/images/dhea.jpeg"
                            onError={(e) => (e.currentTarget.src = "https://api.dicebear.com/7.x/avataaars/svg?seed=DHA")}
                            className="w-32 h-32 sm:w-60 sm:h-auto rounded-full object-cover border-2 border-background shadow-lg"
                            style={{ maxHeight: '300px' }}
                            alt="DHA"
                          />
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background"></div>
                        </div>
                      </div>

                      {/* Right Side - Info & Stats */}
                      <div className="flex-1 space-y-2">
                        {/* Profile Info */}
                        <div className="text-center sm:text-left">
                          <p className="font-bold text-xl">DHA</p>
                          <p className="text-sm text-muted-foreground">PIC CRM</p>
                        </div>

                        {/* Performance Overview */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Total Nilai Kontrak</span>
                            <span className="text-sm font-bold text-primary">Rp {Math.round(dhaTotalAmount * 0.9).toLocaleString('id-ID')}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${dhaTotalAmount > 0 ? Math.min((dhaLanjutAmount / dhaTotalAmount) * 100, 100) : 0}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Kontrak Lanjut: Rp {dhaLanjutAmount.toLocaleString('id-ID')}</span>
                            <span>{dhaTotalAmount > 0 ? Math.round((dhaLanjutAmount / dhaTotalAmount) * 100) : 0}%</span>
                          </div>
                        </div>

                        {/* Detailed Statistics */}
                        <div className="space-y-1">
                          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Performance Breakdown</div>
                          <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 text-xs">
                            <div className="flex justify-between items-center">
                              <span className="text-green-600">✓ Lanjut</span>
                              <div className="text-right">
                                <div className="font-medium">{dhaLanjut}</div>
                                <div className="text-[9px] text-green-600">Rp {dhaDoneAmount.toLocaleString('id-ID')}</div>
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-red-600">✗ Loss</span>
                              <div className="text-right">
                                <div className="font-medium">{dhaLoss}</div>
                                <div className="text-[9px] text-red-600">Rp {dhaLossAmount.toLocaleString('id-ID')}</div>
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-orange-600">⏸ Suspend</span>
                              <div className="text-right">
                                <div className="font-medium">{dhaSuspend}</div>
                                <div className="text-[9px] text-orange-600">Rp {dhaSuspendAmount.toLocaleString('id-ID')}</div>
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-blue-600">⏸ Proses</span>
                              <div className="text-right">
                                <div className="font-medium">{dhaProses}</div>
                                <div className="text-[9px] text-blue-600">Rp {dhaProsesAmount.toLocaleString('id-ID')}</div>
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">⏳ Waiting</span>
                              <div className="text-right">
                                <div className="font-medium">{dhaWaiting}</div>
                                <div className="text-[9px] text-gray-600">Rp {dhaWaitingAmount.toLocaleString('id-ID')}</div>
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-purple-600">📊 Visits</span>
                              <span className="font-medium">{dhaData.filter(t => t.tanggalKunjungan).length}/{dhaTotal}</span>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Charts Section - Lanjut, Loss, Suspend, Proses, Waiting */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                CRM Status Analytics (Contract Base)
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {filterStatus === 'all'
                  ? 'Visualisasi data berdasarkan harga kontrak dengan semua status'
                  : `Visualisasi data berdasarkan harga kontrak dengan status ${filterStatus?.toUpperCase()}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Chart Type:</span>
              <Select value={selectedChartType} onValueChange={setSelectedChartType}>
                <SelectTrigger className="w-32 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="area">Area</SelectItem>
                  <SelectItem value="bar">Bar</SelectItem>
                  <SelectItem value="line">Line</SelectItem>
                  <SelectItem value="pie">Pie</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Show all 5 charts when filterStatus is 'all', otherwise show only selected status chart */}
          {filterStatus === 'all' ? (
            <div className="space-y-4">
              {/* First row: DONE, LOSS, SUSPEND */}
              <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
                {/* Lanjut Chart */}
                <ChartCardCrmData
                  title="Status - DONE"
                  data={filteredTargets.filter(t => t.status === 'DONE')}
                  statusColor="green"
                  chartType={selectedChartType}
                  filterTahun={filterTahun}
                  filterPicCrm={filterPicCrm}
                  filterProvinsi={filterProvinsi}
                  filterKota={filterKota}
                />

                {/* Loss Chart */}
                <ChartCardCrmData
                  title="Status - LOSS"
                  data={filteredTargets.filter(t => t.status === 'LOSS')}
                  statusColor="red"
                  chartType={selectedChartType}
                  filterTahun={filterTahun}
                  filterPicCrm={filterPicCrm}
                  filterProvinsi={filterProvinsi}
                  filterKota={filterKota}
                />

                {/* Suspend Chart */}
                <ChartCardCrmData
                  title="Status - SUSPEND"
                  data={filteredTargets.filter(t => t.status === 'SUSPEND')}
                  statusColor="orange"
                  chartType={selectedChartType}
                  filterTahun={filterTahun}
                  filterPicCrm={filterPicCrm}
                  filterProvinsi={filterProvinsi}
                  filterKota={filterKota}
                />
              </div>

              {/* Second row: PROSES, WAITING */}
              <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
                {/* Proses Chart */}
                <ChartCardCrmData
                  title="Status - PROSES"
                  data={filteredTargets.filter(t => t.status === 'PROSES')}
                  statusColor="blue"
                  chartType={selectedChartType}
                  filterTahun={filterTahun}
                  filterPicCrm={filterPicCrm}
                  filterProvinsi={filterProvinsi}
                  filterKota={filterKota}
                />

                {/* Waiting Chart */}
                <ChartCardCrmData
                  title="Status - WAITING"
                  data={filteredTargets.filter(t => t.status === 'WAITING')}
                  statusColor="gray"
                  chartType={selectedChartType}
                  filterTahun={filterTahun}
                  filterPicCrm={filterPicCrm}
                  filterProvinsi={filterProvinsi}
                  filterKota={filterKota}
                />
              </div>
            </div>
          ) : (
            /* Show only selected status chart with full width */
            <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
              <ChartCardCrmData
                title={`Status - ${filterStatus?.toUpperCase()}`}
                data={filteredTargets.filter(t => {
                  const statusUpper = filterStatus?.toUpperCase() || '';
                  return t.status === statusUpper;
                })}
                statusColor={
                  filterStatus?.toUpperCase() === 'DONE' ? 'green' :
                  filterStatus?.toUpperCase() === 'LOSS' ? 'red' :
                  filterStatus?.toUpperCase() === 'SUSPEND' ? 'orange' : 'blue'
                }
                chartType={selectedChartType}
                filterTahun={filterTahun}
                filterPicCrm={filterPicCrm}
                filterProvinsi={filterProvinsi}
                filterKota={filterKota}
                isFullWidth={true}
              />
            </div>
          )}
        </div>

        {/* Table */}
        <Card>
          {/* Header - Title & Search */}
          <div className="border-b border-border p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Detail Perusahaan</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {filteredTargets.length} records
                </p>
              </div>
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search Company, Sales, PIC..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <CardContent className="p-0">
            <div className="overflow-x-auto relative">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 hidden md:table-cell sticky left-0 bg-white z-10">No</TableHead>
                    <TableHead className="hidden md:table-cell sticky left-[1.7rem] bg-white z-10 border-r border-border min-w-[200px]">Company</TableHead>
                    <TableHead className="md:hidden">No</TableHead>
                    <TableHead className="md:hidden">Company</TableHead>
                    <TableHead>Bulan Exp</TableHead>
                    <TableHead>Produk</TableHead>
                    <TableHead>PIC CRM</TableHead>
                    <TableHead>Sales</TableHead>
                    <TableHead>Nama Associate</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Alasan</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Provinsi</TableHead>
                    <TableHead>Kota</TableHead>
                    <TableHead>Alamat</TableHead>
                    <TableHead>Akreditasi</TableHead>
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
                      <TableCell colSpan={29} className="text-center py-8">
                        No data found
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedTargets.map((target, index) => (
                      <TableRow
                        key={target._id}
                        className="hover:bg-muted/50"
                      >
                        <TableCell className="font-medium hidden md:table-cell sticky left-0 bg-white z-10 border-border">{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                        <TableCell className="font-medium hidden md:table-cell sticky left-[1.7rem] bg-white z-10 border-r border-border min-w-[200px]">{target.namaPerusahaan}</TableCell>
                        <TableCell className="md:hidden font-medium">{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                        <TableCell className="md:hidden font-medium">{target.namaPerusahaan}</TableCell>
                        <TableCell>{target.bulanExpDate || '-'}</TableCell>
                        <TableCell>{target.produk || '-'}</TableCell>
                        <TableCell>{target.picCrm}</TableCell>
                        <TableCell>{target.sales}</TableCell>
                        <TableCell>{target.namaAssociate || '-'}</TableCell>
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
                        <TableCell>{target.provinsi || '-'}</TableCell>
                        <TableCell>{target.kota || '-'}</TableCell>
                        <TableCell className="max-w-xs truncate" title={target.alamat}>{target.alamat || '-'}</TableCell>
                        <TableCell>{target.akreditasi || '-'}</TableCell>
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
        </>
        )}
      </div>
    </div>
  );
}