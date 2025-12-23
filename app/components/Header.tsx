"use client";

import { useEffect, useState } from "react";
import { Sun, Moon, Laptop } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "theme-preference";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const isDarkSystem = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;

  if (theme === "system") {
    if (isDarkSystem) root.classList.add("dark");
    else root.classList.remove("dark");
  } else if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

export default function Header() {
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
    } catch {}
    setTheme(t);
  };

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur border-b border-border">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-primary px-2 py-1 text-sm font-semibold text-primary-foreground">Z</div>
          <div>
            <div className="text-sm font-bold">zidbit news</div>
            <div className="text-xs text-muted-foreground">headlines</div>
          </div>
        </div>

        <div className="flex items-center gap-3 cursor-pointer">
          <label className="sr-only">Theme</label>
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
        </div>
      </div>
    </header>
  );
}
