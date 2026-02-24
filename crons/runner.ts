import cron from 'node-cron';
import { fetchAndStoreNews } from './fetch-news.js';
import dotenv from 'dotenv';

dotenv.config();

console.log('🚀 Cron runner started...');

// Schedule fetch-news to run every hour
cron.schedule('0 * * * *', async () => {
    console.log('🕒 Running scheduled fetch-news job...', new Date().toLocaleString());
    try {
        await fetchAndStoreNews();
        console.log('✅ fetch-news job completed.');
    } catch (error) {
        console.error('❌ fetch-news job failed:', error);
    }
});

// Run immediately on start (optional, but good for testing)
console.log('⚡ Running initial fetch... ');
fetchAndStoreNews().then(() => {
    console.log('🏁 Initial fetch completed.');
});
