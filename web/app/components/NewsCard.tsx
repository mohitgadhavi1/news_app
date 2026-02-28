"use client";
import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, MessageSquare } from 'lucide-react';
import { NewsItem } from '@/types/news';

const SafeHTML = dynamic(
  () => import('@/lib/SafeHtml'),
  { ssr: false }
);

export default function NewsCard({ item, index }: { item: NewsItem, index: number }) {
  const [isFlipped, setIsFlipped] = useState(false);

  const primaryImage = item.images?.primary || item.imageUrl;
  const officialUrl = item.canonicalUrl || item.url || "#";
  const previewText = item.summary || item.content || "";
  const fullText = item.content || item.summary || "No full content available.";

  return (
    <div
      className="group w-full h-[450px] [perspective:1000px] cursor-pointer"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div className={`relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>

        {/* Front of Card */}
        <Card className="absolute inset-0 w-full h-full overflow-hidden hover:shadow-md transition flex flex-col [backface-visibility:hidden]">
          {primaryImage && (
            <div className="relative w-full h-48 bg-linear-to-br from-gray-600 to-gray-800 shrink-0">
              <Image
                fill
                loading={index < 8 ? 'eager' : 'lazy'}
                src={primaryImage}
                alt={item.title}
                className="object-cover"
              />
            </div>
          )}

          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-xl flex-1 line-clamp-2">
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

          <CardContent className="space-y-4 flex-1 flex flex-col pb-4">
            {previewText && (
              <div className="text-sm text-muted-foreground line-clamp-3">
                <SafeHTML html={previewText} />
              </div>
            )}

            {/* Tickers */}
            {item.tickers && item.tickers.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-auto pt-2">
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

            <div className="flex items-center justify-between gap-3 pt-2 mt-auto">
              <div className="flex items-center gap-2 text-xs text-muted-foreground w-full justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-normal capitalize truncate max-w-[100px]">
                    {item.source}
                  </Badge>
                  {item.publishOn && <span className="truncate">{new Date(item.publishOn).toLocaleDateString()}</span>}
                </div>
                {item.commentCount !== undefined && item.commentCount > 0 && (
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    {item.commentCount}
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back of Card */}
        <Card className="absolute inset-0 w-full h-full overflow-hidden hover:shadow-md transition flex flex-col p-6 [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <CardHeader className="p-0 mb-4 shrink-0">
            <CardTitle className="text-lg line-clamp-3">{item.title}</CardTitle>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2 border-b pb-2">
              {item.publishedAt && <span>Published {new Date(item.publishedAt).toLocaleString()}</span>}
            </div>
          </CardHeader>

          <CardContent className="p-0 flex-1 overflow-y-auto min-h-0 pr-2 scrollbar-thin">
            <div className="text-sm leading-relaxed text-foreground">
              <SafeHTML html={fullText} />
            </div>
          </CardContent>

          <div className="mt-4 pt-4 border-t flex justify-between items-center shrink-0">
            <div className="text-xs text-muted-foreground">
              Click to flip back
            </div>
            <Button
              variant="default"
              size="sm"
              asChild
              onClick={(e) => e.stopPropagation()} // Prevent card flip when clicking the button
            >
              <a
                href={officialUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Read Original
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </Card>

      </div>
    </div>
  );
}