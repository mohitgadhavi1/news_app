import { NewsItem } from "@/types/news";
import { fetchCryptoNews } from "../lib/mongodb";
import NewsCard from "./components/NewsCard";
import NewsPagination from "./components/NewsPagination";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/app/components/app-sidebar";
import Header from "./components/Header";

const ITEMS_PER_PAGE = 12;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  // Await searchParams in Next.js 15+
  const params = await searchParams;
  const currentPage = Number(params.page) || 1;
  const skip = (currentPage - 1) * ITEMS_PER_PAGE;

  let news: NewsItem[] = [];
  let totalCount = 0;

  try {
    // fetchCryptoNews now returns { news, total }
    const result = await fetchCryptoNews(ITEMS_PER_PAGE, skip);
    news = result.news;
    totalCount = result.total;
  } catch (err) {
    console.error(err);
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="[--header-height:calc(--spacing(14))]">
       <SidebarProvider className="flex flex-col">
        <Header />
      <AppSidebar />
      
    <SidebarInset>
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold">News</h1>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground">
            Latest financial headlines from around the world          </p>
          {totalCount > 0 && (
            <p className="mt-1 text-xs text-muted-foreground">
              Showing {skip + 1}-{Math.min(skip + ITEMS_PER_PAGE, totalCount)} of {totalCount} articles
            </p>
          )}
        </div>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          {news.length === 0 ? (
            <div className="col-span-full rounded-lg border bg-card p-6 text-center">
              No news available — ensure MongoDB is configured.
            </div>
          ) : (
            news.map((n: NewsItem) => <NewsCard key={n.id} item={n} />)
          )}
        </section>

        {totalPages > 1 && (
          <NewsPagination currentPage={currentPage} totalPages={totalPages} />
        )}
      </div>
    </div>
    </SidebarInset>
        </SidebarProvider>
     </div>
  );
}