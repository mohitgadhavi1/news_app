import { processUncategorizedNews } from './newsCategoryGeneration.js';
import { logger } from './logger.js';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
    logger.info('🕒 Running category generation job...');
    try {
        await processUncategorizedNews();
        logger.info('✅ Category generation job completed.');
    } catch (error) {
        logger.error('❌ Category generation job failed:', error);
        process.exit(1);
    }
}

main();
