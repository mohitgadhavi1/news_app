"use client"

import React from "react"
import { ChevronRight, type LucideIcon } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"



export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  const [counts, setCounts] = React.useState<Record<string, number>>({})

  React.useEffect(() => {
    fetch("/api/categories/counts")
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          setCounts(data)
        }
      })
      .catch((err) => console.error("Error fetching category counts:", err))
  }, [])

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Categories</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((group) => (
          <React.Fragment key={group.title}>
            {group.items?.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild tooltip={item.title}>
                  <a href={item.url}>
                    <span>{item.title}</span>
                  </a>
                </SidebarMenuButton>
                <SidebarMenuBadge>{counts[item.title] ?? 0}</SidebarMenuBadge>
              </SidebarMenuItem>
            ))}
          </React.Fragment>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
