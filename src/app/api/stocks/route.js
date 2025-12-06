import { NextResponse } from 'next/server';
import { JSONFilePreset } from 'lowdb/node';
import { getStockData } from '@/lib/fmp';
import { getYahooData } from '@/lib/yahoo';

// Initialize lowdb
const defaultData = { stocks: [], lastUpdated: null };
const db = await JSONFilePreset('db.json', defaultData);

export async function GET(request) {
    await db.read();
    const { stocks, lastUpdated } = db.data;

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
        // Use existing symbols from DB if available, otherwise we might need a fallback list.
        // Assuming DB is populated from previous scrape.
        if (!stocks || stocks.length === 0) {
            return NextResponse.json({ error: 'No symbols found in DB to update' }, { status: 500 });
        }

        const symbols = stocks.map(s => s.symbol);
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
            updatedStocks.push(...results);
        }

        // Update DB
        db.data.stocks = updatedStocks;
        db.data.lastUpdated = now;
        await db.write();

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
            error: 'Failed to update data'
        });
    }
}
