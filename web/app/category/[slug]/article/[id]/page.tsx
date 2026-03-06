import { categories } from "@/lib/categories";
import { fetchArticleById } from "@/lib/newsService";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ExternalLink, Calendar, User } from "lucide-react";
import Link from "next/link";
import ArticleContent from "@/app/components/ArticleContent";

interface ArticlePageProps {
    params: { slug: string; id: string };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
    const { slug, id } = await params;

    const article = await fetchArticleById(id);
    const category = slug === "all"
        ? { name: "News", slug: "all" }
        : categories.find((c) => c.slug === slug);

    if (!article || !category) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Back Link */}
                <Link
                    href={slug === "all" ? "/" : `/category/${slug}`}
                    className="mb-8 flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors w-fit"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Back to {category.name}
                </Link>

                <article className="space-y-8">
                    {/* Header Section */}
                    <div className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary" className="capitalize">
                                {article.source}
                            </Badge>
                            {category && (
                                <Badge variant="outline">
                                    {category.name}
                                </Badge>
                            )}
                        </div>

                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
                            {article.title}
                        </h1>

                        <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground pt-2">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString(undefined, {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                }) : 'Date unknown'}
                            </div>
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                {article.source}
                            </div>
                        </div>
                    </div>

                    {/* Hero Image */}
                    {article.imageUrl && (
                        <div className="relative aspect-video w-full overflow-hidden rounded-2xl border bg-muted shadow-lg">
                            <Image
                                src={article.imageUrl}
                                alt={article.title}
                                fill
                                className="object-cover"
                                priority
                            />
                        </div>
                    )}

                    {/* Content Section */}
                    <ArticleContent content={article.content || article.summary || "No content available."} />

                    {/* Footer Section */}
                    <div className="pt-12 border-t mt-12 flex flex-wrap items-center justify-between gap-4">
                        <div className="space-y-1">
                            <p className="text-sm font-medium">Source: {article.source}</p>
                            <p className="text-xs text-muted-foreground italic">
                                Original reporting by {article.source}
                            </p>
                        </div>

                        <Button asChild variant="default" size="lg">
                            <a
                                href={article.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2"
                            >
                                Read Original Article
                                <ExternalLink className="h-4 w-4" />
                            </a>
                        </Button>
                    </div>
                </article>
            </div>
        </div>
    );
}
