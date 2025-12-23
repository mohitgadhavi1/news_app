"use client";
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, MessageSquare } from 'lucide-react';
import { useMemo } from 'react';
import { NewsItem } from '@/types/news';

const SafeHTML = dynamic(
  () => import('@/lib/SafeHtml'),
  { ssr: false }
);



export default function NewsCard({ item }: { item: NewsItem }) {
  const date = useMemo(() => {
    if (!item.publishedAt) return "";
    return new Date(item.publishedAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }, [item.publishedAt]);

  return (
    <Card className="w-full overflow-hidden hover:shadow-md transition">
      {item.imageUrl && (
        <div className="relative w-full h-48 bg-linear-to-br from-gray-600 to-gray-800">
          <Image
            fill
            src={item.imageUrl}
            alt={item.title}
            className="object-cover"
          />
        </div>
      )}

      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-xl flex-1">
            <p className="leading-tight">
              {item.title}
            </p>
          </CardTitle>
          {item.isExclusive && (
            <Badge variant="default" className="shrink-0">
              Exclusive
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {item.summary && (
          <div className="text-sm text-muted-foreground line-clamp-3">
            <SafeHTML html={item.summary} />
          </div>
        )}

        {/* Tickers */}
        {item.tickers && item.tickers.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {item.tickers.slice(0, 5).map((ticker) => (
              <Badge 
                key={ticker} 
                variant="outline" 
                className="text-xs font-mono"
              >
                ${ticker}
              </Badge>
            ))}
            {item.tickers.length > 5 && (
              <Badge variant="outline" className="text-xs">
                +{item.tickers.length - 5} more
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <Badge variant="secondary" className="font-normal">
              {item.source}
            </Badge>
            {date && <span>{date}</span>}
            {item.commentCount !== undefined && item.commentCount > 0 && (
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                {item.commentCount}
              </span>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Read More
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}