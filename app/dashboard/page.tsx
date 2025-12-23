"use client";

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { Calendar, ChevronLeft, ChevronRight, MapPin, Users, CheckCircle, Clock, AlertCircle, TrendingUp, Target, Search, Camera, X, User, Filter, ArrowLeft, ArrowRight, LogOut, Shield } from 'lucide-react';
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

export default function Dashboard() {
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
    { value: 0, label: 'Januari' },
    { value: 1, label: 'Februari' },
    { value: 2, label: 'Maret' },
    { value: 3, label: 'April' },
    { value: 4, label: 'Mei' },
    { value: 5, label: 'Juni' },
    { value: 6, label: 'Juli' },
    { value: 7, label: 'Agustus' },
    { value: 8, label: 'September' },
    { value: 9, label: 'Oktober' },
    { value: 10, label: 'November' },
    { value: 11, label: 'Desember' }
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
      {/* Header with User Info */}
      <div className="border-b bg-background sticky top-0 z-50">
        <div className="px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                {user.role === 'super_admin' ? (
                  <Shield className="h-5 w-5 text-white" />
                ) : user.role === 'manager' ? (
                  <Users className="h-5 w-5 text-white" />
                ) : (
                  <User className="h-5 w-5 text-white" />
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold">CRM Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                  Welcome, <span className="font-semibold">{user.name}</span>
                  <span className="ml-2 px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {user.role === 'super_admin' ? 'Super Admin' :
                     user.role === 'manager' ? 'Manager' : 'Staff'}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {user.role === 'staff' && (
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">Staff Access:</span> Personal Data Only
                </div>
              )}
              {user.role === 'manager' && (
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">Manager Access:</span> View All Teams
                </div>
              )}
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6 py-8">

  
        {/* Shadcn UI Filter Section */}
        {true && (
          <div className="px-4 lg:px-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  {user.role === "staff"
                    ? "Your Performance Filters"
                    : "Team Filters"}
                </CardTitle>
              </CardHeader>

              <CardContent>
                {/* FILTER CONTROLS (ALL USERS) */}
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    {/* Status */}
                    <div className="flex items-center gap-1">
                      <label className="text-sm font-medium">Status:</label>
                      <Select
                        value={selectedStatus}
                        onValueChange={(v) => setSelectedStatus(v)}
                      >
                        <SelectTrigger className="w-28">
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
                    <div className="flex items-center gap-1">
                      <label className="text-sm font-medium">Chart:</label>
                      <Select
                        value={selectedChartType}
                        onValueChange={(v) => setSelectedChartType(v)}
                      >
                        <SelectTrigger className="w-28">
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

                    {/* DATE RANGE */}
                    <div className="flex items-center gap-2 ml-auto">
                      <div className="flex items-center gap-1">
                        <label className="text-sm font-medium">From:</label>
                        <Select
                          value={dateRange.startMonth.toString()}
                          onValueChange={(v) =>
                            handleFromMonthChange(Number(v))
                          }
                        >
                          <SelectTrigger className="w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {getMonths().map((m) => (
                              <SelectItem
                                key={m.value}
                                value={m.value.toString()}
                              >
                                {m.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center gap-1">
                        <label className="text-sm font-medium">To:</label>
                        <Select
                          value={dateRange.endMonth.toString()}
                          onValueChange={(v) =>
                            handleToMonthChange(Number(v))
                          }
                        >
                          <SelectTrigger className="w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {getMonths().map((m) => (
                              <SelectItem
                                key={m.value}
                                value={m.value.toString()}
                              >
                                {m.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center gap-1">
                        <label className="text-sm font-medium">Year:</label>
                        <Select
                          value={selectedYear.toString()}
                          onValueChange={(v) =>
                            handleYearChange(Number(v))
                          }
                        >
                          <SelectTrigger className="w-24">
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
                </div>

                {/* ADMIN / MANAGER FILTER */}
                {(user.role === "super_admin" ||
                  user.role === "manager") && (
                  <div className="mb-6">
                    <label className="text-sm font-medium mb-4 block">
                      Filter by Team Member
                    </label>

                    <div className="flex items-center gap-3 flex-wrap">
                      <Button
                        variant={
                          selectedStaff === "all"
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() => setSelectedStaff("all")}
                        className="flex items-center gap-2"
                      >
                        <Users className="h-4 w-4" />
                        All Team Members
                      </Button>
                      {staffData.map((staff) => (
                        <Button
                          key={staff._id}
                          variant={
                            selectedStaff === staff._id
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          onClick={() => setSelectedStaff(staff._id)}
                          className="flex items-center gap-2"
                        >
                          <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex-shrink-0"></div>
                          {staff.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* CHART */}
        <div className="mt-6 px-4 lg:px-6">
          <ChartAreaInteractive
            selectedStaff={selectedStaff}
            selectedYear={selectedYear}
            selectedStatus={selectedStatus}
            allVisitData={getVisitDataByDate()}
            dateRange={dateRange}
            selectedChartType={selectedChartType}
          />
        </div>

        {/* TEAM MEMBER CARDS */}
        {(user.role === "super_admin" ||
          user.role === "manager") && (
          <div className="mt-6 px-4 lg:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {staffData.map((staff) => {
                const completionRate = getCompletionRate(staff._id);
                const staffPhoto = `https://api.dicebear.com/7.x/avataaars/svg?seed=${staff.name}`;
                const totalVisits = Object.values(getVisitDataByDate())
                  .flat()
                  .filter(task => task.staffId === staff._id).length;

                return (
                  <Card
                    key={staff._id}
                    onClick={() => setSelectedStaff(staff._id)}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedStaff === staff._id
                        ? "ring-2 ring-primary shadow-lg"
                        : ""
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <img
                              src={staffPhoto}
                              onError={(e) =>
                                (e.currentTarget.src = "/images/visit.jpeg")
                              }
                              className="w-12 h-12 rounded-full object-cover border-2 border-background"
                            />
                            {staff.isActive && (
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background"></div>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">
                              {staff.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {staff.email}
                            </p>
                            <p className="text-xs text-blue-600 font-medium">
                              Staff ID: {staff.staffId}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-primary">
                            {completionRate}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {totalVisits}/{staff.targetYearly}
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                            <div
                              className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                              style={{ width: `${completionRate}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Modern CRM Stats Cards */}
        <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 xl:grid-cols-4">
          {/* Target Card - Different for admin vs staff */}
          <Card className="@container/card">
            <CardHeader>
              <CardDescription>TARGET</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {(() => {
                  if (user.role === 'super_admin' || user.role === 'manager') {
                    return staffData.reduce((sum, staff) => sum + staff.targetYearly, 0);
                  } else {
                    const currentStaff = staffData.find(staff => staff._id === getCurrentUserId());
                    return currentStaff?.targetYearly || 0;
                  }
                })()}
              </CardTitle>
              <CardAction>
                <Badge variant="outline" className="text-green-600">
                  <IconTrendingUp className="size-4" />
                  +{(() => Math.floor(Math.random() * 20) + 5)()}%
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium text-green-600">
                Annual target for {user.role === 'staff' ? 'you' : 'team'} <IconTrendingUp className="size-4" />
              </div>
              <div className="text-muted-foreground">
                Total client visits target for {new Date().getFullYear()}
              </div>
            </CardFooter>
          </Card>

          <Card className="@container/card">
            <CardHeader>
              <CardDescription>SUSPEND </CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {suspendVisits}
              </CardTitle>
              <CardAction>
                <Badge variant="outline" className="text-blue-600">
                  <IconTrendingUp className="size-4" />
                  +8.2%
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium text-blue-600">
                Pending follow-up <IconTrendingUp className="size-4" />
              </div>
              <div className="text-muted-foreground">
                Client visits pending completion
              </div>
            </CardFooter>
          </Card>

          <Card className="@container/card">
            <CardHeader>
              <CardDescription>LOSS </CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {lossVisits}
              </CardTitle>
              <CardAction>
                <Badge variant="outline" className="text-orange-600">
                  <IconTrendingDown className="size-4" />
                  -2.1%
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium text-orange-600">
                Lost opportunities <IconTrendingDown className="size-4" />
              </div>
              <div className="text-muted-foreground">
                Client visits that resulted in loss
              </div>
            </CardFooter>
          </Card>

          <Card className="@container/card">
            <CardHeader>
              <CardDescription>{getStatusLabel().toUpperCase()}</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {selectedStatus === 'all' ? getStatusCount() : getStatusPercentage()}%
              </CardTitle>
              <CardAction>
                <Badge variant="outline" className="text-green-600">
                  <IconTrendingUp className="size-4" />
                  +4.5%
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium text-green-600">
                {selectedStatus === 'all' ? 'Total visits' : `${getStatusLabel()} completion rate`} <IconTrendingUp className="size-4" />
              </div>
              <div className="text-muted-foreground">
                {selectedStatus === 'all'
                  ? `${getStatusCount()} total visits`
                  : `${getStatusCount()} of {(user.role === 'super_admin' || user.role === 'manager') && selectedStaff === 'all'
                      ? staffData.reduce((sum, staff) => sum + staff.targetYearly, 0)
                      : staffData.find(staff => staff.id === (user.role === 'staff' ? getLoggedInStaffId() : selectedStaff))?.targetYearly || 0} target`
                }
              </div>
            </CardFooter>
          </Card>
        </div>

        {/* Shadcn UI Calendar Section - Only show for admin or with controls for staff */}
        <div className="px-4 lg:px-6">
          <Card>
            <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Calendar className="h-6 w-6" />
                <div>
                  <CardTitle>{(user.role === 'super_admin' || user.role === 'manager') ? 'Timeline Analytics' : 'Your Visit Timeline'}</CardTitle>
                  <CardDescription>
                    {getMonthNames()[dateRange.startMonth].slice(0, 3)} {dateRange.startYear} - {getMonthNames()[dateRange.endMonth].slice(0, 3)} {dateRange.endYear}
                  </CardDescription>
                </div>
              </div>
              {user.role === 'super_admin' && (
                <div className="flex items-center space-x-2">
                  <div className="px-3 py-1 border rounded-md">
                    <span className="text-sm font-medium">
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
                      <TableHead className="text-center min-w-[70px] py-1 text-sm font-semibold" style={{ width: `${100/(calendarMonths.length + 4)}%` }}>Total Uang</TableHead>
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
                              <div className="text-[9px] text-muted-foreground leading-none">
                                {staff.completedThisYear}/{staff.targetYearly}
                              </div>
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
                              className={`text-center cursor-pointer hover:bg-muted/50 py-1 px-1 border border-border ${isCurrentMonth ? 'border-blue-400 bg-blue-50/30' : ''}`}
                              style={{ width: `${100/(calendarMonths.length + 4)}%` }}
                              onClick={() => hasTask && handleCellClick(new Date(month.year, month.monthIndex, 1), staff.id)}
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
                            {(() => {
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
                          </div>
                        </TableCell>
                        <TableCell className="text-center py-1 px-1" style={{ width: `${100/(calendarMonths.length + 4)}%` }}>
                          <div className="font-bold text-sm">
                            {(() => {
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
                          </div>
                        </TableCell>
                        <TableCell className="text-center py-1 px-1" style={{ width: `${100/(calendarMonths.length + 4)}%` }}>
                          <div className="font-bold text-xs">
                            {(() => {
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
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {/* Daily Calendar View */}
              {!isMultiMonthView && (
                <Table className="w-full" style={{ width: '100%', tableLayout: 'auto' }}>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px] py-1">
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          Staff
                        </div>
                      </TableHead>
                      {calendarDays.map((date, index) => {
                        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                        const isToday = date.toDateString() === new Date().toDateString();

                        const rangeStart = new Date(dateRange.startYear, dateRange.startMonth, 1);
                        const rangeEnd = new Date(dateRange.endYear, dateRange.endMonth + 1, 0);
                        const isOutsideRange = date < rangeStart || date > rangeEnd;

                        return (
                          <TableHead
                            key={date.toISOString()}
                            className={`text-center py-0.5 px-0.5 min-w-[25px] ${isOutsideRange ? 'opacity-60' : ''} ${isWeekend ? 'bg-red-200/50' : ''}`}
                            style={{ width: `${100/(calendarDays.length + 3)}%` }}
                          >
                            <div className={`font-semibold ${isToday ? 'text-sm text-blue-600' : 'text-sm'}`}>
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
                      <TableHead className="text-center min-w-[50px] py-1 text-sm font-semibold" style={{ width: `${100/(calendarDays.length + 3)}%` }}>Total</TableHead>
                      <TableHead className="text-center min-w-[50px] py-1 text-sm font-semibold" style={{ width: `${100/(calendarDays.length + 3)}%` }}>Lanjut</TableHead>
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
                            <div className="text-[9px] text-muted-foreground leading-none">
                              {Object.values(getVisitDataByDate()).flat().filter(task => task.staffId === staff._id).length}/{staff.targetYearly}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      {calendarDays.map((date, dayIndex) => {
                        const tasks = getTasksForDateAndStaff(date, staff._id);
                        const hasTask = tasks.length > 0;
                        const isToday = date.toDateString() === new Date().toDateString();
                        const isDiagonal = staffIndex === dayIndex;

                        const rangeStart = new Date(dateRange.startYear, dateRange.startMonth, 1);
                        const rangeEnd = new Date(dateRange.endYear, dateRange.endMonth + 1, 0);
                        const isOutsideRange = date < rangeStart || date > rangeEnd;

                        return (
                          <TableCell
                            key={date.toISOString()}
                            className={`text-center cursor-pointer hover:bg-muted/50 py-1 px-1 border border-border ${isOutsideRange ? 'opacity-40' : ''} ${isToday ? 'border-blue-400 bg-blue-50/30' : ''} ${date.getDay() === 0 || date.getDay() === 6 ? 'bg-red-200/50' : ''}`}
                            style={{ width: `${100/(calendarDays.length + 3)}%` }}
                            onClick={() => hasTask && !isOutsideRange && handleCellClick(date, staff.id)}
                          >
                            {hasTask ? (
                              <div className="flex justify-center">
                                {(() => {
                                  const icon = getTaskIcon(tasks[0].status);
                                  if (tasks[0].status === 'task') {
                                    return icon; // Return the animated border circle directly
                                  }
                                  return (
                                    <div className={`w-3.5 h-3.5 ${getTaskStatusColor(tasks[0].status)} rounded-full flex items-center justify-center text-white text-[8px] font-bold`}>
                                      {icon}
                                    </div>
                                  );
                                })()}
                              </div>
                            ) : isDiagonal ? (
                              <div className="w-4 h-4 border-2 border-dashed border-blue-400 rounded-full mx-auto animate-pulse"></div>
                            ) : null}
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-center py-1 px-1" style={{ width: `${100/(calendarDays.length + 3)}%` }}>
                        <div className="font-bold text-sm">
                          {(() => {
                            let totalVisits = 0;
                            calendarDays.forEach(date => {
                              const tasks = getTasksForDateAndStaff(date, staff._id);
                              totalVisits += tasks.length;
                            });
                            return totalVisits;
                          })()}
                        </div>
                      </TableCell>
                      <TableCell className="text-center py-1 px-1" style={{ width: `${100/(calendarDays.length + 3)}%` }}>
                        <div className="flex flex-col items-center">
                          <div className="font-bold text-sm">
                            {(() => {
                              let totalVisits = 0;
                              let completedVisits = 0;
                              calendarDays.forEach(date => {
                                const tasks = getTasksForDateAndStaff(date, staff._id);
                                totalVisits += tasks.length;
                                completedVisits += tasks.filter(t => t.status === 'lanjut').length;
                              });
                              const percentage = totalVisits > 0 ? Math.round((completedVisits / totalVisits) * 100) : 0;
                              return `${percentage}%`;
                            })()}
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                            {(() => {
                              let totalVisits = 0;
                              let completedVisits = 0;
                              calendarDays.forEach(date => {
                                const tasks = getTasksForDateAndStaff(date, staff._id);
                                totalVisits += tasks.length;
                                completedVisits += tasks.filter(t => t.status === 'lanjut').length;
                              });
                              const percentage = totalVisits > 0 ? Math.round((completedVisits / totalVisits) * 100) : 0;
                              return (
                                <div
                                  className="bg-green-500 h-1.5 rounded-full transition-all duration-500"
                                  style={{ width: `${percentage}%` }}
                                />
                              );
                            })()}
                          </div>
                        </div>
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
         <div className="px-4 lg:px-6">
          <div className="">
            <Card>
              <CardHeader className="pb-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Detail Target Visits
                  </CardTitle>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search client or staff..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[425px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background">
                      <TableRow>
                        <TableHead className="text-xs font-medium w-12 text-center">No</TableHead>
                        <TableHead className="text-xs font-medium">PIC CRM</TableHead>
                        <TableHead className="text-xs font-medium">Client</TableHead>
                        <TableHead className="text-xs font-medium">Tgl</TableHead>
                        <TableHead className="text-xs font-medium">Status</TableHead>
                        <TableHead className="text-xs font-medium text-right">Nilai Kontrak</TableHead>
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

                        return (
                          <>
                            {displayVisits.map((visit, index) => (
                          <TableRow key={visit._id} className="hover:bg-muted/50 cursor-pointer">
                            <TableCell className="text-xs font-medium text-center w-12">{index + 1}</TableCell>
                            <TableCell className="text-xs font-medium">{(visit as any).staffName}</TableCell>
                            <TableCell className="text-xs">{visit.client}</TableCell>
                            <TableCell className="text-xs">
                              {(() => {
                                const [year, month, day] = visit.scheduleVisit.split('-').map(Number);
                                const date = new Date(year, month - 1, day);
                                return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
                              })()}
                            </TableCell>
                            <TableCell className="text-xs">
                              <Badge
                                variant="outline"
                                className={`text-xs px-1.5 py-0.5 ${
                                  visit.statusClient === 'LANJUT' ? 'border-green-500 text-green-700 bg-green-50' :
                                  visit.statusClient === 'LOSS' ? 'border-red-500 text-red-700 bg-red-50' :
                                  visit.statusClient === 'SUSPEND' ? 'border-yellow-500 text-yellow-700 bg-yellow-50' :
                                  'border-blue-500 text-blue-700 bg-blue-50'
                                }`}
                              >
                                {visit.statusClient === 'TO_DO' ? 'TO DO' : visit.statusClient}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-right font-medium">
                              {visit.salesAmount
                                ? `Rp ${visit.salesAmount.toLocaleString('id-ID')}`
                                : '-'}
                            </TableCell>
                          </TableRow>
                            ))}
                          </>
                        );
                      })()}
                    </TableBody>
                    <TableFooter>
                      <TableRow className="bg-muted/50 font-semibold">
                        <TableCell colSpan={5} className="text-xs text-right">
                          Total Nilai Kontrak:
                        </TableCell>
                        <TableCell className="text-xs text-right font-bold text-green-600">
                          Rp {(() => {
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

                            recentVisits.sort((a, b) => new Date(b.scheduleVisit || b.date || '').getTime() - new Date(a.scheduleVisit || a.date || '').getTime());
                            const totalContractValue = recentVisits.reduce((sum, visit) => sum + (visit.salesAmount || 0), 0);
                            return totalContractValue.toLocaleString('id-ID');
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
                      {(() => {
                      const [year, month, day] = selectedVisit.scheduleVisit.split('-').map(Number);
                      const date = new Date(year, month - 1, day);
                      return date.toLocaleDateString('id-ID', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      });
                    })()} at {selectedVisit.visitTime} WIB
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
    </>
  );
}