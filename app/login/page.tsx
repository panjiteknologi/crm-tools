'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, User, Lock, Briefcase, Shield } from 'lucide-react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

interface LoginFormData {
  email: string;
  password: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'manager' | 'staff';
  staffId?: string;
}


export default function LoginPage() {
  const router = useRouter();
  const login = useMutation(api.auth.login);
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const user = await login({
        email: formData.email,
        password: formData.password
      });

      if (user) {
        // Save user data to localStorage (dalam production akan menggunakan secure session)
        localStorage.setItem('crm_user', JSON.stringify(user));

        // Redirect ke dashboard berdasarkan role
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden">
        <div className="md:flex">
          {/* Left Panel - Info */}
          <div className="md:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">CRM Tools</h1>
              <p className="text-blue-100">Dashboard Monitoring Kunjungan Klien</p>
            </div>

            <div className="space-y-4">
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
                <h3 className="font-semibold mb-2 flex items-center">
                  <Briefcase className="mr-2" size={18} />
                  Target Kunjungan
                </h3>
                <p className="text-sm text-blue-100">100 klien per tahun untuk setiap staff</p>
              </div>

              <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
                <h3 className="font-semibold mb-2 flex items-center">
                  <Eye className="mr-2" size={18} />
                  Calendar View
                </h3>
                <p className="text-sm text-blue-100">Monitoring 30 hari ke depan</p>
              </div>

              <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
                <h3 className="font-semibold mb-2 flex items-center">
                  <Shield className="mr-2" size={18} />
                  Multi Role System
                </h3>
                <p className="text-sm text-blue-100">Auto-detect role berdasarkan akun</p>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-white/20">
              <div className="flex items-center justify-center text-sm text-blue-100">
                <Shield className="mr-2" size={16} />
                <span>Secure Authentication</span>
              </div>
            </div>
          </div>

          {/* Right Panel - Login Form */}
          <div className="md:w-1/2 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Login ke Dashboard</h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 size-5" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-900 placeholder:text-gray-500"
                    placeholder="email@perusahaan.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 size-5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="pl-10 pr-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-900 placeholder:text-gray-500"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Memproses...
                  </span>
                ) : (
                  'Login'
                )}
              </button>
            </form>

            {/* Demo Account Info */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-900 mb-2">🔑 Akun Demo:</p>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-blue-700">Super Admin:</span>
                  <span className="font-mono text-blue-800">admin@tsicertification.co.id / password</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-blue-700">Manager (Diara):</span>
                  <span className="font-mono text-blue-800">diara@tsicertification.co.id / password</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-blue-700">Staff (Mercy):</span>
                  <span className="font-mono text-blue-800">mercy@tsicertification.co.id / password</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-blue-700">Staff (Dhea):</span>
                  <span className="font-mono text-blue-800">dhea@tsicertification.co.id / password</span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-blue-200">
                <p className="text-xs text-blue-600">
                  🔒 Passwords are securely hashed with custom hash function
                </p>
              </div>
            </div>

            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                Sistem akan otomatis mendeteksi role Anda setelah login
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}