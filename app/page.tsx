import { fetchCryptoNews } from "../lib/mongodb";
import NewsCard from "./components/NewsCard";

export default async function Home() {
  let news = [];
  try {
    news = await fetchCryptoNews(50);
  } catch (err) {
    // silent — page will render empty list and show message
    console.error(err);
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <main className="mx-auto w-full max-w-4xl">
        <header className="mb-6">
          <h1 className="text-3xl font-bold">Crypto News</h1>
          <p className="mt-1 text-sm text-muted-foreground">Latest headlines from your MongoDB collection</p>
        </header>

        <section className="grid gap-4">
          {news.length === 0 ? (
            <div className="rounded-lg border bg-card p-6">No news available — ensure MongoDB is configured.</div>
          ) : (
            news.map((n: any) => <NewsCard key={n.id} item={n} />)
          )}
        </section>
      </main>
    </div>
  );
}
