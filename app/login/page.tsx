'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, User, Lock, Briefcase, Shield, BarChart3, TrendingUp, Activity, Target, Zap, Globe } from 'lucide-react';
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
        if (user.role === 'manager' || user.role === 'super_admin') {
          router.push('/dashboard-manager');
        } else {
          router.push('/dashboard');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-purple-950/90 to-blue-950">
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>

        {/* Animated Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-tl from-blue-600/10 via-transparent to-purple-600/10 animate-pulse"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-teal-600/5 via-transparent to-indigo-600/5" style={{animation: 'pulse 4s infinite ease-in-out reverse'}}></div>

        {/* Floating Charts Background */}
        {mounted && (
          <>
            {/* Large Area Chart */}
            <div className="absolute top-20 left-20 w-80 h-60 opacity-20 animate-pulse" style={{animationDelay: '2s'}}>
              <svg viewBox="0 0 300 200" className="w-full h-full">
                <defs>
                  <linearGradient id="chart1" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.8"/>
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.1"/>
                  </linearGradient>
                </defs>
                <path d="M0,150 Q50,100 100,120 T200,80 T300,100 L300,200 L0,200 Z" fill="url(#chart1)"/>
                <path d="M0,150 Q50,100 100,120 T200,80 T300,100" stroke="#3B82F6" strokeWidth="2" fill="none"/>
              </svg>
            </div>

            {/* Floating CRM Dashboard */}
            <div className="absolute top-40 right-20 w-80 h-60 opacity-20 animate-pulse" style={{animationDelay: '3s'}}>
              <svg viewBox="0 0 300 200" className="w-full h-full">
                <defs>
                  <linearGradient id="chart2" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.8"/>
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.1"/>
                  </linearGradient>
                  <linearGradient id="chart4" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.6"/>
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.6"/>
                  </linearGradient>
                </defs>
                {/* Main Card */}
                <rect x="20" y="20" width="260" height="160" rx="12" fill="url(#chart4)"/>
                {/* Bar Chart Inside */}
                <rect x="40" y="100" width="20" height="40" fill="rgba(16,185,129,0.7)"/>
                <rect x="70" y="80" width="20" height="60" fill="rgba(59,130,246,0.7)"/>
                <rect x="100" y="90" width="20" height="50" fill="rgba(139,92,246,0.7)"/>
                <rect x="130" y="70" width="20" height="70" fill="rgba(245,158,11,0.7)"/>
                <rect x="160" y="85" width="20" height="55" fill="rgba(239,68,68,0.7)"/>
                {/* Line Graph */}
                <path d="M40,70 Q70,50 100,60 T160,40 T220,50" stroke="#10B981" strokeWidth="3" fill="none"/>
                {/* Circles */}
                <circle cx="230" cy="50" r="15" fill="rgba(16,185,129,0.6)"/>
                <circle cx="230" cy="50" r="8" fill="rgba(255,255,255,0.7)"/>
              </svg>
            </div>

            {/* Pie Chart */}
            <div className="absolute bottom-20 left-40 w-80 h-60 opacity-20 animate-pulse" style={{animationDelay: '1s'}}>
              <svg viewBox="0 0 300 200" className="w-full h-full">
                <defs>
                  <linearGradient id="chart3" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.8"/>
                    <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.1"/>
                  </linearGradient>
                </defs>
                <circle cx="150" cy="100" r="60" fill="url(#chart3)"/>
                <path d="M150,40 L200,100 L150,160 L100,100 Z" fill="rgba(255,255,255,0.3)"/>
                <circle cx="150" cy="100" r="30" fill="rgba(255,255,255,0.5)"/>
              </svg>
            </div>

            {/* Additional Floating Elements */}
            <div className="absolute bottom-40 right-40 w-40 h-40 opacity-15 animate-bounce" style={{animationDelay: '2.5s'}}>
              <svg viewBox="0 0 160 160" className="w-full h-full">
                <defs>
                  <radialGradient id="radial" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.8"/>
                    <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.2"/>
                  </radialGradient>
                </defs>
                <circle cx="80" cy="80" r="60" fill="url(#radial)"/>
                <rect x="40" y="40" width="80" height="80" fill="none" stroke="#10B981" strokeWidth="2" strokeDasharray="10,5"/>
              </svg>
            </div>
          </>
        )}

        {/* Animated Particles */}
        <div className="absolute inset-0">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/30 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 4}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-6xl">
          <div className="bg-gray-900/90 backdrop-blur-xl border border-gray-800 rounded-3xl shadow-2xl overflow-hidden">
            <div className="lg:flex">
              {/* Left Panel - Futuristic Info */}
              <div className="lg:w-1/2 bg-gradient-to-br from-blue-900/40 via-purple-900/40 to-teal-900/40 p-8 lg:p-12 text-white relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.05)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.05)_50%,rgba(255,255,255,0.05)_75%,transparent_75%,transparent_100%)] bg-[size:20px_20px]"></div>

                {/* Animated Background Elements */}
                <div className="absolute inset-0">
                  {/* Floating CRM Dashboard Mockup */}
                  <div className="absolute top-8 right-8 w-32 h-20 opacity-30">
                    <svg viewBox="0 0 128 80" className="w-full h-full">
                      <defs>
                        <linearGradient id="dashboard" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.8"/>
                          <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.6"/>
                        </linearGradient>
                      </defs>
                      {/* Dashboard Card */}
                      <rect x="5" y="5" width="118" height="70" rx="8" fill="url(#dashboard)"/>
                      {/* Mini Chart */}
                      <path d="M15,40 Q30,30 45,35 T75,25 T105,30 L105,55 L15,55 Z" fill="rgba(255,255,255,0.3)"/>
                      {/* Stats Lines */}
                      <rect x="15" y="10" width="30" height="2" fill="rgba(255,255,255,0.5)"/>
                      <rect x="15" y="15" width="50" height="1" fill="rgba(255,255,255,0.3)"/>
                      {/* Circle Stats */}
                      <circle cx="95" cy="20" r="8" fill="rgba(16,185,129,0.5)"/>
                      <circle cx="95" cy="20" r="5" fill="rgba(255,255,255,0.5)"/>
                    </svg>
                  </div>

                  {/* Floating Analytics Elements */}
                  <div className="absolute bottom-16 left-8 w-24 h-24 opacity-20">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <defs>
                        <linearGradient id="analytics" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#10B981" stopOpacity="0.8"/>
                          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.6"/>
                        </linearGradient>
                      </defs>
                      {/* Pie Chart */}
                      <circle cx="50" cy="50" r="25" fill="url(#analytics)"/>
                      <path d="M50,25 L75,50 L50,75 Z" fill="rgba(255,255,255,0.3)"/>
                      <circle cx="50" cy="50" r="10" fill="rgba(255,255,255,0.5)"/>
                    </svg>
                  </div>

                  {/* Floating Bar Chart */}
                  <div className="absolute top-32 left-12 w-20 h-16 opacity-20">
                    <svg viewBox="0 0 80 64" className="w-full h-full">
                      <rect x="10" y="30" width="12" height="24" fill="rgba(139,92,246,0.6)"/>
                      <rect x="28" y="20" width="12" height="34" fill="rgba(59,130,246,0.6)"/>
                      <rect x="46" y="35" width="12" height="19" fill="rgba(16,185,129,0.6)"/>
                      <rect x="64" y="25" width="12" height="29" fill="rgba(245,158,11,0.6)"/>
                    </svg>
                  </div>

                  {/* Floating Line Graph */}
                  <div className="absolute bottom-8 right-16 w-28 h-12 opacity-20">
                    <svg viewBox="0 0 112 48" className="w-full h-full">
                      <defs>
                        <linearGradient id="linechart" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#10B981" stopOpacity="0.8"/>
                          <stop offset="100%" stopColor="#10B981" stopOpacity="0.1"/>
                        </linearGradient>
                      </defs>
                      <path d="M0,40 Q28,20 56,25 T112,15 L112,48 L0,48 Z" fill="url(#linechart)"/>
                      <path d="M0,40 Q28,20 56,25 T112,15" stroke="#10B981" strokeWidth="2" fill="none"/>
                    </svg>
                  </div>

                  {/* Animated Data Points */}
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-2 h-2 bg-blue-400/30 rounded-full"
                      style={{
                        left: `${15 + (i * 12)}%`,
                        top: `${20 + Math.sin(i * 0.8) * 30}%`,
                        animation: `pulse ${3 + i * 0.5}s infinite ease-in-out`
                      }}
                    />
                  ))}

                  {/* Floating CRM Icons */}
                  <div className="absolute top-48 right-24 w-8 h-8 opacity-30 animate-bounce" style={{animationDelay: '1s'}}>
                    <Target className="w-full h-full text-blue-400" />
                  </div>
                  <div className="absolute bottom-32 right-32 w-6 h-6 opacity-30 animate-bounce" style={{animationDelay: '2s'}}>
                    <TrendingUp className="w-full h-full text-green-400" />
                  </div>
                  <div className="absolute top-64 left-20 w-7 h-7 opacity-30 animate-bounce" style={{animationDelay: '3s'}}>
                    <Activity className="w-full h-full text-purple-400" />
                  </div>
                </div>

                <div className="relative z-10">
                  {/* Logo Section */}
                  <div className="mb-12">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-600 to-teal-500 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/25 relative overflow-hidden">
                        {/* Animated Glow Effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent animate-pulse"></div>
                        <Globe className="w-8 h-8 text-white relative z-10" />
                      </div>
                      <div>
                        <h1 className="text-4xl lg:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-teal-400 relative">
                          CRM Tools
                          {/* Glowing Underline */}
                          <div className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-purple-400 to-teal-400 rounded-full animate-pulse"></div>
                        </h1>
                        <p className="text-gray-300 text-base lg:text-lg font-medium mt-2">Advanced Analytics Dashboard</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-xs text-green-400">Real-time Processing</span>
                        </div>
                      </div>
                    </div>

                    {/* Decorative Elements */}
                    <div className="flex gap-4 ml-20">
                      <div className="w-2 h-2 bg-blue-400/50 rounded-full"></div>
                      <div className="w-2 h-2 bg-purple-400/50 rounded-full"></div>
                      <div className="w-2 h-2 bg-teal-400/50 rounded-full"></div>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-4 mb-8">
                    <div className="bg-white/5 backdrop-blur rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all duration-300">
                      <h3 className="font-semibold mb-2 flex items-center text-blue-400">
                        <BarChart3 className="mr-2" size={20} />
                        Real-time Analytics
                      </h3>
                      <p className="text-sm text-gray-400">Track performance with interactive charts and live data visualization</p>
                    </div>

                    <div className="bg-white/5 backdrop-blur rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all duration-300">
                      <h3 className="font-semibold mb-2 flex items-center text-green-400">
                        <Target className="mr-2" size={20} />
                        Smart Target Management
                      </h3>
                      <p className="text-sm text-gray-400">AI-powered goal setting and progress tracking for maximum efficiency</p>
                    </div>

                    <div className="bg-white/5 backdrop-blur rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all duration-300">
                      <h3 className="font-semibold mb-2 flex items-center text-purple-400">
                        <Activity className="mr-2" size={20} />
                        Activity Monitoring
                      </h3>
                      <p className="text-sm text-gray-400">Comprehensive calendar view with 30-day advance planning</p>
                    </div>

                    <div className="bg-white/5 backdrop-blur rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all duration-300">
                      <h3 className="font-semibold mb-2 flex items-center text-teal-400">
                        <Zap className="mr-2" size={20} />
                        Lightning Fast
                      </h3>
                      <p className="text-sm text-gray-400">Optimized performance with real-time data synchronization</p>
                    </div>
                  </div>

                  {/* Security Badge */}
                  <div className="bg-gradient-to-r from-green-500/20 to-teal-500/20 rounded-xl p-4 border border-green-500/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Shield className="mr-2 text-green-400" size={18} />
                        <span className="text-sm font-medium">Enterprise Security</span>
                      </div>
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Panel - Login Form */}
              <div className="lg:w-1/2 p-8 lg:p-12">
                <div className="max-w-md mx-auto">
                  <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2">Welcome Back</h2>
                  <p className="text-gray-400 mb-8">Access your advanced analytics dashboard</p>

                  {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 size-5" />
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          className="pl-10 w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all text-white placeholder:text-gray-500 backdrop-blur"
                          placeholder="email@company.com"
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 size-5" />
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          value={formData.password}
                          onChange={(e) => setFormData({...formData, password: e.target.value})}
                          className="pl-10 pr-10 w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all text-white placeholder:text-gray-500 backdrop-blur"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition"
                        >
                          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Authenticating...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center">
                          <TrendingUp className="mr-2" size={20} />
                          Launch Dashboard
                        </span>
                      )}
                    </button>
                  </form>

                  {/* Demo Account Info */}
                  <div className="mt-8 p-4 bg-gray-800/50 rounded-xl border border-gray-700 backdrop-blur">
                    <p className="text-sm font-medium text-gray-300 mb-3 flex items-center">
                      <span className="text-lg mr-2">🚀</span>
                      Demo Accounts
                    </p>
                    <div className="space-y-2 text-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <span className="text-blue-400">Super Admin:</span>
                        <span className="font-mono text-gray-400">admin@tsicertification.co.id</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <span className="text-purple-400">Manager (Diara):</span>
                        <span className="font-mono text-gray-400">diara@tsicertification.co.id</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <span className="text-green-400">Staff (Mercy):</span>
                        <span className="font-mono text-gray-400">mercy@tsicertification.co.id</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <span className="text-teal-400">Staff (Dhea):</span>
                        <span className="font-mono text-gray-400">dhea@tsicertification.co.id</span>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-700">
                      <p className="text-xs text-gray-500">
                        🔐 Default password: <span className="text-gray-300 font-mono">password</span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 text-center">
                    <p className="text-xs text-gray-500">
                      System auto-detects your role level upon login
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}