import { NextResponse } from 'next/server';
import { getStockData } from '@/lib/fmp';
import { getYahooData } from '@/lib/yahoo';

// Initialize in-memory cache (global to survive hot reloads in dev)
if (!global.stockCache) {
    global.stockCache = { stocks: [], lastUpdated: null };
}

// Fallback list of some major NASDAQ-100 symbols to bootstrap if cache is empty
const FALLBACK_SYMBOLS = [
    'AAPL', 'MSFT', 'AMZN', 'NVDA', 'GOOGL', 'GOOG', 'META', 'TSLA', 'AVGO', 'PEP',
    'COST', 'CSCO', 'TMUS', 'ADBE', 'TXN', 'NFLX', 'CMCSA', 'AMD', 'QCOM', 'INTC',
    'HON', 'AMGN', 'INTU', 'BKNG', 'AMAT', 'SBUX', 'ISRG', 'MDLZ', 'GILD', 'ADP'
];

export async function GET(request) {
    let { stocks, lastUpdated } = global.stockCache;

    // Check for force refresh param
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

    // If cache is invalid or empty, fetch fresh data
    try {
        // Use existing symbols from cache if available, otherwise use fallback list
        let symbols = stocks.length > 0 ? stocks.map(s => s.symbol) : FALLBACK_SYMBOLS;

        const updatedStocks = [];

        // Fetch data for each symbol
        // We'll do this in batches to avoid overwhelming the API or hitting timeouts, 
        // though FMP is pretty fast.
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

        // Update In-Memory Cache
        global.stockCache = {
            stocks: updatedStocks,
            lastUpdated: now
        };

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
