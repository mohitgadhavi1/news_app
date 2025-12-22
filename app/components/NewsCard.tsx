import React from "react";

type NewsItem = {
  id: string;
  title: string;
  summary?: string;
  url?: string;
  source?: string;
  publishedAt?: string | Date | null;
};

export default function NewsCard({ item }: { item: NewsItem }) {
  const date = item.publishedAt ? new Date(item.publishedAt).toLocaleString() : "";
  return (
    <article className="w-full rounded-lg border bg-card p-4 shadow-sm hover:shadow-md transition">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <a
            href={item.url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="text-lg font-semibold text-foreground hover:underline"
          >
            {item.title}
          </a>
          {item.summary ? (
            <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
              {item.summary}
            </p>
          ) : null}
          <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
            {item.source ? <span className="rounded-full bg-muted px-2 py-0.5">{item.source}</span> : null}
            {date ? <span>{date}</span> : null}
          </div>
        </div>
      </div>
    </article>
  );
}
