'use client';

import React, { useState } from 'react';
import { Plus, Search, Filter, Users, Calendar, MapPin, CheckCircle, Clock, AlertCircle, Eye, TrendingUp } from 'lucide-react';

interface Staff {
  id: string;
  name: string;
  email: string;
  role: string;
  totalVisits: number;
  completedVisits: number;
  pendingVisits: number;
  inProgressVisits: number;
}

interface VisitTask {
  id: string;
  clientName: string;
  date: string;
  time: string;
  location: string;
  status: 'completed' | 'pending' | 'in_progress' | 'overdue';
  staffName: string;
  staffId: string;
  notes?: string;
}

const mockStaff: Staff[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@company.com',
    role: 'Sales Executive',
    totalVisits: 45,
    completedVisits: 38,
    pendingVisits: 5,
    inProgressVisits: 2
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@company.com',
    role: 'Sales Executive',
    totalVisits: 42,
    completedVisits: 35,
    pendingVisits: 4,
    inProgressVisits: 3
  },
  {
    id: '3',
    name: 'Mike Johnson',
    email: 'mike@company.com',
    role: 'Sales Executive',
    totalVisits: 38,
    completedVisits: 30,
    pendingVisits: 6,
    inProgressVisits: 2
  },
  {
    id: '4',
    name: 'Sarah Williams',
    email: 'sarah@company.com',
    role: 'Sales Executive',
    totalVisits: 40,
    completedVisits: 32,
    pendingVisits: 5,
    inProgressVisits: 3
  }
];

const mockAllVisits: VisitTask[] = [
  {
    id: '1',
    clientName: 'PT. Maju Jaya',
    date: '2025-01-17',
    time: '09:00',
    location: 'Jakarta Pusat',
    status: 'completed',
    staffName: 'John Doe',
    staffId: '1',
    notes: 'Closed deal - Produk A'
  },
  {
    id: '2',
    clientName: 'CV. Sukses Mandiri',
    date: '2025-01-17',
    time: '14:00',
    location: 'Jakarta Selatan',
    status: 'completed',
    staffName: 'Jane Smith',
    staffId: '2',
    notes: 'Follow up kontrak'
  },
  {
    id: '3',
    clientName: 'PT. Teknologi Indonesia',
    date: '2025-01-18',
    time: '10:00',
    location: 'Jakarta Utara',
    status: 'in_progress',
    staffName: 'Mike Johnson',
    staffId: '3'
  },
  {
    id: '4',
    clientName: 'PT. Global Trading',
    date: '2025-01-18',
    time: '13:00',
    location: 'Tangerang',
    status: 'pending',
    staffName: 'Sarah Williams',
    staffId: '4'
  },
  {
    id: '5',
    clientName: 'CV. Karya Utama',
    date: '2025-01-19',
    time: '15:00',
    location: 'Depok',
    status: 'pending',
    staffName: 'John Doe',
    staffId: '1'
  }
];

export default function TeamPage() {
  const [view, setView] = useState<'overview' | 'details'>('overview');
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [selectedTask, setSelectedTask] = useState<VisitTask | null>(null);

  const filteredStaff = mockStaff.filter(staff =>
    staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredVisits = mockAllVisits.filter(visit => {
    const matchesStaff = !selectedStaff || visit.staffId === selectedStaff;
    const matchesStatus = statusFilter === 'all' || visit.status === statusFilter;
    return matchesStaff && matchesStatus;
  });

  const getStatusColor = (status: VisitTask['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'overdue': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: VisitTask['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle size={14} />;
      case 'in_progress': return <Clock size={14} />;
      case 'pending': return <Clock size={14} />;
      case 'overdue': return <AlertCircle size={14} />;
      default: return <Clock size={14} />;
    }
  };

  const getStatusText = (status: VisitTask['status']) => {
    switch (status) {
      case 'completed': return 'Selesai';
      case 'in_progress': return 'Berlangsung';
      case 'pending': return 'Menunggu';
      case 'overdue': return 'Terlambat';
      default: return status;
    }
  };

  const getCompletionRate = (completed: number, total: number) => {
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const handleViewTaskDetail = (task: VisitTask) => {
    setSelectedTask(task);
    setShowTaskDetail(true);
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tim & Task Management</h1>
          <p className="text-gray-600 mt-1">Monitoring kunjungan dan performa tim sales</p>
        </div>

        {/* View Toggle */}
        <div className="bg-white rounded-lg border border-gray-200 p-1 inline-flex">
          <button
            onClick={() => setView('overview')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              view === 'overview'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            <Users size={18} className="inline mr-2" />
            Overview Tim
          </button>
          <button
            onClick={() => setView('details')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              view === 'details'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            <Calendar size={18} className="inline mr-2" />
            Detail Kunjungan
          </button>
        </div>

        {view === 'overview' ? (
          /* Team Overview View */
          <>
            {/* Team Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <p className="text-sm font-medium text-gray-600">Total Staff</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{mockStaff.length}</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <p className="text-sm font-medium text-gray-600">Total Kunjungan</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {mockAllVisits.length}
                </p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <p className="text-sm font-medium text-gray-600">Selesai</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {mockAllVisits.filter(v => v.status === 'completed').length}
                </p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  {Math.round(
                    (mockAllVisits.filter(v => v.status === 'completed').length / mockAllVisits.length) * 100
                  )}%
                </p>
              </div>
            </div>

            {/* Search */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Cari staff..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            {/* Team Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStaff.map((staff) => (
                <div key={staff.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{staff.name}</h3>
                      <p className="text-sm text-gray-600">{staff.role}</p>
                      <p className="text-xs text-gray-500">{staff.email}</p>
                    </div>
                    <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">
                        {staff.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Kunjungan</span>
                      <span className="text-sm font-semibold text-gray-900">{staff.totalVisits}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Completion Rate</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${getCompletionRate(staff.completedVisits, staff.totalVisits)}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-900">
                          {getCompletionRate(staff.completedVisits, staff.totalVisits)}%
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-200">
                      <div className="text-center">
                        <p className="text-lg font-semibold text-green-600">{staff.completedVisits}</p>
                        <p className="text-xs text-gray-600">Selesai</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-blue-600">{staff.inProgressVisits}</p>
                        <p className="text-xs text-gray-600">Berjalan</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-yellow-600">{staff.pendingVisits}</p>
                        <p className="text-xs text-gray-600">Menunggu</p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedStaff(staff.id);
                        setView('details');
                      }}
                      className="w-full mt-4 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
                    >
                      Lihat Detail Kunjungan
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* Detailed Visits View */
          <>
            {/* Filters */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <select
                    value={selectedStaff || ''}
                    onChange={(e) => setSelectedStaff(e.target.value || null)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="">Semua Staff</option>
                    {mockStaff.map(staff => (
                      <option key={staff.id} value={staff.id}>{staff.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="all">Semua Status</option>
                    <option value="pending">Menunggu</option>
                    <option value="in_progress">Berlangsung</option>
                    <option value="completed">Selesai</option>
                    <option value="overdue">Terlambat</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Visits Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Staff
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Klien
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tanggal & Waktu
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Lokasi
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredVisits.length > 0 ? (
                      filteredVisits.map((visit) => (
                        <tr key={visit.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                <span className="text-blue-600 text-xs font-semibold">
                                  {visit.staffName.split(' ').map(n => n[0]).join('')}
                                </span>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{visit.staffName}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{visit.clientName}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {new Date(visit.date).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short'
                              })}
                            </div>
                            <div className="text-sm text-gray-500">{visit.time} WIB</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 flex items-start">
                              <MapPin size={14} className="mr-1 mt-0.5 text-gray-400 flex-shrink-0" />
                              {visit.location}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(visit.status)}`}>
                              {getStatusIcon(visit.status)}
                              <span className="ml-1">{getStatusText(visit.status)}</span>
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleViewTaskDetail(visit)}
                              className="p-1 text-gray-400 hover:text-blue-600 transition"
                              title="Lihat Detail"
                            >
                              <Eye size={18} />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                          <Calendar size={48} className="mx-auto mb-3 text-gray-300" />
                          <p>Tidak ada kunjungan yang ditemukan</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Task Detail Modal */}
        {showTaskDetail && selectedTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-lg w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Detail Kunjungan</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Staff</label>
                    <p className="text-gray-900">{selectedTask.staffName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(selectedTask.status)}`}>
                      {getStatusIcon(selectedTask.status)}
                      <span className="ml-1">{getStatusText(selectedTask.status)}</span>
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Klien</label>
                  <p className="text-gray-900">{selectedTask.clientName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Tanggal & Waktu</label>
                  <p className="text-gray-900">
                    {new Date(selectedTask.date).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })} pukul {selectedTask.time} WIB
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Lokasi</label>
                  <p className="text-gray-900">{selectedTask.location}</p>
                </div>
                {selectedTask.notes && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Catatan</label>
                    <p className="text-gray-900">{selectedTask.notes}</p>
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowTaskDetail(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}