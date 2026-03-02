import crypto from 'crypto';
import { NewsItem } from '../types.js';

/**
 * Simple regex-based RSS parser to avoid dependency issues.
 * Extracts data and maps it to the NewsItem interface.
 */
export function parseRSS(xml: string, sourceName: string): NewsItem[] {
    const items: NewsItem[] = [];

    // Match <item> (RSS) or <entry> (Atom) blocks
    const itemRegex = /<(item|entry)>([\s\S]*?)<\/\1>/g;
    let match;

    while ((match = itemRegex.exec(xml)) !== null) {
        const content = match[2];

        const extract = (tag: string) => {
            const tagRegex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
            const tagMatch = tagRegex.exec(content);
            if (tagMatch) {
                // Remove CDATA and basic HTML tags
                return tagMatch[1]
                    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
                    .replace(/<\/?[^>]+(>|$)/g, "")
                    .trim();
            }
            return '';
        };

        const title = extract('title') || 'N.A.';
        // Handle both <link>...</link> and <link href="..." />
        let link = extract('link');
        if (!link) {
            const linkHrefMatch = /<link[^>]+href=["']([^"']+)["']/i.exec(content);
            link = linkHrefMatch ? linkHrefMatch[1] : '';
        }

        const rawPubDate = extract('pubDate') || extract('updated') || extract('published');
        const publishOn = rawPubDate ? new Date(rawPubDate) : new Date();
        const description = extract('description') || extract('summary') || extract('content') || 'N.A.';

        // Image extraction (simple regex for common patterns)
        const imgRegex = /<img[^>]+src=["']([^"']+)["']/i;
        const imgMatch = imgRegex.exec(content) || imgRegex.exec(extract('description'));
        const imageUrl = imgMatch ? imgMatch[1] : 'N.A.';

        if (title !== 'N.A.' || link) {
            const articleId = crypto.createHash('md5').update(link || title).digest('hex');

            items.push({
                articleId,
                canonicalUrl: link || 'N.A.',
                commentCount: 0,
                content: description,
                createdAt: new Date(),
                images: {
                    primary: imageUrl,
                    variants: []
                },
                isExclusive: false,
                lastModified: publishOn,
                metered: false,
                publishOn,
                source: sourceName,
                status: 'published',
                tickers: [],
                title,
                type: 'RSS',
                updatedAt: new Date()
            });
        }
    }

    return items;
}
