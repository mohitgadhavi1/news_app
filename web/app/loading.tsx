import { Skeleton } from "@/components/ui/skeleton";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import Header from "./components/Header";

export default function Loading() {
    return (
        <div className="[--header-height:calc(--spacing(14))]">
            <SidebarProvider defaultOpen={false} className="flex flex-col">
                <Header />
                <div className="flex flex-1">
                    <div className="hidden md:block w-64 bg-sidebar border-r" />
                    <SidebarInset>
                        <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
                            <div className="mx-auto w-full max-w-7xl">
                                <div className="mb-8 space-y-4">
                                    <Skeleton className="h-10 w-48" />
                                    <Skeleton className="h-4 w-96 truncate" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <div key={i} className="flex flex-col space-y-4 rounded-xl border bg-card p-4">
                                            <Skeleton className="h-48 w-full rounded-lg" />
                                            <div className="space-y-2">
                                                <Skeleton className="h-6 w-3/4" />
                                                <Skeleton className="h-4 w-full" />
                                                <Skeleton className="h-4 w-full" />
                                            </div>
                                            <div className="flex items-center justify-between pt-4">
                                                <Skeleton className="h-6 w-20" />
                                                <Skeleton className="h-4 w-24" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </SidebarInset>
                </div>
            </SidebarProvider>
        </div>
    );
}
