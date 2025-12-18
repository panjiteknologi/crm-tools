"use client"

import * as React from "react"
import { Bell, Moon, Sun, Search, Menu, X } from "lucide-react"
import {
  IconSettings,
  IconActivity,
  IconCalendar,
  IconUsers,
  IconTrendingUp,
  IconLogout
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

export interface CRMUser {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'manager' | 'staff';
  avatar?: string;
}

export interface CRMHeaderProps {
  user: CRMUser;
  onThemeToggle?: () => void;
  isDarkMode?: boolean;
}

export function CRMHeader({ user, onThemeToggle, isDarkMode }: CRMHeaderProps) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Administrator'
      case 'manager': return 'Manager'
      case 'staff': return 'Team Member'
      default: return role
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('crm_user');
    window.location.href = '/login';
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-sidebar-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
          <SidebarTrigger className="-ml-1 lg:hidden" />

          <div className="flex items-center gap-3 ml-2 lg:ml-0">
            <div className="hidden sm:block">
              <h1 className="text-lg font-semibold tracking-tight">Dashboard</h1>
              <p className="text-sm text-muted-foreground">Business Intelligence Platform</p>
            </div>
          </div>

          <Separator orientation="vertical" className="h-6 hidden sm:block" />

          {/* Search Bar - Hidden on mobile */}
          <div className="hidden md:flex flex-1 max-w-sm lg:max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search clients, visits..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Mobile Search Toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => {/* Handle mobile search */}}
            >
              <Search className="h-4 w-4" />
            </Button>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onThemeToggle}
              className="h-9 w-9 p-0"
            >
              {isDarkMode ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>

            {/* Notifications */}
            <Button
              variant="ghost"
              size="sm"
              className="relative h-9 w-9 p-0"
            >
              <Bell className="h-4 w-4" />
              <Badge className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-destructive" />
            </Button>

            {/* User Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-9 w-9 rounded-full overflow-hidden"
                >
                  <div className="h-full w-full rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                    <Badge variant="secondary" className="w-fit">
                      {getRoleLabel(user.role)}
                    </Badge>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <IconSettings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Bell className="mr-2 h-4 w-4" />
                  <span>Notifications</span>
                  <Badge className="ml-auto">3</Badge>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <IconLogout className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden h-9 w-9 p-0"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu - Full screen overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-16 z-50 bg-background border-b border-sidebar-border/40">
          <div className="px-4 py-4 space-y-4">
            {/* Mobile Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search clients, visits..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Mobile Navigation */}
            <nav className="space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Activity className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Calendar className="mr-2 h-4 w-4" />
                My Visits
              </Button>
              {(user.role === 'super_admin' || user.role === 'manager') && (
                <>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Team Management
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Analytics
                  </Button>
                </>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  )
}