"use client";

import React, { useState } from 'react';
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
import { ChartCardCrmData } from '@/components/chart-card-crm-data';
import { ChartCardPencapaianMonthly } from '@/components/chart-card-pencapaian-monthly';

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
  const [activeFilterSheet, setActiveFilterSheet] = useState<string | null>(null);

  // Comprehensive Filters
  const [expandedFilterSections, setExpandedFilterSections] = useState<string[]>(['date', 'details', 'picSales', 'sertifikat', 'pembayaran', 'jadwal']);
  const currentYear = new Date().getFullYear().toString();
  const [filterTahun, setFilterTahun] = useState<string>(currentYear);
  const [filterFromBulanExp, setFilterFromBulanExp] = useState<string>('all');
  const [filterToBulanExp, setFilterToBulanExp] = useState<string>('all');
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
  const [filterTipeProduk, setFilterTipeProduk] = useState<string>('all');
  const [filterPicSales, setFilterPicSales] = useState<string>('all');
  const [filterFromKunjungan, setFilterFromKunjungan] = useState<string>('all');
  const [filterToKunjungan, setFilterToKunjungan] = useState<string>('all');
  const [filterStatusKunjungan, setFilterStatusKunjungan] = useState<string>('all');

  // Fetch CRM targets
  const crmTargets = useQuery(api.crmTargets.getCrmTargets);
  const allUsers = useQuery(api.auth.getAllUsers);
  const staffUsers = allUsers?.filter(user => user.role === 'staff') || [];

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
    setFilterFromBulanExp('all');
    setFilterToBulanExp('all');
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
    setFilterTipeProduk('all');
    setFilterPicSales('all');
    setFilterFromKunjungan('all');
    setFilterToKunjungan('all');
    setFilterStatusKunjungan('all');
    setSearchTerm('');
  };

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
    const matchesStandar = filterStandar === 'all' || target.std === filterStandar;
    const matchesAkreditasi = filterAkreditasi === 'all' || target.akreditasi === filterAkreditasi;
    const matchesEaCode = filterEaCode === '' || (target.eaCode || '').toLowerCase().includes(filterEaCode.toLowerCase());
    const matchesTahapAudit = filterTahapAudit === 'all' || target.tahapAudit === filterTahapAudit;
    const matchesStatusSertifikat = filterStatusSertifikat === 'all' || target.statusSertifikat === filterStatusSertifikat;
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
           matchesKota && matchesStandar && matchesAkreditasi && matchesEaCode &&
           matchesTahapAudit && matchesBulanTTD && matchesStatusSertifikat &&
           matchesTermin && matchesTipeProduk && matchesKunjungan && matchesStatusKunjungan;
  }) || [];

  // Pagination
  const totalPages = Math.ceil(filteredTargets.length / itemsPerPage);

  // Get paginated data
  const paginatedTargets = filteredTargets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Get unique values for filters
  const uniqueStatuses = [...new Set(crmTargets?.map(t => t.status) || [])].sort();
  const uniquePicCrms = [...new Set(crmTargets?.map(t => t.picCrm) || [])].sort();

  // Helper function to get status badge variant
  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    const statusUpper = status?.toUpperCase() || '';

    switch (statusUpper) {
      case 'PROSES':
        return 'default';
      case 'LANJUT':
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
              {/* Section Date */}
              <div className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleFilterSection('date')}
                  className="w-full flex items-center justify-between p-3 bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                >
                  <span className="font-medium text-sm">Filter Date</span>
                  {expandedFilterSections.includes('date') ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                {expandedFilterSections.includes('date') && (
                  <div className="p-3 space-y-3 border-t">
                    {/* Tahun */}
                    <div>
                      <Label className="mb-1.5 block text-xs">Tahun</Label>
                      <Select value={filterTahun} onValueChange={setFilterTahun}>
                        <SelectTrigger className="w-full h-8">
                          <SelectValue placeholder="All Tahun" />
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
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="mb-1.5 block text-xs">From Bulan Exp</Label>
                        <Select value={filterFromBulanExp} onValueChange={setFilterFromBulanExp}>
                          <SelectTrigger className="w-full h-8">
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
                        <Label className="mb-1.5 block text-xs">To Bulan Exp</Label>
                        <Select value={filterToBulanExp} onValueChange={setFilterToBulanExp}>
                          <SelectTrigger className="w-full h-8">
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
                )}
              </div>

              {/* Section Details */}
              <div className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleFilterSection('details')}
                  className="w-full flex items-center justify-between p-3 bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                >
                  <span className="font-medium text-sm">Filter PIC CRM</span>
                  {expandedFilterSections.includes('details') ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                {expandedFilterSections.includes('details') && (
                  <div className="p-3 space-y-3 border-t">
                    {/* PIC CRM - Button Filter */}
                    <div>
                      <Label className="mb-1.5 block text-xs">PIC CRM</Label>
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
                )}
              </div>

              {/* Section Lokasi */}
              <div className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleFilterSection('lokasi')}
                  className="w-full flex items-center justify-between p-3 bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                >
                  <span className="font-medium text-sm">Filter Company</span>
                  {expandedFilterSections.includes('lokasi') ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                {expandedFilterSections.includes('lokasi') && (
                  <div className="p-3 space-y-3 border-t">
                                        {/* Status - Button Filter with Colors */}
                    <div>
                      <Label className="mb-1.5 block text-xs">Status</Label>
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

                    {/* Category - Button Filter with Gradient Colors */}
                    <div>
                      <Label className="mb-1.5 block text-xs">Category</Label>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant={filterCategory === "all" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setFilterCategory("all")}
                          className={`flex items-center gap-1 text-xs h-8 px-2 cursor-pointer ${
                            filterCategory === "all"
                              ? "bg-primary text-primary-foreground border-primary"
                              : ""
                          }`}
                        >
                          All Category
                        </Button>
                        {['GOLD', 'SILVER', 'BRONZE'].map((category) => {
                          let categoryColor = '';

                          switch (category) {
                            case 'GOLD':
                              categoryColor = 'bg-gradient-to-r from-yellow-100 to-yellow-200 hover:from-yellow-200 hover:to-yellow-300 text-yellow-800 border-yellow-300 font-medium shadow-sm';
                              break;
                            case 'SILVER':
                              categoryColor = 'bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-800 border-gray-300 font-medium shadow-sm';
                              break;
                            case 'BRONZE':
                              categoryColor = 'bg-gradient-to-r from-orange-100 to-orange-200 hover:from-orange-200 hover:to-orange-300 text-orange-800 border-orange-300 font-medium shadow-sm';
                              break;
                          }

                          return (
                            <Button
                              key={category}
                              size="sm"
                              onClick={() => setFilterCategory(category)}
                              className={`flex items-center gap-1 text-xs h-8 px-2 border cursor-pointer ${
                                filterCategory === category
                                  ? 'bg-black hover:bg-gray-800 text-white border-black font-semibold'
                                  : categoryColor
                              }`}
                            >
                              {category}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
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
                        <SelectTrigger className="w-full h-8 text-xs">
                          <SelectValue placeholder="All Provinsi" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Provinsi</SelectItem>
                          {provinsiOptions.map((provinsi) => (
                            <SelectItem key={provinsi} value={provinsi}>
                              {provinsi}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Kota */}
                    <div>
                      <Label className="mb-1.5 block text-xs">Kota</Label>
                      <Select
                        value={filterKota}
                        onValueChange={setFilterKota}
                        disabled={filterProvinsi === 'all'}
                      >
                        <SelectTrigger className="w-full h-8 text-xs">
                          <SelectValue placeholder={filterProvinsi === 'all' ? 'Select Provinsi first' : 'All Kota'} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Kota</SelectItem>
                          {kotaOptions.map((kota) => (
                            <SelectItem key={kota} value={kota}>
                              {kota}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    
                    {/* Alasan */}
                    <div>
                      <Label className="mb-1.5 block text-xs">Alasan</Label>
                      <Select value={filterAlasan} onValueChange={setFilterAlasan}>
                        <SelectTrigger className="w-full h-8 text-xs">
                          <SelectValue placeholder="All Alasan" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Alasan</SelectItem>
                          {alasanOptions.map((alasan) => (
                            <SelectItem key={alasan} value={alasan}>
                              {alasan}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>

              {/* Section PIC Sales */}
              <div className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleFilterSection('picSales')}
                  className="w-full flex items-center justify-between p-3 bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                >
                  <span className="font-medium text-sm">Filter PIC Sales</span>
                  {expandedFilterSections.includes('picSales') ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                {expandedFilterSections.includes('picSales') && (
                  <div className="p-3 space-y-3 border-t">
                    {/* PIC Sales - Button Filter */}
                    <div>
                      <Label className="mb-1.5 block text-xs">PIC Sales</Label>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant={filterPicSales === "all" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setFilterPicSales("all")}
                          className={`flex items-center gap-1 text-xs h-8 px-2 cursor-pointer ${
                            filterPicSales === "all"
                              ? "bg-primary text-primary-foreground border-primary"
                              : ""
                          }`}
                        >
                          All Sales
                        </Button>
                        {salesOptions.map((sales) => (
                          <Button
                            key={sales}
                            variant={filterPicSales === sales ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilterPicSales(sales)}
                            className={`flex items-center gap-1 text-xs h-8 px-2 cursor-pointer ${
                              filterPicSales === sales
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300"
                            }`}
                          >
                            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex-shrink-0"></div>
                            {sales}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Section Sertifikat */}
              <div className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleFilterSection('sertifikat')}
                  className="w-full flex items-center justify-between p-3 bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                >
                  <span className="font-medium text-sm">Filter Sertifikat</span>
                  {expandedFilterSections.includes('sertifikat') ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                {expandedFilterSections.includes('sertifikat') && (
                  <div className="p-3 space-y-3 border-t">
                    {/* Tipe Produk */}
                    <div>
                      <Label className="mb-1.5 block text-xs">Tipe Produk</Label>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant={filterTipeProduk === "all" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setFilterTipeProduk("all")}
                          className={`flex items-center gap-1 text-xs h-8 px-2 cursor-pointer ${
                            filterTipeProduk === "all"
                              ? "bg-primary text-primary-foreground border-primary"
                              : ""
                          }`}
                        >
                          All
                        </Button>
                        {['XMS', 'SUSTAIN'].map((tipe) => {
                          let tipeColor = '';
                          switch (tipe) {
                            case 'XMS':
                              tipeColor = 'bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-300';
                              break;
                            case 'SUSTAIN':
                              tipeColor = 'bg-green-100 hover:bg-green-200 text-green-700 border-green-300';
                              break;
                          }

                          return (
                            <Button
                              key={tipe}
                              size="sm"
                              onClick={() => setFilterTipeProduk(tipe)}
                              className={`flex items-center gap-1 text-xs h-8 px-2 border cursor-pointer ${
                                filterTipeProduk === tipe
                                  ? 'bg-black hover:bg-gray-800 text-white border-black'
                                  : tipeColor
                              }`}
                            >
                              {tipe}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                    {/* Standar */}
                    <div>
                      <Label className="mb-1.5 block text-xs">Standar</Label>
                      <Select value={filterStandar} onValueChange={setFilterStandar}>
                        <SelectTrigger className="w-full h-8 text-xs">
                          <SelectValue placeholder="All Standar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Standar</SelectItem>
                          {standarOptions.map((standar) => (
                            <SelectItem key={standar} value={standar}>
                              {standar}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Akreditasi */}
                    <div>
                      <Label className="mb-1.5 block text-xs">Akreditasi</Label>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant={filterAkreditasi === "all" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setFilterAkreditasi("all")}
                          className={`flex items-center gap-1 text-xs h-8 px-2 cursor-pointer ${
                            filterAkreditasi === "all"
                              ? "bg-primary text-primary-foreground border-primary"
                              : ""
                          }`}
                        >
                          All
                        </Button>
                        {['KAN', 'NON AKRE'].map((akreditasi) => (
                          <Button
                            key={akreditasi}
                            size="sm"
                            onClick={() => setFilterAkreditasi(akreditasi)}
                            className={`flex items-center gap-1 text-xs h-8 px-2 border cursor-pointer ${
                              filterAkreditasi === akreditasi
                                ? 'bg-black hover:bg-gray-800 text-white border-black'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300'
                            }`}
                          >
                            {akreditasi}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* EA CODE */}
                    <div>
                      <Label className="mb-1.5 block text-xs">EA CODE</Label>
                      <Input
                        placeholder="Search EA Code..."
                        value={filterEaCode}
                        onChange={(e) => setFilterEaCode(e.target.value)}
                        className="h-8"
                      />
                    </div>

                    {/* Tahapan Audit */}
                    <div>
                      <Label className="mb-1.5 block text-xs">Tahapan Audit</Label>
                      <Select value={filterTahapAudit} onValueChange={setFilterTahapAudit}>
                        <SelectTrigger className="w-full h-8 text-xs">
                          <SelectValue placeholder="All Tahapan" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Tahapan</SelectItem>
                          {tahapanAuditOptions.map((tahap) => (
                            <SelectItem key={tahap} value={tahap}>
                              {tahap}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* From/To Bulan TTD */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="mb-1.5 block text-xs">From Bulan TTD</Label>
                        <Select value={filterFromBulanTTD} onValueChange={setFilterFromBulanTTD}>
                          <SelectTrigger className="w-full h-8">
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
                        <Label className="mb-1.5 block text-xs">To Bulan TTD</Label>
                        <Select value={filterToBulanTTD} onValueChange={setFilterToBulanTTD}>
                          <SelectTrigger className="w-full h-8">
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

                    {/* Status Sertifikat */}
                    <div>
                      <Label className="mb-1.5 block text-xs">Status Sertifikat</Label>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant={filterStatusSertifikat === "all" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setFilterStatusSertifikat("all")}
                          className={`flex items-center gap-1 text-xs h-8 px-2 cursor-pointer ${
                            filterStatusSertifikat === "all"
                              ? "bg-primary text-primary-foreground border-primary"
                              : ""
                          }`}
                        >
                          All
                        </Button>
                        {['Terbit', 'Belum Terbit'].map((status) => (
                          <Button
                            key={status}
                            size="sm"
                            onClick={() => setFilterStatusSertifikat(status)}
                            className={`flex items-center gap-1 text-xs h-8 px-2 border cursor-pointer ${
                              filterStatusSertifikat === status
                                ? 'bg-black hover:bg-gray-800 text-white border-black'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300'
                            }`}
                          >
                            {status}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Termin */}
                    <div>
                      <Label className="mb-1.5 block text-xs">Termin</Label>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant={filterTermin === "all" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setFilterTermin("all")}
                          className={`flex items-center gap-1 text-xs h-8 px-2 cursor-pointer ${
                            filterTermin === "all"
                              ? "bg-primary text-primary-foreground border-primary"
                              : ""
                          }`}
                        >
                          All
                        </Button>
                        {['DP', 'Lunas Diawal', 'Lunas Diakhir'].map((termin) => (
                          <Button
                            key={termin}
                            size="sm"
                            onClick={() => setFilterTermin(termin)}
                            className={`flex items-center gap-1 text-xs h-8 px-2 border cursor-pointer ${
                              filterTermin === termin
                                ? 'bg-black hover:bg-gray-800 text-white border-black'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300'
                            }`}
                          >
                            {termin}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Section Jadwal Kunjungan */}
              <div className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleFilterSection('jadwal')}
                  className="w-full flex items-center justify-between p-3 bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                >
                  <span className="font-medium text-sm">Filter Jadwal Kunjungan</span>
                  {expandedFilterSections.includes('jadwal') ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                {expandedFilterSections.includes('jadwal') && (
                  <div className="p-3 space-y-3 border-t">
                    {/* From/To Kunjungan */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="mb-1.5 block text-xs">From</Label>
                        <Select value={filterFromKunjungan} onValueChange={setFilterFromKunjungan}>
                          <SelectTrigger className="w-full h-8">
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
                        <Label className="mb-1.5 block text-xs">To</Label>
                        <Select value={filterToKunjungan} onValueChange={setFilterToKunjungan}>
                          <SelectTrigger className="w-full h-8">
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

                    {/* Status Kunjungan */}
                    <div>
                      <Label className="mb-1.5 block text-xs">Status Kunjungan</Label>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant={filterStatusKunjungan === "all" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setFilterStatusKunjungan("all")}
                          className={`flex items-center gap-1 text-xs h-8 px-2 cursor-pointer ${
                            filterStatusKunjungan === "all"
                              ? "bg-primary text-primary-foreground border-primary"
                              : ""
                          }`}
                        >
                          All
                        </Button>
                        {['VISITED', 'NOT YET'].map((status) => {
                          let statusColor = '';
                          switch (status) {
                            case 'VISITED':
                              statusColor = 'bg-green-100 hover:bg-green-200 text-green-700 border-green-300';
                              break;
                            case 'NOT YET':
                              statusColor = 'bg-gray-200 hover:bg-gray-300 text-gray-700 border-gray-300';
                              break;
                          }

                          return (
                            <Button
                              key={status}
                              size="sm"
                              onClick={() => setFilterStatusKunjungan(status)}
                              className={`flex items-center gap-1 text-xs h-8 px-2 border cursor-pointer ${
                                filterStatusKunjungan === status
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
                  </div>
                )}
              </div>
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
              {(filterFromBulanTTD !== 'all' || filterToBulanTTD !== 'all') && (
                <Badge variant="secondary" className="gap-1">
                  <span className="font-semibold">Bulan TTD:</span>
                  {filterFromBulanTTD !== 'all' ? bulanOptions.find(b => b.value === filterFromBulanTTD)?.label : 'All'}
                  {filterFromBulanTTD !== 'all' && filterToBulanTTD !== 'all' ? ' - ' : ''}
                  {filterToBulanTTD !== 'all' ? bulanOptions.find(b => b.value === filterToBulanTTD)?.label : ''}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => {
                      setFilterFromBulanTTD('all');
                      setFilterToBulanTTD('all');
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
                  className="h-7 text-xs"
                >
                  Reset All
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Total Target Card - Combined MRC & DHA */}
        <Card>
          <CardContent className="p-6">
            {(() => {
              // Calculate TOTAL from ALL data (without filters) - this stays constant
              const allData = (crmTargets || []);

              const totalAllContracts = allData.reduce((sum, t) => sum + (t.hargaKontrak || 0), 0);

              // Calculate FILTERED data - this changes based on filters
              const filteredData = (filteredTargets || []);

              const totalFilteredContracts = filteredData.reduce((sum, t) => sum + (t.hargaKontrak || 0), 0);
              const lanjutContracts = filteredData
                .filter(t => t.status === 'LANJUT' || t.status === 'DONE')
                .reduce((sum, t) => sum + (t.hargaKontrak || 0), 0);
              const lossContracts = filteredData
                .filter(t => t.status === 'LOSS')
                .reduce((sum, t) => sum + (t.hargaKontrak || 0), 0);
              const suspendContracts = filteredData
                .filter(t => t.status === 'SUSPEND')
                .reduce((sum, t) => sum + (t.hargaKontrak || 0), 0);
              const prosesContracts = filteredData
                .filter(t => t.status === 'PROSES')
                .reduce((sum, t) => sum + (t.hargaKontrak || 0), 0);
              const waitingContracts = filteredData
                .filter(t => t.status === 'WAITING')
                .reduce((sum, t) => sum + (t.hargaKontrak || 0), 0);

              // Calculate percentage based on filtered data
              const achievementPercentage = totalFilteredContracts > 0
                ? Math.round((lanjutContracts / totalFilteredContracts) * 100)
                : 0;

              // Determine which progress bar to show based on status filter
              const getProgressConfig = () => {
                // Percentage is ALWAYS calculated from total ALL contracts (not filtered)
                if (filterStatus === 'LANJUT' || filterStatus === 'all') {
                  return {
                    label: 'Pencapaian Kontrak Lanjut',
                    value: lanjutContracts,
                    color: 'green',
                    percentage: totalAllContracts > 0 ? Math.round((lanjutContracts / totalAllContracts) * 100) : 0
                  };
                } else if (filterStatus === 'LOSS') {
                  return {
                    label: 'Pencapaian Kontrak Loss',
                    value: lossContracts,
                    color: 'red',
                    percentage: totalAllContracts > 0 ? Math.round((lossContracts / totalAllContracts) * 100) : 0
                  };
                } else if (filterStatus === 'SUSPEND') {
                  return {
                    label: 'Pencapaian Kontrak Suspend',
                    value: suspendContracts,
                    color: 'orange',
                    percentage: totalAllContracts > 0 ? Math.round((suspendContracts / totalAllContracts) * 100) : 0
                  };
                } else if (filterStatus === 'PROSES') {
                  return {
                    label: 'Pencapaian Kontrak Proses',
                    value: prosesContracts,
                    color: 'blue',
                    percentage: totalAllContracts > 0 ? Math.round((prosesContracts / totalAllContracts) * 100) : 0
                  };
                } else if (filterStatus === 'WAITING') {
                  return {
                    label: 'Pencapaian Kontrak Waiting',
                    value: waitingContracts,
                    color: 'gray',
                    percentage: totalAllContracts > 0 ? Math.round((waitingContracts / totalAllContracts) * 100) : 0
                  };
                } else {
                  // Default: show LANJUT
                  return {
                    label: 'Pencapaian Kontrak Lanjut',
                    value: lanjutContracts,
                    color: 'green',
                    percentage: totalAllContracts > 0 ? Math.round((lanjutContracts / totalAllContracts) * 100) : 0
                  };
                }
              };

              const progressConfig = getProgressConfig();

              const colorClasses = {
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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                        <BarChart3 className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold">Total Target ( Contract Base )</h3>
                        <p className="text-sm text-muted-foreground">Combined MRC & DHA (All Data)</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">Rp {totalAllContracts.toLocaleString('id-ID')}</p>
                      <p className="text-xs text-muted-foreground">{allData.length} kontrak total</p>
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
                        Rp {progressConfig.value.toLocaleString('id-ID')} dari Rp {totalAllContracts.toLocaleString('id-ID')} (Total Semua Kontrak)
                        {filterStatus !== 'all' && filterStatus !== 'LANJUT' && (
                          <span className="ml-2">• Filter: {filterStatus}</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Detailed Breakdown */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-4 border-t">
                    {/* LANJUT */}
                    <div className="flex flex-row items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-green-50 rounded-lg border border-green-200">
                      {/* Left - Percentage Circle */}
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-green-500 flex items-center justify-center">
                          <span className="text-white text-xs sm:text-sm font-bold">{totalAllContracts > 0 ? Math.round((lanjutContracts / totalAllContracts) * 100) : 0}%</span>
                        </div>
                      </div>
                      {/* Right - Info */}
                      <div className="flex-1 min-w-0 text-left">
                        <span className="text-[10px] sm:text-xs text-green-600 font-medium">LANJUT/DONE</span>
                        <div className="text-xs sm:text-sm font-bold text-green-700 truncate">Rp {Math.round(lanjutContracts).toLocaleString('id-ID')}</div>
                        <span className="text-[9px] sm:text-[10px] text-green-600">
                          {filteredData.filter(t => t.status === 'LANJUT' || t.status === 'DONE').length} kontrak
                        </span>
                      </div>
                    </div>

                    {/* PROSES */}
                    <div className="flex flex-row items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-blue-500 flex items-center justify-center">
                          <span className="text-white text-xs sm:text-sm font-bold">{totalAllContracts > 0 ? Math.round((prosesContracts / totalAllContracts) * 100) : 0}%</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <span className="text-[10px] sm:text-xs text-blue-600 font-medium">PROSES</span>
                        <div className="text-xs sm:text-sm font-bold text-blue-700 truncate">Rp {Math.round(prosesContracts).toLocaleString('id-ID')}</div>
                        <span className="text-[9px] sm:text-[10px] text-blue-600">
                          {filteredData.filter(t => t.status === 'PROSES').length} kontrak
                        </span>
                      </div>
                    </div>

                    {/* SUSPEND */}
                    <div className="flex flex-row items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-orange-500 flex items-center justify-center">
                          <span className="text-white text-xs sm:text-sm font-bold">{totalAllContracts > 0 ? Math.round((suspendContracts / totalAllContracts) * 100) : 0}%</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <span className="text-[10px] sm:text-xs text-orange-600 font-medium">SUSPEND</span>
                        <div className="text-xs sm:text-sm font-bold text-orange-700 truncate">Rp {Math.round(suspendContracts).toLocaleString('id-ID')}</div>
                        <span className="text-[9px] sm:text-[10px] text-orange-600">
                          {filteredData.filter(t => t.status === 'SUSPEND').length} kontrak
                        </span>
                      </div>
                    </div>

                    {/* LOSS */}
                    <div className="flex flex-row items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-red-500 flex items-center justify-center">
                          <span className="text-white text-xs sm:text-sm font-bold">{totalAllContracts > 0 ? Math.round((lossContracts / totalAllContracts) * 100) : 0}%</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <span className="text-[10px] sm:text-xs text-red-600 font-medium">LOSS</span>
                        <div className="text-xs sm:text-sm font-bold text-red-700 truncate">Rp {Math.round(lossContracts).toLocaleString('id-ID')}</div>
                        <span className="text-[9px] sm:text-[10px] text-red-600">
                          {filteredData.filter(t => t.status === 'LOSS').length} kontrak
                        </span>
                      </div>
                    </div>

                    {/* WAITING */}
                    <div className="flex flex-row items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-gray-500 flex items-center justify-center">
                          <span className="text-white text-xs sm:text-sm font-bold">{totalAllContracts > 0 ? Math.round((waitingContracts / totalAllContracts) * 100) : 0}%</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <span className="text-[10px] sm:text-xs text-gray-600 font-medium">WAITING</span>
                        <div className="text-xs sm:text-sm font-bold text-gray-700 truncate">Rp {Math.round(waitingContracts).toLocaleString('id-ID')}</div>
                        <span className="text-[9px] sm:text-[10px] text-gray-600">
                          {filteredData.filter(t => t.status === 'WAITING').length} kontrak
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
                  Pencapaian Analytics (Per Bulan)
                </CardTitle>
                <CardDescription className="mt-1">
                  Visualisasi data berdasarkan total harga kontrak per bulan {filterStatus !== 'all' && `- Status: ${filterStatus.toUpperCase()}`}
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

              // When filterStatus is 'all', only show LANJUT/DONE contracts
              // Otherwise, filter by the selected status
              if (filterStatus === 'all') {
                filteredByStatus = filteredByStatus.filter(t => t.status === 'LANJUT' || t.status === 'DONE');
              } else {
                const statusUpper = filterStatus?.toUpperCase() || '';
                filteredByStatus = filteredByStatus.filter(t => {
                  if (statusUpper === 'LANJUT') {
                    return t.status === 'LANJUT' || t.status === 'DONE';
                  }
                  return t.status === statusUpper;
                });
              }

              // Group by bulanExpDate and calculate totals
              const monthlyData: { [key: string]: { total: number; count: number } } = {};

              filteredByStatus.forEach(target => {
                const bulan = target.bulanExpDate || 'Unknown';
                const amount = target.hargaKontrak || 0;

                if (!monthlyData[bulan]) {
                  monthlyData[bulan] = {
                    total: 0,
                    count: 0
                  };
                }

                monthlyData[bulan].total += amount;
                monthlyData[bulan].count += 1;
              });

              // Convert to array and sort by month
              const bulanOrder: { [key: string]: number } = {
                'januari': 1, 'februari': 2, 'maret': 3, 'april': 4, 'mei': 5, 'juni': 6,
                'juli': 7, 'agustus': 8, 'september': 9, 'oktober': 10, 'november': 11, 'desember': 12,
                '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6,
                '7': 7, '8': 8, '9': 9, '10': 10, '11': 11, '12': 12
              };

              const sortedMonthlyData = Object.entries(monthlyData)
                .filter(([bulan]) => bulan.toLowerCase() !== 'unknown')
                .sort(([a], [b]) => {
                  const orderA = bulanOrder[a.toLowerCase()] || 999;
                  const orderB = bulanOrder[b.toLowerCase()] || 999;
                  return orderA - orderB;
                });

              // Calculate grand total
              const grandTotal = filteredByStatus.reduce((sum, t) => sum + (t.hargaKontrak || 0), 0);

              // Determine status color - SAME LOGIC as Total Target progress bar
              const getStatusColor = () => {
                if (filterStatus === 'LANJUT' || filterStatus === 'all') {
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

              // Create aggregated data array for chart (one data point per month with total value)
              const chartData = sortedMonthlyData.map(([bulan, data]) => ({
                bulanExpDate: bulan,
                hargaKontrak: data.total,
                namaPerusahaan: `Total ${bulan}`,
                picCrm: 'All',
                sales: 'All',
                status: filterStatus !== 'all' ? filterStatus.toUpperCase() : 'ALL',
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
              }));

              // Color classes - MATCHES Total Target progress bar colors
              const colorClasses = {
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
                  {/* Summary Card */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    <div className="p-4 bg-white rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-600 font-medium">Rata-rata per Bulan</p>
                      <p className="text-2xl font-bold text-gray-700 mt-1">
                        Rp {sortedMonthlyData.length > 0 ? Math.round(grandTotal / sortedMonthlyData.length).toLocaleString('id-ID') : '0'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{sortedMonthlyData.length} bulan aktif</p>
                    </div>
                    <div className="p-4 bg-white rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-600 font-medium">Tertinggi</p>
                      <p className="text-2xl font-bold text-green-600 mt-1">
                        Rp {sortedMonthlyData.length > 0 ? Math.max(...sortedMonthlyData.map(([, data]) => data.total)).toLocaleString('id-ID') : '0'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {sortedMonthlyData.length > 0 ? sortedMonthlyData.reduce((a, b) => a[1].total > b[1].total ? a : b)[0] : '-'}
                      </p>
                    </div>
                  </div>

                  {/* Chart - Dynamic color based on status - MATCHES Total Target progress bar */}
                  <ChartCardPencapaianMonthly
                    title={`Pencapaian Per Bulan${filterStatus !== 'all' ? ` - ${filterStatus.toUpperCase()}` : ''}`}
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
                  // Get MRC data from crmTargets (not filteredTargets) - shows all data regardless of filters (except PIC CRM filter)
                  const mrcData = (crmTargets || []).filter(t => (t.picCrm || '').toUpperCase() === 'MRC');
                const mrcTotal = mrcData.length;
                const mrcLanjut = mrcData.filter(t => t.status === 'LANJUT' || t.status === 'DONE').length;
                const mrcLoss = mrcData.filter(t => t.status === 'LOSS').length;
                const mrcSuspend = mrcData.filter(t => t.status === 'SUSPEND').length;
                const mrcProses = mrcData.filter(t => t.status === 'PROSES').length;
                const mrcWaiting = mrcData.filter(t => t.status === 'WAITING').length;
                const mrcTotalAmount = mrcData.reduce((sum, t) => sum + (t.hargaKontrak || 0), 0);
                const mrcLanjutAmount = mrcData.filter(t => t.status === 'LANJUT' || t.status === 'DONE').reduce((sum, t) => sum + (t.hargaKontrak || 0), 0);
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
                            <span className="text-sm font-bold text-primary">Rp {mrcTotalAmount.toLocaleString('id-ID')}</span>
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
                              <span className="font-medium">{mrcLanjut}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-red-600">✗ Loss</span>
                              <span className="font-medium">{mrcLoss}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-orange-600">⏸ Suspend</span>
                              <span className="font-medium">{mrcSuspend}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-blue-600">⏸ Proses</span>
                              <span className="font-medium">{mrcProses}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">⏳ Waiting</span>
                              <span className="font-medium">{mrcWaiting}</span>
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
                  // Get DHA data from crmTargets (not filteredTargets) - shows all data regardless of filters (except PIC CRM filter)
                  const dhaData = (crmTargets || []).filter(t => (t.picCrm || '').toUpperCase() === 'DHA');
                const dhaTotal = dhaData.length;
                const dhaLanjut = dhaData.filter(t => t.status === 'LANJUT' || t.status === 'DONE').length;
                const dhaLoss = dhaData.filter(t => t.status === 'LOSS').length;
                const dhaSuspend = dhaData.filter(t => t.status === 'SUSPEND').length;
                const dhaProses = dhaData.filter(t => t.status === 'PROSES').length;
                const dhaWaiting = dhaData.filter(t => t.status === 'WAITING').length;
                const dhaTotalAmount = dhaData.reduce((sum, t) => sum + (t.hargaKontrak || 0), 0);
                const dhaLanjutAmount = dhaData.filter(t => t.status === 'LANJUT' || t.status === 'DONE').reduce((sum, t) => sum + (t.hargaKontrak || 0), 0);
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
                            <span className="text-sm font-bold text-primary">Rp {dhaTotalAmount.toLocaleString('id-ID')}</span>
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
                              <span className="font-medium">{dhaLanjut}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-red-600">✗ Loss</span>
                              <span className="font-medium">{dhaLoss}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-orange-600">⏸ Suspend</span>
                              <span className="font-medium">{dhaSuspend}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-blue-600">⏸ Proses</span>
                              <span className="font-medium">{dhaProses}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">⏳ Waiting</span>
                              <span className="font-medium">{dhaWaiting}</span>
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
              {/* First row: LANJUT, LOSS, SUSPEND */}
              <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
                {/* Lanjut Chart */}
                <ChartCardCrmData
                  title="Status - LANJUT"
                  data={filteredTargets.filter(t => t.status === 'LANJUT' || t.status === 'DONE')}
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
                  return t.status === statusUpper || (statusUpper === 'LANJUT' && t.status === 'DONE');
                })}
                statusColor={
                  filterStatus?.toUpperCase() === 'LANJUT' ? 'green' :
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
      </div>
    </div>
  );
}
