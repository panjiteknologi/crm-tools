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
  IconActivity,
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
  if (role === 'staff') {
    return [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: IconActivity,
      },
      {
        title: "My Targets",
        url: "/dashboard/my-visits",
        icon: IconCalendar,
      }
    ];
  }

  if (role === 'manager') {
    return [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: IconActivity,
      }
    ];
  }

  // Super admin sees all items
  return [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconActivity,
    },
    {
      title: "My Visits",
      url: "/dashboard/my-visits",
      icon: IconCalendar,
    },
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

  // Super admin gets all secondary items including settings
  return [
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: IconSettings,
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
  ];
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