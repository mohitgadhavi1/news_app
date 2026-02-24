import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

// Helper to handle ESM __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCES_FILE = path.join(__dirname, '..', 'test', 'tech_news_sources.txt');

interface RSSItem {
    title: string;
    link: string;
    pubDate: string;
    description: string;
}

/**
 * Simple regex-based RSS parser to avoid dependency issues.
 * Extracts title, link, pubDate, and description from <item> or <entry> tags.
 */
function parseRSS(xml: string): RSSItem[] {
    const items: RSSItem[] = [];

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

        const title = extract('title');
        // Handle both <link>...</link> and <link href="..." />
        let link = extract('link');
        if (!link) {
            const linkHrefMatch = /<link[^>]+href=["']([^"']+)["']/i.exec(content);
            link = linkHrefMatch ? linkHrefMatch[1] : '';
        }

        const pubDate = extract('pubDate') || extract('updated') || extract('published');
        const description = extract('description') || extract('summary') || extract('content');

        if (title || link) {
            items.push({ title, link, pubDate, description });
        }
    }

    return items;
}

async function run() {
    console.log('🚀 Starting RSS Fetch Test Script...');

    if (!fs.existsSync(SOURCES_FILE)) {
        console.error(`❌ Error: Sources file not found at ${SOURCES_FILE}`);
        process.exit(1);
    }

    const content = fs.readFileSync(SOURCES_FILE, 'utf-8');
    const lines = content.split('\n');

    const rssSources: { name: string; url: string }[] = [];

    // Parse the sources file
    // Example line: 1. TechCrunch URL: https://techcrunch.com/feed/ Type: RSS Cost: Free
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line && line.includes('URL:') && line.includes('Type: RSS')) {
            const nameMatch = /^(\d+\.\s+)?(.*?)\s+URL:/.exec(line);
            const urlMatch = /URL:\s+(https?:\/\/\S+)/.exec(line);

            if (urlMatch) {
                rssSources.push({
                    name: nameMatch ? nameMatch[2].trim() : 'Unknown Source',
                    url: urlMatch[1]
                });
            }
        }
    }

    console.log(`Found ${rssSources.length} RSS sources to fetch.\n`);

    for (const source of rssSources) {
        console.log(`--------------------------------------------------`);
        console.log(`📡 Fetching: ${source.name} (${source.url})`);
        console.log(`--------------------------------------------------`);

        try {
            const response = await axios.get(source.url, {
                timeout: 5000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });

            const items = parseRSS(response.data);

            if (items.length === 0) {
                console.log('⚠️  No items found in this feed.');
            } else {
                // Show top 3 items to avoid console flooding
                items.slice(0, 3).forEach((item, index) => {
                    console.log(`\n[${index + 1}] TITLE: ${item.title}`);
                    console.log(`   LINK:  ${item.link}`);
                    console.log(`   DATE:  ${item.pubDate}`);
                    console.log(`   CONTENT: ${item.description.substring(0, 200)}${item.description.length > 200 ? '...' : ''}`);
                });
            }
        } catch (error: any) {
            console.error(`❌ Failed to fetch ${source.name}: ${error.message}`);
        }
        console.log('\n');
    }

    console.log('✅ RSS Fetch Test Complete.');
}

run();
