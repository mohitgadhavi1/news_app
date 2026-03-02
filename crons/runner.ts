import cron from 'node-cron';
import { fetchAndStoreNews } from './fetch-news.js';
import { processUncategorizedNews } from './newsCategoryGeneration.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from './logger.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const apiSourcesPath = path.join(__dirname, 'api_news_sources.json');
let apiSources = [];
try {
    apiSources = JSON.parse(fs.readFileSync(apiSourcesPath, 'utf8'));
} catch (error) {
    logger.error('Failed to load api_news_sources.json', error);
}

logger.info('🚀 Cron runner started...');

async function runJob(sourceId: string, sourceName: string) {
    logger.info(`🕒 Running scheduled fetch for ${sourceName}...`);
    try {
        await fetchAndStoreNews(sourceId);
        logger.info(`✅ ${sourceName} job completed.`);
    } catch (error) {
        logger.error(`❌ ${sourceName} job failed:`, error);
    }
}

// 1. Seeking Alpha (ID: "3") - Limit 500/mo. Run every 2 hours on the hour.
cron.schedule('0 */2 * * *', () => runJob("3", "Seeking Alpha"));

// 2. NewsAPI (ID: "2") - Limit 100/day. Run every 2 hours at 30 minutes past.
cron.schedule('30 */2 * * *', () => runJob("2", "NewsAPI"));

// 3. GNews (ID: "1") - Limit 100/day. Run every 2 hours at 15 minutes past.
cron.schedule('15 */2 * * *', () => runJob("1", "GNews"));

// 4. News Category Generation - RPM=5, RPD=20. Run every 15 minutes.
cron.schedule('*/15 * * * *', async () => {
    logger.info('🕒 Running scheduled category generation...');
    await processUncategorizedNews();
});

logger.info('⚡ Running initial fetch for all sources... ');
const initialRun = async () => {
    for (const source of apiSources) {
        await runJob(source.id, source.name);
    }
    logger.info('🤖 Running initial category generation...');
    await processUncategorizedNews();
    logger.info('🏁 Initial tasks completed. Waiting for scheduled crons...');
};

initialRun();
