"use client";

import React, { useState, useEffect } from 'react';

// Add CSS for custom animations
const customStyles = `
  @keyframes fadeInSlide {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .fade-in-slide {
    animation: fadeInSlide 0.4s ease-out;
  }

  @keyframes slideInFromLeft {
    from {
      opacity: 0;
      transform: translateX(-30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .slide-in-left {
    animation: slideInFromLeft 0.6s ease-out forwards;
  }

  @keyframes slideInFromRight {
    from {
      opacity: 0;
      transform: translateX(30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .slide-in-right {
    animation: slideInFromRight 0.6s ease-out forwards;
  }

  @keyframes slideInFromBottom {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .slide-in-bottom {
    animation: slideInFromBottom 0.5s ease-out forwards;
  }

  @keyframes slideInFromTop {
    from {
      opacity: 0;
      transform: translateY(-30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .slide-in-top {
    animation: slideInFromTop 0.5s ease-out forwards;
  }

  @keyframes numberChange {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
  }

  .number-change {
    animation: numberChange 0.3s ease-in-out;
  }

  @keyframes scaleIn {
    from {
      opacity: 0;
      transform: scale(0.8);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .scale-in {
    animation: scaleIn 0.5s ease-out forwards;
  }

  /* Stagger delays for animations */
  .delay-100 { animation-delay: 0.1s; }
  .delay-200 { animation-delay: 0.2s; }
  .delay-300 { animation-delay: 0.3s; }
  .delay-400 { animation-delay: 0.4s; }
  .delay-500 { animation-delay: 0.5s; }
  .delay-600 { animation-delay: 0.6s; }
  .delay-700 { animation-delay: 0.7s; }
  .delay-800 { animation-delay: 0.8s; }

  /* Initial hidden state */
  .animate-on-mount {
    opacity: 0;
    animation-fill-mode: forwards;
  }

  /* Safe area for mobile devices with notch */
  .safe-area-inset-bottom {
    padding-bottom: env(safe-area-inset-bottom);
  }

  /* Hide scrollbar but allow scroll */
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }

  /* Safe area for mobile devices */
  .safe-area-bottom {
    padding-bottom: env(safe-area-inset-bottom);
  }

  .px-safe {
    padding-left: max(4px, env(safe-area-inset-left));
    padding-right: max(4px, env(safe-area-inset-right));
  }
`;
import { useQuery, useMutation } from 'convex/react';
import { Calendar, ChevronLeft, ChevronRight, MapPin, Users, CheckCircle, Clock, AlertCircle, TrendingUp, Target, Search, Camera, X, User, Filter, ArrowLeft, ArrowRight, LogOut, Shield, ChevronUp, Calendar as CalendarIcon, BarChart3, Filter as FilterIcon } from 'lucide-react';
import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, CardAction } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ChartAreaInteractive } from '@/components/chart-area-interactive';
import { api } from '@/convex/_generated/api';
import { handleLogout } from '@/lib/auth';

interface Staff {
  _id: string;
  id: string;
  name: string;
  email: string;
  targetYearly: number;
  completedThisYear: number;
  staffId?: string;
  role: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

interface VisitTask {
  _id: string;
  client: string;
  address: string;
  pic: string;
  scheduleVisit: string;
  visitTime: string;
  statusClient: 'LANJUT' | 'LOSS' | 'SUSPEND' | 'TO_DO';
  statusKunjungan: 'TO_DO' | 'VISITED';
  nilaiKontrak: number;
  salesAmount?: number;
  notes?: string;
  contactPerson?: string;
  contactPhone?: string;
  location?: string;
  photoUrl?: string;
  createdAt: number;
  updatedAt: number;
  created_by: string;
  // Legacy properties for compatibility
  clientName?: string;
  date?: string;
  status?: string;
  staffId?: string;
  staffName?: string;
  time?: string;
  phone?: string;
}

interface DateRange {
  startMonth: number;
  startYear: number;
  endMonth: number;
  endYear: number;
}


type UserRole = 'super_admin' | 'manager' | 'staff';

interface User {
  role: UserRole;
  name: string;
  staffId?: string;
}

export default function ManagerDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date(2025, 11, 17)); // December 17, 2025 (current date)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [selectedVisit, setSelectedVisit] = useState<VisitTask | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedChartType, setSelectedChartType] = useState<string>('area');
  const [showMoneyBreakdownModal, setShowMoneyBreakdownModal] = useState(false);
  const [moneyBreakdownData, setMoneyBreakdownData] = useState<{staffName: string, visits: VisitTask[]}[]>([]);
  const [animationsReady, setAnimationsReady] = useState(false);
  const [showMobileFilterModal, setShowMobileFilterModal] = useState(false);
  const [activeFilterSheet, setActiveFilterSheet] = useState<string | null>(null);

  // Convex data fetching
  const allUsers = useQuery(api.auth.getAllUsers);

  // Find the actual user ID from staffId
  const getCurrentUserId = () => {
    if (!user || user.role !== 'staff' || !user.staffId) return undefined;
    const currentUser = allUsers?.find(u => u.staffId === user.staffId);
    return currentUser?._id;
  };

  const targets = useQuery(api.targets.getTargets,
    getCurrentUserId()
      ? { userId: getCurrentUserId() as any }
      : {}
  );

  // Helper functions to convert Convex data to dashboard format
  const convertTargetToVisitTask = (target: any): VisitTask => {
    const staffUser = allUsers?.find(u => u._id === target.pic);
    return {
      _id: target._id,
      client: target.client,
      address: target.address,
      pic: target.pic,
      scheduleVisit: target.scheduleVisit,
      visitTime: target.visitTime,
      statusClient: target.statusClient,
      statusKunjungan: target.statusKunjungan,
      nilaiKontrak: target.nilaiKontrak,
      salesAmount: target.salesAmount,
      notes: target.notes,
      contactPerson: target.contactPerson,
      contactPhone: target.contactPhone,
      location: target.location,
      createdAt: target.createdAt,
      updatedAt: target.updatedAt,
      created_by: target.created_by,
      // Add legacy fields for compatibility
      clientName: target.client,
      date: target.scheduleVisit,
      time: target.visitTime,
      staffId: target.pic,
      staffName: staffUser?.name || 'Unknown',
      status: target.statusKunjungan === 'TO_DO' ? 'task' : target.statusClient.toLowerCase(),
      photoUrl: target.photoUrl,
      phone: target.contactPhone
    } as any;
  };

  // Convert targets to visit tasks and organize by date
  const getVisitDataByDate = () => {
    const visitData: { [key: string]: VisitTask[] } = {};

    if (!targets) return visitData;

    targets.forEach(target => {
      const visitTask = convertTargetToVisitTask(target);
      const date = target.scheduleVisit;

      if (!visitData[date]) {
        visitData[date] = [];
      }
      visitData[date].push(visitTask);
    });

    return visitData;
  };

  // Get staff data from Convex users
  const getStaffData = (): Staff[] => {
    if (!allUsers) return [];

    return allUsers
      .filter(u => u.role === 'staff')
      .map(u => ({
        _id: u._id, // Use _id for Convex compatibility
        id: u._id, // Keep id for backward compatibility
        name: u.name,
        email: u.email,
        targetYearly: u.targetYearly || 100,
        completedThisYear: 0, // Will be calculated dynamically
        staffId: u.staffId, // Add staffId for mapping
        role: u.role,
        isActive: u.isActive,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt
      }));
  };

  // Date range filter states
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  // Default date range based on user role
  const getDefaultDateRange = (): DateRange => {
    if (user?.role === 'staff') {
      // Staff: current month only
      return {
        startMonth: currentMonth,
        startYear: currentYear,
        endMonth: currentMonth,
        endYear: currentYear
      };
    } else {
      // Admin/Manager: full year
      return {
        startMonth: 0, // January
        startYear: currentYear,
        endMonth: 11, // December
        endYear: currentYear
      };
    }
  };

  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange());
  const [showDateRangeFilter, setShowDateRangeFilter] = useState(false);

  // Helper functions
  const getMonthNames = () => {
    return [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
  };

  const getYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 2; i <= currentYear + 2; i++) {
      years.push(i);
    }
    return years;
  };

  const getMonths = () => [
    { value: 0, label: 'Jan' },
    { value: 1, label: 'Feb' },
    { value: 2, label: 'Mar' },
    { value: 3, label: 'Apr' },
    { value: 4, label: 'Mei' },
    { value: 5, label: 'Jun' },
    { value: 6, label: 'Jul' },
    { value: 7, label: 'Agu' },
    { value: 8, label: 'Sep' },
    { value: 9, label: 'Okt' },
    { value: 10, label: 'Nov' },
    { value: 11, label: 'Des' }
  ];

  // Update date range when From month changes
  const handleFromMonthChange = (month: number) => {
    setDateRange(prev => ({
      ...prev,
      startMonth: month,
      startYear: selectedYear
    }));
  };

  // Update date range when To month changes
  const handleToMonthChange = (month: number) => {
    setDateRange(prev => ({
      ...prev,
      endMonth: month,
      endYear: selectedYear
    }));
  };

  // Update date range when year changes
  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    setDateRange(prev => ({
      startMonth: prev.startMonth,
      startYear: year,
      endMonth: prev.endMonth,
      endYear: year
    }));
  };

  // Generate calendar days based on selected date range
  const generateCalendarDays = () => {
    const days = [];

    // Create date range from selected filters
    const rangeStart = new Date(dateRange.startYear, dateRange.startMonth, 1);
    const rangeEnd = new Date(dateRange.endYear, dateRange.endMonth + 1, 0);

    // Generate all days in the selected date range
    const currentDate = new Date(rangeStart);
    while (currentDate <= rangeEnd) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Limit to maximum 60 days for display purposes
    if (days.length > 60) {
      return days.slice(0, 60);
    }

    return days;
  };

  // Generate calendar months for multi-month view
  const generateCalendarMonths = () => {
    const months = [];
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const monthShortNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Generate all months within the selected date range
    const startDate = new Date(dateRange.startYear, dateRange.startMonth, 1);
    const endDate = new Date(dateRange.endYear, dateRange.endMonth, 1);

    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const monthIndex = currentDate.getMonth();
      const year = currentDate.getFullYear();

      months.push({
        date: new Date(currentDate),
        monthIndex,
        year,
        monthName: monthNames[monthIndex],
        monthShort: monthShortNames[monthIndex]
      });

      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return months;
  };

  // Filter calendar days based on date range
  const getFilteredCalendarDays = () => {
    const calendarDays = generateCalendarDays();

    // Always return calendar days, even if outside date range
    // The tasks will be filtered separately
    return calendarDays;
  };

  const handleViewPhoto = () => {
    setShowPhotoModal(true);
  };

  const handleDownloadPhoto = () => {
    if (selectedVisit?.photoUrl) {
      const link = document.createElement('a');
      link.href = selectedVisit.photoUrl;
      link.download = `visit-${selectedVisit.client || selectedVisit.clientName || 'unknown'}-${selectedVisit.scheduleVisit || selectedVisit.date || 'unknown'}.jpg`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Get staff ID from current user state
  const getLoggedInStaffId = () => {
    return user?.role === 'staff' ? user.staffId : null;
  };

  // Get logged in user data from localStorage
  const getLoggedInUser = () => {
    try {
      const userData = localStorage.getItem('crm_user');
      if (userData) {
        return JSON.parse(userData);
      }
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
    return null;
  };

  useEffect(() => {
    try {
      const userData = localStorage.getItem('crm_user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser({
          role: parsedUser.role,
          name: parsedUser.name,
          staffId: parsedUser.staffId
        });

        // If staff, auto-select their Convex user ID
        if (parsedUser.role === 'staff' && parsedUser.staffId) {
          setSelectedStaff(parsedUser.staffId); // Will be updated to _id after users load
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }, []);

  // Update date range and year when user changes
  useEffect(() => {
    if (user) {
      const newDateRange = getDefaultDateRange();
      setDateRange(newDateRange);
      // Update selected year to match the date range year
      setSelectedYear(newDateRange.startYear);
    }
  }, [user]);

  // Update selectedStaff to Convex ID when users are loaded
  useEffect(() => {
    if (user?.role === 'staff' && user?.staffId && allUsers && allUsers.length > 0) {
      const currentUser = allUsers.find(u => u.staffId === user.staffId);
      if (currentUser && selectedStaff === user.staffId) {
        setSelectedStaff(currentUser._id);
      }
    }
  }, [allUsers, user]);

  // Trigger animations when data is loaded
  useEffect(() => {
    if (user && targets && allUsers) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        setAnimationsReady(true);
      }, 100);
    }
  }, [user, targets, allUsers]);

  if (!user || !targets || !allUsers) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }


  const getTasksForDateAndStaff = (date: Date, staffId: string) => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const visitData = getVisitDataByDate();
    const tasks = visitData[dateStr] || [];

    // Apply status filter
    const statusFilteredTasks = tasks.filter(task => {
      if (selectedStatus === 'all') return true;
      if (selectedStatus === 'visited') return task.status === 'lanjut' || task.status === 'loss' || task.status === 'suspend';
      return task.status === selectedStatus;
    });

    if (staffId === 'all') {
      return statusFilteredTasks;
    }

    return statusFilteredTasks.filter(task => task.staffId === staffId);
  };

  // Get tasks for month and staff
  const getTasksForMonthAndStaff = (monthIndex: number, year: number, staffId: string) => {
    const monthTasks: VisitTask[] = [];
    const visitData = getVisitDataByDate();

    // Iterate through all visit data
    Object.entries(visitData).forEach(([dateStr, tasks]) => {
      const [taskYear, taskMonth, day] = dateStr.split('-').map(Number);
      const taskDate = new Date(taskYear, taskMonth - 1, day);

      // Check if task is in the selected month and year
      if (taskDate.getFullYear() === year && taskDate.getMonth() === monthIndex) {
        const staffFilteredTasks = staffId === 'all' ? tasks : tasks.filter(task => task.staffId === staffId);

        // Apply status filter
        const statusFilteredTasks = staffFilteredTasks.filter(task => {
          if (selectedStatus === 'all') return true;
          if (selectedStatus === 'visited') return task.status === 'lanjut' || task.status === 'loss' || task.status === 'suspend';
          return task.status === selectedStatus;
        });

        monthTasks.push(...statusFilteredTasks);
      }
    });

    return monthTasks;
  };

  const getTaskStatusColor = (status: VisitTask['status']) => {
    switch (status) {
      case 'lanjut': return 'bg-green-500';
      case 'loss': return 'bg-red-500';
      case 'suspend': return 'bg-yellow-500';
      case 'task': return 'bg-gray-400';
      default: return 'bg-gray-500';
    }
  };

  const getCompletionRate = (staffId: string) => {
    const visitData = getVisitDataByDate();
    const currentYear = new Date().getFullYear();
    let completedVisits = 0;
    let totalVisits = 0;

    Object.entries(visitData).forEach(([dateStr, tasks]) => {
      const [year, month, day] = dateStr.split('-').map(Number);
      if (year === currentYear) {
        const staffTasks = tasks.filter(task => task.staffId === staffId);
        totalVisits += staffTasks.length;
        completedVisits += staffTasks.filter(t => t.status === 'lanjut').length;
      }
    });

    const staffTarget = staffData.find(s => s._id === staffId)?.targetYearly || 100;
    return Math.round((completedVisits / staffTarget) * 100);
  };

  // Dynamic functions based on selected status
  const getStatusLabel = () => {
    switch (selectedStatus) {
      case 'all': return 'Visited';
      case 'visited': return 'Visited';
      case 'task': return 'To Do';
      case 'lanjut': return 'Lanjut';
      case 'loss': return 'Loss';
      case 'suspend': return 'Suspend';
      default: return 'Visited';
    }
  };

  const getStatusCount = () => {
    const { totalVisits } = calculateTotals();
    return totalVisits;
  };

  const getStatusPercentage = () => {
    const { totalVisits } = calculateTotals();
    const staffData = getStaffData();
    const totalTarget = selectedStaff === 'all'
      ? staffData.reduce((sum, staff) => sum + staff.targetYearly, 0)
      : staffData.find(staff => staff.id === selectedStaff)?.targetYearly || 0;

    return totalTarget > 0 ? Math.round((totalVisits / totalTarget) * 100) : 0;
  };

  const getStatusTotalAmount = () => {
    let totalAmount = 0;
    const visitData = getVisitDataByDate();
    const rangeStart = new Date(dateRange.startYear, dateRange.startMonth, 1);
    const rangeEnd = new Date(dateRange.endYear, dateRange.endMonth + 1, 0);

    Object.entries(visitData).forEach(([dateStr, tasks]) => {
      const [year, month, day] = dateStr.split('-').map(Number);
      const taskDate = new Date(year, month - 1, day);

      if (taskDate >= rangeStart && taskDate <= rangeEnd) {
        const staffFilteredTasks = selectedStaff === 'all'
          ? tasks
          : tasks.filter(task => task.staffId === selectedStaff);

        const filteredTasks = staffFilteredTasks.filter(task => {
          if (selectedStatus === 'all') return task.status === 'lanjut' || task.status === 'loss' || task.status === 'suspend';
          if (selectedStatus === 'visited') return task.status === 'lanjut' || task.status === 'loss' || task.status === 'suspend';
          return task.status === selectedStatus;
        });

        filteredTasks.forEach(task => {
          totalAmount += task.salesAmount || 0;
        });
      }
    });

    return totalAmount;
  };

  const getTaskIcon = (status: VisitTask['status']) => {
    switch (status) {
      case 'lanjut': return '✓';
      case 'loss': return '✗';
      case 'suspend': return '✓'; // Keep checkmark but with orange background
      case 'task': return <div className="w-4 h-4 border-2 border-dashed border-blue-400 rounded-full mx-auto animate-pulse"></div>;
      default: return '?';
    }
  };

  const handleCellClick = (date: Date, staffId: string) => {
    setSelectedDate(date);
    const tasks = getTasksForDateAndStaff(date, staffId);
    if (tasks.length > 0) {
      setSelectedVisit(tasks[0]);
      setShowDetailModal(true);
    }
  };

  const handleMonthCellClick = (monthIndex: number, year: number, staffId: string) => {
    const tasks = getTasksForMonthAndStaff(monthIndex, year, staffId);
    if (tasks.length > 0) {
      // Sort by date to get the most recent task
      tasks.sort((a, b) => new Date(b.scheduleVisit || b.date || '').getTime() - new Date(a.scheduleVisit || a.date || '').getTime());
      setSelectedVisit(tasks[0]);
      setShowDetailModal(true);
    }
  };

  const handleMoneyCellClick = () => {
    const breakdownData: {staffName: string, visits: VisitTask[]}[] = [];

    // Get all filtered staff
    const staffToShow = selectedStaff === 'all' ? staffData : staffData.filter(staff => staff._id === selectedStaff);

    staffToShow.forEach(staff => {
      const staffVisits: VisitTask[] = [];

      // Get all tasks for this staff within the date range and filters
      calendarMonths.forEach(month => {
        const tasks = getTasksForMonthAndStaff(month.monthIndex, month.year, staff._id);

        // Apply status filter
        const filteredTasks = tasks.filter(task => {
          if (selectedStatus === 'all' || selectedStatus === 'visited') {
            return task.status === 'lanjut' || task.status === 'loss' || task.status === 'suspend';
          }
          return task.status === selectedStatus;
        });

        // Only include visits that have sales amounts
        const visitsWithAmount = filteredTasks.filter(task => (task.salesAmount || 0) > 0);
        staffVisits.push(...visitsWithAmount);
      });

      if (staffVisits.length > 0) {
        // Sort by date (most recent first)
        staffVisits.sort((a, b) => new Date(b.scheduleVisit || b.date || '').getTime() - new Date(a.scheduleVisit || a.date || '').getTime());
        breakdownData.push({
          staffName: staff.name,
          visits: staffVisits
        });
      }
    });

    setMoneyBreakdownData(breakdownData);
    setShowMoneyBreakdownModal(true);
  };

  // Determine if we should show monthly calendar (more than 1 month) or daily calendar (1 month)
  const isMultiMonthView = dateRange.endMonth > dateRange.startMonth || dateRange.endYear > dateRange.startYear;

  // Generate appropriate calendar data
  const calendarDays = isMultiMonthView ? [] : getFilteredCalendarDays();
  const calendarMonths = isMultiMonthView ? generateCalendarMonths() : [];

  const staffData = getStaffData();
  const filteredStaff = selectedStaff === 'all'
    ? staffData
    : staffData.filter(staff => staff._id === selectedStaff);


  // Calculate totals for selected staff(s) using date range
  const calculateTotals = () => {
    let totalVisits = 0;
    let completedVisits = 0;
    let suspendVisits = 0;
    let lossVisits = 0;

    const visitData = getVisitDataByDate();

    // Calculate date range for filtering
    const rangeStart = new Date(dateRange.startYear, dateRange.startMonth, 1);
    const rangeEnd = new Date(dateRange.endYear, dateRange.endMonth + 1, 0);

    // Iterate through all visit data and filter by date range
    Object.entries(visitData).forEach(([dateStr, tasks]) => {
      const [year, month, day] = dateStr.split('-').map(Number);
      const taskDate = new Date(year, month - 1, day);

      // Check if task date is within the selected date range
      if (taskDate >= rangeStart && taskDate <= rangeEnd) {
        const staffFilteredTasks = selectedStaff === 'all'
          ? tasks
          : tasks.filter(task => task.staffId === selectedStaff);

        // Apply status filter
        const filteredTasks = staffFilteredTasks.filter(task => {
          if (selectedStatus === 'all') return true;
          if (selectedStatus === 'visited') return task.status === 'lanjut' || task.status === 'loss' || task.status === 'suspend';
          return task.status === selectedStatus;
        });

        totalVisits += filteredTasks.length;
        completedVisits += filteredTasks.filter(t => t.status === 'lanjut').length;
        suspendVisits += filteredTasks.filter(t => t.status === 'suspend').length;
        lossVisits += filteredTasks.filter(t => t.status === 'loss').length;
      }
    });

    return { totalVisits, completedVisits, suspendVisits, lossVisits };
  };

  const { totalVisits, completedVisits, suspendVisits, lossVisits } = calculateTotals();
  const completionRate = totalVisits > 0 ? Math.round((completedVisits / totalVisits) * 100) : 0;

  return (
    <>
      {/* Custom Animation Styles */}
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />

      {/* Futuristic Background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        {/* Animated Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:60px_60px]"></div>

        {/* Floating Data Visualization Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Large Area Chart Background */}
          <div className="absolute top-10 left-10 w-96 h-64 opacity-10 animate-pulse" style={{animationDelay: '3s'}}>
            <svg viewBox="0 0 400 250" className="w-full h-full">
              <defs>
                <linearGradient id="bgChart1" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4"/>
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.1"/>
                </linearGradient>
              </defs>
              <path d="M0,180 Q100,120 200,140 T400,100 L400,250 L0,250 Z" fill="url(#bgChart1)"/>
              <path d="M0,180 Q100,120 200,140 T400,100" stroke="#3B82F6" strokeWidth="1" fill="none" opacity="0.3"/>
            </svg>
          </div>

          {/* Bar Chart Background */}
          <div className="absolute top-40 right-20 w-80 h-60 opacity-10 animate-pulse" style={{animationDelay: '5s'}}>
            <svg viewBox="0 0 320 200" className="w-full h-full">
              <defs>
                <linearGradient id="bgChart2" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.4"/>
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0.1"/>
                </linearGradient>
              </defs>
              <rect x="20" y="100" width="40" height="60" fill="url(#bgChart2)"/>
              <rect x="70" y="60" width="40" height="100" fill="url(#bgChart2)"/>
              <rect x="120" y="80" width="40" height="80" fill="url(#bgChart2)"/>
              <rect x="170" y="40" width="40" height="120" fill="url(#bgChart2)"/>
              <rect x="220" y="70" width="40" height="90" fill="url(#bgChart2)"/>
              <rect x="270" y="90" width="40" height="70" fill="url(#bgChart2)"/>
            </svg>
          </div>

          {/* Pie Chart Background */}
          <div className="absolute bottom-20 left-32 w-64 h-64 opacity-10 animate-pulse" style={{animationDelay: '2s'}}>
            <svg viewBox="0 0 250 250" className="w-full h-full">
              <defs>
                <radialGradient id="bgChart3" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.4"/>
                  <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.1"/>
                </radialGradient>
              </defs>
              <circle cx="125" cy="125" r="80" fill="url(#bgChart3)"/>
              <path d="M125,45 L185,125 L125,205 Z" fill="rgba(255,255,255,0.2)"/>
              <circle cx="125" cy="125" r="40" fill="rgba(255,255,255,0.3)"/>
            </svg>
          </div>

          {/* Line Graph Background */}
          <div className="absolute bottom-40 right-40 w-96 h-48 opacity-10 animate-pulse" style={{animationDelay: '4s'}}>
            <svg viewBox="0 0 400 200" className="w-full h-full">
              <defs>
                <linearGradient id="bgChart4" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.4"/>
                  <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.1"/>
                </linearGradient>
              </defs>
              <path d="M0,160 Q80,100 160,120 T320,80 L320,200 L0,200 Z" fill="url(#bgChart4)"/>
              <path d="M0,160 Q80,100 160,120 T320,80" stroke="#F59E0B" strokeWidth="1" fill="none" opacity="0.3"/>
            </svg>
          </div>

          {/* Animated Particles */}
          <div className="absolute inset-0">
            {[...Array(30)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-blue-400/20 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animation: `pulse ${3 + Math.random() * 4}s infinite ease-in-out`,
                  animationDelay: `${Math.random() * 5}s`
                }}
              />
            ))}
          </div>

          {/* Floating Orbs */}
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400/10 rounded-full blur-sm animate-ping" style={{animationDuration: '4s'}}></div>
          <div className="absolute top-3/4 right-1/3 w-3 h-3 bg-purple-400/10 rounded-full blur-sm animate-ping" style={{animationDuration: '6s', animationDelay: '2s'}}></div>
          <div className="absolute top-1/2 right-1/4 w-2 h-2 bg-teal-400/10 rounded-full blur-sm animate-ping" style={{animationDuration: '5s', animationDelay: '1s'}}></div>
          <div className="absolute bottom-1/3 left-1/3 w-4 h-4 bg-green-400/8 rounded-full blur-sm animate-ping" style={{animationDuration: '7s', animationDelay: '3s'}}></div>
        </div>

        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-blue-900/5 via-transparent to-purple-900/5"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-teal-900/3 via-transparent to-indigo-900/3" style={{animation: 'pulse 8s infinite ease-in-out'}}></div>
      </div>

      {/* Header with User Info */}
      <div className="border-b bg-background">
        <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                {user.role === 'super_admin' ? (
                  <Shield className="h-3 w-3 sm:h-5 sm:w-5 text-white" />
                ) : user.role === 'manager' ? (
                  <Users className="h-3 w-3 sm:h-5 sm:w-5 text-white" />
                ) : (
                  <User className="h-3 w-3 sm:h-5 sm:w-5 text-white" />
                )}
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold">Manager Dashboard</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Welcome, <span className="font-semibold hidden sm:inline">{user.name}</span>
                  <span className="sm:hidden">{user.name.split(' ')[0]}</span>
                  <span className="ml-1 sm:ml-2 px-1 sm:px-2 py-0.5 sm:py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {user.role === 'super_admin' ? 'Super Admin' :
                     user.role === 'manager' ? 'Manager' : 'Staff'}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Hide text on mobile, only show logout button */}
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="flex items-center gap-1 sm:gap-2 h-8 sm:h-9 px-2 sm:px-3"
              >
                <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 py-8 px-4 lg:px-6">
        {/* LEFT SIDEBAR - FILTERS (Desktop Only) */}
        <div className="hidden lg:block lg:w-80 flex-shrink-0">
          <div className="sticky top-6 space-y-6">
            {/* Filter Card */}
            <Card className={`${animationsReady ? 'animate-on-mount slide-in-left' : ''}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Staff Filter Buttons */}
                <div>
                  <label className="text-sm font-medium mb-3 block">Filter by Team Member</label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={selectedStaff === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedStaff("all")}
                      className="flex items-center gap-1 text-xs h-8 px-2"
                    >
                      <Users className="h-3 w-3" />
                      All Team
                    </Button>
                    {staffData.map((staff) => (
                      <Button
                        key={staff._id}
                        variant={selectedStaff === staff._id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedStaff(staff._id)}
                        className="flex items-center gap-1 text-xs h-8 px-2"
                      >
                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex-shrink-0"></div>
                        {staff.name}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Other Filters */}
                <div className="space-y-4">
                  {/* Status */}
                  <div>
                    <label className="text-sm font-medium">Status:</label>
                    <Select value={selectedStatus} onValueChange={(v) => setSelectedStatus(v)}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="visited">VISITED</SelectItem>
                        <SelectItem value="task">TO DO</SelectItem>
                        <SelectItem value="lanjut">LANJUT</SelectItem>
                        <SelectItem value="loss">LOSS</SelectItem>
                        <SelectItem value="suspend">SUSPEND</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Chart */}
                  <div>
                    <label className="text-sm font-medium">Chart:</label>
                    <Select value={selectedChartType} onValueChange={(v) => setSelectedChartType(v)}>
                      <SelectTrigger className="w-full">
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

                  {/* From Month */}
                  <div>
                    <label className="text-sm font-medium">From:</label>
                    <Select
                      value={dateRange.startMonth.toString()}
                      onValueChange={(v) => handleFromMonthChange(Number(v))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getMonths().map((m) => (
                          <SelectItem key={m.value} value={m.value.toString()}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* To Month */}
                  <div>
                    <label className="text-sm font-medium">To:</label>
                    <Select
                      value={dateRange.endMonth.toString()}
                      onValueChange={(v) => handleToMonthChange(Number(v))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getMonths().map((m) => (
                          <SelectItem key={m.value} value={m.value.toString()}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Year Filter */}
                  <div>
                    <label className="text-sm font-medium">Year:</label>
                    <Select value={selectedYear.toString()} onValueChange={(v) => handleYearChange(Number(v))}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getYears().map((y) => (
                          <SelectItem key={y} value={y.toString()}>
                            {y}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            </div>
        </div>

        {/* MOBILE FILTERS */}
        <div className="lg:hidden">
          {/* Bottom Filter Navigation Bar - Responsive with Labels */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-lg lg:hidden safe-area-bottom">
            <div className="flex px-safe py-2">
              {/* Staff Select */}
              <div className="flex-1 flex flex-col ">
                <span className="text-[9px] text-muted-foreground font-medium pl-2">Team</span>
                <Select value={selectedStaff} onValueChange={(v) => setSelectedStaff(v)}>
                  <SelectTrigger className="h-auto min-h-[32px] pl-2 pr-1 flex-1 text-[10px] sm:text-xs border-r-0 rounded-r-none">
                    <SelectValue placeholder="Team" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {staffData.map((staff) => (
                      <SelectItem key={staff._id} value={staff._id} className="text-xs">
                        {staff.name.split(' ')[0]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Select */}
              <div className="flex-1 flex flex-col ">
                <span className="text-[9px] text-muted-foreground font-medium pl-2">Status</span>
                <Select value={selectedStatus} onValueChange={(v) => setSelectedStatus(v)}>
                  <SelectTrigger className="h-auto min-h-[32px] pl-2 pr-1 flex-1 text-[10px] sm:text-xs border-r-0 rounded-r-none rounded-l-none">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="visited">Visited</SelectItem>
                    <SelectItem value="task">To Do</SelectItem>
                    <SelectItem value="lanjut">Lanjut</SelectItem>
                    <SelectItem value="loss">Loss</SelectItem>
                    <SelectItem value="suspend">Suspend</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Year Select */}
              <div className="flex-1 flex flex-col ">
                <span className="text-[9px] text-muted-foreground font-medium pl-2">Year</span>
                <Select value={selectedYear.toString()} onValueChange={(v) => handleYearChange(Number(v))}>
                  <SelectTrigger className="h-auto min-h-[32px] pl-2 pr-1 flex-1 text-[10px] sm:text-xs border-r-0 rounded-l-none rounded-r-none">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {getYears().map((y) => (
                      <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Chart Type Select */}
              <div className="flex-1 flex flex-col ">
                <span className="text-[9px] text-muted-foreground font-medium pl-2">Chart</span>
                <Select value={selectedChartType} onValueChange={(v) => setSelectedChartType(v)}>
                  <SelectTrigger className="h-auto min-h-[32px] pl-2 pr-1 flex-1 text-[10px] sm:text-xs border-r-0 rounded-l-none rounded-r-none">
                    <SelectValue placeholder="Chart" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="area">Area</SelectItem>
                    <SelectItem value="bar">Bar</SelectItem>
                    <SelectItem value="line">Line</SelectItem>
                    <SelectItem value="pie">Pie</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* From Month Select */}
              <div className="flex-1 flex flex-col ">
                <span className="text-[9px] text-muted-foreground font-medium pl-2">From</span>
                <Select
                  value={dateRange.startMonth.toString()}
                  onValueChange={(v) => handleFromMonthChange(Number(v))}
                >
                  <SelectTrigger className="h-auto min-h-[32px] pl-2 pr-1 flex-1 text-[10px] sm:text-xs border-r-0 rounded-l-none rounded-r-none">
                    <SelectValue placeholder="From" />
                  </SelectTrigger>
                  <SelectContent>
                    {getMonths().map((m) => (
                      <SelectItem key={m.value} value={m.value.toString()}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* To Month Select */}
              <div className="flex-1 flex flex-col ">
                <span className="text-[9px] text-muted-foreground font-medium pl-2">To</span>
                <Select
                  value={dateRange.endMonth.toString()}
                  onValueChange={(v) => handleToMonthChange(Number(v))}
                >
                  <SelectTrigger className="h-auto min-h-[32px] pl-2 pr-1 flex-1 text-[10px] sm:text-xs rounded-l-none">
                    <SelectValue placeholder="To" />
                  </SelectTrigger>
                  <SelectContent>
                    {getMonths().map((m) => (
                      <SelectItem key={m.value} value={m.value.toString()}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Add padding to bottom of page to account for fixed bottom nav */}
          <div className="h-20 lg:hidden"></div>
        </div>

        {/* MAIN CONTENT */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Chart and Performance Section */}
          {(user.role === "super_admin" || user.role === "manager") && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Staff Performance Card - Show only when staff is selected */}
              {selectedStaff !== "all" && staffData.find(staff => staff._id === selectedStaff) && (
                <div className="lg:col-span-2">
                    <Card className={`min-h-[445px] ${animationsReady ? 'animate-on-mount slide-in-left delay-200' : ''}`}>
                    <CardContent>
                      {(() => {
                        const selectedStaffData = staffData.find(staff => staff._id === selectedStaff);
                        if (!selectedStaffData) return null;

                        const staffPhoto = selectedStaffData.name.toLowerCase() === 'dhea'
                          ? '/images/dhea.jpeg'
                          : selectedStaffData.name.toLowerCase() === 'mercy'
                          ? '/images/mercy.jpeg'
                          : `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedStaffData.name}`;

                        // Get additional stats for the selected staff based on current filters
                        const getStaffStats = () => {
                          const visitData = getVisitDataByDate();
                          let completedVisits = 0;
                          let suspendVisits = 0;
                          let lossVisits = 0;
                          let totalVisits = 0;
                          let totalAmount = 0;

                          // Calculate date range from current filters
                          const rangeStart = new Date(dateRange.startYear, dateRange.startMonth, 1);
                          const rangeEnd = new Date(dateRange.endYear, dateRange.endMonth + 1, 0);

                          Object.entries(visitData).forEach(([dateStr, tasks]) => {
                            const [year, month, day] = dateStr.split('-').map(Number);
                            const taskDate = new Date(year, month - 1, day);

                            // Filter by date range
                            if (taskDate >= rangeStart && taskDate <= rangeEnd) {
                              const staffTasks = tasks.filter(task => task.staffId === selectedStaffData._id);

                              // Apply status filter
                              let filteredTasks = staffTasks;
                              if (selectedStatus === 'all') {
                                // For 'all', include all tasks regardless of status
                                filteredTasks = staffTasks;
                              } else if (selectedStatus === 'visited') {
                                filteredTasks = staffTasks.filter(task => task.status === 'lanjut' || task.status === 'loss' || task.status === 'suspend');
                              } else {
                                filteredTasks = staffTasks.filter(task => task.status === selectedStatus);
                              }

                              totalVisits += filteredTasks.filter(t => t.statusKunjungan === 'VISITED').length;
                              completedVisits += filteredTasks.filter(t => t.status === 'lanjut').length;
                              suspendVisits += filteredTasks.filter(t => t.status === 'suspend').length;
                              lossVisits += filteredTasks.filter(t => t.status === 'loss').length;

                              filteredTasks.forEach(task => {
                                totalAmount += task.salesAmount || 0;
                              });
                            }
                          });

                          return { completedVisits, suspendVisits, lossVisits, totalVisits, totalAmount };
                        };

                        const staffStats = getStaffStats();
                        // Calculate completion rate based on filtered data
                        const completionRate = selectedStaffData.targetYearly > 0
                          ? Math.round((staffStats.totalVisits / selectedStaffData.targetYearly) * 100)
                          : 0;

                        return (
                          <div className="space-y-4">
                            {/* Profile Photo */}
                            <div className="flex justify-center">
                              <div className="relative">
                                <img
                                  src={staffPhoto}
                                  onError={(e) => (e.currentTarget.src = "/images/visit.jpeg")}
                                  className="w-24 h-24 rounded-full object-cover border-4 border-background shadow-lg"
                                />
                                {selectedStaffData.isActive && (
                                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-background"></div>
                                )}
                              </div>
                            </div>

                            {/* Profile Info */}
                            <div className="text-center space-y-1">
                              <p className="font-semibold text-sm truncate">{selectedStaffData.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{selectedStaffData.email}</p>
                              <p className="text-xs text-blue-600 font-medium">ID: {selectedStaffData.staffId}</p>
                            </div>

                            {/* Performance Overview */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">Target Achievement</span>
                                <span className="text-lg font-bold text-primary">{completionRate}%</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">Total Visits</span>
                                <span className="text-xs text-muted-foreground">{staffStats.totalVisits}/{selectedStaffData.targetYearly}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                  style={{ width: `${Math.min((staffStats.totalVisits / selectedStaffData.targetYearly) * 100, 100)}%` }}
                                />
                              </div>
                            </div>

                            {/* Detailed Statistics */}
                            <div className="space-y-2">
                              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Performance Breakdown</div>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="flex justify-between items-center">
                                  <span className="text-green-600">✓ Lanjut</span>
                                  <span className="font-medium">{staffStats.completedVisits}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-yellow-600">⏸ Suspend</span>
                                  <span className="font-medium">{staffStats.suspendVisits}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-red-600">✗ Loss</span>
                                  <span className="font-medium">{staffStats.lossVisits}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-blue-600">📋 To Do</span>
                                  <span className="font-medium">{Math.max(0, selectedStaffData.targetYearly - staffStats.totalVisits)}</span>
                                </div>
                              </div>
                            </div>

                            {/* Total Revenue */}
                            <div className="pt-2 border-t">
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-muted-foreground">Revenue</span>
                                <span className="text-xs font-bold text-green-600">
                                  Rp {staffStats.totalAmount.toLocaleString('id-ID')}
                                </span>
                              </div>
                            </div>

                          </div>
                        );
                      })()}
                    </CardContent>
                    </Card>
                </div>
              )}
              {/* Chart */}
              <div className={`${selectedStaff !== "all" && staffData.find(staff => staff._id === selectedStaff) ? "lg:col-span-10" : "lg:col-span-12"} min-h-[300px] sm:min-h-[350px] lg:min-h-[400px] ${animationsReady ? 'animate-on-mount slide-in-right delay-300' : ''}`}>
                <ChartAreaInteractive
                  selectedStaff={selectedStaff}
                  selectedYear={selectedYear}
                  selectedStatus={selectedStatus}
                  allVisitData={getVisitDataByDate()}
                  dateRange={dateRange}
                  selectedChartType={selectedChartType}
                />
              </div>

              
            </div>
          )}

          {/* Modern CRM Stats Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4 transition-all duration-300 ease-in-out" key={`${selectedStaff}-${selectedStatus}-${selectedYear}-${dateRange.startMonth}-${dateRange.endMonth}`}>
          {/* Target Card - Total data from Convex table with progress bar */}
          <Card className={`@container/card transition-all duration-300 ease-in-out hover:shadow-lg transform hover:-translate-y-1 ${animationsReady ? 'animate-on-mount slide-in-bottom delay-100' : ''}`}>
            <CardHeader className="pb-2 sm:pb-4">
              <CardDescription className="text-xs sm:text-sm">TARGET</CardDescription>
              <CardTitle className="text-xl sm:text-2xl font-semibold tabular-nums @[250px]/card:text-3xl transition-all duration-300 ease-in-out">
                <span className="number-change inline-block">{(() => {
                  // Calculate total data from Convex targets table
                  let totalTargets = 0;
                  let totalVisited = 0;
                  const visitData = getVisitDataByDate();
                  const rangeStart = new Date(dateRange.startYear, dateRange.startMonth, 1);
                  const rangeEnd = new Date(dateRange.endYear, dateRange.endMonth + 1, 0);

                  Object.entries(visitData).forEach(([dateStr, tasks]) => {
                    const [year, month, day] = dateStr.split('-').map(Number);
                    const taskDate = new Date(year, month - 1, day);

                    if (taskDate >= rangeStart && taskDate <= rangeEnd) {
                      const staffFilteredTasks = selectedStaff === 'all' ? tasks : tasks.filter(task => task.staffId === selectedStaff);
                      totalTargets += staffFilteredTasks.length;
                      totalVisited += staffFilteredTasks.filter(task => task.statusKunjungan === 'VISITED').length;
                    }
                  });

                  return totalTargets;
                })()}</span>
              </CardTitle>
              <CardAction className="pt-1">
                <Badge variant="outline" className="text-xs sm:text-sm text-green-600">
                  <IconTrendingUp className="size-3 sm:size-4" />
                  <span className="hidden sm:inline">+{(() => Math.floor(Math.random() * 20) + 5)()}%</span>
                  <span className="sm:hidden">+{(() => Math.floor(Math.random() * 20) + 5)()}%</span>
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-xs sm:text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium text-green-600">
                Total data in Convex table <IconTrendingUp className="size-4" />
              </div>

              {/* Progress Bar */}
              <div className="w-full space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">
                    <span className="number-change inline-block">{(() => {
                      let totalTargets = 0;
                      let totalVisited = 0;
                      const visitData = getVisitDataByDate();
                      const rangeStart = new Date(dateRange.startYear, dateRange.startMonth, 1);
                      const rangeEnd = new Date(dateRange.endYear, dateRange.endMonth + 1, 0);

                      Object.entries(visitData).forEach(([dateStr, tasks]) => {
                        const [year, month, day] = dateStr.split('-').map(Number);
                        const taskDate = new Date(year, month - 1, day);

                        if (taskDate >= rangeStart && taskDate <= rangeEnd) {
                          const staffFilteredTasks = selectedStaff === 'all' ? tasks : tasks.filter(task => task.staffId === selectedStaff);
                          totalTargets += staffFilteredTasks.length;
                          totalVisited += staffFilteredTasks.filter(task => task.statusKunjungan === 'VISITED').length;
                        }
                      });

                      const percentage = totalTargets > 0 ? Math.round((totalVisited / totalTargets) * 100) : 0;
                      return `${totalVisited}/${totalTargets} (${percentage}%)`;
                    })()}
                  </span>
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <span className="number-change inline-block">{(() => {
                    let totalTargets = 0;
                    let totalVisited = 0;
                    const visitData = getVisitDataByDate();
                    const rangeStart = new Date(dateRange.startYear, dateRange.startMonth, 1);
                    const rangeEnd = new Date(dateRange.endYear, dateRange.endMonth + 1, 0);

                    Object.entries(visitData).forEach(([dateStr, tasks]) => {
                      const [year, month, day] = dateStr.split('-').map(Number);
                      const taskDate = new Date(year, month - 1, day);

                      if (taskDate >= rangeStart && taskDate <= rangeEnd) {
                        const staffFilteredTasks = selectedStaff === 'all' ? tasks : tasks.filter(task => task.staffId === selectedStaff);
                        totalTargets += staffFilteredTasks.length;
                        totalVisited += staffFilteredTasks.filter(task => task.statusKunjungan === 'VISITED').length;
                      }
                    });

                    const percentage = totalTargets > 0 ? Math.round((totalVisited / totalTargets) * 100) : 0;
                    return (
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    );
                  })()}
                  </span>
                </div>
              </div>

              <div className="text-muted-foreground">
                All target records in date range
              </div>
            </CardFooter>
          </Card>

          <Card className={`@container/card transition-all duration-300 ease-in-out hover:shadow-lg transform hover:-translate-y-1 ${animationsReady ? 'animate-on-mount slide-in-bottom delay-200' : ''}`}>
            <CardHeader className="pb-2 sm:pb-4">
              <CardDescription className="text-xs sm:text-sm">LANJUT</CardDescription>
              <CardTitle className="text-xl sm:text-2xl font-semibold tabular-nums @[250px]/card:text-3xl transition-all duration-300 ease-in-out">
                <span className="number-change inline-block">{(() => {
                  // Calculate total visits with LANJUT status
                  let lanjutCount = 0;
                  const visitData = getVisitDataByDate();
                  const rangeStart = new Date(dateRange.startYear, dateRange.startMonth, 1);
                  const rangeEnd = new Date(dateRange.endYear, dateRange.endMonth + 1, 0);

                  Object.entries(visitData).forEach(([dateStr, tasks]) => {
                    const [year, month, day] = dateStr.split('-').map(Number);
                    const taskDate = new Date(year, month - 1, day);

                    if (taskDate >= rangeStart && taskDate <= rangeEnd) {
                      const staffFilteredTasks = selectedStaff === 'all' ? tasks : tasks.filter(task => task.staffId === selectedStaff);
                      lanjutCount += staffFilteredTasks.filter(task => task.status === 'lanjut').length;
                    }
                  });

                  return lanjutCount;
                })()}</span>
              </CardTitle>
              <CardAction className="pt-1">
                <Badge variant="outline" className="text-xs sm:text-sm text-green-600">
                  <IconTrendingUp className="size-3 sm:size-4" />
                  <span className="hidden sm:inline">+{(() => Math.floor(Math.random() * 20) + 5)()}%</span>
                  <span className="sm:hidden">+{(() => Math.floor(Math.random() * 20) + 5)()}%</span>
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-xs sm:text-sm">
              <div className="line-clamp-1 flex gap-1 sm:gap-2 font-medium text-green-600">
                <span className="hidden sm:inline">Successful visits</span>
                <span className="sm:hidden">Successful</span>
                <IconTrendingUp className="size-3 sm:size-4" />
              </div>
              <div className="text-muted-foreground">
                <span className="hidden sm:inline">All visits with LANJUT status</span>
                <span className="sm:hidden">LANJUT status visits</span>
              </div>
            </CardFooter>
          </Card>

          <Card className={`@container/card transition-all duration-300 ease-in-out hover:shadow-lg transform hover:-translate-y-1 ${animationsReady ? 'animate-on-mount slide-in-bottom delay-300' : ''}`}>
            <CardHeader className="pb-2 sm:pb-4">
              <CardDescription className="text-xs sm:text-sm">LOSS</CardDescription>
              <CardTitle className="text-xl sm:text-2xl font-semibold tabular-nums @[250px]/card:text-3xl transition-all duration-300 ease-in-out">
                {lossVisits}
              </CardTitle>
              <CardAction className="pt-1">
                <Badge variant="outline" className="text-xs sm:text-sm text-orange-600">
                  <IconTrendingDown className="size-3 sm:size-4" />
                  <span className="hidden sm:inline">-2.1%</span>
                  <span className="sm:hidden">-2%</span>
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-xs sm:text-sm">
              <div className="line-clamp-1 flex gap-1 sm:gap-2 font-medium text-orange-600">
                <span className="hidden sm:inline">Lost opportunities</span>
                <span className="sm:hidden">Lost</span>
                <IconTrendingDown className="size-3 sm:size-4" />
              </div>
              <div className="text-muted-foreground">
                <span className="hidden sm:inline">Client visits that resulted in loss</span>
                <span className="sm:hidden">Visits lost</span>
              </div>
            </CardFooter>
          </Card>
          
           <Card className={`@container/card transition-all duration-300 ease-in-out hover:shadow-lg transform hover:-translate-y-1 ${animationsReady ? 'animate-on-mount slide-in-bottom delay-400' : ''}`}>
            <CardHeader className="pb-2 sm:pb-4">
              <CardDescription className="text-xs sm:text-sm">SUSPEND</CardDescription>
              <CardTitle className="text-xl sm:text-2xl font-semibold tabular-nums @[250px]/card:text-3xl transition-all duration-300 ease-in-out">
                {suspendVisits}
              </CardTitle>
              <CardAction className="pt-1">
                <Badge variant="outline" className="text-xs sm:text-sm text-blue-600">
                  <IconTrendingUp className="size-3 sm:size-4" />
                  <span className="hidden sm:inline">+8.2%</span>
                  <span className="sm:hidden">+8%</span>
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-xs sm:text-sm">
              <div className="line-clamp-1 flex gap-1 sm:gap-2 font-medium text-blue-600">
                <span className="hidden sm:inline">Pending follow-up</span>
                <span className="sm:hidden">Pending</span>
                <IconTrendingUp className="size-3 sm:size-4" />
              </div>
              <div className="text-muted-foreground">
                <span className="hidden sm:inline">Client visits suspended</span>
                <span className="sm:hidden">Visits suspended</span>
              </div>
            </CardFooter>
          </Card>
          
        </div>

        {/* Shadcn UI Calendar Section - Only show for admin or with controls for staff */}
        <div className={`transition-all duration-300 ease-in-out ${animationsReady ? 'animate-on-mount slide-in-top delay-500' : ''}`} key={`calendar-${selectedStaff}-${selectedStatus}-${selectedYear}`}>
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <Calendar className="h-5 w-5 sm:h-6 sm:w-6" />
                  <div>
                    <CardTitle className="text-lg sm:text-xl">{(user.role === 'super_admin' || user.role === 'manager') ? 'Timeline Analytics' : 'Your Visit Timeline'}</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      {getMonthNames()[dateRange.startMonth].slice(0, 3)} {dateRange.startYear} - {getMonthNames()[dateRange.endMonth].slice(0, 3)} {dateRange.endYear}
                    </CardDescription>
                  </div>
                </div>
                {user.role === 'super_admin' && (
                  <div className="flex items-center space-x-2">
                    <div className="px-2 py-1 sm:px-3 border rounded-md">
                      <span className="text-xs sm:text-sm font-medium">
                        {calendarDays.length} days displayed
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="w-full overflow-x-auto">
                {/* Monthly Calendar View */}
                {isMultiMonthView && (
                  <Table className="w-full" style={{ width: '100%', tableLayout: 'auto' }}>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px] py-1">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            Staff
                          </div>
                        </TableHead>
                        {calendarMonths.map((month) => {
                          const isCurrentMonth = month.monthIndex === new Date().getMonth() && month.year === new Date().getFullYear();

                          return (
                            <TableHead
                              key={`${month.year}-${month.monthIndex}`}
                              className={`text-center py-0.5 px-0.5 min-w-[60px] ${isCurrentMonth ? 'bg-blue-100' : ''}`}
                              style={{ width: `${100/(calendarMonths.length + 3)}%` }}
                            >
                              <div className={`font-semibold ${isCurrentMonth ? 'text-sm text-blue-600' : 'text-sm'}`}>
                                {month.monthShort}
                              </div>
                              <div className="text-[10px] leading-none">
                                {month.year}
                              </div>
                              {isCurrentMonth && (
                                <Badge variant="secondary" className="text-[8px] px-1 py-0.5 mt-0.5">
                                  ★
                                </Badge>
                              )}
                            </TableHead>
                          );
                        })}
                        <TableHead className="text-center min-w-[50px] py-1 text-sm font-semibold" style={{ width: `${100/(calendarMonths.length + 4)}%` }}>Target</TableHead>
                        <TableHead className="text-center min-w-[50px] py-1 text-sm font-semibold" style={{ width: `${100/(calendarMonths.length + 4)}%` }}>Persentase</TableHead>
                        <TableHead className="text-center min-w-[70px] py-1 text-sm font-semibold" style={{ width: `${100/(calendarMonths.length + 4)}%` }}>Actual Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStaff.map((staff, staffIndex) => (
                        <TableRow key={staff.id}>
                          <TableCell className="font-medium py-1 px-1">
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
                                <User className="h-3 w-3 text-blue-600" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-xs truncate">{staff.name}</div>
                              </div>
                            </div>
                          </TableCell>
                          {calendarMonths.map((month, monthIndex) => {
                            const tasks = getTasksForMonthAndStaff(month.monthIndex, month.year, staff._id);
                            const hasTask = tasks.length > 0;
                            const isCurrentMonth = month.monthIndex === new Date().getMonth() && month.year === new Date().getFullYear();

                            // Calculate filtered tasks based on selected status
                            const getFilteredTaskCount = (taskList: any[]) => {
                              if (selectedStatus === 'all' || selectedStatus === 'visited') {
                                return taskList.filter(task => task.status === 'lanjut' || task.status === 'loss' || task.status === 'suspend').length;
                              }
                              return taskList.filter(task => task.status === selectedStatus).length;
                            };

                            const filteredTaskCount = getFilteredTaskCount(tasks);
                            const hasFilteredTask = filteredTaskCount > 0;

                            return (
                              <TableCell
                                key={`${staff.id}-${month.year}-${month.monthIndex}`}
                                className={`text-center hover:bg-muted/50 py-1 px-1 border border-border ${isCurrentMonth ? 'border-blue-400 bg-blue-50/30' : ''}`}
                                style={{ width: `${100/(calendarMonths.length + 4)}%` }}
                                // onClick={() => hasFilteredTask && handleMonthCellClick(month.monthIndex, month.year, staff._id)}
                              >
                                {hasFilteredTask ? (
                                  <div className="text-xs font-semibold">
                                    {filteredTaskCount}
                                  </div>
                                ) : (
                                  <div className="text-xs text-gray-400">-</div>
                                )}
                              </TableCell>
                            );
                          })}
                          <TableCell className="text-center py-1 px-1" style={{ width: `${100/(calendarMonths.length + 4)}%` }}>
                            <div className="font-bold text-sm">
                              <span className="number-change inline-block">{(() => {
                                let totalFilteredVisits = 0;
                                calendarMonths.forEach(month => {
                                  const tasks = getTasksForMonthAndStaff(month.monthIndex, month.year, staff._id);

                                  // Apply status filter
                                  if (selectedStatus === 'all' || selectedStatus === 'visited') {
                                    totalFilteredVisits += tasks.filter(task => task.status === 'lanjut' || task.status === 'loss' || task.status === 'suspend').length;
                                  } else {
                                    totalFilteredVisits += tasks.filter(task => task.status === selectedStatus).length;
                                  }
                                });
                                return totalFilteredVisits;
                              })()}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center py-1 px-1" style={{ width: `${100/(calendarMonths.length + 4)}%` }}>
                            <div className="font-bold text-sm">
                              <span className="number-change inline-block">{(() => {
                                let totalFilteredVisits = 0;
                                let totalTasks = 0;
                                calendarMonths.forEach(month => {
                                  const tasks = getTasksForMonthAndStaff(month.monthIndex, month.year, staff._id);
                                  totalTasks += tasks.length;

                                  // Apply status filter
                                  if (selectedStatus === 'all' || selectedStatus === 'visited') {
                                    totalFilteredVisits += tasks.filter(task => task.status === 'lanjut' || task.status === 'loss' || task.status === 'suspend').length;
                                  } else {
                                    totalFilteredVisits += tasks.filter(task => task.status === selectedStatus).length;
                                  }
                                });

                                const percentage = totalTasks > 0 ? Math.round((totalFilteredVisits / totalTasks) * 100) : 0;
                                return `${percentage}%`;
                              })()}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell
                              className="text-center py-1 px-1 cursor-pointer hover:bg-muted/50 transition-colors"
                              style={{ width: `${100/(calendarMonths.length + 4)}%` }}
                              onClick={handleMoneyCellClick}
                              title="Click to see detailed breakdown"
                            >
                              <div className="font-bold text-xs">
                                <span className="number-change inline-block hover:text-blue-600 transition-colors">{(() => {
                                let totalAmount = 0;
                                calendarMonths.forEach(month => {
                                  const tasks = getTasksForMonthAndStaff(month.monthIndex, month.year, staff._id);

                                  // Apply status filter and sum amounts
                                  const filteredTasks = tasks.filter(task => {
                                    if (selectedStatus === 'all' || selectedStatus === 'visited') {
                                      return task.status === 'lanjut' || task.status === 'loss' || task.status === 'suspend';
                                    }
                                    return task.status === selectedStatus;
                                  });

                                  filteredTasks.forEach(task => {
                                    totalAmount += task.salesAmount || 0;
                                  });
                                });

                                // Format as Indonesian Rupiah
                                return new Intl.NumberFormat('id-ID', {
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 0
                                }).format(totalAmount);
                              })()}
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                {/* Daily Calendar View */}
                {!isMultiMonthView && (
                  <Table className="w-full" style={{ tableLayout: 'auto' }}>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px] py-1">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            Staff
                          </div>
                        </TableHead>

                        {calendarDays.map((date) => {
                          const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                          const isToday = date.toDateString() === new Date().toDateString();

                          const rangeStart = new Date(dateRange.startYear, dateRange.startMonth, 1);
                          const rangeEnd = new Date(dateRange.endYear, dateRange.endMonth + 1, 0);
                          const isOutsideRange = date < rangeStart || date > rangeEnd;

                          return (
                            <TableHead
                              key={date.toISOString()}
                              className={`text-center py-0.5 px-0.5 min-w-[25px]
                                ${isOutsideRange ? 'opacity-60' : ''}
                                ${isWeekend ? 'bg-red-200/50' : ''}`}
                            >
                              <div className={`font-semibold ${isToday ? 'text-blue-600' : ''}`}>
                                {date.getDate()}
                              </div>
                              <div className="text-[10px] leading-none">
                                {date.toLocaleDateString('id-ID', { weekday: 'short' }).slice(0, 1)}
                              </div>
                              {isToday && (
                                <Badge variant="secondary" className="text-[8px] px-1 py-0.5 mt-0.5">
                                  ★
                                </Badge>
                              )}
                            </TableHead>
                          );
                        })}

                        <TableHead className="text-center min-w-[50px]">Total</TableHead>
                        <TableHead className="text-center min-w-[50px]">Visited</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {filteredStaff.map((staff, staffIndex) => (
                        <TableRow key={staff._id}>
                          <TableCell className="py-1 px-1">
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
                                <User className="h-3 w-3 text-blue-600" />
                              </div>
                              <div>
                                <div className="font-semibold text-xs truncate">{staff.name}</div>
                                <div className="text-[9px] text-muted-foreground">
                                  {
                                    Object.values(getVisitDataByDate())
                                      .flat()
                                      .filter(task => task.staffId === staff._id).length
                                  }/{staff.targetYearly}
                                </div>
                              </div>
                            </div>
                          </TableCell>

                          {calendarDays.map((date, dayIndex) => {
                            const tasks = getTasksForDateAndStaff(date, staff._id);
                            const hasTask = tasks.length > 0;
                            const isToday = date.toDateString() === new Date().toDateString();
                            const isDiagonal = staffIndex === dayIndex;

                            return (
                              <TableCell
                                key={date.toISOString()}
                                className={`text-center cursor-pointer py-1 px-1 border
                                  ${isToday ? 'border-blue-400 bg-blue-50/30' : ''}
                                  ${date.getDay() === 0 || date.getDay() === 6 ? 'bg-red-200/50' : ''}`}
                                onClick={() => hasTask && handleCellClick(date, staff._id)}
                              >
                                {hasTask ? (
                                  <div className="flex justify-center">
                                    {tasks[0].status === 'task'
                                      ? getTaskIcon(tasks[0].status)
                                      : (
                                        <div className={`w-3.5 h-3.5 ${getTaskStatusColor(tasks[0].status)} rounded-full flex items-center justify-center text-white text-[8px]`}>
                                          {getTaskIcon(tasks[0].status)}
                                        </div>
                                      )}
                                  </div>
                                ) : null}
                              </TableCell>
                            );
                          })}

                          {/* TOTAL */}
                          <TableCell className="text-center">
                            <div className="font-bold text-sm number-change">
                              {calendarDays.reduce((sum, d) => (
                                sum + getTasksForDateAndStaff(d, staff._id).length
                              ), 0)}
                            </div>
                          </TableCell>

                          {/* PERCENTAGE */}
                          <TableCell className="text-center">
                            {(() => {
                              let total = 0;
                              let done = 0;

                              calendarDays.forEach(d => {
                                const tasks = getTasksForDateAndStaff(d, staff._id);
                                total += tasks.length;
                                done += tasks.filter(t => t.statusKunjungan === 'VISITED').length;
                              });

                              const percent = total ? Math.round((done / total) * 100) : 0;

                              return (
                                <>
                                  <div className="font-bold text-sm number-change">{percent}% ({done})</div>
                                  <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                                    <div
                                      className="bg-green-500 h-1.5 rounded-full transition-all"
                                      style={{ width: `${percent}%` }}
                                    />
                                  </div>
                                </>
                              );
                            })()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

              </div>

              {/* Timeline Info */}
              <div className="flex justify-between items-center mt-4 p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {isMultiMonthView
                      ? `Showing monthly view for ${calendarMonths.length} month${calendarMonths.length > 1 ? 's' : ''}`
                      : `Showing daily view for ${calendarDays.length} day${calendarDays.length > 1 ? 's' : ''}`
                    }
                  </span>
                </div>
                <div className="flex items-center">
                  <Badge variant="secondary" className="text-xs">
                    {isMultiMonthView
                      ? `${calendarMonths.filter(month => getTasksForMonthAndStaff(month.monthIndex, month.year, selectedStaff).length > 0).length} Active Months`
                      : `${calendarDays.filter(date => getTasksForDateAndStaff(date, selectedStaff).length > 0).length} Active Days`
                    }
                  </Badge>
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center space-x-4 mt-3 p-3 bg-muted/20 rounded-lg">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-xs font-medium">LANJUT</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-xs font-medium">LOSS</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-xs font-medium">SUSPEND</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 border-[1.5px] border-dashed border-blue-400 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium">TASK</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Interactive Chart Component */}
         {/* Recent Visits Table */}
         <div className={`transition-all duration-300 ease-in-out ${animationsReady ? 'animate-on-mount slide-in-bottom delay-600' : ''}`} key={`table-${selectedStaff}-${selectedStatus}-${selectedYear}`}>
          <div className="">
            <Card>
              <CardHeader className="pb-3 sm:pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="hidden sm:inline">Detail Target Visits</span>
                    <span className="sm:hidden">Target Visits</span>
                  </CardTitle>
                  <div className="relative w-full sm:w-auto">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search client or staff..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-full sm:w-64"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto max-h-[425px]">
                  <Table className="min-w-[600px]">
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead className="text-xs font-medium w-12 text-center">No</TableHead>
                        <TableHead className="text-xs font-medium min-w-[100px]">PIC CRM</TableHead>
                        <TableHead className="text-xs font-medium min-w-[150px]">Client</TableHead>
                        <TableHead className="text-xs font-medium min-w-[120px]">Tanggal Kunjungan</TableHead>
                        <TableHead className="text-xs font-medium min-w-[100px]">Status</TableHead>
                        <TableHead className="text-xs font-medium text-right min-w-[120px]">Nilai Kontrak</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(() => {
                        const recentVisits: VisitTask[] = [];

                        // Get visits within date range
                        const rangeStart = new Date(dateRange.startYear, dateRange.startMonth, 1);
                        const rangeEnd = new Date(dateRange.endYear, dateRange.endMonth + 1, 0);

                        Object.entries(getVisitDataByDate()).forEach(([dateStr, visits]) => {
                          const [year, month, day] = dateStr.split('-').map(Number);
                          const taskDate = new Date(year, month - 1, day);

                          if (taskDate >= rangeStart && taskDate <= rangeEnd) {
                            const filteredVisits = selectedStaff === 'all'
                              ? visits
                              : visits.filter(visit => visit.staffId === selectedStaff);

                            // Apply status filter
                            const statusFilteredVisits = filteredVisits.filter(visit => {
                              if (selectedStatus === 'all') return true;
                              if (selectedStatus === 'visited') return visit.status === 'lanjut' || visit.status === 'loss' || visit.status === 'suspend';
                              return visit.status === selectedStatus;
                            });

                            // Apply search filter
                            const searchedVisits = statusFilteredVisits.filter(visit =>
                              searchTerm === '' ||
                              visit.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              ((visit as any).staffName || '').toLowerCase().includes(searchTerm.toLowerCase())
                            );

                            recentVisits.push(...searchedVisits);
                          }
                        });

                        // Sort by date (most recent first) and display all
                        recentVisits.sort((a, b) => new Date(b.scheduleVisit || b.date || '').getTime() - new Date(a.scheduleVisit || a.date || '').getTime());
                        const displayVisits = recentVisits;

                        if (displayVisits.length === 0) {
                          return (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                {searchTerm ? 'No visits found matching your search criteria' : 'No visits found for the selected filters'}
                              </TableCell>
                            </TableRow>
                          );
                        }

                        return displayVisits.map((visit, index) => (
                          <TableRow key={visit._id} className="hover:bg-muted/50 cursor-pointer">
                            <TableCell className="text-xs font-medium text-center w-12 py-3">{index + 1}</TableCell>
                            <TableCell className="text-xs font-medium py-3 truncate max-w-[100px]" title={(visit as any).staffName}>
                              {(visit as any).staffName || 'Unknown'}
                            </TableCell>
                            <TableCell className="text-xs py-3 truncate max-w-[150px]" title={visit.client}>
                              {visit.client}
                            </TableCell>
                            <TableCell className="text-xs py-3">
                              <span className="number-change inline-block">
                                {(() => {
                                  const dateStr = visit.scheduleVisit;
                                  if (!dateStr) return 'Invalid Date';

                                  const [year, month, day] = dateStr.split('-').map(Number);
                                  const date = new Date(year, month - 1, day);

                                  // Check if date is valid
                                  if (isNaN(date.getTime())) return 'Invalid Date';

                                  return (
                                    <>
                                      <span className="hidden sm:inline">
                                        {date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                      </span>
                                      <span className="sm:hidden">
                                        {date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                                      </span>
                                    </>
                                  );
                                })()}
                              </span>
                            </TableCell>
                            <TableCell className="text-xs py-3">
                              <Badge
                                variant="outline"
                                className={`text-xs px-2 py-1 whitespace-nowrap ${
                                  visit.statusClient === 'LANJUT' ? 'border-green-500 text-green-700 bg-green-50' :
                                  visit.statusClient === 'LOSS' ? 'border-red-500 text-red-700 bg-red-50' :
                                  visit.statusClient === 'SUSPEND' ? 'border-yellow-500 text-yellow-700 bg-yellow-50' :
                                  visit.statusClient === 'TO_DO' ? 'border-blue-500 text-blue-700 bg-blue-50' :
                                  'border-gray-500 text-gray-700 bg-gray-50'
                                }`}
                              >
                                {visit.statusClient === 'TO_DO' ? 'TO DO' : visit.statusClient}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-right font-medium py-3 truncate">
                              {visit.salesAmount ? (
                                <div className="number-change inline-block">
                                  <span className="hidden sm:inline">
                                    Rp {visit.salesAmount.toLocaleString('id-ID')}
                                  </span>
                                  <span className="sm:hidden text-green-600 font-semibold">
                                    {(visit.salesAmount / 1000000).toFixed(1)}M
                                  </span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ));
                      })()}
                    </TableBody>
                    <TableFooter>
                      <TableRow className="bg-muted/50 font-semibold">
                        <TableCell colSpan={5} className="text-xs text-right py-3">
                          Total Nilai Kontrak:
                        </TableCell>
                        <TableCell className="text-xs text-right font-bold text-green-600 py-3">
                          {(() => {
                            const recentVisits: VisitTask[] = [];
                            const rangeStart = new Date(dateRange.startYear, dateRange.startMonth, 1);
                            const rangeEnd = new Date(dateRange.endYear, dateRange.endMonth + 1, 0);

                            Object.entries(getVisitDataByDate()).forEach(([dateStr, visits]) => {
                              const [year, month, day] = dateStr.split('-').map(Number);
                              const taskDate = new Date(year, month - 1, day);

                              if (taskDate >= rangeStart && taskDate <= rangeEnd) {
                                const filteredVisits = selectedStaff === 'all'
                                  ? visits
                                  : visits.filter(visit => visit.staffId === selectedStaff);

                                // Apply status filter
                                const statusFilteredVisits = filteredVisits.filter(visit => {
                                  if (selectedStatus === 'all') return true;
                                  if (selectedStatus === 'visited') return visit.status === 'lanjut' || visit.status === 'loss' || visit.status === 'suspend';
                                  return visit.status === selectedStatus;
                                });

                                // Apply search filter
                                const searchedVisits = statusFilteredVisits.filter(visit =>
                                  searchTerm === '' ||
                                  visit.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  ((visit as any).staffName || '').toLowerCase().includes(searchTerm.toLowerCase())
                                );

                                recentVisits.push(...searchedVisits);
                              }
                            });

                            const totalContractValue = recentVisits.reduce((sum, visit) => sum + (visit.salesAmount || 0), 0);

                            return totalContractValue > 0 ? (
                              <span className="number-change inline-block">
                                Rp {totalContractValue.toLocaleString('id-ID')}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">Rp 0</span>
                            );
                          })()}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
         </div>
        </div>
      </div>

      {/* Shadcn UI Dialog Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent
          className="max-h-[95vh] overflow-y-auto"
          style={{
            width: '90vw',
            maxWidth: '1400px',
            minWidth: '1200px'
          }}
        >
          <DialogHeader>
            <div className="flex items-center gap-3">
              <Calendar className="h-6 w-6" />
              <div>
                <DialogTitle>Visit Details</DialogTitle>
                <DialogDescription>
                  Complete information about this visit
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedVisit && (
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-2">
              {/* Visit Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Visit Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Client</label>
                    <p className="text-lg font-semibold">{selectedVisit.client}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Staff</label>
                    <p className="text-lg font-semibold">{(selectedVisit as any).staffName || 'Unknown'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Date & Time</label>
                    <p className="text-lg font-semibold">
                      <span className="number-change inline-block">{(() => {
                        const [year, month, day] = selectedVisit.scheduleVisit.split('-').map(Number);
                        const date = new Date(year, month - 1, day);
                        return date.toLocaleDateString('id-ID', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        });
                      })()} at {selectedVisit.visitTime} WIB
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <div className="flex items-center gap-2 mt-1">
                      <div className={`w-3 h-3 ${getTaskStatusColor(selectedVisit.status)} rounded-full`}></div>
                      <Badge variant={selectedVisit.statusClient === 'LANJUT' ? 'default' : 'secondary'}>
                        {selectedVisit.statusClient}
                      </Badge>
                    </div>
                  </div>
                  {selectedVisit.salesAmount && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Sales Amount</label>
                      <div className="flex items-center gap-2 mt-1">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="text-lg font-semibold text-green-600">
                          Rp {selectedVisit.salesAmount.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Location</label>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedVisit.location}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact & Photo */}
              <div className="space-y-6">
                {/* Contact Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedVisit.contactPerson && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Contact Person</label>
                        <p className="text-lg font-semibold">{selectedVisit.contactPerson}</p>
                      </div>
                    )}
                    {selectedVisit.contactPhone && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Phone</label>
                        <p className="text-lg font-semibold">{selectedVisit.contactPhone}</p>
                      </div>
                    )}
                    {selectedVisit.notes && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Notes</label>
                        <p className="text-sm">{selectedVisit.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Photo Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Camera className="h-5 w-5" />
                      Visit Photo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedVisit.photoUrl ? (
                      <div className="space-y-4">
                        <div className="overflow-hidden rounded-lg">
                          <img
                            src={selectedVisit.photoUrl}
                            alt="Visit documentation"
                            className="w-full h-64 object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "/images/visit.jpeg";
                            }}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button className="flex-1" onClick={handleViewPhoto}>
                            <Camera className="h-4 w-4 mr-2" />
                            View Photo
                          </Button>
                          <Button variant="outline" onClick={handleDownloadPhoto}>
                            Download
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed rounded-lg p-8 text-center">
                        <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">No photo uploaded yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Photo View Modal */}
      <Dialog open={showPhotoModal} onOpenChange={setShowPhotoModal}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Visit Photo</DialogTitle>
            <DialogDescription>
              View full-size photo from the visit
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4">
            {selectedVisit?.photoUrl ? (
              <>
                <div className="w-full max-w-3xl">
                  <img
                    src={selectedVisit.photoUrl}
                    alt={`Visit photo for ${selectedVisit.client || selectedVisit.clientName || 'unknown'}`}
                    className="w-full h-auto rounded-lg border shadow-lg"
                    onError={(e) => {
                      e.currentTarget.src = "/images/visit.jpeg";
                    }}
                  />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {selectedVisit.client || selectedVisit.clientName || 'unknown'} - {selectedVisit.scheduleVisit || selectedVisit.date || 'unknown'}
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={handleDownloadPhoto}>
                      <Camera className="h-4 w-4 mr-2" />
                      Download Photo
                    </Button>
                    <Button variant="outline" onClick={() => setShowPhotoModal(false)}>
                      Close
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <Camera className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No photo available</p>
                <Button variant="outline" onClick={() => setShowPhotoModal(false)} className="mt-4">
                  Close
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Money Breakdown Modal */}
      <Dialog open={showMoneyBreakdownModal} onOpenChange={setShowMoneyBreakdownModal}>
        <DialogContent
          className="max-h-[90vh] overflow-y-auto p-4 sm:p-6"
          style={{
            width: '95vw',
            maxWidth: '1600px'
          }}
        >
          <DialogHeader className="px-0 sm:px-0 pb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-lg sm:text-xl">Total Money Breakdown</DialogTitle>
                <DialogDescription className="text-xs sm:text-sm">
                  Detailed breakdown of sales amounts by staff member
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 sm:space-y-6">
            {moneyBreakdownData.map((staffData, staffIndex) => (
              <Card key={staffIndex}>
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="flex items-center gap-2 justify-between text-sm sm:text-base">
                    <div className="flex items-center gap-2 min-w-0">
                      <Users className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                      <span className="truncate">{staffData.staffName}</span>
                    </div>
                    <div className="text-sm sm:text-lg font-bold text-green-600">
                      Rp {staffData.visits.reduce((sum, visit) => sum + (visit.salesAmount || 0), 0).toLocaleString('id-ID')}
                    </div>
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    {staffData.visits.length} visit{staffData.visits.length > 1 ? 's' : ''} with sales amounts
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table className="w-full">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-[10px] sm:text-xs font-medium w-8 sm:w-12 text-center px-1 sm:px-2">No</TableHead>
                          <TableHead className="text-[10px] sm:text-xs font-medium min-w-[80px] sm:min-w-[120px] px-1 sm:px-2">Client</TableHead>
                          <TableHead className="text-[10px] sm:text-xs font-medium min-w-[80px] sm:min-w-[100px] px-1 sm:px-2">Date</TableHead>
                          <TableHead className="text-[10px] sm:text-xs font-medium min-w-[70px] sm:min-w-[90px] px-1 sm:px-2">Status</TableHead>
                          <TableHead className="text-[10px] sm:text-xs font-medium text-right min-w-[90px] sm:min-w-[120px] px-1 sm:px-2">Sales</TableHead>
                          <TableHead className="text-[10px] sm:text-xs font-medium min-w-[80px] sm:min-w-[150px] hidden sm:table-cell px-1 sm:px-2">Location</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {staffData.visits.map((visit, visitIndex) => (
                          <TableRow key={visit._id} className="hover:bg-muted/50">
                            <TableCell className="text-[10px] sm:text-xs font-medium text-center w-8 sm:w-12 py-1.5 sm:py-2 px-1 sm:px-2">
                              {visitIndex + 1}
                            </TableCell>
                            <TableCell className="text-[10px] sm:text-xs py-1.5 sm:py-2 px-1 sm:px-2 truncate max-w-[80px] sm:max-w-[120px]" title={visit.client}>
                              {visit.client}
                            </TableCell>
                            <TableCell className="text-[10px] sm:text-xs py-1.5 sm:py-2 px-1 sm:px-2">
                              {(() => {
                                const dateStr = visit.scheduleVisit;
                                if (!dateStr) return 'Invalid Date';
                                const [year, month, day] = dateStr.split('-').map(Number);
                                const date = new Date(year, month - 1, day);
                                return isNaN(date.getTime()) ? 'Invalid Date' :
                                  date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
                              })()}
                            </TableCell>
                            <TableCell className="text-[10px] sm:text-xs py-1.5 sm:py-2 px-1 sm:px-2">
                              <Badge
                                variant="outline"
                                className={`text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 whitespace-nowrap ${
                                  visit.statusClient === 'LANJUT' ? 'border-green-500 text-green-700 bg-green-50' :
                                  visit.statusClient === 'LOSS' ? 'border-red-500 text-red-700 bg-red-50' :
                                  visit.statusClient === 'SUSPEND' ? 'border-yellow-500 text-yellow-700 bg-yellow-50' :
                                  visit.statusClient === 'TO_DO' ? 'border-blue-500 text-blue-700 bg-blue-50' :
                                  'border-gray-500 text-gray-700 bg-gray-50'
                                }`}
                              >
                                {visit.statusClient === 'TO_DO' ? 'TO DO' : visit.statusClient}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-[10px] sm:text-xs text-right font-medium py-1.5 sm:py-2 px-1 sm:px-2 text-green-600">
                              Rp {visit.salesAmount?.toLocaleString('id-ID') || 0}
                            </TableCell>
                            <TableCell className="text-[10px] sm:text-xs py-1.5 sm:py-2 px-1 sm:px-2 truncate max-w-[80px] sm:max-w-[150px] hidden sm:table-cell" title={visit.location}>
                              {visit.location || '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                      <TableFooter>
                        <TableRow className="bg-muted/50 font-semibold">
                          <TableCell colSpan={4} className="text-[10px] sm:text-xs text-right py-1.5 sm:py-2 px-1 sm:px-2">
                            Total:
                          </TableCell>
                          <TableCell className="text-[10px] sm:text-xs text-right font-bold text-green-600 py-1.5 sm:py-2 px-1 sm:px-2">
                            Rp {staffData.visits.reduce((sum, visit) => sum + (visit.salesAmount || 0), 0).toLocaleString('id-ID')}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell"></TableCell>
                        </TableRow>
                      </TableFooter>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Grand Total */}
            <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
              <CardContent className="pt-4 sm:pt-6 pb-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-6">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 flex-shrink-0" />
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold text-green-600">Grand Total</h3>
                      <p className="text-[10px] sm:text-sm text-muted-foreground">
                        {moneyBreakdownData.reduce((sum, staff) => sum + staff.visits.length, 0)} total visits
                      </p>
                    </div>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-green-600 text-left sm:text-right">
                    Rp {moneyBreakdownData.reduce((sum, staff) =>
                      sum + staff.visits.reduce((visitSum, visit) => visitSum + (visit.salesAmount || 0), 0), 0
                    ).toLocaleString('id-ID')}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mobile Filter Modal */}
      <Dialog open={showMobileFilterModal} onOpenChange={setShowMobileFilterModal}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter Options
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Staff Filter */}
            <div>
              <label className="text-sm font-medium mb-3 block">Filter by Team Member</label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={selectedStaff === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedStaff("all")}
                  className="col-span-2"
                >
                  <Users className="h-4 w-4 mr-2" />
                  All Team
                </Button>
                {staffData.map((staff) => (
                  <Button
                    key={staff._id}
                    variant={selectedStaff === staff._id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedStaff(staff._id)}
                    className="flex items-center gap-2"
                  >
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex-shrink-0"></div>
                    <span className="truncate">{staff.name.split(' ')[0]}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Other Filters */}
            <div className="space-y-4">
              {/* Status */}
              <div>
                <label className="text-sm font-medium">Status:</label>
                <Select value={selectedStatus} onValueChange={(v) => setSelectedStatus(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="visited">VISITED</SelectItem>
                    <SelectItem value="task">TO DO</SelectItem>
                    <SelectItem value="lanjut">LANJUT</SelectItem>
                    <SelectItem value="loss">LOSS</SelectItem>
                    <SelectItem value="suspend">SUSPEND</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Chart Type */}
              <div>
                <label className="text-sm font-medium">Chart Type:</label>
                <Select value={selectedChartType} onValueChange={(v) => setSelectedChartType(v)}>
                  <SelectTrigger className="w-full">
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

              {/* From Month */}
              <div>
                <label className="text-sm font-medium">From Month:</label>
                <Select
                  value={dateRange.startMonth.toString()}
                  onValueChange={(v) => handleFromMonthChange(Number(v))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getMonths().map((m) => (
                      <SelectItem key={m.value} value={m.value.toString()}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* To Month */}
              <div>
                <label className="text-sm font-medium">To Month:</label>
                <Select
                  value={dateRange.endMonth.toString()}
                  onValueChange={(v) => handleToMonthChange(Number(v))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getMonths().map((m) => (
                      <SelectItem key={m.value} value={m.value.toString()}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Year */}
              <div>
                <label className="text-sm font-medium">Year:</label>
                <Select value={selectedYear.toString()} onValueChange={(v) => handleYearChange(Number(v))}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getYears().map((y) => (
                      <SelectItem key={y} value={y.toString()}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setSelectedStaff('all');
                setSelectedStatus('all');
                setSelectedChartType('area');
                setSelectedYear(2025);
                setDateRange({ startMonth: 0, startYear: 2025, endMonth: 11, endYear: 2025 });
              }}
            >
              Reset Filters
            </Button>
            <Button
              className="flex-1"
              onClick={() => setShowMobileFilterModal(false)}
            >
              Apply & Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}