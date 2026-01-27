"use client"

import { usePathname } from "next/navigation"
import { type Icon } from "@tabler/icons-react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: Icon
    roles?: string[]
  }[]
}) {
  const pathname = usePathname()

  // Check if current path matches item URL
  const isActive = (url: string) => {
    if (url === "/dashboard-manager" && pathname === "/dashboard-manager") return true
    return pathname === url || pathname?.startsWith(url + "/")
  }

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const active = isActive(item.url)
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  className={active ? `
                    relative
                    bg-gradient-to-r from-blue-600 to-purple-600
                    hover:!from-blue-700 hover:!to-purple-700
                    text-white font-medium
                    shadow-md
                    before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:to-transparent
                    before:opacity-0 hover:before:opacity-100
                    transition-all duration-200
                  ` : ""}
                >
                  <a href={item.url} className="relative z-10">
                    {item.icon && <item.icon className={active ? "text-white" : ""} />}
                    <span>{item.title}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

