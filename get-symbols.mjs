import { scrapeStocks } from './src/lib/scraper.js';

async function main() {
    try {
        const stocks = await scrapeStocks();
        if (stocks.length > 0) {
            const symbols = stocks.map(s => s.symbol);
            console.log(JSON.stringify(symbols)); // Single line for easier copy-paste or parsing if needed, or nicely formatted
        } else {
            console.error("No stocks found");
        }
    } catch (e) {
        console.error(e);
    }
}
main();
