import { MongoClient } from 'mongodb';
import { fetchFromSource } from './apis.js';
import { NewsItem } from './types.js';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ Missing MONGODB_URI env variable');
    process.exit(1);
}

export async function fetchAndStoreNews(sourceId: string) {
    const client = new MongoClient(MONGODB_URI as string);

    try {
        await client.connect();
        const db = client.db('news');
        const collection = db.collection('external_news');

        // Performance index only
        await collection.createIndex(
            { articleId: 1 },
            { unique: true, background: true }
        );

        console.log(`⏳ Fetching news from source: ${sourceId}...`);
        const rawArticles = await fetchFromSource(sourceId);

        if (!Array.isArray(rawArticles) || rawArticles.length === 0) {
            console.log(`⚠️ No valid articles returned from ${sourceId}.`);
            return;
        }

        const validArticles = rawArticles.filter(article => article !== null);

        if (validArticles.length) {
            const bulkOps = validArticles.map(article => ({
                updateOne: {
                    filter: { articleId: article!.articleId },
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
                `📰 [${sourceId}] Upserted: ${result.upsertedCount}, Updated: ${result.modifiedCount}`
            );
        }

        // Cleanup
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 31);

        const { deletedCount } = await collection.deleteMany({
            publishOn: { $lt: cutoff },
        });

        console.log(`🧹 [${sourceId}] Deleted ${deletedCount} old articles based on cutoff`);
    } catch (err) {
        console.error(`❌ Error fetching/storing news for ${sourceId}:`, err);
    } finally {
        await client.close();
    }
}