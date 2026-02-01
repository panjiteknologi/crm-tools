'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { Plus, Search, Filter, MapPin, Calendar, Clock, CheckCircle, AlertCircle, Edit, Trash2, Eye, Users, Target, ChevronLeft, ChevronRight, Sun, Moon, Upload, FileSpreadsheet, Download, Menu, X, Save } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTarget, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import * as XLSX from 'xlsx';
import { api } from '@/convex/_generated/api';

interface TargetData {
  id?: string;
  client: string;
  address: string;
  pic: string;
  picName: string;
  scheduleVisit: string;
  statusClient: 'LANJUT' | 'LOSS' | 'SUSPEND';
  nilaiKontrak: number;
  statusKunjungan: 'TO_DO' | 'VISITED';
  contactPerson?: string;
  contactPhone?: string;
  location: string;
  photoUrl?: string;
  salesAmount?: number;
  notes?: string;
  visitTime?: string;
  created_by?: string;
  createdAt?: number;
  updatedAt?: number;
}

interface ConvexTarget {
  _id: string;
  client: string;
  address: string;
  pic: string;
  scheduleVisit: string;
  statusClient: 'LANJUT' | 'LOSS' | 'SUSPEND';
  nilaiKontrak: number;
  statusKunjungan: 'TO_DO' | 'VISITED';
  contactPerson?: string;
  contactPhone?: string;
  location: string;
  photoUrl?: string;
  salesAmount?: number;
  notes?: string;
  visitTime?: string;
  created_by: string;
  updated_by?: string;
  createdAt: number;
  updatedAt: number;
}

interface VisitTask {
  id: string;
  clientName: string;
  address: string;
  date: string;
  visitTime: string;
  statusClient: 'LANJUT' | 'LOSS' | 'SUSPEND';
  nilaiKontrak: number;
  status: 'completed' | 'pending';
  contactPerson?: string;
  contactPhone?: string;
  location: string;
  photoUrl?: string;
  salesAmount?: number;
  notes?: string;
  picName?: string;
  email?: string;
}

interface CalendarDay {
  date: Date;
  tasks: VisitTask[];
  isCurrentMonth: boolean;
  isToday: boolean;
}

type UserRole = 'super_admin' | 'manager' | 'staff';

interface User {
  role: UserRole;
  name: string;
  staffId?: string;
  _id?: string;
}

const mockVisitTasks: VisitTask[] = [
  {
    id: '1',
    clientName: 'PT. Digital Indonesia',
    address: 'Jl. Sudirman No. 123, Jakarta Pusat',
    date: '2025-12-01',
    visitTime: '09:00',
    statusClient: 'LANJUT',
    nilaiKontrak: 100000000,
    location: 'Jl. Sudirman No. 123, Jakarta Pusat',
    status: 'completed',
    notes: 'Kick off meeting Q4 2025',
    contactPerson: 'Ricky Halim',
    contactPhone: '0812-1111-2222',
    email: 'ricky@digitalindonesia.com',
    photoUrl: '/images/visit.jpeg'
  },
  {
    id: '2',
    clientName: 'CV. Teknologi Maju',
    address: 'Jl. Gatot Subroto No. 456',
    date: '2025-12-02',
    visitTime: '13:30',
    statusClient: 'LANJUT',
    nilaiKontrak: 75000000,
    location: 'Jl. Gatot Subroto No. 456, Jakarta Selatan',
    status: 'completed',
    notes: 'Diskusi implementasi sistem',
    contactPerson: 'Andi Wijaya',
    contactPhone: '0813-3333-4444',
    email: 'andi@teknologimaju.com'
  },
  {
    id: '3',
    clientName: 'PT. Global Solution',
    address: 'Jl. MH Thamrin No. 789',
    date: '2025-12-03',
    visitTime: '10:00',
    statusClient: 'SUSPEND',
    nilaiKontrak: 50000000,
    location: 'Jl. MH Thamrin No. 789, Jakarta Utara',
    status: 'completed',
    notes: 'Presentasi solusi enterprise',
    contactPerson: 'Michael Chen',
    contactPhone: '0814-5555-6666',
    email: 'michael@globalsolution.com',
    photoUrl: '/images/visit.jpeg'
  },
  {
    id: '4',
    clientName: 'CV. Sukses Abadi',
    address: 'Ruko Golden Boulevard',
    date: '2025-12-04',
    visitTime: '14:30',
    statusClient: 'LANJUT',
    nilaiKontrak: 60000000,
    location: 'Ruko Golden Boulevard, Tangerang',
    status: 'pending',
    notes: 'Meeting perkenalan produk',
    contactPerson: 'Lisa Permatasari',
    contactPhone: '0815-7777-8888',
    email: 'lisa@suksesabadi.com'
  },
  {
    id: '5',
    clientName: 'PT. Fortune Nusantara',
    address: 'Jl. Thamrin No. 1',
    date: '2025-12-05',
    visitTime: '11:00',
    statusClient: 'LANJUT',
    nilaiKontrak: 120000000,
    location: 'Jl. Thamrin No. 1, Jakarta Pusat',
    status: 'completed',
    notes: 'Negosiasi kontrak tahunan',
    contactPerson: 'David Kusuma',
    contactPhone: '0816-9999-0000',
    email: 'david@fortunenusantara.com'
  }
];

export default function MyVisitsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<VisitTask[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<VisitTask | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importPreview, setImportPreview] = useState<TargetData[]>([]);
  const [importError, setImportError] = useState<string>('');
  const [showAllData, setShowAllData] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState<VisitTask | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const bulkImportTargets = useMutation(api.targets.bulkImportTargets);
  const updateTarget = useMutation(api.targets.updateTarget);
  const deleteTarget = useMutation(api.targets.deleteTarget);

  const targetsData = useQuery(api.targets.getTargets, user?._id ? { userId: user._id as any } : {});
  const convexTargets: ConvexTarget[] = Array.isArray(targetsData) ? targetsData : [];
  const isLoadingTargets = targetsData === undefined;

  const convertConvexToVisitTask = (convexTarget: ConvexTarget): VisitTask => {
    return {
      id: convexTarget._id,
      clientName: convexTarget.client,
      address: convexTarget.address,
      date: convexTarget.scheduleVisit,
      visitTime: convexTarget.visitTime || '09:00',
      statusClient: convexTarget.statusClient,
      nilaiKontrak: convexTarget.nilaiKontrak,
      status: convexTarget.statusKunjungan === 'VISITED' ? 'completed' : 'pending',
      notes: convexTarget.notes,
      contactPerson: convexTarget.contactPerson,
      contactPhone: convexTarget.contactPhone,
      location: convexTarget.location,
      photoUrl: convexTarget.photoUrl,
      salesAmount: convexTarget.salesAmount,
      email: '',
    };
  };

  useEffect(() => {
    try {
      const userData = localStorage.getItem('crm_user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        const currentUser: User = {
          role: parsedUser.role,
          name: parsedUser.name,
          staffId: parsedUser.staffId,
          _id: parsedUser._id || parsedUser.id || 'user-' + Date.now()
        };
        setUser(currentUser);
      } else {
        const currentUser: User = {
          _id: 'user-123',
          role: 'staff',
          name: 'Guest User',
          staffId: 'STAFF001'
        };
        setUser(currentUser);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      const currentUser: User = {
        _id: 'user-123',
        role: 'staff',
        name: 'Guest User',
        staffId: 'STAFF001'
      };
      setUser(currentUser);
    }

    const checkDarkMode = () => {
      const systemDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const storedDarkMode = localStorage.getItem('darkMode') === 'true';
      setIsDarkMode(systemDarkMode || storedDarkMode);
    };

    checkDarkMode();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', checkDarkMode);

    return () => mediaQuery.removeEventListener('change', checkDarkMode);
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
  };

  // Use convex data if loaded, otherwise use empty array (no mock data flicker)
  const allTasks = convexTargets && convexTargets.length > 0 && !isLoadingTargets
    ? convexTargets.map(convertConvexToVisitTask)
    : [];

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const getTasksForMonth = (month: number, year: number) => {
    return allTasks.filter(task => {
      const [yearStr, monthStr, dayStr] = task.date.split('-').map(Number);
      if (yearStr && monthStr && dayStr) {
        const taskDate = new Date(yearStr, monthStr - 1, dayStr);
        return taskDate.getMonth() === month && taskDate.getFullYear() === year;
      }
      return false;
    });
  };

  const currentMonthTasks = getTasksForMonth(currentMonth, currentYear);

  const baseTasks = showAllData ? allTasks : currentMonthTasks;

  const filteredTasks = baseTasks.filter(task => {
    const matchesSearch = task.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getMonthName = (date: Date) => {
    return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
    setSelectedDate(null);
  };

  const generateCalendarDays = (): CalendarDay[] => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const today = new Date();

    const days: CalendarDay[] = [];

    for (let i = 0; i < firstDay; i++) {
      days.push({
        date: new Date(currentYear, currentMonth, -firstDay + i + 1),
        tasks: [],
        isCurrentMonth: false,
        isToday: false
      });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentYear, currentMonth, i);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const dayTasks = allTasks.filter(task => task.date === dateStr);

      days.push({
        date,
        tasks: dayTasks,
        isCurrentMonth: true,
        isToday: date.toDateString() === today.toDateString()
      });
    }

    return days;
  };

  const getStatusVariant = (status: VisitTask['status']): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'completed': return 'default';
      case 'pending': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusText = (status: VisitTask['status']) => {
    switch (status) {
      case 'completed': return 'Visited';
      case 'pending': return 'To Do';
      default: return status;
    }
  };

  const handleViewDetail = (task: VisitTask) => {
    setSelectedTask(task);
    setShowDetailModal(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!user) {
      alert('User tidak ditemukan. Silakan login kembali.');
      return;
    }

    if (confirm('Apakah Anda yakin ingin menghapus kunjungan ini?')) {
      try {
        if (convexTargets && convexTargets.length > 0) {
          await deleteTarget({
            targetId: taskId as any,
            deleted_by: user._id as any,
          });
        } else {
          setTasks(tasks.filter(task => task.id !== taskId));
        }
      } catch (error) {
        console.error('Error deleting task:', error);
        alert('Gagal menghapus kunjungan. Silakan coba lagi.');
      }
    }
  };

  const handleEditTask = (task: VisitTask) => {
    setEditingTask(task);
    setShowEditModal(true);
  };

  const handleUpdateTask = async (updatedData: Partial<VisitTask>) => {
    if (!user || !editingTask) {
      alert('User tidak ditemukan. Silakan login kembali.');
      return;
    }

    setIsUpdating(true);
    try {
      if (convexTargets && convexTargets.length > 0) {
        const convexUpdates = {
          client: updatedData.clientName,
          address: updatedData.address,
          scheduleVisit: updatedData.date,
          visitTime: updatedData.visitTime,
          statusClient: updatedData.statusClient,
          nilaiKontrak: updatedData.nilaiKontrak,
          statusKunjungan: updatedData.status === 'completed' ? 'VISITED' as const : 'TO_DO' as const,
          notes: updatedData.notes,
          contactPerson: updatedData.contactPerson,
          contactPhone: updatedData.contactPhone,
          location: updatedData.location,
          photoUrl: updatedData.photoUrl,
          salesAmount: updatedData.salesAmount,
          updated_by: user._id as any,
        };

        await updateTarget({
          targetId: editingTask.id as any,
          updates: convexUpdates,
        });
      } else {
        setTasks(tasks.map(task =>
          task.id === editingTask.id
            ? { ...task, ...updatedData }
            : task
        ));
      }

      // Show success message
      setSuccessMessage(`✅ Data kunjungan "${updatedData.clientName}" berhasil diperbarui!`);
      setShowSuccessMessage(true);

      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);

      setShowEditModal(false);
      setEditingTask(null);
    } catch (error) {
      console.error('Error updating task:', error);
      alert('❌ Gagal mengupdate kunjungan. Silakan coba lagi.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePhotoUpload = async (file: File) => {
    if (!editingTask) return;

    setUploadingPhoto(true);
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setEditingTask({
          ...editingTask,
          photoUrl: base64String
        });
        setUploadingPhoto(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Gagal mengupload foto. Silakan coba lagi.');
      setUploadingPhoto(false);
    }
  };

  const downloadTemplate = () => {
    const currentUser = user?.name || 'Current User';
    const templateData = [
      {
        'Client': 'PT. Digital Indonesia',
        'Address': 'Jl. Sudirman No. 123, Jakarta Pusat',
        'PIC Staff': currentUser,
        'Schedule Visit': '2025-12-25',
        'Visit Time': '10:00',
        'Status Client': 'LANJUT',
        'Nilai Kontrak': 100000000,
        'Status Kunjungan': 'TO_DO',
        'Contact Person': 'Ricky Halim',
        'Contact Phone': '0812-1111-2222',
        'Location': 'Gedung Graha Kirana Lt. 7',
        'Sales Amount': 75000000,
        'Notes': `Template untuk ${currentUser} - Client berminat dengan paket enterprise`,
        'Photo URL': ''
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Targets');

    const colWidths = [
      { wch: 20 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 15 },
      { wch: 15 }, { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 15 },
      { wch: 30 }, { wch: 20 }
    ];
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, 'Template_Import_Targets.xlsx');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const importedTargets: TargetData[] = jsonData.map((row: any, index: number) => {
          const picStaffFromExcel = row['PIC Staff'] || row['PIC'] || row['pic'] || row['Staff'] || '';
          const finalPicStaff = picStaffFromExcel.trim() ? picStaffFromExcel : (user?.name || '');

          return {
            id: `import-${Date.now()}-${index}`,
            client: row['Client'] || row['Nama Client'] || row['client'] || '',
            address: row['Address'] || row['Alamat'] || row['address'] || '',
            pic: user?._id || 'user-123',
            picName: finalPicStaff,
            scheduleVisit: validateDate(row['Schedule Visit'] || row['ScheduleVisit'] || row['Schedule'] || row['Tanggal'] || row['Date'] || row['date'] || ''),
            visitTime: validateTime(row['Visit Time'] || row['VisitTime'] || row['Waktu'] || row['Time'] || row['time'] || ''),
            statusClient: validateStatusClient(row['Status Client'] || row['StatusClient'] || row['statusClient'] || row['Status Akhir'] || row['statusClient'] || 'LANJUT'),
            nilaiKontrak: validateNumber(row['Nilai Kontrak'] || row['NilaiKontrak'] || row['nilaiKontrak'] || row['Kontrak'] || row['contract'] || 0),
            statusKunjungan: validateStatusKunjungan(row['Status Kunjungan'] || row['StatusKunjungan'] || row['statusKunjungan'] || row['Status'] || row['status'] || 'TO_DO'),
            contactPerson: row['Contact Person'] || row['ContactPerson'] || row['Contact'] || row['contactPerson'] || '',
            contactPhone: row['Contact Phone'] || row['ContactPhone'] || row['Phone'] || row['Telepon'] || row['phone'] || '',
            location: row['Location'] || row['Lokasi'] || row['location'] || row['address'] || '',
            photoUrl: row['Photo URL'] || row['PhotoURL'] || row['photoUrl'] || row['Photo'] || row['photo'] || '',
            salesAmount: validateNumber(row['Sales Amount'] || row['SalesAmount'] || row['salesAmount'] || row['Sales'] || row['sales'] || 0),
            notes: row['Notes'] || row['Catatan'] || row['notes'] || row['Keterangan'] || row['keterangan'] || '',
            created_by: user?._id || 'user-123'
          };
        }).filter(target => target.client && target.address && target.scheduleVisit);

        if (importedTargets.length === 0) {
          setImportError('Tidak ada data valid yang ditemukan dalam file Excel. Pastikan kolom Client, Address, dan Schedule Visit terisi.');
          return;
        }

        setImportPreview(importedTargets);
        setImportError('');
        setShowImportModal(true);
      } catch (error) {
        setImportError('Error membaca file Excel. Pastikan format file benar dan sesuai template.');
        console.error('Excel import error:', error);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const validateDate = (date: string): string => {
    if (!date) return '';
    try {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return date;
      }
      return parsedDate.toISOString().split('T')[0];
    } catch {
      return date;
    }
  };

  const validateTime = (time: string): string | undefined => {
    if (!time) return undefined;
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (timeRegex.test(time)) {
      return time;
    }
    return undefined;
  };

  const validateStatusClient = (status: string): 'LANJUT' | 'LOSS' | 'SUSPEND' => {
    const statusMap: { [key: string]: 'LANJUT' | 'LOSS' | 'SUSPEND' } = {
      'lanjut': 'LANJUT', 'LANJUT': 'LANJUT', 'continue': 'LANJUT', 'proceed': 'LANJUT',
      'loss': 'LOSS', 'LOSS': 'LOSS', 'lost': 'LOSS', 'hilang': 'LOSS',
      'suspend': 'SUSPEND', 'SUSPEND': 'SUSPEND', 'ditunda': 'SUSPEND', 'pending': 'SUSPEND'
    };
    const normalizedStatus = status?.toString().toLowerCase().trim();
    return statusMap[normalizedStatus] || 'LANJUT';
  };

  const validateStatusKunjungan = (status: string): 'TO_DO' | 'VISITED' => {
    const statusMap: { [key: string]: 'TO_DO' | 'VISITED' } = {
      'to_do': 'TO_DO', 'TO_DO': 'TO_DO', 'todo': 'TO_DO', 'to do': 'TO_DO',
      'belum': 'TO_DO', 'belum dikunjungi': 'TO_DO',
      'visited': 'VISITED', 'VISITED': 'VISITED', 'selesai': 'VISITED',
      'done': 'VISITED', 'sudah': 'VISITED', 'sudah dikunjungi': 'VISITED'
    };
    const normalizedStatus = status?.toString().toLowerCase().trim();
    return statusMap[normalizedStatus] || 'TO_DO';
  };

  const validateNumber = (value: any): number => {
    if (value === null || value === undefined || value === '') {
      return 0;
    }
    const num = parseFloat(value.toString().replace(/[^0-9.-]/g, ''));
    return isNaN(num) ? 0 : num;
  };

  const confirmImport = async () => {
    if (!user) {
      alert('User tidak ditemukan. Silakan login kembali.');
      return;
    }

    try {
      const confirmButton = document.querySelector('[data-testid="confirm-import-button"]') as HTMLButtonElement;
      if (confirmButton) {
        confirmButton.disabled = true;
        confirmButton.innerHTML = '<div class="animate-spin h-4 w-4 mr-2">⟳</div> Mengimport...';
      }

      const targetsForConvex = importPreview.map(target => ({
        client: target.client,
        address: target.address,
        picName: target.picName,
        scheduleVisit: target.scheduleVisit,
        visitTime: target.visitTime,
        statusClient: target.statusClient,
        nilaiKontrak: target.nilaiKontrak,
        statusKunjungan: target.statusKunjungan,
        contactPerson: target.contactPerson,
        contactPhone: target.contactPhone,
        location: target.location,
        photoUrl: target.photoUrl,
        salesAmount: target.salesAmount,
        notes: target.notes,
      }));

      const result = await bulkImportTargets({
        targets: targetsForConvex,
        imported_by: user._id as any,
      });

      if (result.success > 0) {
        alert(`✅ Import berhasil!\n\nBerhasil: ${result.success} data${result.failed > 0 ? `\nGagal: ${result.failed} data` : ''}`);

        if (result.failed > 0) {
          console.error('Import errors:', result.errors);
        }
      } else {
        alert(`❌ Import gagal! Semua data gagal diimport.\n\nError:\n${result.errors.join('\n')}`);
        return;
      }

      setShowImportModal(false);
      setImportPreview([]);
      setImportError('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('Import error:', error);
      alert(`❌ Terjadi kesalahan saat import: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      const confirmButton = document.querySelector('[data-testid="confirm-import-button"]') as HTMLButtonElement;
      if (confirmButton) {
        confirmButton.disabled = false;
        confirmButton.innerHTML = `<Upload className="h-4 w-4 mr-2" /> Import ${importPreview.length} Data`;
      }
    }
  };

  const cancelImport = () => {
    setShowImportModal(false);
    setImportPreview([]);
    setImportError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const calendarDays = generateCalendarDays();

  const displayTasks = selectedDate
    ? allTasks.filter(task => {
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        const selectedDateStr = `${year}-${month}-${day}`;
        const matchesDate = task.date === selectedDateStr;
        if (!matchesDate) return false;

        if (showAllData) {
          return true;
        }

        const matchesSearch = task.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              task.location.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
    : filteredTasks;

  const isUsingConvexData = convexTargets && convexTargets.length > 0;

  return (
    <div className="min-h-screen bg-background p-3 sm:p-4 space-y-3 flex flex-col" style={{ height: "100vh", maxHeight: "-webkit-fill-available" }}>
      {/* Header Section - Professional Design */}
      <CardTarget className="shadow-sm border-border/50 bg-gradient-to-r from-card to-card/50">
        <CardHeader className="py-4 px-4 sm:py-4 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Brand Section */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg sm:text-xl font-semibold text-foreground">Jadwal Kunjungan</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Kelola jadwal kunjungan klien Anda
                </CardDescription>
              </div>
            </div>

            {/* Center: User Info (Desktop only) */}
            <div className="hidden lg:flex items-center gap-4 bg-muted/30 px-4 py-2 rounded-lg">
              {user && (
                <div className="text-sm">
                  <p className="font-medium text-foreground">{user.name}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="capitalize px-2 py-0.5 bg-background rounded-full font-medium">
                      {user.role === 'super_admin' ? 'Super Admin' :
                       user.role === 'manager' ? 'Manager' : 'Staff'}
                      {user.staffId && ` • ${user.staffId}`}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${isUsingConvexData ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`}></div>
                      <span className="font-medium">{isUsingConvexData ? 'Live' : 'Demo'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={downloadTemplate}
                className="hidden sm:flex hover:bg-accent transition-colors cursor-pointer"
              >
                <Download className="h-4 w-4 mr-2" />
                Template
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="hover:bg-accent transition-colors cursor-pointer"
              >
                <Upload className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Import</span>
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                onClick={() => {}}
                className="hover:bg-primary/90 transition-colors shadow-sm cursor-pointer"
              >
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Tambah</span>
              </Button>

              {/* Mobile Menu Button */}
              <Button
                variant="outline"
                size="sm"
                className="lg:hidden hover:bg-accent transition-colors"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
              >
                {showMobileMenu ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {showMobileMenu && (
            <div className="lg:hidden flex flex-col gap-3 pt-3 border-t">
              {user && (
                <div className="text-sm bg-muted/50 p-3 rounded-lg">
                  <p className="font-medium">{user.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <span className="capitalize">
                      {user.role === 'super_admin' ? 'Super Admin' :
                       user.role === 'manager' ? 'Manager' : 'Staff'}
                    </span>
                    <div className="flex items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${isUsingConvexData ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                      <span>{isUsingConvexData ? 'Live' : 'Demo'}</span>
                    </div>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={downloadTemplate}>
                  <Download className="h-4 w-4 mr-2" />
                  Template
                </Button>
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
                <Button variant="outline" size="sm" onClick={toggleDarkMode}>
                  {isDarkMode ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
                  {isDarkMode ? 'Light' : 'Dark'}
                </Button>
                <Button size="sm" onClick={() => {}}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah
                </Button>
              </div>
            </div>
          )}
        </CardHeader>
      </CardTarget>

      {/* Stats Dashboard - Professional Design */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 flex-shrink-0">
        <CardTarget className="hover:shadow-md transition-all duration-200 border-border/50 bg-gradient-to-br from-card to-card/80">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">{currentMonthTasks.length}</h3>
                  <p className="text-sm text-muted-foreground font-medium">Target</p>
                </div>
              </div>
              <div className="text-blue-600/20 text-2xl font-bold">
                {currentMonthTasks.length > 0 ? '100%' : '0%'}
              </div>
            </div>
          </CardContent>
        </CardTarget>

        <CardTarget className="hover:shadow-md transition-all duration-200 border-border/50 bg-gradient-to-br from-card to-card/80">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">
                    {currentMonthTasks.filter(t => t.status === 'completed').length}
                  </h3>
                  <p className="text-sm text-muted-foreground font-medium">Visited</p>
                </div>
              </div>
              <div className="text-green-600/20 text-2xl font-bold">
                {currentMonthTasks.length > 0 ? (currentMonthTasks.filter(t => t.status === 'completed').length / currentMonthTasks.length * 100).toFixed(0) : 0}%
              </div>
            </div>
          </CardContent>
        </CardTarget>

        <CardTarget className="hover:shadow-md transition-all duration-200 border-border/50 bg-gradient-to-br from-card to-card/80">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">0</h3>
                  <p className="text-sm text-muted-foreground font-medium">Lanjut</p>
                </div>
              </div>
              <div className="text-orange-600/20 text-2xl font-bold">
                0%
              </div>
            </div>
          </CardContent>
        </CardTarget>

        <CardTarget className="hover:shadow-md transition-all duration-200 border-border/50 bg-gradient-to-br from-card to-card/80">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">
                    {currentMonthTasks.filter(t => t.status === 'pending').length}
                  </h3>
                  <p className="text-sm text-muted-foreground font-medium">Loss</p>
                </div>
              </div>
              <div className="text-red-600/20 text-2xl font-bold">
                {currentMonthTasks.length > 0 ? (currentMonthTasks.filter(t => t.status === 'pending').length / currentMonthTasks.length * 100).toFixed(0) : 0}%
              </div>
            </div>
          </CardContent>
        </CardTarget>
      </div>

      {/* Main Content - Responsive Layout */}
      <div className="flex flex-col lg:flex-row gap-3 flex-1 overflow-hidden">
        {/* Calendar Section - Professional Design */}
        <CardTarget className="flex flex-col lg:flex-1 lg:min-h-0 shadow-sm border-border/50 bg-gradient-to-br from-card to-card/50">
          <CardHeader className="pb-2 px-3 pt-2 flex-shrink-0 border-b">
            <div className="flex items-center justify-between gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
                className="hover:bg-accent transition-all duration-200 h-9 w-9 p-0 rounded-lg cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-center flex-1 min-w-0">
                <CardTitle className="text-lg sm:text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent truncate">
                  {getMonthName(currentDate)}
                </CardTitle>
                <CardDescription className="text-sm font-medium text-muted-foreground hidden sm:block">
                  Kalender Kunjungan
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
                className="hover:bg-accent transition-all duration-200 h-9 w-9 p-0 rounded-lg cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-4 lg:min-h-0 flex flex-col">
            <div className="flex-1 overflow-y-auto">
              {/* Calendar Grid - Responsive */}
              <div className="grid grid-cols-7 gap-1 text-center mb-2 sticky top-0 bg-background z-10">
                {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(day => (
                  <div key={day} className="text-xs font-bold text-muted-foreground uppercase tracking-wide py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days - Responsive */}
              <div className="grid grid-cols-7 gap-3">
              {calendarDays.map((day, index) => (
                <div
                  key={index}
                  onClick={() => day.isCurrentMonth && setSelectedDate(day.date)}
                  style={{ cursor: day.isCurrentMonth ? 'pointer' : 'default' }}
                  className={`
                    relative group min-h-[30px] h-[80px] p-2 rounded-lg transition-all duration-200
                    ${day.isCurrentMonth
                      ? 'bg-background border border-border hover:shadow-md hover:border-primary/50 hover:bg-gradient-to-br hover:from-primary/5 hover:to-accent/20'
                      : 'opacity-25'
                    }
                    ${day.isToday
                      ? 'bg-gradient-to-br from-primary/10 to-primary/20 border-2 border-primary/50 shadow-sm ring-2 ring-primary/20'
                      : ''
                    }
                    ${selectedDate?.toDateString() === day.date.toDateString()
                      ? 'bg-gradient-to-br from-primary/15 to-accent/30 border-2 border-primary shadow-md ring-2 ring-primary/30'
                      : ''
                    }
                  `}
                >
                  {/* Date Number */}
                  <div className={`text-xs sm:text-sm font-bold mb-0.5 ${
                    day.isCurrentMonth
                      ? day.isToday || selectedDate?.toDateString() === day.date.toDateString()
                        ? 'text-primary'
                        : 'text-foreground'
                      : 'text-muted-foreground'
                  }`}>
                    {day.date.getDate()}
                  </div>

                  {/* Tasks - Show dots on mobile, full on desktop */}
                  <div className="space-y-0.5 sm:space-y-1">
                    {/* Mobile: Show clickable dots */}
                    <div className="sm:hidden flex gap-0.5 flex-wrap">
                      {day.tasks.slice(0, 3).map((task, taskIndex) => (
                        <div
                          key={taskIndex}
                          className={`w-1.5 h-1.5 rounded-full cursor-pointer hover:scale-125 transition-transform ${
                            task.status === 'completed' ? 'bg-emerald-500' : 'bg-blue-500'
                          }`}
                          title={`${task.clientName} - Klik untuk edit`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditTask(task);
                          }}
                        />
                      ))}
                    </div>
                    
                    {/* Desktop: Show full task cards */}
                    <div className="hidden sm:block space-y-0.5 sm:space-y-1">
                      {day.tasks.slice(0, 2).map((task, taskIndex) => (
                        <div
                          key={taskIndex}
                          className={`
                            text-[8px] sm:text-[9px] md:text-[10px] px-1 sm:px-1.5 py-0.5 rounded-md font-medium truncate text-center
                            shadow-sm transition-all duration-200 hover:shadow-md
                            ${task.status === 'completed'
                              ? 'bg-gradient-to-r from-emerald-400 to-emerald-500 text-white'
                              : 'bg-gradient-to-r from-blue-400 to-blue-500 text-white'
                            }
                          `}
                          title={`${task.clientName} - ${getStatusText(task.status)}`}
                        >
                          <span className="truncate">{task.clientName}</span>
                        </div>
                      ))}
                      {day.tasks.length > 2 && (
                        <div className="text-[8px] sm:text-[9px] md:text-[10px] font-medium text-center bg-gradient-to-r from-muted/80 to-muted px-1 sm:px-2 py-0.5 rounded-md text-muted-foreground/80">
                          +{day.tasks.length - 2}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Today Indicator */}
                  {day.isToday && (
                    <div className="absolute top-1 right-1 flex items-center gap-0.5 sm:gap-1">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></div>
                      <span className="text-[8px] sm:text-[9px] font-bold text-primary/80 hidden sm:inline">Hari Ini</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Selected Date Info - Responsive */}
            {selectedDate && (
              <div className="mt-3 sm:mt-4 md:mt-6 p-2 sm:p-3 md:p-4 bg-gradient-to-r from-primary/10 to-accent/20 rounded-lg sm:rounded-xl border border-primary/30 shadow-md">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-semibold text-primary/90 truncate">
                        {selectedDate.toLocaleDateString('id-ID', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        <span className="font-medium text-primary/80">
                          {(() => {
                            const year = selectedDate.getFullYear();
                            const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                            const day = String(selectedDate.getDate()).padStart(2, '0');
                            const selectedDateStr = `${year}-${month}-${day}`;
                            return tasks.filter(task => task.date === selectedDateStr).length;
                          })()}
                        </span> kunjungan
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedDate(null)}
                    className="hover:bg-primary/10 hover:text-primary h-8 w-8 p-0 flex-shrink-0 cursor-pointer"
                  >
                    <X className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
          </CardContent>
        </CardTarget>

        {/* Tasks List Section - Responsive */}
        <CardTarget className="flex flex-col lg:flex-1 lg:min-h-0 shadow-sm border-border/50 bg-gradient-to-br from-card to-card/50">
          <CardHeader className="flex-shrink-0 p-2 border-b">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base sm:text-lg md:text-xl truncate" >
                  {selectedDate ? 'Detail Kunjungan' : showAllData ? 'Semua Kunjungan' : 'Kunjungan Bulan Ini'}
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm truncate">
                  {selectedDate && (
                    <>
                      {selectedDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      {showAllData && ` • Mode semua data`}
                    </>
                  )}
                  {!selectedDate && (
                    <>
                      {showAllData ? `${allTasks.length} kunjungan` : `${currentMonthTasks.length} kunjungan`}
                    </>
                  )}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (selectedDate) {
                    setSelectedDate(null);
                    setShowAllData(true);
                  } else {
                    setShowAllData(!showAllData);
                  }
                }}
                className="hover:bg-primary/10 flex-shrink-0 w-full sm:w-auto cursor-pointer"
              >
                {selectedDate ? (
                  <>
                    <Target className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    <span className="text-xs sm:text-sm">Semua</span>
                  </>
                ) : showAllData ? (
                  <>
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    <span className="text-xs sm:text-sm">Bulan Ini</span>
                  </>
                ) : (
                  <>
                    <Target className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    <span className="text-xs sm:text-sm">Semua</span>
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-2 lg:min-h-0">
            <div className="h-full flex flex-col">
              {/* Search and Filter - One Line Layout */}
              {(!selectedDate || !showAllData) && (
                <div className="flex flex-col sm:flex-row gap-2 pb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-3 w-3 sm:h-4 sm:w-4" />
                    <Input
                      placeholder="Cari nama klien..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 sm:pl-10 text-xs sm:text-sm h-9 sm:h-10 w-full"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm cursor-pointer w-full sm:w-40">
                      <Filter className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      <SelectValue placeholder="Filter Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="pending">To Do</SelectItem>
                      <SelectItem value="completed">Visited</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Mode indicator */}
              {selectedDate && showAllData && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 sm:p-3">
                  <p className="text-blue-700 text-xs sm:text-sm font-medium">
                    📅 Menampilkan semua untuk {selectedDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}
                  </p>
                </div>
              )}

              {/* Tasks List - Responsive Cards */}
              <div className="flex-1 overflow-y-auto space-y-1 pr-1">
                {isLoadingTargets ? (
                  <div className="text-center py-8 sm:py-12">
                    <div className="animate-spin h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-3 sm:mb-4 border-4 border-primary border-t-transparent rounded-full"></div>
                    <p className="text-sm sm:text-lg font-medium text-muted-foreground">Memuat data...</p>
                  </div>
                ) : displayTasks.length > 0 ? (
                  displayTasks.map((task) => (
                    <CardTarget key={task.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-2">
                        {/* Mobile Layout */}
                        <div className="flex flex-col gap-2 sm:hidden">
                          {/* Header: Client name and status */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm sm:text-base truncate">{task.clientName}</h4>
                              <Badge variant={getStatusVariant(task.status)} className="text-xs sm:text-sm mt-1">
                                {getStatusText(task.status)}
                              </Badge>
                            </div>
                            {task.photoUrl && (
                              <img
                                src={task.photoUrl}
                                alt="Bukti"
                                className="w-16 h-12 object-cover rounded border-2 border-muted cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => handleViewDetail(task)}
                              />
                            )}
                          </div>

                          {/* Details */}
                          <div className="space-y-1 text-xs sm:text-sm text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">
                                {new Date(task.date).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'short'
                                })} • {task.visitTime} WIB
                              </span>
                            </div>
                            <div className="flex items-start gap-1.5">
                              <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                              <span className="line-clamp-2">{task.location}</span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-1 pt-2 border-t">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetail(task)}
                              className="flex-1 h-8 text-xs cursor-pointer"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Detail
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs cursor-pointer"
                              onClick={() => handleEditTask(task)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTask(task.id)}
                              className="h-8 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        {/* Desktop Layout */}
                        <div className="hidden sm:flex items-start justify-between gap-4">
                          {/* Left: Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold sm:text-lg truncate">{task.clientName}</h4>
                              <Badge variant={getStatusVariant(task.status)} className="text-sm">
                                {getStatusText(task.status)}
                              </Badge>
                            </div>

                            <div className="space-y-1 text-sm sm:text-base text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 flex-shrink-0" />
                                <span className="truncate">
                                  {new Date(task.date).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                  })} • {task.visitTime} WIB
                                </span>
                              </div>
                              <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                <span className="truncate">{task.location}</span>
                              </div>
                              {task.contactPerson && (
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4 flex-shrink-0" />
                                  <span className="truncate">
                                    <span className="font-medium">Contact:</span> {task.contactPerson}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Center: Photo */}
                          <div className="flex-shrink-0">
                            {task.photoUrl ? (
                              <div className="relative group cursor-pointer" onClick={() => handleViewDetail(task)}>
                                <img
                                  src={task.photoUrl}
                                  alt="Bukti kunjungan"
                                  className="w-32 h-24 object-cover rounded-lg border-2 border-muted transition-all duration-200 hover:scale-105 hover:shadow-md"
                                />
                                <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                                  <Eye className="h-5 w-5 text-white" />
                                </div>
                              </div>
                            ) : (
                              <div className="w-32 h-24 border-2 border-dashed border-muted rounded-lg flex items-center justify-center">
                                <span className="text-xs text-muted-foreground">No Photo</span>
                              </div>
                            )}
                          </div>

                          {/* Right: Actions */}
                          <div className="flex-shrink-0">
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewDetail(task)}
                                className="h-8 w-8 p-0 cursor-pointer"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 cursor-pointer"
                                onClick={() => handleEditTask(task)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteTask(task.id)}
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </CardTarget>
                  ))
                ) : (
                  <div className="text-center py-8 sm:py-12">
                    <Calendar className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground mb-3 sm:mb-4" />
                    <p className="text-sm sm:text-lg font-medium text-muted-foreground">
                      {selectedDate ? 'Tidak ada kunjungan' : showAllData ? 'Tidak ada kunjungan' : 'Tidak ada kunjungan bulan ini'}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                      {selectedDate ? 'Pilih tanggal lain' : 'Mulai tambahkan kunjungan baru'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </CardTarget>
      </div>

      {/* Detail Modal - Responsive */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] sm:max-h-[80vh] overflow-y-auto p-4 sm:p-6">
          {selectedTask && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base sm:text-lg">Detail Kunjungan</DialogTitle>
                <DialogDescription className="text-xs sm:text-sm">
                  Informasi lengkap mengenai kunjungan ke {selectedTask.clientName}
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Photo */}
                {selectedTask.photoUrl && (
                  <CardTarget className="sm:col-span-2">
                    <CardContent className="p-3 sm:p-4">
                      <div className="space-y-2 sm:space-y-3">
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground">Bukti Kunjungan</p>
                        <div className="flex justify-center">
                          <img
                            src={selectedTask.photoUrl}
                            alt="Bukti kunjungan"
                            className="max-w-full max-h-64 sm:max-h-96 object-contain rounded-lg border-2 border-muted shadow-lg"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </CardTarget>
                )}
                
                {/* Info Cards - Responsive */}
                <CardTarget>
                  <CardContent className="p-3 sm:p-4">
                    <div className="space-y-2 sm:space-y-3">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Nama Klien</p>
                        <p className="font-semibold text-sm sm:text-base">{selectedTask.clientName}</p>
                      </div>
                      {selectedTask.contactPerson && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Contact Person</p>
                          <p className="font-semibold text-sm sm:text-base">{selectedTask.contactPerson}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Status</p>
                        <Badge variant={getStatusVariant(selectedTask.status)} className="text-xs">
                          {getStatusText(selectedTask.status)}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </CardTarget>
                <CardTarget>
                  <CardContent className="p-3 sm:p-4">
                    <div className="space-y-2 sm:space-y-3">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Tanggal & Waktu</p>
                        <p className="font-semibold text-xs sm:text-sm">
                          {new Date(selectedTask.date).toLocaleDateString('id-ID', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })} pukul {selectedTask.visitTime} WIB
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Lokasi</p>
                        <p className="text-xs sm:text-sm">{selectedTask.location}</p>
                      </div>
                      {selectedTask.notes && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Catatan</p>
                          <p className="text-xs sm:text-sm">{selectedTask.notes}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </CardTarget>
                {selectedTask.contactPhone && (
                  <CardTarget>
                    <CardContent className="p-3 sm:p-4">
                      <p className="text-xs font-medium text-muted-foreground">Telepon</p>
                      <p className="font-semibold text-sm sm:text-base">{selectedTask.contactPhone}</p>
                    </CardContent>
                  </CardTarget>
                )}
                {selectedTask.email && (
                  <CardTarget>
                    <CardContent className="p-3 sm:p-4">
                      <p className="text-xs font-medium text-muted-foreground">Email</p>
                      <p className="font-semibold text-xs sm:text-sm break-all">{selectedTask.email}</p>
                    </CardContent>
                  </CardTarget>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Import Modal - Responsive */}
      <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl lg:max-w-6xl max-h-[90vh] sm:max-h-[80vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <FileSpreadsheet className="h-4 w-4 sm:h-5 sm:w-5" />
              Preview Import Data Excel
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Periksa data yang akan diimpor. Pastikan semua data sudah benar sebelum melanjutkan.
            </DialogDescription>
          </DialogHeader>

          {importError ? (
            <CardTarget className="border-red-200 bg-red-50">
              <CardContent className="p-3 sm:p-4">
                <p className="text-red-600 font-medium text-xs sm:text-sm">❌ {importError}</p>
                <p className="text-red-500 text-xs mt-1">
                  Pastikan file Excel memiliki kolom wajib: <strong>Client</strong>, <strong>Address</strong>, <strong>Schedule Visit</strong>.
                </p>
              </CardContent>
            </CardTarget>
          ) : (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                <p className="text-blue-700 font-medium text-xs sm:text-sm">
                  📊 Ditemukan <span className="font-bold">{importPreview.length}</span> data kunjungan yang akan diimpor
                </p>
              </div>

              <div className="max-h-[300px] sm:max-h-[400px] overflow-x-auto overflow-y-auto border rounded-lg">
                <table className="w-full text-xs sm:text-sm">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="text-left p-2 sm:p-3 border-b">Client</th>
                      <th className="text-left p-2 sm:p-3 border-b hidden sm:table-cell">PIC Staff</th>
                      <th className="text-left p-2 sm:p-3 border-b">Schedule</th>
                      <th className="text-left p-2 sm:p-3 border-b hidden md:table-cell">Status Client</th>
                      <th className="text-left p-2 sm:p-3 border-b hidden lg:table-cell">Status Kunjungan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importPreview.map((target, index) => (
                      <tr key={index} className="hover:bg-muted/50">
                        <td className="p-2 sm:p-3 border-b font-medium max-w-[150px] truncate">{target.client}</td>
                        <td className="p-2 sm:p-3 border-b hidden sm:table-cell">{target.picName}</td>
                        <td className="p-2 sm:p-3 border-b">{target.scheduleVisit}</td>
                        <td className="p-2 sm:p-3 border-b hidden md:table-cell">
                          <Badge variant={target.statusClient === 'LANJUT' ? 'default' : target.statusClient === 'LOSS' ? 'destructive' : 'secondary'} className="text-xs">
                            {target.statusClient}
                          </Badge>
                        </td>
                        <td className="p-2 sm:p-3 border-b hidden lg:table-cell">
                          <Badge variant={target.statusKunjungan === 'VISITED' ? 'default' : 'outline'} className="text-xs">
                            {target.statusKunjungan}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4">
                <Button variant="outline" onClick={cancelImport} className="w-full sm:w-auto cursor-pointer">
                  Batal
                </Button>
                <Button
                  onClick={confirmImport}
                  data-testid="confirm-import-button"
                  className="w-full sm:w-auto cursor-pointer"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import {importPreview.length} Data
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Modal - Responsive */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] sm:max-h-[80vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Edit Kunjungan</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Ubah detail kunjungan yang ada.
            </DialogDescription>
          </DialogHeader>

          {editingTask && (
            <div className="grid gap-4 sm:gap-6 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-medium">Nama Klien</label>
                  <Input
                    value={editingTask.clientName}
                    onChange={(e) => setEditingTask({...editingTask, clientName: e.target.value})}
                    placeholder="Masukkan nama klien"
                    className="text-xs sm:text-sm h-9 sm:h-10"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-medium">Alamat</label>
                  <Input
                    value={editingTask.address}
                    onChange={(e) => setEditingTask({...editingTask, address: e.target.value})}
                    placeholder="Masukkan alamat lengkap"
                    className="text-xs sm:text-sm h-9 sm:h-10"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-medium">Tanggal Kunjungan</label>
                  <Input
                    type="date"
                    value={editingTask.date}
                    onChange={(e) => setEditingTask({...editingTask, date: e.target.value})}
                    className="text-xs sm:text-sm h-9 sm:h-10"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-medium">Waktu Kunjungan</label>
                  <Input
                    type="time"
                    value={editingTask.visitTime}
                    onChange={(e) => setEditingTask({...editingTask, visitTime: e.target.value})}
                    className="text-xs sm:text-sm h-9 sm:h-10"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-medium">Status Client</label>
                  <Select
                    value={editingTask.statusClient}
                    onValueChange={(value: 'LANJUT' | 'LOSS' | 'SUSPEND') =>
                      setEditingTask({...editingTask, statusClient: value})
                    }
                  >
                    <SelectTrigger className="text-xs sm:text-sm h-9 sm:h-10 cursor-pointer">
                      <SelectValue placeholder="Pilih status client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LANJUT">Lanjut</SelectItem>
                      <SelectItem value="LOSS">Loss</SelectItem>
                      <SelectItem value="SUSPEND">Suspend</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-medium">Status Kunjungan</label>
                  <Select
                    value={editingTask.status}
                    onValueChange={(value: 'pending' | 'completed') =>
                      setEditingTask({...editingTask, status: value})
                    }
                  >
                    <SelectTrigger className="text-xs sm:text-sm h-9 sm:h-10 cursor-pointer">
                      <SelectValue placeholder="Pilih status kunjungan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">To Do</SelectItem>
                      <SelectItem value="completed">Visited</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-medium">Nilai Kontrak (Rp)</label>
                  <Input
                    type="number"
                    value={editingTask.nilaiKontrak || 0}
                    onChange={(e) => setEditingTask({...editingTask, nilaiKontrak: parseInt(e.target.value) || 0})}
                    placeholder="Masukkan nilai kontrak"
                    className="text-xs sm:text-sm h-9 sm:h-10"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-medium">Sales Amount (Rp)</label>
                  <Input
                    type="number"
                    value={editingTask.salesAmount || 0}
                    onChange={(e) => setEditingTask({...editingTask, salesAmount: parseInt(e.target.value) || 0})}
                    placeholder="Masukkan sales amount"
                    className="text-xs sm:text-sm h-9 sm:h-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium">Lokasi Detail</label>
                <Input
                  value={editingTask.location}
                  onChange={(e) => setEditingTask({...editingTask, location: e.target.value})}
                  placeholder="Masukkan detail lokasi"
                  className="text-xs sm:text-sm h-9 sm:h-10"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-medium">Contact Person</label>
                  <Input
                    value={editingTask.contactPerson || ''}
                    onChange={(e) => setEditingTask({...editingTask, contactPerson: e.target.value})}
                    placeholder="Nama contact person"
                    className="text-xs sm:text-sm h-9 sm:h-10"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-medium">No. Telepon</label>
                  <Input
                    value={editingTask.contactPhone || ''}
                    onChange={(e) => setEditingTask({...editingTask, contactPhone: e.target.value})}
                    placeholder="Nomor telepon"
                    className="text-xs sm:text-sm h-9 sm:h-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium">Upload Foto Bukti Kunjungan</label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handlePhotoUpload(file);
                      }
                    }}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => photoInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="w-full sm:w-auto text-xs sm:text-sm h-9 sm:h-10 cursor-pointer"
                  >
                    {uploadingPhoto ? 'Mengunggah...' : 'Pilih Foto'}
                  </Button>
                  {editingTask.photoUrl && (
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <span className="text-xs text-green-600">✓ Foto terupload</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingTask({...editingTask, photoUrl: undefined})}
                        className="text-xs h-8 cursor-pointer"
                      >
                        Hapus
                      </Button>
                    </div>
                  )}
                </div>
                {editingTask.photoUrl && (
                  <div className="mt-2">
                    <img
                      src={editingTask.photoUrl}
                      alt="Bukti kunjungan"
                      className="max-w-full sm:max-w-xs h-auto rounded-lg border"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium">Catatan Kunjungan</label>
                <textarea
                  className="w-full min-h-[80px] sm:min-h-[100px] p-2 sm:p-3 border rounded-md resize-none text-xs sm:text-sm"
                  value={editingTask.notes || ''}
                  onChange={(e) => setEditingTask({...editingTask, notes: e.target.value})}
                  placeholder="Tambahkan catatan detail kunjungan..."
                />
              </div>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowEditModal(false)}
              className="w-full sm:w-auto cursor-pointer"
              disabled={isUpdating}
            >
              Batal
            </Button>
            <Button
              onClick={() => editingTask && handleUpdateTask(editingTask)}
              className="w-full sm:w-auto cursor-pointer"
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Simpan Perubahan
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Message Toast */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right duration-300">
          <div className="bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 min-w-[300px]">
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
            <span className="font-medium text-sm">{successMessage}</span>
            <button
              onClick={() => setShowSuccessMessage(false)}
              className="ml-auto text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
