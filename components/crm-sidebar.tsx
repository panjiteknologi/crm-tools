"use client"

import * as React from "react"
import {
  IconUsers,
  IconCalendar,
  IconTarget,
  IconTrendingUp,
  IconSettings,
  IconHelp,
  IconSearch,
  IconCamera,
  IconActivity,
  IconBell,
  IconLogout,
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
  if (role === 'manager') {
    return [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: IconActivity,
      }
    ];
  }

  return [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconActivity,
    },
    {
      title: "Team Management",
      url: "/dashboard/team",
      icon: IconUsers,
      roles: ['super_admin', 'manager']
    },
    {
      title: "My Visits",
      url: "/dashboard/my-visits",
      icon: IconCalendar,
    },
    {
      title: "Analytics",
      url: "/dashboard/analytics",
      icon: IconTrendingUp,
      roles: ['super_admin', 'manager']
    },
    {
      title: "Targets",
      url: "/dashboard/targets",
      icon: IconTarget,
    }
  ].filter(item => !item.roles || item.roles.includes(role));
};

const getSecondaryItems = (role: string) => {
  if (role === 'manager') {
    return [];
  }

  return [
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: IconSettings,
      roles: ['super_admin']
    },
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
  ].filter(item => !item.roles || item.roles.includes(role));
};

export function CRMSidebar({ user, ...props }: CRMSidebarProps) {
  const navItems = getNavigationItems(user.role);
  const secondaryItems = getSecondaryItems(user.role);

  return (
    <Sidebar
      {...props}
      collapsible="offcanvas"
      variant="sidebar"
    >
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/dashboard" className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <IconActivity className="h-4 w-4" />
                </div>
                <span className="text-base font-semibold">CRM Tools</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="gap-4 py-4">
        <NavMain items={navItems} />

        {/* Only show Quick Actions for non-manager roles */}
        {user.role !== 'manager' && (
          <div className="px-3 py-2">
            <div className="text-xs font-medium text-sidebar-foreground uppercase tracking-wider">
              Quick Actions
            </div>
            <div className="mt-2 space-y-1">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <button className="w-full justify-start">
                      <IconCamera className="h-4 w-4" />
                      <span>Add Visit</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <button className="w-full justify-start">
                      <IconBell className="h-4 w-4" />
                      <span>Notifications</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </div>
          </div>
        )}

        <NavSecondary items={secondaryItems} className="mt-auto" />
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
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