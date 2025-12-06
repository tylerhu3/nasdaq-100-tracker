import { scrapeStocks } from './src/lib/scraper.js';

async function test() {
    console.log('Starting scrape...');
    const stocks = await scrapeStocks();
    console.log(`Found ${stocks.length} stocks.`);
    if (stocks.length > 0) {
        console.log('First 5 stocks:', stocks.slice(0, 5));
    } else {
        console.log('No stocks found. Check selectors.');
    }
}

test();
