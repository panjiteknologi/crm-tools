"use client"

import * as React from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { format, parseISO, isPast, isToday, isFuture, startOfMonth, endOfMonth, isSameMonth, isSameDay } from "date-fns"
import { id } from "date-fns/locale"
import indonesiaData from "@/data/indonesia-provinsi-kota.json"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { FilterCompanySection } from "@/components/filters/FilterCompanySection"
import { FilterPicCrmSection } from "@/components/filters/FilterPicCrmSection"
import { FilterKunjunganSection } from "@/components/filters/FilterKunjunganSection"
import { InfinityLoader } from "@/components/ui/infinity-loader"

import { IconCalendar, IconMapPin, IconPhone, IconBuilding, IconSearch, IconFilter, IconCheck, IconX, IconClock, IconCalendarTime, IconChevronLeft, IconChevronRight } from "@tabler/icons-react"
import { cn } from "@/lib/utils"

interface CrmTarget {
  _id: Id<"crmTargets">
  tahun: string
  bulanExpDate: string
  produk: string
  picCrm: string
  sales: string
  namaAssociate: string
  namaPerusahaan: string
  status: string
  alasan?: string
  category?: string
  provinsi: string
  kota: string
  alamat: string
  tanggalKunjungan?: string
  statusKunjungan?: string
  catatanKunjungan?: string
  fotoBuktiKunjungan?: string
  akreditasi?: string
  std?: string
  eaCode?: string
  iaDate?: string
  expDate?: string
  tahapAudit?: string
  hargaKontrak?: number
  bulanTtdNotif?: string
  hargaTerupdate?: number
  trimmingValue?: number
  lossValue?: number
  cashback?: number
  terminPembayaran?: string
  statusSertifikat?: string
  createdAt: number
  updatedAt: number
}

interface CalendarDay {
  date: Date
  tasks: CrmTarget[]
  isCurrentMonth: boolean
  isToday: boolean
}

export default function DashboardKunjunganPage() {
  // Get current user from localStorage
  const [currentUser, setCurrentUser] = React.useState<any>(null)

  React.useEffect(() => {
    try {
      const userData = localStorage.getItem('crm_user')
      if (userData) {
        const parsedUser = JSON.parse(userData)
        setCurrentUser(parsedUser)

        // Auto-set filter PIC for staff
        if (parsedUser.role === 'staff') {
          setFilterPic(parsedUser.name)
        }
      }
    } catch (error) {
      console.error('Error parsing user data:', error)
    }
  }, [])

  // Query based on user role
  const allCrmTargets = useQuery(api.crmTargets.list) || []

  // Query for staff - pass picCrm only when role is staff and name exists
  const staffCrmTargets = useQuery(
    api.crmTargets.getCrmTargetsByPicCrm,
    currentUser?.role === 'staff' && currentUser?.name
      ? { picCrm: currentUser.name }
      : {}
  ) || []

  // Use different query based on role
  const crmTargets = React.useMemo(() => {
    if (!currentUser) return []
    if (currentUser.role === 'staff') {
      return staffCrmTargets
    }
    return allCrmTargets
  }, [currentUser, allCrmTargets, staffCrmTargets])

  const [currentPage, setCurrentPage] = React.useState(1)
  const itemsPerPage = 10

  // Loading state
  const isLoading = crmTargets.length === 0;

  // Filter states
  const [filterPic, setFilterPic] = React.useState<string>("all")
  const [filterSales, setFilterSales] = React.useState<string>("all")
  const [filterStatusCrm, setFilterStatusCrm] = React.useState<string>("all")
  const [filterStatusKunjungan, setFilterStatusKunjungan] = React.useState<string>("all")
  const [filterMonth, setFilterMonth] = React.useState<string>(format(new Date(), "yyyy-MM"))
  const [filterProvinsi, setFilterProvinsi] = React.useState<string>("all")
  const [filterKota, setFilterKota] = React.useState<string>("all")
  const [filterCategory, setFilterCategory] = React.useState<string>("all")
  const [filterAlasan, setFilterAlasan] = React.useState<string>("all")
  const [searchQuery, setSearchQuery] = React.useState<string>("")
  const [tableSearchQuery, setTableSearchQuery] = React.useState<string>("")
  const [currentDate, setCurrentDate] = React.useState(new Date())
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null)
  const [selectedTask, setSelectedTask] = React.useState<CrmTarget | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false)

  // Form states
  const [editTanggal, setEditTanggal] = React.useState<string>("")
  const [editStatus, setEditStatus] = React.useState<string>("")
  const [editCatatan, setEditCatatan] = React.useState<string>("")
  const [editFoto, setEditFoto] = React.useState<string | null>(null)
  const [isUploading, setIsUploading] = React.useState(false)

  // Mutations
  const updateCrmTarget = useMutation(api.crmTargets.updateCrmTarget)

  // Get unique values for filters
  const picList = React.useMemo(() => {
    const pics = new Set(crmTargets.map(t => t.picCrm))
    return Array.from(pics).sort()
  }, [crmTargets])

  const salesList = React.useMemo(() => {
    const sales = new Set(crmTargets.map(t => t.sales))
    return Array.from(sales).sort()
  }, [crmTargets])

  const companyList = React.useMemo(() => {
    const companies = new Set(crmTargets.map(t => t.namaPerusahaan))
    return Array.from(companies).sort()
  }, [crmTargets])

  const provinsiList = React.useMemo(() => {
    return Object.keys(indonesiaData).sort()
  }, [])

  const kotaList = React.useMemo(() => {
    if (filterProvinsi === "all") {
      // Return all cities from all provinces (unique only)
      const allKotaSet = new Set<string>()
      Object.values(indonesiaData).forEach((prov: any) => {
        prov.kabupaten_kota.forEach((kota: string) => {
          allKotaSet.add(kota)
        })
      })
      return Array.from(allKotaSet).sort() as string[]
    }
    // Return cities for selected province
    const selectedProvData = (indonesiaData as any)[filterProvinsi]
    return selectedProvData?.kabupaten_kota || []
  }, [filterProvinsi])

  const statusOptions = React.useMemo(() => {
    const statuses = new Set(crmTargets.map(t => t.status).filter(Boolean))
    return Array.from(statuses).sort()
  }, [crmTargets])

  const alasanOptions = React.useMemo(() => {
    const alasan = new Set(crmTargets.map(t => t.alasan).filter((a): a is string => Boolean(a)))
    return Array.from(alasan).sort()
  }, [crmTargets])

  // Bulan options for filters
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
  ]

  // Filter data
  const filteredData = React.useMemo(() => {
    // Debug: Log current filter values
   
    return crmTargets.filter(target => {
      // Filter by PIC CRM
      if (filterPic !== "all" && target.picCrm !== filterPic) return false

      // Filter by Sales
      if (filterSales !== "all" && target.sales !== filterSales) return false

      // Filter by Status CRM
      if (filterStatusCrm !== "all" && target.status !== filterStatusCrm) return false

      // Filter by Status Kunjungan
      if (filterStatusKunjungan !== "all") {
        // If filter is set, only show targets that match the filter
        if (target.statusKunjungan !== filterStatusKunjungan) return false
      }

      // Filter by Provinsi (case-insensitive and trim)
      if (filterProvinsi !== "all") {
        const targetProvinsi = (target.provinsi || "").trim().toLowerCase()
        const filterProvinsiLower = filterProvinsi.trim().toLowerCase()
        if (targetProvinsi !== filterProvinsiLower) {
          
          return false
        }
      }

      // Filter by Kota (case-insensitive and trim)
      if (filterKota !== "all") {
        const targetKota = (target.kota || "").trim().toLowerCase()
        const filterKotaLower = filterKota.trim().toLowerCase()
        if (targetKota !== filterKotaLower) {
          
          return false
        }
      }

      // Filter by Category
      if (filterCategory !== "all" && target.category !== filterCategory) return false

      // Filter by Alasan
      if (filterAlasan !== "all" && target.alasan !== filterAlasan) return false

      // Search query (from sidebar)
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          target.namaPerusahaan?.toLowerCase().includes(query) ||
          target.namaAssociate?.toLowerCase().includes(query) ||
          target.kota?.toLowerCase().includes(query) ||
          target.provinsi?.toLowerCase().includes(query) ||
          target.produk?.toLowerCase().includes(query)
        )
      }

      // Table search query
      if (tableSearchQuery) {
        const query = tableSearchQuery.toLowerCase()
        return (
          target.namaPerusahaan?.toLowerCase().includes(query) ||
          target.namaAssociate?.toLowerCase().includes(query) ||
          target.kota?.toLowerCase().includes(query) ||
          target.provinsi?.toLowerCase().includes(query) ||
          target.produk?.toLowerCase().includes(query) ||
          target.sales?.toLowerCase().includes(query) ||
          target.picCrm?.toLowerCase().includes(query) ||
          target.status?.toLowerCase().includes(query) ||
          target.category?.toLowerCase().includes(query)
        )
      }

      return true
    }).sort((a, b) => {
      // Sort by tanggalKunjungan
      if (!a.tanggalKunjungan) return 1
      if (!b.tanggalKunjungan) return -1
      return new Date(a.tanggalKunjungan).getTime() - new Date(b.tanggalKunjungan).getTime()
    })
  }, [crmTargets, filterPic, filterSales, filterStatusCrm, filterStatusKunjungan, filterProvinsi, filterKota, filterCategory, filterAlasan, searchQuery, tableSearchQuery])

  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()

  const getTasksForMonth = (month: number, year: number) => {
    return filteredData.filter(target => {
      if (!target.tanggalKunjungan) return false
      const [yearStr, monthStr, dayStr] = target.tanggalKunjungan.split('-').map(Number)
      if (yearStr && monthStr && dayStr) {
        const taskDate = new Date(yearStr, monthStr - 1, dayStr)
        return taskDate.getMonth() === month && taskDate.getFullYear() === year
      }
      return false
    })
  }

  const currentMonthTasks = getTasksForMonth(currentMonth, currentYear)

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const getMonthName = (date: Date) => {
    return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
    setSelectedDate(null)
  }

  const generateCalendarDays = (): CalendarDay[] => {
    const daysInMonth = getDaysInMonth(currentDate)
    const firstDay = getFirstDayOfMonth(currentDate)
    const today = new Date()

    const days: CalendarDay[] = []

    for (let i = 0; i < firstDay; i++) {
      days.push({
        date: new Date(currentYear, currentMonth, -firstDay + i + 1),
        tasks: [],
        isCurrentMonth: false,
        isToday: false
      })
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentYear, currentMonth, i)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const dateStr = `${year}-${month}-${day}`
      const dayTasks = filteredData.filter(task => task.tanggalKunjungan === dateStr)

      days.push({
        date,
        tasks: dayTasks,
        isCurrentMonth: true,
        isToday: date.toDateString() === today.toDateString()
      })
    }

    return days
  }

  const calendarDays = generateCalendarDays()

  const displayTasks = selectedDate
    ? filteredData.filter(task => {
        const year = selectedDate.getFullYear()
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0')
        const day = String(selectedDate.getDate()).padStart(2, '0')
        const selectedDateStr = `${year}-${month}-${day}`
        return task.tanggalKunjungan === selectedDateStr
      })
    : filteredData

  // Debug: log data
  // React.useEffect(() => {
  //   
  //   
  //   
  //   
  //   
  // }, [crmTargets, filteredData, displayTasks, selectedDate, filterMonth])

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [filterPic, filterSales, filterStatusCrm, filterStatusKunjungan, filterProvinsi, filterKota, filterCategory, filterAlasan, searchQuery, tableSearchQuery, selectedDate])

  const getVisitStatusBadge = (target: CrmTarget) => {
    if (!target.tanggalKunjungan) {
      return <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-300">Not Scheduled</Badge>
    }

    if (target.statusKunjungan === "VISITED") {
      return <Badge className="bg-green-500 hover:bg-green-600">Visited</Badge>
    }

    if (target.statusKunjungan === "NOT YET") {
      const visitDate = parseISO(target.tanggalKunjungan)
      if (isPast(visitDate) && !isToday(visitDate)) {
        return <Badge variant="destructive">Overdue</Badge>
      }
      if (isToday(visitDate)) {
        return <Badge className="bg-blue-500 hover:bg-blue-600">Today</Badge>
      }
      return <Badge variant="secondary" className="bg-orange-50 text-orange-600 border-orange-200">Upcoming</Badge>
    }

    return <Badge variant="outline">Unknown</Badge>
  }

  const getCategoryBadge = (category?: string) => {
    if (!category) return null

    const colors: Record<string, string> = {
      "GOLD": "bg-yellow-500 hover:bg-yellow-600 text-white",
      "SILVER": "bg-gray-400 hover:bg-gray-500 text-white",
      "BRONZE": "bg-orange-700 hover:bg-orange-800 text-white",
    }

    return (
      <Badge className={colors[category] || "bg-gray-200"}>
        {category}
      </Badge>
    )
  }

  const [expandedFilterSections, setExpandedFilterSections] = React.useState<string[]>(['date', 'picCrm', 'company', 'jadwal']);
  const [expandedCompanies, setExpandedCompanies] = React.useState<Set<string>>(new Set());
  const [isMassUpdateModalOpen, setIsMassUpdateModalOpen] = React.useState(false);
  const [selectedCompanyForUpdate, setSelectedCompanyForUpdate] = React.useState<string | null>(null);
  const [massUpdateTanggal, setMassUpdateTanggal] = React.useState<string>("");
  const [massUpdateStatus, setMassUpdateStatus] = React.useState<string>("");
  const [massUpdateCatatan, setMassUpdateCatatan] = React.useState<string>("");
  const [massUpdateFoto, setMassUpdateFoto] = React.useState<string | null>(null);
  const [isMassUploading, setIsMassUploading] = React.useState(false);

  // Mobile filter sheet state
  const [activeFilterSheet, setActiveFilterSheet] = React.useState<string | null>(null);

  // Reset all filters
  const resetAllFilters = () => {
    setFilterPic("all")
    setFilterSales("all")
    setFilterStatusCrm("all")
    setFilterStatusKunjungan("all")
    setFilterMonth(format(new Date(), "yyyy-MM"))
    setFilterProvinsi("all")
    setFilterKota("all")
    setFilterCategory("all")
    setFilterAlasan("all")
    setSearchQuery("")
    setTableSearchQuery("")
    setSelectedDate(null)
    setCurrentDate(new Date())
    setActiveFilterSheet(null)
  }

  const toggleFilterSection = (section: string) => {
    setExpandedFilterSections(prev =>
      prev.includes(section)
        ? prev.filter((s: string) => s !== section)
        : [...prev, section]
    );
  };

  const toggleCompanyExpand = (companyName: string) => {
    setExpandedCompanies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(companyName)) {
        newSet.delete(companyName);
      } else {
        newSet.add(companyName);
      }
      return newSet;
    });
  };

  // Group data by company
  const groupedByCompany = React.useMemo(() => {
    const groups: Record<string, CrmTarget[]> = {};
    displayTasks.forEach(task => {
      const companyName = task.namaPerusahaan;
      if (!groups[companyName]) {
        groups[companyName] = [];
      }
      groups[companyName].push(task);
    });
    return Object.entries(groups).map(([companyName, tasks]) => ({
      companyName,
      tasks,
      totalCount: tasks.length
    }));
  }, [displayTasks]);

  // Pagination for grouped companies
  const totalPages = Math.ceil(groupedByCompany.length / itemsPerPage);

  // Get paginated grouped data
  const paginatedGroups = groupedByCompany.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Get total tasks for pagination info
  const totalTasks = displayTasks.length;
  const displayedTasks = paginatedGroups.reduce((sum, group) => sum + group.totalCount, 0);

  // Reset form when selected task changes
  React.useEffect(() => {
    if (selectedTask) {
      setEditTanggal(selectedTask.tanggalKunjungan || "")
      setEditStatus(selectedTask.statusKunjungan || "")
      setEditCatatan(selectedTask.catatanKunjungan || "")
      setEditFoto(selectedTask.fotoBuktiKunjungan || null)
    }
  }, [selectedTask])

  // Reset city filter when province changes
  React.useEffect(() => {
    if (filterProvinsi !== "all") {
      setFilterKota("all")
    }
  }, [filterProvinsi])

  // Update calendar view when selectedDate changes
  React.useEffect(() => {
    if (selectedDate) {
      setCurrentDate(selectedDate)
    }
  }, [selectedDate])

  // Update calendar view when filterMonth changes
  React.useEffect(() => {
    if (filterMonth) {
      const [year, month] = filterMonth.split('-').map(Number)
      setCurrentDate(new Date(year, month - 1, 1))
    }
  }, [filterMonth])

  // Compress image before upload
  const compressImage = (file: File, maxSizeKB: number = 500): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (event) => {
        const img = new Image()
        img.src = event.target?.result as string
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height

          // Calculate new dimensions (max 1024px)
          const MAX_DIMENSION = 1024
          if (width > height) {
            if (width > MAX_DIMENSION) {
              height *= MAX_DIMENSION / width
              width = MAX_DIMENSION
            }
          } else {
            if (height > MAX_DIMENSION) {
              width *= MAX_DIMENSION / height
              height = MAX_DIMENSION
            }
          }

          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('Failed to get canvas context'))
            return
          }

          ctx.drawImage(img, 0, 0, width, height)

          // Start with high quality
          let quality = 0.9
          let compressedDataUrl = canvas.toDataURL('image/jpeg', quality)

          // Reduce quality until size is under limit
          while (compressedDataUrl.length > maxSizeKB * 1024 * 1.37 && quality > 0.1) {
            quality -= 0.1
            compressedDataUrl = canvas.toDataURL('image/jpeg', quality)
          }

          resolve(compressedDataUrl)
        }
        img.onerror = (error) => reject(error)
      }
      reader.onerror = (error) => reject(error)
    })
  }

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size (max 2MB before compression)
    if (file.size > 2 * 1024 * 1024) {
      alert('File terlalu besar! Maksimum 2MB.')
      return
    }

    setIsUploading(true)
    try {
      // Compress image to max 500KB
      const compressedImage = await compressImage(file, 500)
      setEditFoto(compressedImage)
      setIsUploading(false)
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('Gagal mengupload foto. Silakan coba lagi.')
      setIsUploading(false)
    }
  }

  // Handle mass update file upload
  const handleMassFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size (max 2MB before compression)
    if (file.size > 2 * 1024 * 1024) {
      alert('File terlalu besar! Maksimum 2MB.')
      return
    }

    setIsMassUploading(true)
    try {
      // Compress image to max 500KB
      const compressedImage = await compressImage(file, 500)
      setMassUpdateFoto(compressedImage)
      setIsMassUploading(false)
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('Gagal mengupload foto. Silakan coba lagi.')
      setIsMassUploading(false)
    }
  }

  // Handle save
  const handleSave = async () => {
    if (!selectedTask) return

    try {
      await updateCrmTarget({
        id: selectedTask._id,
        tanggalKunjungan: editTanggal || undefined,
        statusKunjungan: editStatus || undefined,
        catatanKunjungan: editCatatan || undefined,
        fotoBuktiKunjungan: editFoto || undefined,
      })

      // Close modal and reset form
      setIsEditModalOpen(false)
      setSelectedTask(null)
      setEditTanggal("")
      setEditStatus("")
      setEditCatatan("")
      setEditFoto(null)

      // Show success message
      alert('Kunjungan berhasil diupdate!')
    } catch (error) {
      console.error('Error updating kunjungan:', error)
      alert('Gagal mengupdate kunjungan. Silakan coba lagi.')
    }
  }

  // Handle mass update for all tasks under a company
  const handleMassUpdate = async () => {
    if (!selectedCompanyForUpdate) return

    try {
      // Find all tasks for this company
      const companyTasks = displayTasks.filter(t => t.namaPerusahaan === selectedCompanyForUpdate)

      // Update all tasks
      const updatePromises = companyTasks.map(task =>
        updateCrmTarget({
          id: task._id,
          tanggalKunjungan: massUpdateTanggal || undefined,
          statusKunjungan: massUpdateStatus || undefined,
          catatanKunjungan: massUpdateCatatan || undefined,
          fotoBuktiKunjungan: massUpdateFoto || undefined,
        })
      )

      await Promise.all(updatePromises)

      // Close modal and reset form
      setIsMassUpdateModalOpen(false)
      setSelectedCompanyForUpdate(null)
      setMassUpdateTanggal("")
      setMassUpdateStatus("")
      setMassUpdateCatatan("")
      setMassUpdateFoto(null)
      setIsMassUploading(false)

      // Show success message
      alert(`Kunjungan berhasil diupdate untuk ${companyTasks.length} standar!`)
    } catch (error) {
      console.error('Error mass updating kunjungan:', error)
      alert('Gagal mengupdate kunjungan. Silakan coba lagi.')
    }
  }

  // Open mass update modal
  const openMassUpdateModal = (companyName: string) => {
    setSelectedCompanyForUpdate(companyName)

    // Get the first task to pre-fill data
    const firstTask = displayTasks.find(t => t.namaPerusahaan === companyName)
    if (firstTask) {
      setMassUpdateTanggal(firstTask.tanggalKunjungan || "")
      setMassUpdateStatus(firstTask.statusKunjungan || "")
      setMassUpdateCatatan(firstTask.catatanKunjungan || "")
      setMassUpdateFoto(firstTask.fotoBuktiKunjungan || null)
    }

    setIsMassUpdateModalOpen(true)
  }

  return (
    <div className="lg:flex lg:flex-row gap-6 py-4 lg:py-8 px-4 lg:px-6 pb-20 lg:pb-8">
      {/* Loading Overlay - Initial Data Load */}
      {isLoading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center">
            <InfinityLoader size="xl" />
            <p className="mt-6 text-lg font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Memuat data...</p>
            <p className="text-sm text-muted-foreground mt-2">Mohon tunggu sebentar</p>
          </div>
        </div>
      )}

      {/* Loading Overlay - Mass Update */}
      {isMassUploading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center bg-background p-8 rounded-lg shadow-lg border">
            <InfinityLoader size="xl" />
            <p className="mt-6 text-lg font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Menyimpan Data...</p>
            <p className="text-sm text-muted-foreground mt-2">Mohon tunggu, sedang mengupdate semua standar</p>
          </div>
        </div>
      )}

      {/* LEFT SIDEBAR - FILTERS */}
      <div className="hidden lg:block lg:w-80 flex-shrink-0">
        <div className="sticky top-6 space-y-4">
          {/* Filter Card */}
          <Card>

            <CardHeader className="pb-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
              <CardTitle className="flex items-center gap-2 text-sm">
                <IconFilter className="h-4 w-4" />
                Filter
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={resetAllFilters}
                className="w-full text-xs cursor-pointer background-red-50 border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300 focus:ring-red-300"
              >
                <IconX className="h-4 w-4 mr-1" />
                Reset Filter
              </Button>
            </div>
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
                    <IconChevronLeft className="h-4 w-4 rotate-[-90deg]" />
                  ) : (
                    <IconChevronRight className="h-4 w-4" />
                  )}
                </button>
                {expandedFilterSections.includes('date') && (
                  <div className="p-3 space-y-3 border-t">
                    <div className="space-y-1">
                      <Label htmlFor="filter-month" className="text-xs">Bulan</Label>
                      <Input
                        id="filter-month"
                        type="month"
                        value={filterMonth}
                        onChange={(e) => setFilterMonth(e.target.value)}
                        className="w-full h-9 text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Section PIC CRM - Hide for staff */}
              {currentUser?.role !== 'staff' && (
                <div className="border rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleFilterSection('picCrm')}
                    className="w-full flex items-center justify-between p-3 bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                  >
                    <span className="font-medium text-sm">PIC CRM</span>
                    {expandedFilterSections.includes('picCrm') ? (
                      <IconChevronLeft className="h-4 w-4 rotate-[-90deg]" />
                    ) : (
                      <IconChevronRight className="h-4 w-4" />
                    )}
                  </button>
                  {expandedFilterSections.includes('picCrm') && (
                    <div className="p-3 space-y-3 border-t">
                      <FilterPicCrmSection
                        filterPicCrm={filterPic}
                        setFilterPicCrm={setFilterPic}
                        picCrmOptions={picList}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Section Company */}
              <div className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleFilterSection('company')}
                  className="w-full flex items-center justify-between p-3 bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                >
                  <span className="font-medium text-sm">Company</span>
                  {expandedFilterSections.includes('company') ? (
                    <IconChevronLeft className="h-4 w-4 rotate-[-90deg]" />
                  ) : (
                    <IconChevronRight className="h-4 w-4" />
                  )}
                </button>
                {expandedFilterSections.includes('company') && (
                  <div className="p-3 space-y-3 border-t">
                    <FilterCompanySection
                      filterStatus={filterStatusCrm}
                      setFilterStatus={setFilterStatusCrm}
                      filterCategory={filterCategory}
                      setFilterCategory={setFilterCategory}
                      filterProvinsi={filterProvinsi}
                      setFilterProvinsi={setFilterProvinsi}
                      filterKota={filterKota}
                      setFilterKota={setFilterKota}
                      filterAlasan={filterAlasan}
                      setFilterAlasan={setFilterAlasan}
                      statusOptions={statusOptions}
                      provinsiOptions={provinsiList}
                      kotaOptions={kotaList}
                      alasanOptions={alasanOptions}
                    />
                  </div>
                )}
              </div>

              {/* Section Jadwal Kunjungan */}
              <div className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleFilterSection('jadwal')}
                  className="w-full flex items-center justify-between p-3 bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                >
                  <span className="font-medium text-sm">Status Kunjungan</span>
                  {expandedFilterSections.includes('jadwal') ? (
                    <IconChevronLeft className="h-4 w-4 rotate-[-90deg]" />
                  ) : (
                    <IconChevronRight className="h-4 w-4" />
                  )}
                </button>
                {expandedFilterSections.includes('jadwal') && (
                  <div className="p-3 space-y-3 border-t">
                    <FilterKunjunganSection
                      filterFromKunjungan="all"
                      setFilterFromKunjungan={() => {}}
                      filterToKunjungan="all"
                      setFilterToKunjungan={() => {}}
                      filterStatusKunjungan={filterStatusKunjungan}
                      setFilterStatusKunjungan={setFilterStatusKunjungan}
                      bulanOptions={bulanOptions}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 min-w-0 space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard Kunjungan</h1>
            {currentUser?.role === 'staff' && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-300">
                PIC: {currentUser.name}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-2">
            {currentUser?.role === 'staff'
              ? `Menampilkan data kunjungan untuk PIC: ${currentUser.name}`
              : 'Monitor dan lacak jadwal kunjungan berdasarkan data CRM Targets'
            }
          </p>
        </div>

      {/* Stats Cards - Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total Kunjungan Card */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-600">Total Kunjungan</p>
                <p className="text-3xl font-bold text-blue-700 mt-0.5">
                  {displayTasks.length}
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                <IconCalendar className="h-4 w-4 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Visited Card */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-green-600">Sudah Dikunjungi</p>
                <p className="text-3xl font-bold text-green-700 mt-0.5">
                  {displayTasks.filter(t => t.statusKunjungan === 'VISITED').length}
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                <IconCheck className="h-4 w-4 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Card */}
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-orange-600">Belum Dikunjungi</p>
                <p className="text-3xl font-bold text-orange-700 mt-0.5">
                  {displayTasks.filter(t => t.statusKunjungan === 'NOT YET').length}
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                <IconClock className="h-4 w-4 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* PIC CRM Performance Cards - Dynamic based on logged-in user role */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(() => {
          // Get unique PICs from crmTargets
          const uniquePics = Array.from(new Set(crmTargets.map(t => t.picCrm))).sort();

          // For staff, only show their own card
          // For manager/super_admin, show all cards (or respect filterPic)
          const picsToShow = currentUser?.role === 'staff'
            ? uniquePics.filter(pic => pic === currentUser.name)
            : filterPic === 'all'
            ? uniquePics
            : uniquePics.filter(pic => pic === filterPic);

          if (picsToShow.length === 0) {
            return (
              <Card className="col-span-1 md:col-span-2">
                <CardContent className="p-8 text-center text-muted-foreground">
                  Tidak ada data PIC CRM yang dapat ditampilkan
                </CardContent>
              </Card>
            );
          }

          return picsToShow.map((picCrm) => {
            const picData = crmTargets.filter(t => t.picCrm === picCrm);
            const picTotal = picData.length;
            const picLanjut = picData.filter(t => t.status === 'LANJUT' || t.status === 'DONE').length;
            const picLoss = picData.filter(t => t.status === 'LOSS').length;
            const picSuspend = picData.filter(t => t.status === 'SUSPEND').length;
            const picProses = picData.filter(t => t.status === 'PROSES').length;
            const picWaiting = picData.filter(t => t.status === 'WAITING').length;

            // Get unique companies
            const picCompanies = new Set(picData.map(t => t.namaPerusahaan));
            const picTotalCompanies = picCompanies.size;

            // Get companies with at least one visited target
            const picVisitedCompanies = new Set(
              picData
                .filter(t => t.statusKunjungan === 'VISITED')
                .map(t => t.namaPerusahaan)
            );
            const picVisitedCount = picVisitedCompanies.size;
            const picProgress = picTotalCompanies > 0 ? Math.round((picVisitedCount / picTotalCompanies) * 100) : 0;

            // Get calendar data for this PIC
            const picCalendarData = calendarDays.map(day => {
              const dayTasks = picData.filter(task => {
                if (!task.tanggalKunjungan) return false;
                const taskDate = parseISO(task.tanggalKunjungan);
                return isSameMonth(taskDate, currentDate) && isSameDay(taskDate, day.date);
              });

              return {
                ...day,
                tasks: dayTasks
              };
            });

            // Group tasks by company for this PIC
            const picCompanyGroups: { [key: string]: typeof picData } = {};
            picCalendarData.forEach(day => {
              day.tasks.forEach(task => {
                if (!picCompanyGroups[task.namaPerusahaan]) {
                  picCompanyGroups[task.namaPerusahaan] = [];
                }
                picCompanyGroups[task.namaPerusahaan].push(task);
              });
            });

            return (
              <Card key={picCrm}>
                <CardContent className="p-4 space-y-4">
                  <div className="space-y-4">
                    {/* Profile Section */}
                    <div className="flex items-center gap-3 pb-3 border-b">
                      <div className="relative flex-shrink-0">
                        <img
                          src={(() => {
                            // Untuk PIC tertentu, gunakan foto spesifik
                            const picPhotos: { [key: string]: string } = {
                              'MRC': '/images/mercy.jpeg',
                              'DHA': '/images/dhea.jpeg',
                            };

                            // Jika ada foto spesifik untuk PIC ini, gunakan itu (termasuk untuk staff)
                            if (picPhotos[picCrm]) {
                              return picPhotos[picCrm];
                            }

                            // Jika user staff dan ini card mereka, gunakan avatar mereka
                            if (currentUser?.role === 'staff' && currentUser?.name === picCrm && currentUser?.avatar) {
                              return currentUser.avatar;
                            }

                            // Default ke generated avatar
                            return `https://api.dicebear.com/7.x/avataaars/svg?seed=${picCrm}`;
                          })()}
                          onError={(e) => {
                            // Fallback ke generated avatar jika foto tidak ditemukan
                            const target = e.currentTarget;
                            target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${picCrm}`;
                          }}
                          className="w-16 h-16 rounded-full object-cover border-2 border-background shadow-lg"
                          alt={picCrm}
                        />
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-lg">{picCrm}</p>
                        <p className="text-xs text-muted-foreground">PIC CRM</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">Progress Kunjungan</span>
                        <span className="text-sm font-bold text-primary">
                          {picVisitedCount}/{picTotalCompanies}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${picProgress}%`
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Total Perusahaan: {picTotalCompanies}</span>
                        <span>{picProgress}%</span>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center p-2 bg-green-50 rounded-lg border border-green-200">
                        <div className="font-bold text-green-700 text-lg">{picLanjut}</div>
                        <div className="text-green-600">Lanjut</div>
                      </div>
                      <div className="text-center p-2 bg-red-50 rounded-lg border border-red-200">
                        <div className="font-bold text-red-700 text-lg">{picLoss}</div>
                        <div className="text-red-600">Loss</div>
                      </div>
                      <div className="text-center p-2 bg-orange-50 rounded-lg border border-orange-200">
                        <div className="font-bold text-orange-700 text-lg">{picSuspend}</div>
                        <div className="text-orange-600">Suspend</div>
                      </div>
                    </div>

                    {/* Mini Calendar for this PIC */}
                    <div className="border-t pt-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold">Calendar</h4>
                        <span className="text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                          {getMonthName(currentDate)}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {/* Day Headers */}
                        <div className="grid grid-cols-7 gap-1 text-center">
                          {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(day => (
                            <div key={day} className="text-xs font-bold text-muted-foreground uppercase">
                              {day}
                            </div>
                          ))}
                        </div>
                        {/* Calendar Days */}
                        <div className="grid grid-cols-7 gap-1">
                          {picCalendarData.map((day, index) => {
                            // Group by company name (unique companies) for this PIC
                            const picDayTasks = picData.filter(task => {
                              if (!task.tanggalKunjungan) return false;
                              const taskDate = parseISO(task.tanggalKunjungan);
                              return isSameMonth(taskDate, currentDate) && isSameDay(taskDate, day.date);
                            });

                            // Group by company name (unique companies)
                            const picDayCompanyGroups = Array.from(
                              new Map(
                                picDayTasks.map(task => [task.namaPerusahaan, task])
                              ).values()
                            );

                            return (
                              <div
                                key={index}
                                onClick={() => day.isCurrentMonth && setSelectedDate(day.date)}
                                className={`
                                  relative aspect-square p-1 rounded text-center transition-all cursor-pointer
                                  ${day.isCurrentMonth
                                    ? 'bg-background border border-border hover:bg-accent hover:shadow-sm'
                                    : 'opacity-25'
                                  }
                                  ${day.isToday ? 'bg-primary/10 border-2 border-primary' : ''}
                                  ${selectedDate?.toDateString() === day.date.toDateString()
                                    ? 'bg-primary/20 border-2 border-primary shadow-md'
                                    : ''
                                  }
                                `}
                              >
                                <div className={`text-sm font-bold mb-1 ${
                                  day.isCurrentMonth
                                    ? day.isToday || selectedDate?.toDateString() === day.date.toDateString()
                                      ? 'text-primary'
                                      : 'text-foreground'
                                    : 'text-muted-foreground'
                                }`}>
                                  {day.date.getDate()}
                                </div>
                                {/* Task indicators - grouped by company */}
                                <div className="space-y-0.5">
                                  {picDayCompanyGroups.slice(0, 2).map((task, taskIndex) => (
                                    <div
                                      key={taskIndex}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setSelectedTask(task)
                                        setIsEditModalOpen(true)
                                      }}
                                      className={`
                                        text-[8px] px-1 py-0.5 rounded truncate cursor-pointer
                                        ${task.statusKunjungan === 'VISITED'
                                          ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-300'
                                          : task.statusKunjungan === 'NOT YET'
                                            ? 'bg-orange-100 text-orange-700 hover:bg-orange-200 border border-orange-300'
                                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-300'
                                        }
                                      `}
                                      title={`${task.namaPerusahaan} - Click to edit`}
                                    >
                                      {task.namaPerusahaan.length > 10
                                        ? task.namaPerusahaan.substring(0, 10) + '..'
                                        : task.namaPerusahaan
                                      }
                                    </div>
                                  ))}
                                  {picDayCompanyGroups.length > 2 && (
                                    <div className="text-[8px] font-medium text-center bg-primary/80 rounded text-primary-foreground">
                                      +{picDayCompanyGroups.length - 2}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
          );
        });
        })()}
      </div>

      {/* Main Content - Data Table */}
      <div>
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1 w-full">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <IconBuilding className="h-5 w-5" />
                    Data Perusahaan
                  </CardTitle>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-1">
                    <CardDescription className="text-sm">
                      {selectedDate
                        ? `Kunjungan pada ${selectedDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} (${totalTasks} data dari ${groupedByCompany.length} perusahaan)`
                        : `Menampilkan ${totalTasks} data dari ${crmTargets.length} data (${groupedByCompany.length} perusahaan)`
                      }
                    </CardDescription>
                    {selectedDate && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedDate(null)}
                        className="h-7 text-xs cursor-pointer background-blue-500 hover:bg-blue-600"
                      >
                        Tampilkan Semua
                      </Button>
                    )}
                  </div>
                </div>

                {/* Table Search Bar */}
                <div className="relative w-full sm:w-64 lg:w-80">
                  <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari perusahaan, PIC, sales..."
                    value={tableSearchQuery}
                    onChange={(e) => setTableSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto relative">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No</TableHead>
                      <TableHead>Company</TableHead>
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
                    {paginatedGroups.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={29} className="text-center py-8">
                          No data found
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedGroups.map((group, groupIndex) => {
                        const isExpanded = expandedCompanies.has(group.companyName);
                        const firstTask = group.tasks[0];

                        return (
                          <React.Fragment key={group.companyName}>
                            {/* Company Row - Always Visible */}
                            <TableRow
                              className="hover:bg-muted/50 bg-muted/30"
                            >
                              <TableCell className="font-bold">{(currentPage - 1) * itemsPerPage + groupIndex + 1}</TableCell>
                              <TableCell className="font-bold">
                                <div className="flex items-center justify-between">
                                  <div
                                    className="flex items-center gap-2 flex-1 cursor-pointer"
                                    onClick={() => toggleCompanyExpand(group.companyName)}
                                  >
                                    <span className="transform transition-transform">{isExpanded ? '▼' : '▶'}</span>
                                    <span>{group.companyName}</span>
                                    <Badge variant="secondary" className="ml-2">
                                      {group.totalCount} standar
                                    </Badge>
                                  </div>
                                  <Button
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openMassUpdateModal(group.companyName);
                                    }}
                                    className="h-7 text-xs bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 cursor-pointer"
                                  >
                                    Update Kunjungan
                                  </Button>
                                </div>
                              </TableCell>
                              <TableCell colSpan={27} className="text-muted-foreground text-sm">
                                {group.tasks[0].provinsi && `${group.tasks[0].provinsi}${group.tasks[0].kota ? `, ${group.tasks[0].kota}` : ''} • `}
                                {group.tasks[0].statusKunjungan && `${group.tasks[0].statusKunjungan || '-'}`}
                              </TableCell>
                            </TableRow>

                            {/* Task Rows - Expandable */}
                            {isExpanded && group.tasks.map((target, taskIndex) => (
                              <TableRow
                                key={`${target._id}-${taskIndex}`}
                                className="hover:bg-muted/50 cursor-pointer bg-white"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTask(target);
                                  setIsEditModalOpen(true);
                                }}
                              >
                                <TableCell></TableCell>
                                <TableCell className="pl-8">
                                  <div className="flex items-center gap-2">
                                    <div className="w-1 h-1 bg-primary rounded-full"></div>
                                    <span className="text-xs text-muted-foreground">Standar #{taskIndex + 1}</span>
                                  </div>
                                </TableCell>
                                <TableCell>{target.bulanExpDate || '-'}</TableCell>
                                <TableCell className="font-medium">{target.produk || '-'}</TableCell>
                                <TableCell>{target.picCrm}</TableCell>
                                <TableCell>{target.sales}</TableCell>
                                <TableCell>{target.namaAssociate || '-'}</TableCell>
                                <TableCell>
                                  <Badge
                                    variant={target.status === 'PROSES' ? 'default' : target.status === 'LANJUT' ? 'default' : 'destructive'}
                                    className={
                                      target.status === 'PROSES' ? 'bg-blue-600 hover:bg-blue-700' :
                                      target.status === 'LANJUT' ? 'bg-green-600 hover:bg-green-700' :
                                      target.status === 'LOSS' ? 'bg-red-600 hover:bg-red-700' :
                                      target.status === 'SUSPEND' ? 'bg-orange-500 hover:bg-orange-600' :
                                      target.status === 'WAITING' ? 'bg-gray-500 hover:bg-gray-600' :
                                      target.status === 'DONE' ? 'bg-purple-600 hover:bg-purple-700' :
                                      'bg-gray-500 hover:bg-gray-600'
                                    }
                                  >
                                    {target.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>{target.alasan || '-'}</TableCell>
                                <TableCell>
                                  {target.category ? (
                                    <Badge
                                      variant="outline"
                                      className={target.category === 'GOLD' ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-white border-yellow-500 font-semibold shadow-sm' :
                                                target.category === 'SILVER' ? 'bg-gradient-to-r from-gray-300 to-gray-500 hover:from-gray-400 hover:to-gray-600 text-white border-gray-400 font-semibold shadow-sm' :
                                                target.category === 'BRONZE' ? 'bg-gradient-to-r from-orange-400 to-orange-700 hover:from-orange-500 hover:to-orange-800 text-white border-orange-600 font-semibold shadow-sm' :
                                                'bg-gray-200'}
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
                                  {target.bulanTtdNotif ? new Date(target.bulanTtdNotif).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-'}
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
                                <TableCell>
                                  {target.tanggalKunjungan ? (
                                    <div className="flex items-center gap-1">
                                      <IconCalendar className="h-3 w-3 text-muted-foreground" />
                                      <span className="text-xs">
                                        {format(parseISO(target.tanggalKunjungan), "dd MMM yyyy", { locale: id })}
                                      </span>
                                    </div>
                                  ) : (
                                    '-'
                                  )}
                                </TableCell>
                                <TableCell>
                                  {target.statusKunjungan ? (
                                    <Badge
                                      variant="outline"
                                      className={target.statusKunjungan === 'VISITED' ? 'bg-green-600 hover:bg-green-700 text-white border-green-600 font-semibold' :
                                                target.statusKunjungan === 'NOT YET' ? 'bg-gray-500 hover:bg-gray-600 text-white border-gray-500' :
                                                'bg-gray-400 hover:bg-gray-500 text-white border-gray-400'}
                                    >
                                      {target.statusKunjungan}
                                    </Badge>
                                  ) : '-'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </React.Fragment>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, groupedByCompany.length)} of {groupedByCompany.length} perusahaan
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

    {/* Edit Modal */}
    <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Update Kunjungan</DialogTitle>
          <DialogDescription>
            Update informasi kunjungan untuk {selectedTask?.namaPerusahaan}
          </DialogDescription>
        </DialogHeader>

        {selectedTask && (
          <div className="space-y-4 py-4">
            {/* Company Info */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <IconBuilding className="h-4 w-4" />
                Informasi Perusahaan
              </h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Nama:</span>
                  <p className="font-medium">{selectedTask.namaPerusahaan}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Associate:</span>
                  <p className="font-medium">{selectedTask.namaAssociate || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">PIC CRM:</span>
                  <p className="font-medium">{selectedTask.picCrm}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Sales:</span>
                  <p className="font-medium">{selectedTask.sales}</p>
                </div>
              </div>
            </div>

            {/* Visit Information */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <IconCalendar className="h-4 w-4" />
                Detail Kunjungan
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-tanggal">Tanggal Kunjungan</Label>
                  <Input
                    id="edit-tanggal"
                    type="date"
                    value={editTanggal}
                    onChange={(e) => setEditTanggal(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status Kunjungan</Label>
                  <Select value={editStatus} onValueChange={setEditStatus}>
                    <SelectTrigger id="edit-status">
                      <SelectValue placeholder="Pilih status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VISITED">Visited</SelectItem>
                      <SelectItem value="NOT YET">Not Yet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-foto">Foto Bukti Kunjungan</Label>
                <div className="space-y-2">
                  <Input
                    id="edit-foto"
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                  />
                  {editFoto && (
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground mb-1">Preview:</p>
                      <img
                        src={editFoto}
                        alt="Preview bukti kunjungan"
                        className="max-w-xs max-h-40 object-cover rounded-lg border"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditFoto(null)}
                        className="mt-1 text-xs text-red-600 hover:text-red-700"
                      >
                        Hapus foto
                      </Button>
                    </div>
                  )}
                  {isUploading && (
                    <p className="text-xs text-muted-foreground">Mengupload foto...</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-notes">Catatan Kunjungan</Label>
                <Textarea
                  id="edit-notes"
                  placeholder="Tambahkan catatan kunjungan..."
                  className="min-h-[100px]"
                  value={editCatatan}
                  onChange={(e) => setEditCatatan(e.target.value)}
                />
              </div>
            </div>

            {/* Location Info */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <IconMapPin className="h-4 w-4" />
                Lokasi
              </h3>
              <div className="text-sm space-y-1 bg-muted/50 p-3 rounded-lg">
                <p><span className="text-muted-foreground">Alamat:</span> {selectedTask.alamat || '-'}</p>
                <p><span className="text-muted-foreground">Kota:</span> {selectedTask.kota || '-'}</p>
                <p><span className="text-muted-foreground">Provinsi:</span> {selectedTask.provinsi || '-'}</p>
              </div>
            </div>

            {/* Contract Info */}
            <div className="space-y-3">
              <h3 className="font-semibold">Informasi Kontrak</h3>
              <div className="grid grid-cols-2 gap-2 text-sm bg-muted/50 p-3 rounded-lg">
                <div>
                  <span className="text-muted-foreground">Produk:</span>
                  <p className="font-medium">{selectedTask.produk || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <Badge className={
                    selectedTask.status === 'PROSES' ? 'bg-blue-600 hover:bg-blue-700' :
                    selectedTask.status === 'LANJUT' ? 'bg-green-600 hover:bg-green-700' :
                    selectedTask.status === 'LOSS' ? 'bg-red-600 hover:bg-red-700' :
                    'bg-gray-500 hover:bg-gray-600'
                  }>
                    {selectedTask.status}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Harga Kontrak:</span>
                  <p className="font-medium">
                    {selectedTask.hargaKontrak ? `Rp ${selectedTask.hargaKontrak.toLocaleString('id-ID')}` : '-'}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Bulan Exp:</span>
                  <p className="font-medium">{selectedTask.bulanExpDate || '-'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
            Batal
          </Button>
          <Button onClick={handleSave} disabled={isUploading}>
            {isUploading ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Mass Update Kunjungan Modal */}
    <Dialog open={isMassUpdateModalOpen} onOpenChange={setIsMassUpdateModalOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Update Kunjungan Massal</DialogTitle>
          <DialogDescription>
            Update informasi kunjungan untuk SEMUA standar under perusahaan <strong>{selectedCompanyForUpdate}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Warning Info */}
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <IconCalendar className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold">Perhatian!</p>
                <p className="text-xs mt-1">Update ini akan diterapkan ke <strong>SEMUA</strong> standar/produk under perusahaan ini.</p>
              </div>
            </div>
          </div>

          {/* Company Info */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <IconBuilding className="h-4 w-4" />
              Informasi Perusahaan
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Nama Perusahaan:</span>
                <p className="font-medium">{selectedCompanyForUpdate || '-'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Jumlah Standar:</span>
                <p className="font-medium">{displayTasks.filter(t => t.namaPerusahaan === selectedCompanyForUpdate).length} standar</p>
              </div>
            </div>
          </div>

          {/* Visit Information */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <IconCalendar className="h-4 w-4" />
              Detail Kunjungan
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mass-update-tanggal">Tanggal Kunjungan</Label>
                <Input
                  id="mass-update-tanggal"
                  type="date"
                  value={massUpdateTanggal}
                  onChange={(e) => setMassUpdateTanggal(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mass-update-status">Status Kunjungan</Label>
                <Select value={massUpdateStatus} onValueChange={setMassUpdateStatus}>
                  <SelectTrigger id="mass-update-status">
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VISITED">Visited</SelectItem>
                    <SelectItem value="NOT YET">Not Yet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mass-update-foto">Foto Bukti Kunjungan</Label>
              <div className="space-y-2">
                <Input
                  id="mass-update-foto"
                  type="file"
                  accept="image/*"
                  onChange={handleMassFileUpload}
                  disabled={isMassUploading}
                />
                {massUpdateFoto && (
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground mb-1">Preview:</p>
                    <img
                      src={massUpdateFoto}
                      alt="Preview bukti kunjungan"
                      className="max-w-xs max-h-40 object-cover rounded-lg border"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setMassUpdateFoto(null)}
                      className="mt-1 text-xs text-red-600 hover:text-red-700"
                    >
                      Hapus foto
                    </Button>
                  </div>
                )}
                {isMassUploading && (
                  <p className="text-xs text-muted-foreground">Mengupload foto...</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mass-update-notes">Catatan Kunjungan</Label>
              <Textarea
                id="mass-update-notes"
                placeholder="Tambahkan catatan kunjungan..."
                className="min-h-[100px]"
                value={massUpdateCatatan}
                onChange={(e) => setMassUpdateCatatan(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsMassUpdateModalOpen(false)}>
            Batal
          </Button>
          <Button onClick={handleMassUpdate} disabled={isMassUploading} className="bg-blue-600 hover:bg-blue-700">
            {isMassUploading ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Mobile Bottom Navigation */}
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border lg:hidden">
      <div className="grid grid-cols-5 gap-1 p-2">
        {/* Date Filter Tab */}
        <button
          onClick={() => setActiveFilterSheet(activeFilterSheet === 'date' ? null : 'date')}
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors ${
            activeFilterSheet === 'date' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
          }`}
        >
          <IconCalendarTime className="h-5 w-5 mb-1" />
          <span className="text-[10px] font-medium">Date</span>
        </button>

        {/* PIC CRM Tab - Hide for staff */}
        {currentUser?.role !== 'staff' && (
          <button
            onClick={() => setActiveFilterSheet(activeFilterSheet === 'picCrm' ? null : 'picCrm')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors ${
              activeFilterSheet === 'picCrm' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
            }`}
          >
            <IconFilter className="h-5 w-5 mb-1" />
            <span className="text-[10px] font-medium">PIC</span>
          </button>
        )}

        {/* Company Tab */}
        <button
          onClick={() => setActiveFilterSheet(activeFilterSheet === 'company' ? null : 'company')}
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors ${
            activeFilterSheet === 'company' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
          }`}
        >
          <IconBuilding className="h-5 w-5 mb-1" />
          <span className="text-[10px] font-medium">Company</span>
        </button>

        {/* Jadwal Tab */}
        <button
          onClick={() => setActiveFilterSheet(activeFilterSheet === 'jadwal' ? null : 'jadwal')}
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors ${
            activeFilterSheet === 'jadwal' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
          }`}
        >
          <IconCalendar className="h-5 w-5 mb-1" />
          <span className="text-[10px] font-medium">Status</span>
        </button>

        {/* Reset Tab */}
        <button
          onClick={resetAllFilters}
          className="flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors hover:bg-red-50 hover:text-red-600 text-red-500"
        >
          <IconX className="h-5 w-5 mb-1" />
          <span className="text-[10px] font-medium">Reset</span>
        </button>
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
          <div className="flex justify-center py-3 border-b">
            <div className="w-12 h-1.5 bg-muted rounded-full" />
          </div>

          {/* Filter Content */}
          <div className="p-4 space-y-4">
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
                    <IconX className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mobile-filter-month" className="text-xs">Bulan</Label>
                  <Input
                    id="mobile-filter-month"
                    type="month"
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    className="w-full h-9 text-sm"
                  />
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
                    <IconX className="h-4 w-4" />
                  </Button>
                </div>
                <FilterPicCrmSection
                  filterPicCrm={filterPic}
                  setFilterPicCrm={setFilterPic}
                  picCrmOptions={picList}
                />
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
                    <IconX className="h-4 w-4" />
                  </Button>
                </div>
                <FilterCompanySection
                  filterStatus={filterStatusCrm}
                  setFilterStatus={setFilterStatusCrm}
                  filterCategory={filterCategory}
                  setFilterCategory={setFilterCategory}
                  filterProvinsi={filterProvinsi}
                  setFilterProvinsi={setFilterProvinsi}
                  filterKota={filterKota}
                  setFilterKota={setFilterKota}
                  filterAlasan={filterAlasan}
                  setFilterAlasan={setFilterAlasan}
                  statusOptions={statusOptions}
                  provinsiOptions={provinsiList}
                  kotaOptions={kotaList}
                  alasanOptions={alasanOptions}
                />
              </div>
            )}

            {/* Jadwal Filter */}
            {activeFilterSheet === 'jadwal' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Jadwal Kunjungan</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveFilterSheet(null)}
                    className="h-8 text-xs"
                  >
                    <IconX className="h-4 w-4" />
                  </Button>
                </div>
                <FilterKunjunganSection
                  filterFromKunjungan="all"
                  setFilterFromKunjungan={() => {}}
                  filterToKunjungan="all"
                  setFilterToKunjungan={() => {}}
                  filterStatusKunjungan={filterStatusKunjungan}
                  setFilterStatusKunjungan={setFilterStatusKunjungan}
                  bulanOptions={bulanOptions}
                />
              </div>
            )}
          </div>
        </div>
      </>
    )}
    </div>
  )
}
