import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { NewsItem } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read configurations
const apiSourcesPath = path.join(__dirname, 'api_news_sources.json');
const apiSources = JSON.parse(fs.readFileSync(apiSourcesPath, 'utf8'));

export async function fetchFromSource(sourceId: string): Promise<Partial<NewsItem>[]> {

    const sourceConfig = apiSources.find((s: any) => s.id === sourceId);

    if (!sourceConfig) {
        throw new Error(`Source configuration not found for ID: ${sourceId}`);
    }

    if (sourceConfig.name === 'seeking-alpha') {
        return fetchSeekingAlpha();
    } else if (sourceConfig.name === 'NewsAPI') {
        return fetchNewsAPI(sourceConfig);
    } else if (sourceConfig.name === 'GNews') {
        return fetchGNews(sourceConfig);
    }

    throw new Error(`Unsupported source type: ${sourceConfig.name}`);
}

async function fetchSeekingAlpha(): Promise<Partial<NewsItem>[]> {
    const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
    if (!RAPIDAPI_KEY) {
        console.warn('⚠️ RAPIDAPI_KEY missing. Skipping seeking-alpha fetch.');
        return [];
    }

    const response = await axios.get(
        'https://seeking-alpha.p.rapidapi.com/news/v2/list?size=20&category=market-news%3A%3Aall&number=1',
        {
            headers: {
                'x-rapidapi-key': RAPIDAPI_KEY,
                'x-rapidapi-host': 'seeking-alpha.p.rapidapi.com',
            },
        }
    );

    const newsData = response.data?.data;
    if (!Array.isArray(newsData)) {
        console.log('⚠️ No valid articles returned from seeking-alpha.');
        return [];
    }

    return newsData.map((article: any) => {
        const tickers = article.relationships?.sentiments?.data?.primaryTickers?.data;
        return {
            source: 'seeking-alpha',
            articleId: article.id,
            type: article.type,
            title: article.attributes?.title,
            content: article.attributes?.content || '',
            publishOn: new Date(article.attributes?.publishOn),
            lastModified: new Date(article.attributes?.lastModified || article.attributes?.publishOn),
            status: article.attributes?.status,
            isExclusive: article.attributes?.isExclusive,
            metered: article.attributes?.metered,
            commentCount: article.attributes?.commentCount || 0,
            images: {
                primary: article.attributes?.gettyImageUrl,
                variants: article.links?.schemaImage ?? [],
            },
            canonicalUrl: article.links?.canonical,
            tickers: Array.isArray(tickers) ? tickers.map((t: { id: string }) => t.id) : [],
        };
    });
}

async function fetchNewsAPI(sourceConfig: any): Promise<Partial<NewsItem>[]> {
    const NEWSAPI_KEY = process.env.NEWSAPI_ORD_KEY;
    if (!NEWSAPI_KEY) {
        console.warn('⚠️ NEWSAPI_ORD_KEY missing. Skipping NewsAPI fetch.');
        return [];
    }

    const endpoint = sourceConfig.endpoints.top_headlines.url;
    const response = await axios.get(endpoint, {
        params: {
            country: 'us',
            category: 'business',
            pageSize: 20,
        },
        headers: {
            'X-Api-Key': NEWSAPI_KEY
        }
    });

    const articles = response.data?.articles;
    if (!Array.isArray(articles)) {
        console.log('⚠️ No valid articles returned from NewsAPI.');
        return [];
    }

    return articles.map((article: any) => {
        // NewsAPI doesn't have an ID, create a stable hash mostly using URL.
        const hashTarget = article.url || article.title || Math.random().toString();
        const articleId = Buffer.from(hashTarget).toString('base64').substring(0, 32);

        return {
            source: 'NewsAPI',
            articleId: `newsapi_${articleId}`,
            type: 'article',
            title: article.title,
            content: article.content || article.description || '',
            publishOn: new Date(article.publishedAt),
            lastModified: new Date(article.publishedAt),
            status: 'published',
            isExclusive: false,
            metered: false,
            commentCount: 0,
            images: {
                primary: article.urlToImage || null,
                variants: [],
            },
            canonicalUrl: article.url || null,
            tickers: [],
        };
    });
}

async function fetchGNews(sourceConfig: any): Promise<Partial<NewsItem>[]> {
    const GNEWS_KEY = process.env.GNEWS_API_KEY;
    if (!GNEWS_KEY) {
        console.warn('⚠️ GNEWS_API_KEY missing. Skipping GNews fetch.');
        return [];
    }

    const endpoint = sourceConfig.endpoints.top_headlines.url;
    const response = await axios.get(endpoint, {
        params: {
            topic: 'business',
            lang: 'en',
            max: 10,
            apikey: GNEWS_KEY
        }
    });

    const articles = response.data?.articles;
    if (!Array.isArray(articles)) {
        console.log('⚠️ No valid articles returned from GNews.');
        return [];
    }

    return articles.map((article: any) => {
        const hashTarget = article.url || article.title || Math.random().toString();
        const articleId = Buffer.from(hashTarget).toString('base64').substring(0, 32);

        return {
            source: 'GNews',
            articleId: `gnews_${articleId}`,
            type: 'article',
            title: article.title,
            content: article.content || article.description || '',
            publishOn: new Date(article.publishedAt),
            lastModified: new Date(article.publishedAt),
            status: 'published',
            isExclusive: false,
            metered: false,
            commentCount: 0,
            images: {
                primary: article.image || null,
                variants: [],
            },
            canonicalUrl: article.url || null,
            tickers: [],
        };
    });
}
