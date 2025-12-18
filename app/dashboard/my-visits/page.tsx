'use client';

import React, { useState } from 'react';
import { Plus, Search, Filter, MapPin, Calendar, Clock, CheckCircle, AlertCircle, Edit, Trash2, Eye } from 'lucide-react';

interface VisitTask {
  id: string;
  clientName: string;
  date: string;
  time: string;
  location: string;
  status: 'completed' | 'pending' | 'in_progress' | 'overdue';
  notes?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
}

const mockVisitTasks: VisitTask[] = [
  {
    id: '1',
    clientName: 'PT. Digital Indonesia',
    date: '2025-12-01',
    time: '09:00',
    location: 'Jl. Sudirman No. 123, Jakarta Pusat',
    status: 'completed',
    notes: 'Kick off meeting Q4 2025',
    contactPerson: 'Ricky Halim',
    phone: '0812-1111-2222',
    email: 'ricky@digitalindonesia.com'
  },
  {
    id: '2',
    clientName: 'CV. Teknologi Maju',
    date: '2025-12-02',
    time: '13:30',
    location: 'Jl. Gatot Subroto No. 456, Jakarta Selatan',
    status: 'completed',
    notes: 'Diskusi implementasi sistem',
    contactPerson: 'Andi Wijaya',
    phone: '0813-3333-4444',
    email: 'andi@teknologimaju.com'
  },
  {
    id: '3',
    clientName: 'PT. Global Solution',
    date: '2025-12-03',
    time: '10:00',
    location: 'Jl. MH Thamrin No. 789, Jakarta Utara',
    status: 'completed',
    notes: 'Presentasi solusi enterprise',
    contactPerson: 'Michael Chen',
    phone: '0814-5555-6666',
    email: 'michael@globalsolution.com'
  },
  {
    id: '4',
    clientName: 'CV. Sukses Abadi',
    date: '2025-12-04',
    time: '14:30',
    location: 'Ruko Golden Boulevard, Tangerang',
    status: 'pending',
    notes: 'Meeting perkenalan produk',
    contactPerson: 'Lisa Permatasari',
    phone: '0815-7777-8888',
    email: 'lisa@suksesabadi.com'
  },
  {
    id: '5',
    clientName: 'PT. Fortune Nusantara',
    date: '2025-12-05',
    time: '11:00',
    location: 'Jl. Thamrin No. 1, Jakarta Pusat',
    status: 'completed',
    notes: 'Negosiasi kontrak tahunan',
    contactPerson: 'David Kusuma',
    phone: '0816-9999-0000',
    email: 'david@fortunenusantara.com'
  },
  {
    id: '6',
    clientName: 'CV. Cahaya Baru',
    date: '2025-12-08',
    time: '09:30',
    location: 'Kawasan Industri Bekasi',
    status: 'completed',
    notes: 'Deal berhasil - Paket Premium',
    contactPerson: 'Siti Rahayu',
    phone: '0817-1111-2222',
    email: 'siti@cahayabaru.com'
  },
  {
    id: '7',
    clientName: 'PT. Mitra Sejahtera',
    date: '2025-12-10',
    time: '15:00',
    location: 'Jl. Pajajaran No. 23, Bogor',
    status: 'completed',
    notes: 'Finalisasi kerjasama',
    contactPerson: 'Budi Santoso',
    phone: '0818-3333-4444',
    email: 'budi@mitrasejahtera.com'
  },
  {
    id: '8',
    clientName: 'CV. Karya Mandiri',
    date: '2025-12-11',
    time: '13:00',
    location: 'BSD City, Tangerang Selatan',
    status: 'pending',
    notes: 'Survey lokasi proyek',
    contactPerson: 'Eko Prasetyo',
    phone: '0819-5555-6666',
    email: 'eko@karyamandiri.com'
  },
  {
    id: '9',
    clientName: 'PT. Investama Global',
    date: '2025-12-12',
    time: '10:30',
    location: 'Jl. Kemang Raya No. 45, Jakarta Selatan',
    status: 'completed',
    notes: 'Presentasi portfolio',
    contactPerson: 'Ahmad Fauzi',
    phone: '0820-7777-8888',
    email: 'ahmad@investamaglobal.com'
  },
  {
    id: '10',
    clientName: 'CV. Berkah Jaya',
    date: '2025-12-15',
    time: '14:00',
    location: 'Jl. Margonda Raya No. 88, Depok',
    status: 'completed',
    notes: 'Renewal kontrak tahunan',
    contactPerson: 'Rina Wijaya',
    phone: '0821-9999-0000',
    email: 'rina@berkahjaya.com'
  },
  {
    id: '11',
    clientName: 'PT. Harapan Mulia',
    date: '2025-12-16',
    time: '11:30',
    location: 'Jl. Sudirman No. 234, Jakarta Pusat',
    status: 'completed',
    notes: 'Review kinerja Q3',
    contactPerson: 'Doni Hermawan',
    phone: '0822-1111-2222',
    email: 'doni@harapanmulia.com'
  },
  {
    id: '12',
    clientName: 'CV. Sentosa Abadi',
    date: '2025-12-17',
    time: '09:00',
    location: 'Jl. Gatot Subroto No. 567, Jakarta Selatan',
    status: 'in_progress',
    notes: 'Meeting dengan direksi - Sedang berlangsung',
    contactPerson: 'Faisal Rahman',
    phone: '0823-3333-4444',
    email: 'faisal@sentosaabadi.com'
  },
  {
    id: '13',
    clientName: 'PT. Nusantara Makmur',
    date: '2025-12-18',
    time: '13:30',
    location: 'Jl. MH Thamrin No. 890, Jakarta Utara',
    status: 'pending',
    notes: 'Diskusi rencana 2026',
    contactPerson: 'Yudi Pratama',
    phone: '0824-5555-6666',
    email: 'yudi@nusantaramakmur.com'
  },
  {
    id: '14',
    clientName: 'CV. Jaya Perkasa',
    date: '2025-12-19',
    time: '10:00',
    location: 'Ruko Bekasi Square, Bekasi',
    status: 'pending',
    notes: 'Presentasi produk baru',
    contactPerson: 'Indah Permata',
    phone: '0825-7777-8888',
    email: 'indah@jayaperkasa.com'
  },
  {
    id: '15',
    clientName: 'PT. Central Vision',
    date: '2025-12-22',
    time: '14:30',
    location: 'Jl. Pajajaran No. 345, Bogor',
    status: 'pending',
    notes: 'Meeting stakeholder',
    contactPerson: 'Rizki Ahmad',
    phone: '0826-9999-0000',
    email: 'rizki@centralvision.com'
  },
  {
    id: '16',
    clientName: 'CV. Mega Sukses',
    date: '2025-12-23',
    time: '11:00',
    location: 'BSD City, Tangerang Selatan',
    status: 'pending',
    notes: 'Survey implementasi',
    contactPerson: 'Maya Sari',
    phone: '0827-1111-2222',
    email: 'maya@megasukses.com'
  },
  {
    id: '17',
    clientName: 'PT. Elite Group',
    date: '2025-12-24',
    time: '09:30',
    location: 'Jl. Sudirman No. 456, Jakarta Pusat',
    status: 'pending',
    notes: 'Final review tahunan',
    contactPerson: 'Kevin Wijaya',
    phone: '0828-3333-4444',
    email: 'kevin@elitegroup.com'
  },
  {
    id: '18',
    clientName: 'CV. Prima Jaya',
    date: '2025-12-26',
    time: '15:00',
    location: 'Jl. Gatot Subroto No. 678, Jakarta Selatan',
    status: 'pending',
    notes: 'Planning Q1 2026',
    contactPerson: 'Andi Kusuma',
    phone: '0829-5555-6666',
    email: 'andi@primajaya.com'
  },
  {
    id: '19',
    clientName: 'PT. Golden Bridge',
    date: '2025-12-29',
    time: '10:30',
    location: 'Jl. MH Thamrin No. 123, Jakarta Utara',
    status: 'pending',
    notes: 'Negosiasi kontrak baru',
    contactPerson: 'Hendra Kusuma',
    phone: '0830-7777-8888',
    email: 'hendra@goldenbridge.com'
  },
  {
    id: '20',
    clientName: 'CV. Berkah Mandiri',
    date: '2025-12-30',
    time: '13:00',
    location: 'Jl. Margonda Raya No. 234, Depok',
    status: 'pending',
    notes: 'Planning 2026',
    contactPerson: 'Siti Nurhaliza',
    phone: '0831-9999-0000',
    email: 'siti@berkahmandiri.com'
  },
  {
    id: '5',
    clientName: 'CV. Karya Utama',
    date: '2025-01-20',
    time: '15:30',
    location: 'Jl. Margonda Raya No. 321, Depok',
    status: 'pending',
    notes: 'Survey kebutuhan produk',
    contactPerson: 'Dewi Lestari',
    phone: '0816-7890-1234',
    email: 'dewi@karya.utama.com'
  }
];

export default function MyVisitsPage() {
  const [tasks, setTasks] = useState<VisitTask[]>(mockVisitTasks);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<VisitTask | null>(null);

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    return matchesSearch && matchesStatus;
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
      case 'in_progress': return 'Sedang Berlangsung';
      case 'pending': return 'Menunggu';
      case 'overdue': return 'Terlambat';
      default: return status;
    }
  };

  const handleViewDetail = (task: VisitTask) => {
    setSelectedTask(task);
    setShowDetailModal(true);
  };

  const handleStatusChange = (taskId: string, newStatus: VisitTask['status']) => {
    setTasks(tasks.map(task =>
      task.id === taskId ? { ...task, status: newStatus } : task
    ));
  };

  const handleDeleteTask = (taskId: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus kunjungan ini?')) {
      setTasks(tasks.filter(task => task.id !== taskId));
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kunjungan Saya</h1>
            <p className="text-gray-600 mt-1">Kelola jadwal kunjungan klien Anda</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={20} className="mr-2" />
            Tambah Kunjungan
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm font-medium text-gray-600">Total Kunjungan</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{tasks.length}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm font-medium text-gray-600">Selesai</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {tasks.filter(t => t.status === 'completed').length}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm font-medium text-gray-600">Berlangsung</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {tasks.filter(t => t.status === 'in_progress').length}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm font-medium text-gray-600">Menunggu</p>
            <p className="text-2xl font-bold text-yellow-600 mt-1">
              {tasks.filter(t => t.status === 'pending').length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Cari klien atau lokasi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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

        {/* Tasks Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
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
                {filteredTasks.length > 0 ? (
                  filteredTasks.map((task) => (
                    <tr key={task.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{task.clientName}</div>
                          <div className="text-sm text-gray-500">{task.contactPerson}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(task.date).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </div>
                        <div className="text-sm text-gray-500">{task.time} WIB</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 flex items-start">
                          <MapPin size={14} className="mr-1 mt-0.5 text-gray-400 flex-shrink-0" />
                          {task.location}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                          {getStatusIcon(task.status)}
                          <span className="ml-1">{getStatusText(task.status)}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleViewDetail(task)}
                            className="p-1 text-gray-400 hover:text-blue-600 transition"
                            title="Lihat Detail"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            className="p-1 text-gray-400 hover:text-gray-600 transition"
                            title="Edit"
                          >
                            <Edit size={18} />
                          </button>
                          {task.status !== 'completed' && (
                            <select
                              value={task.status}
                              onChange={(e) => handleStatusChange(task.id, e.target.value as VisitTask['status'])}
                              className="text-xs border border-gray-300 rounded px-2 py-1"
                            >
                              <option value="pending">Menunggu</option>
                              <option value="in_progress">Berlangsung</option>
                              <option value="completed">Selesai</option>
                            </select>
                          )}
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-1 text-gray-400 hover:text-red-600 transition"
                            title="Hapus"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      <Calendar size={48} className="mx-auto mb-3 text-gray-300" />
                      <p>Belum ada kunjungan terjadwal</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Detail Kunjungan</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Nama Klien</label>
                <p className="text-gray-900">{selectedTask.clientName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Contact Person</label>
                <p className="text-gray-900">{selectedTask.contactPerson}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Tanggal & Waktu</label>
                <p className="text-gray-900">
                  {new Date(selectedTask.date).toLocaleDateString('id-ID', {
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
              <div>
                <label className="text-sm font-medium text-gray-600">Status</label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(selectedTask.status)}`}>
                  {getStatusIcon(selectedTask.status)}
                  <span className="ml-1">{getStatusText(selectedTask.status)}</span>
                </span>
              </div>
              {selectedTask.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Catatan</label>
                  <p className="text-gray-900">{selectedTask.notes}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                {selectedTask.phone && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Telepon</label>
                    <p className="text-gray-900">{selectedTask.phone}</p>
                  </div>
                )}
                {selectedTask.email && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <p className="text-gray-900">{selectedTask.email}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}