import { NewsItem } from "@/types/news";
import NewsCard from "./NewsCard";
import NewsPagination from "./NewsPagination";
import { newsFetchServe } from "@/hooks/newsFetchServe";

interface NewsSectionProps {
  searchParams?: { [key: string]: string | string[] | undefined };
  categoryName?: string;
  categorySlug?: string;
}

// Server Component for News Section with Pagination
export default async function NewsSection({ searchParams = {}, categoryName, categorySlug }: NewsSectionProps) {
  // Safely get page from search params
  const pageParam = searchParams.page;
  const page = pageParam
    ? Number(Array.isArray(pageParam) ? pageParam[0] : pageParam)
    : 1;


  let newsData;
  try {
    newsData = await newsFetchServe(page, categoryName);
  } catch {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="text-center">Error loading news.</div>
      </div>
    );
  }

  if (!newsData) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="text-center">Loading news...</div>
      </div>
    );
  }

  const { currentPage, news, totalCount, totalPages, itemsPerPage, skip } = newsData;

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold">{categoryName ?? "News"}</h1>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground">
            Latest financial headlines from around the world
          </p>
          <div className="my-4 flex items-center justify-end">
            {totalPages > 1 && (
              <NewsPagination currentPage={currentPage} totalPages={totalPages} />
            )}
          </div>
          {totalCount > 0 && (
            <p className="mt-1 text-xs text-muted-foreground">
              Showing {skip + 1}-{Math.min(skip + itemsPerPage, totalCount)} of {totalCount} articles
            </p>
          )}
        </div>
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          {news.length === 0 ? (
            <div className="col-span-full rounded-lg border bg-card p-6 text-center">
              No news available — ensure MongoDB is configured.
            </div>
          ) : (
            news.map((n: any, index: number) => (
              <NewsCard
                key={n.id}
                item={n}
                index={index}
                categorySlug={categorySlug ?? "all"}
              />
            ))
          )}
        </section>
        {totalPages > 1 && (
          <NewsPagination currentPage={currentPage} totalPages={totalPages} />
        )}
      </div>
    </div>
  );
}