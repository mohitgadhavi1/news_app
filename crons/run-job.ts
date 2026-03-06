import { fetchAndStoreNews } from './fetch-news.js';
import { logger } from './logger.js';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
    const args = process.argv.slice(2);
    const sourceIndex = args.indexOf('--source-id');
    if (sourceIndex !== -1 && args[sourceIndex + 1]) {
        const sourceId = args[sourceIndex + 1];
        logger.info(`🕒 Running fetch job for source ID: ${sourceId}...`);
        try {
            await fetchAndStoreNews(sourceId);
            logger.info(`✅ Fetch job for source ID: ${sourceId} completed.`);
        } catch (error) {
            logger.error(`❌ Fetch job for source ID: ${sourceId} failed:`, error);
            process.exit(1);
        }
    } else {
        console.error('Usage:');
        console.error('  npx tsx crons/run-job.ts --source-id <id>');
        process.exit(1);
    }
}

main();
