"use client"

import * as React from "react"
import { Search, X } from "lucide-react"

import { Label } from "@/components/ui/label"
import { SidebarInput } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"

export function SearchForm({ ...props }: React.ComponentProps<"form">) {
  const [query, setQuery] = React.useState("")
  const inputRef = React.useRef<HTMLInputElement>(null)

  return (
    <form {...props}>
      <div className="relative">
        <Label htmlFor="search" className="sr-only">
          Search
        </Label>
        <SidebarInput
          ref={inputRef}
          id="search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type to search..."
          className="h-8 pl-7 pr-7"
        />
        <Search className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 opacity-50 select-none" />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-1/2 right-1 h-6 w-6 -translate-y-1/2 hover:bg-transparent"
            onClick={() => {
              setQuery("")
              inputRef.current?.focus()
            }}
            aria-label="Clear search"
          >
            <X className="size-3.5 opacity-50" />
          </Button>
        )}
      </div>
    </form>
  )
}
