import { categories } from "@/lib/categories";
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
        <NewsSection
            searchParams={query}
            categoryName={category.name}
            categorySlug={category.slug}
        />
    );
}
