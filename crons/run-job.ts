import { fetchAndStoreNews } from './fetch-news.js';
import { processUncategorizedNews } from './newsCategoryGeneration.js';
import { logger } from './logger.js';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
    const args = process.argv.slice(2);

    if (args.includes('--category-gen')) {
        logger.info('🕒 Running category generation job...');
        try {
            await processUncategorizedNews();
            logger.info('✅ Category generation job completed.');
        } catch (error) {
            logger.error('❌ Category generation job failed:', error);
            process.exit(1);
        }
    } else {
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
            console.error('  npx tsx crons/run-job.ts --category-gen');
            process.exit(1);
        }
    }
}

main();
