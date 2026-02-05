"use client"

import * as React from "react"
import Link from "next/link"
import {
  IconUsers,
  IconCalendar,
  IconTarget,
  IconTrendingUp,
  IconSettings,
  IconHelp,
  IconSearch,
  IconActivity,
  IconLogout,
  IconDatabase,
  IconChartBar,
  IconCalendarTime,
  IconKey,
  IconAward,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export interface CRMUser {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'manager' | 'staff';
  avatar?: string;
}

export interface CRMSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: CRMUser;
}

const getNavigationItems = (role: string) => {
  if (role === 'staff') {
    return [
      {
        title: "Dashboard Kunjungan",
        url: "/dashboard-manager/dashboard-kunjungan",
        icon: IconCalendarTime,
      }
    ];
  }

  if (role === 'manager') {
    return [
      {
        title: "Dashboard Pencapaian",
        url: "/dashboard-manager/dashboard-data",
        icon: IconDatabase,
      },
      {
        title: "Dashboard Kunjungan",
        url: "/dashboard-manager/dashboard-kunjungan",
        icon: IconCalendarTime,
      },
      {
        title: "CRM Data Management",
        url: "/dashboard-manager/crm-data",
        icon: IconTarget,
      },
      {
        title: "KPI Tracker",
        url: "/dashboard-manager/kpi",
        icon: IconAward,
      }
    ];
  }

  // Super admin sees all items - Dashboard Manager is the main dashboard
  return [
    // {
    //   title: "Dashboard Manager",
    //   url: "/dashboard-manager",
    //   icon: IconChartBar,
    // },
    {
      title: "Dashboard Pencapaian",
      url: "/dashboard-manager/dashboard-data",
      icon: IconDatabase,
    },
    {
      title: "Dashboard Kunjungan",
      url: "/dashboard-manager/dashboard-kunjungan",
      icon: IconCalendarTime,
    },
    {
      title: "CRM Data Management",
      url: "/dashboard-manager/crm-data",
      icon: IconTarget,
    },
    {
      title: "KPI Tracker",
      url: "/dashboard-manager/kpi",
      icon: IconAward,
    },
    {
      title: "Settings",
      icon: IconSettings,
      items: [
        {
          title: "Users",
          url: "/dashboard-manager/settings/users",
          icon: IconUsers,
        },
        {
          title: "Roles & Permissions",
          url: "/dashboard-manager/settings/permissions",
          icon: IconKey,
        }
      ]
    }
  ];
};

const getSecondaryItems = (role: string) => {
  if (role === 'staff') {
    return [
      {
        title: "Get Help",
        url: "#",
        icon: IconHelp,
      },
      {
        title: "Search",
        url: "#",
        icon: IconSearch,
      },
    ];
  }

  if (role === 'manager') {
    return [
      {
        title: "Get Help",
        url: "#",
        icon: IconHelp,
      },
      {
        title: "Search",
        url: "#",
        icon: IconSearch,
      },
    ];
  }

  // Super admin gets all secondary items
  return [
    {
      title: "Get Help",
      url: "#",
      icon: IconHelp,
    },
    {
      title: "Search",
      url: "#",
      icon: IconSearch,
    },
  ];
};

export function CRMSidebar({ user, ...props }: CRMSidebarProps) {
  const navItems = getNavigationItems(user.role);
  const secondaryItems = getSecondaryItems(user.role);

  return (
    <Sidebar
      {...props}
      collapsible="icon"
      variant="sidebar"
      className="relative overflow-hidden"
    >
      {/* Gradient overlay for futuristic effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-700/10 via-blue-600/10 to-purple-900/5 pointer-events-none" />

      <SidebarHeader className="relative border-b border-sidebar-border/50 bg-gradient-to-r from-purple-600/10 via-blue-600/10 to-purple-600/10 backdrop-blur-sm">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
            >
              <Link href={
                user.role === 'staff'
                  ? '/dashboard-manager/dashboard-kunjungan'
                  : user.role === 'manager'
                  ? '/dashboard-manager/dashboard-data'
                  : '/dashboard-manager/dashboard-data'
              } className="flex items-center gap-3 group">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-shadow duration-300 flex-shrink-0">
                  <IconActivity className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">CRM Tools</span>
                  <span className="text-xs text-muted-foreground">Management System</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="relative gap-4 py-6">
        <NavMain items={navItems} />
        <NavSecondary items={secondaryItems} className="mt-auto" />
      </SidebarContent>

      <SidebarFooter className="relative border-t border-sidebar-border/50 bg-background/50 backdrop-blur-sm">
        <NavUser
          user={{
            name: user.name,
            email: user.email,
            avatar: user.avatar || ""
          }}
        />
      </SidebarFooter>
    </Sidebar>
  )
}