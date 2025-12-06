import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { getStockData } from '@/lib/fmp';
import { getYahooData } from '@/lib/yahoo';
import { scrapeStocks } from '@/lib/scraper';

// Initialize Redis
// Requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in .env.local
const RedisClient = Redis.fromEnv();

// In case the DB is empty or fails, we need a list of symbols to start with.
const FALLBACK_SYMBOLS = [
    'AAPL', 'MSFT', 'AMZN', 'NVDA', 'GOOGL', 'GOOG', 'META', 'TSLA', 'AVGO', 'PEP',
    'COST', 'CSCO', 'TMUS', 'ADBE', 'TXN', 'NFLX', 'CMCSA', 'AMD', 'QCOM', 'INTC',
    'HON', 'AMGN', 'INTU', 'BKNG', 'AMAT', 'SBUX', 'ISRG', 'MDLZ', 'GILD', 'ADP'
];

export async function GET(request) {
    // 1. Fetch current data from Redis
    let dbData = null;
    try {
        dbData = await RedisClient.get('stocks_data');
    } catch (e) {
        console.error("Redis error:", e);
    }

    if (!dbData) {
        dbData = { stocks: [], lastUpdated: null };
    }
    const { stocks, lastUpdated } = dbData;

    // 2. Check for force refresh param
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const isCacheValid = lastUpdated && (now - lastUpdated) < oneDay;

    if (!force && isCacheValid && stocks.length > 0) {
        return NextResponse.json({
            stocks,
            lastUpdated,
            source: 'cache'
        });
    }

    // 3. If cache is invalid or empty, fetch fresh data
    try {
        let symbols = [];
        const MIN_STOCKS = 50; // If cache has fewer than this, we assume it's incomplete (fallback list)

        // Use existing symbols from DB if available AND sufficient
        if (stocks.length > MIN_STOCKS) {
            symbols = stocks.map(s => s.symbol);
        } else {
            console.log(`Cache has only ${stocks.length} stocks. Attempting to scrape full list...`);
            // DB is empty or incomplete, try to scrape the official list
            try {
                const scrapedList = await scrapeStocks();
                if (scrapedList && scrapedList.length > 0) {
                    symbols = scrapedList.map(s => s.symbol);
                }
            } catch (err) {
                console.error("Scraping failed", err);
            }
        }

        // Last resort
        if (symbols.length === 0) {
            // Check if we at least have the partial cache to fall back on
            if (stocks.length > 0) {
                symbols = stocks.map(s => s.symbol);
            } else {
                symbols = FALLBACK_SYMBOLS;
            }
        }

        const updatedStocks = [];
        const batchSize = 5;

        for (let i = 0; i < symbols.length; i += batchSize) {
            const batch = symbols.slice(i, i + batchSize);
            const promises = batch.map(async (symbol) => {
                // Try FMP first
                let fmpData = await getStockData(symbol);

                // If FMP fails, try Yahoo
                if (!fmpData) {
                    const yahooData = await getYahooData(symbol);
                    if (yahooData) {
                        return yahooData;
                    }
                } else {
                    return {
                        symbol: fmpData.symbol,
                        name: fmpData.name,
                        price: fmpData.price,
                        change: fmpData.change,
                        percentChange: `${fmpData.changePercentage.toFixed(2)}%`,
                        marketCap: fmpData.marketCap.toLocaleString(),
                        volume: fmpData.volume,
                        dayLow: fmpData.dayLow,
                        dayHigh: fmpData.dayHigh,
                        yearLow: fmpData.yearLow,
                        yearHigh: fmpData.yearHigh,
                        exchange: fmpData.exchange,
                        timestamp: fmpData.timestamp
                    };
                }

                // Fallback to existing data if both fail
                return stocks.find(s => s.symbol === symbol);
            });

            const results = await Promise.all(promises);
            updatedStocks.push(...results.filter(Boolean));
        }

        // 4. Update Redis
        const newData = {
            stocks: updatedStocks,
            lastUpdated: now
        };
        await RedisClient.set('stocks_data', newData);

        return NextResponse.json({
            stocks: updatedStocks,
            lastUpdated: now,
            source: 'fresh'
        });

    } catch (error) {
        console.error('Error updating stocks:', error);
        // Fallback to cache if update fails
        return NextResponse.json({
            stocks,
            lastUpdated,
            source: 'cache-fallback',
            error: 'Failed to update data',
            details: error.message
        });
    }
}
