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
import { handleLogout } from "@/lib/auth"

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

  return (
    <header className={`sticky top-0 z-50 w-full rounded-xl border border-border shadow-md ${isDarkMode ? 'bg-background' : 'bg-white'}`}>
      <div className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
          <SidebarTrigger className="-ml-1 hover:bg-gray-100 cursor-pointer" />

          <div className="flex items-center gap-3 ml-2 lg:ml-0">
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">Dashboard</h1>
              <p className="text-sm text-muted-foreground/90 font-medium">Business Intelligence Platform</p>
            </div>
          </div>

          <Separator orientation="vertical" className="h-6 hidden sm:block" />

          <div className="ml-auto flex items-center gap-2">
            {/* Mobile Search Toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden hover:bg-gray-100"
              onClick={() => {/* Handle mobile search */}}
            >
              <Search className="h-4 w-4" />
            </Button>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onThemeToggle}
              className="h-9 w-9 p-0 cursor-pointer hover:bg-gray-100"
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
              className="relative h-9 w-9 p-0 cursor-pointer hover:bg-gray-100"
            >
              <Bell className="h-4 w-4" />
              <Badge className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-destructive" />
            </Button>

            {/* User Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-9 w-9 rounded-full overflow-hidden cursor-pointer hover:bg-gray-100"
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
              className="lg:hidden h-9 w-9 p-0 bg-white hover:bg-gray-100"
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
        <div className="lg:hidden fixed inset-x-0 top-16 z-50 bg-white dark:bg-background border-b border-sidebar-border/40">
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
              {(user.role === 'super_admin' || user.role === 'manager') ? (
                <>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => setIsMobileMenuOpen(false)}
                    asChild
                  >
                    <a href="/dashboard-manager">
                      <IconTrendingUp className="mr-2 h-4 w-4" />
                      Dashboard Manager
                    </a>
                  </Button>
                  {user.role === 'super_admin' && (
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => setIsMobileMenuOpen(false)}
                      asChild
                    >
                      <a href="/dashboard-manager/crm-data">
                        <IconUsers className="mr-2 h-4 w-4" />
                        CRM Data
                      </a>
                    </Button>
                  )}
                </>
              ) : (
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => setIsMobileMenuOpen(false)}
                  asChild
                >
                  <a href="/dashboard">
                    <IconActivity className="mr-2 h-4 w-4" />
                    Dashboard
                  </a>
                </Button>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  )
}