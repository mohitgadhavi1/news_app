"use client"

import * as React from "react"


import { NavMain } from "./nav-main"

import {
  Sidebar,
  SidebarContent,

  SidebarFooter,

  SidebarRail,
} from "@/components/ui/sidebar"

import { categories } from "@/lib/categories"
import { LifeBuoy, Send } from "lucide-react"
import { NavSecondary } from "./nav-secondary"
import { NavUser } from "./nav-user"

const navSecondaryData = [
  {
    title: "Support",
    url: "#",
    icon: LifeBuoy,
  },
  {
    title: "Feedback",
    url: "#",
    icon: Send,
  },
]

const navItems = [
  {
    title: "Categories",
    icon: LifeBuoy, // Added icon for category
    url: "/categories",
    isActive: true,
    items: categories.map((c) => ({
      title: c.name,
      url: `/category/${c.slug}`,
    })),
  },
]


export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
    >

      <SidebarContent>
        <NavMain items={navItems} />
        <NavSecondary items={navSecondaryData} className="mt-auto" />
      </SidebarContent>

      <SidebarRail />
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
