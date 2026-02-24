import axios from 'axios';
import { MongoClient } from 'mongodb';
import { classifyNewsText, CATEGORIES } from './newsCategoryGeneration.js';

const MONGODB_URI = process.env.MONGODB_URI;
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

if (!MONGODB_URI || !RAPIDAPI_KEY) {
    console.error('❌ Missing env variables');
    process.exit(1);
}

export async function fetchAndStoreNews() {
    const client = new MongoClient(MONGODB_URI as string);

    try {
        await client.connect();
        const db = client.db('seeking-alpha');
        const collection = db.collection('news');

        // Performance index only
        await collection.createIndex(
            { articleId: 1 },
            { unique: true, background: true }
        );

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
            console.log('⚠️ No valid articles returned.');
            return;
        }

        // Add error handling for individual articles
        const formatted = await Promise.all(newsData.map(async (article) => {
            try {
                const categoryResult = await classifyNewsText(
                    (article.attributes?.title || '') + ' ' + (article.attributes?.content || '')
                );

                // Safer ticker extraction
                const tickers = article.relationships?.sentiments?.data?.primaryTickers?.data;

                // Find the full category object meta
                const categoryInfo = CATEGORIES.find(c => c.name === categoryResult.categoryName);

                return {
                    source: 'seeking-alpha',
                    articleId: article.id,
                    type: article.type,
                    title: article.attributes?.title,
                    content: article.attributes?.content,
                    publishOn: new Date(article.attributes?.publishOn),
                    lastModified: new Date(article.attributes?.lastModified),
                    status: article.attributes?.status,
                    isExclusive: article.attributes?.isExclusive,
                    metered: article.attributes?.metered,
                    commentCount: article.attributes?.commentCount,
                    images: {
                        primary: article.attributes?.gettyImageUrl,
                        variants: article.links?.schemaImage ?? [],
                    },
                    canonicalUrl: article.links?.canonical,
                    tickers: Array.isArray(tickers) ? tickers.map((t: { id: string }) => t.id) : [],
                    category: categoryInfo ? {
                        ...categoryInfo,
                        categoryName: categoryResult.categoryName,
                        confidence: categoryResult.confidence,
                        reasoning: categoryResult.reasoning,
                    } : undefined,
                };
            } catch (err) {
                console.error(`⚠️ Failed to process article ${article.id}:`, err);
                return null;
            }
        }));

        // Filter out failed articles
        const validArticles = formatted.filter(article => article !== null);

        if (validArticles.length) {
            const bulkOps = validArticles.map(article => ({
                updateOne: {
                    filter: { articleId: article.articleId },
                    update: {
                        $set: {
                            ...article,
                            updatedAt: new Date(),
                        },
                        $setOnInsert: {
                            createdAt: new Date(),
                        },
                    },
                    upsert: true,
                },
            }));

            const result = await collection.bulkWrite(bulkOps, { ordered: false });

            console.log(
                `📰 Upserted: ${result.upsertedCount}, Updated: ${result.modifiedCount}, Failed: ${formatted.length - validArticles.length}`
            );
        }

        // Cleanup
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 31);

        const { deletedCount } = await collection.deleteMany({
            publishOn: { $lt: cutoff },
        });

        console.log(`🧹 Deleted ${deletedCount} old articles`);
    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await client.close();
    }
}

// fetchAndStoreNews(); // Removed to allow control by runner