"use client"

import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Sun, Moon, Laptop } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import applyTheme, { Theme } from "@/lib/applyTheme";
import { useEffect, useState } from "react"
import { getStoredAuth, fetchUserInfo, redirectToLogin, logout, getBasicUserFromUrlOrToken } from "@/lib/auth"

const STORAGE_KEY = "theme-preference";


export function NavUser() {
  const { isMobile } = useSidebar();
  // Theme logic
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      return (v as Theme) || "system";
    } catch {
      return "system";
    }
  });
  useEffect(() => {
    applyTheme(theme);
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (theme === "system") applyTheme("system");
    };
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, [theme]);
  const handleChange = (t: Theme) => {
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch { }
    setTheme(t);
  };
  // Auth logic
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  // Try to extract basic user info from URL or token if /me fails

  useEffect(() => {
    let ignore = false;
    async function refreshUser() {
      const { token } = getStoredAuth();
      if (!token) {
        if (!ignore) {
          setUser(null);
          setLoading(false);
        }
        return;
      }
      setLoading(true);
      const data = await fetchUserInfo(token);
      if (!ignore) {
        if (data && !data.error) {
          setUser(data);
        } else {
          // fallback to centralized basic info extraction
          setUser(getBasicUserFromUrlOrToken());
        }
        setLoading(false);
      }
    }
    refreshUser();
    // Listen for storage changes (e.g., login in another tab)
    function handleStorage(e: StorageEvent) {
      if (e.key === "zidbit_auth_token") refreshUser();
    }
    // Listen for window focus (e.g., after login redirect)
    function handleFocus() {
      refreshUser();
    }
    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", handleFocus);
    return () => {
      ignore = true;
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);
  // Render
  if (loading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg">
            <span>Loading...</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }
  if (!user) {
    // Not logged in
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" onClick={redirectToLogin}>
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarFallback className="rounded-lg">?</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">Sign in</span>
              <span className="truncate text-xs">Login to your account</span>
            </div>
            <ChevronsUpDown className="ml-auto size-4" />
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }
  // Logged in
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.picture} alt={user.name || user.email} />
                <AvatarFallback className="rounded-lg">{(user.name || user.email || "U").slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name || "Unknown User"}</span>
                <span className="truncate text-xs">{user.email || "Details unavailable"}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.picture} alt={user.name || user.email} />
                  <AvatarFallback className="rounded-lg">{(user.name || user.email || "U").slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name || "Unknown User"}</span>
                  <span className="truncate text-xs">{user.email || "Details unavailable"}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Select value={theme} onValueChange={(t: Theme) => handleChange(t)}>
                  <SelectTrigger className="w-30">
                    <Sun className="mr-2 h-4 w-4" style={{ display: theme === 'light' ? 'inline' : 'none' }} />
                    <Moon className="mr-2 h-4 w-4" style={{ display: theme === 'dark' ? 'inline' : 'none' }} />
                    <Laptop className="mr-2 h-4 w-4" style={{ display: theme === 'system' ? 'inline' : 'none' }} />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system">
                      <Laptop className="mr-2 h-4 w-4 inline" />System
                    </SelectItem>
                    <SelectItem value="light">
                      <Sun className="mr-2 h-4 w-4 inline" />Light
                    </SelectItem>
                    <SelectItem value="dark">
                      <Moon className="mr-2 h-4 w-4 inline" />Dark
                    </SelectItem>
                  </SelectContent>
                </Select>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Sparkles />
                Upgrade to Pro
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => window.location.href = "/account"}>
                <BadgeCheck />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCard />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
