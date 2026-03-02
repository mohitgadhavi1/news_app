import { categories } from "@/lib/categories";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/app/components/ui/sidebar/app-sidebar";
import Header from "@/app/components/Header";
import NewsSection from "@/app/components/NewsSection";
import { notFound } from "next/navigation";

interface CategoryPageProps {
    params: { slug: string };
    searchParams: { [key: string]: string | string[] | undefined };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
    const { slug } = await params;
    const query = await searchParams;

    // Find category by slug
    const category = categories.find((c) => c.slug === slug);

    if (!category) {
        notFound();
    }

    return (
        <div className="[--header-height:calc(--spacing(14))]">
            <SidebarProvider defaultOpen={false} className="flex flex-col">
                <Header />
                <AppSidebar />
                <SidebarInset>
                    <NewsSection
                        searchParams={query}
                        categoryName={category.name}
                        categorySlug={category.slug}
                    />
                </SidebarInset>
            </SidebarProvider>
        </div>
    );
}
