"use client";

import SafeHTML from "@/lib/SafeHtml";

export default function ArticleContent({ content }: { content: string }) {
    return (
        <div className="text-lg leading-relaxed text-foreground/90">
            <SafeHTML html={content} />
        </div>
    );
}
