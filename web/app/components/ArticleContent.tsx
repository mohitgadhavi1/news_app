"use client";

import dynamic from "next/dynamic";

const SafeHTML = dynamic(
    () => import("@/lib/SafeHtml"),
    { ssr: false }
);

export default function ArticleContent({ content }: { content: string }) {
    return (
        <div className="text-lg leading-relaxed text-foreground/90">
            <SafeHTML html={content} />
        </div>
    );
}
