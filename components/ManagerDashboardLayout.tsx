'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { CRMSidebar } from './crm-sidebar';
import { CRMHeader } from './crm-header';
import { SidebarProvider } from '@/components/ui/sidebar';
import { InfinityLoader } from '@/components/ui/infinity-loader';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'manager' | 'staff';
}

interface ManagerDashboardLayoutProps {
  children: React.ReactNode;
}

export default function ManagerDashboardLayout({ children }: ManagerDashboardLayoutProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check user authentication and role
    const checkAuth = () => {
      try {
        const userData = localStorage.getItem('crm_user');
        if (userData) {
          const parsedUser = JSON.parse(userData);

          // Check if user has manager or super_admin role
          if (parsedUser.role === 'manager' || parsedUser.role === 'super_admin') {
            setUser(parsedUser);
          } else {
            // Redirect staff to regular dashboard
            router.push('/dashboard');
          }
        } else {
          // Redirect to login if no user data
          router.push('/login');
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleThemeToggle = () => {
    if (theme === 'dark') {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  };

  // Prevent hydration mismatch
  const isDarkMode = mounted ? theme === 'dark' : false;

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <InfinityLoader size="lg" />
        <p className="mt-6 text-sm font-medium bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Loading Dashboard...
        </p>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className={`flex h-screen w-full overflow-hidden ${isDarkMode ? 'bg-gradient-to-br from-purple-950/50 via-background to-blue-950/50' : 'bg-gradient-to-br from-purple-100/80 via-blue-50/60 to-purple-400/80'}`}>
        <CRMSidebar user={user} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="px-4 lg:px-6 pt-4 flex-shrink-0">
            <CRMHeader
              user={user}
              onThemeToggle={handleThemeToggle}
              isDarkMode={isDarkMode}
            />
          </div>
          <main className="flex-1 overflow-hidden px-4 lg:px-0 pb-4">
            <div className="h-full overflow-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}