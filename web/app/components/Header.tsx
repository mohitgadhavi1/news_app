"use client";



import { SidebarIcon } from "lucide-react"
import { SearchForm } from "@/app/components/search-form"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useSidebar } from "@/components/ui/sidebar"





export default function Header() {
  const { toggleSidebar, } = useSidebar()
 

  return (
    <header className="bg-background sticky top-0 z-50 flex w-full items-center border-b ">
        <div className="flex h-(--header-height) w-full items-center gap-2 px-4 ">
    <Button
          className="h-8 w-8"
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
        >
          <SidebarIcon />
        </Button>
           <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb className="hidden sm:block">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">
                Category
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>All</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <SearchForm className="w-full sm:ml-auto sm:w-auto" />
            <div className="mx-auto flex max-w-4xl items-center justify-end  gap-4 px-4 py-3">
        <div className="flex items-center gap-3 ">

          <div className="">
                      <div className="rounded-md bg-primary px-2 py-1 mx-2 text-sm font-semibold text-primary-foreground text-center">Z</div>
            {/* <div className="text-sm font-bold">zidbit news</div> */}
            <div className="text-xs text-muted-foreground">headlines</div>
          </div>
        </div>
      
       
        </div>
      
      </div>
    </header>
  );
}
