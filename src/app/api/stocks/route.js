import { NextResponse } from 'next/server';
import {
    getCachedStocks,
    updateStockCache,
    refreshAllStocks
} from '@/lib/stockService';

export async function GET(request) {
    console.log(`[API] GET Request to /api/stocks - URL: ${request.url}`);

    // 1. Fetch current data from Cache (Redis)
    const { stocks, lastUpdated } = await getCachedStocks();

    // 2. Check for force refresh param
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const isCacheValid = lastUpdated && (now - lastUpdated) < oneDay;

    if (!force && isCacheValid && stocks.length > 0) {
        console.log(`[API] Returning cached data. Stock count: ${stocks.length}, Last Updated: ${new Date(lastUpdated).toISOString()}`);
        return NextResponse.json({
            stocks,
            lastUpdated,
            source: 'cache'
        });
    }

    // 3. If cache is invalid or empty, fetch fresh data
    try {
        console.log('[API] Cache invalid or force refresh. Fetching fresh data...');
        const updatedStocks = await refreshAllStocks(stocks);
        console.log(`[API] Fresh data fetched. Updated stock count: ${updatedStocks.length}`);

        // 4. Update Cache
        const newData = {
            stocks: updatedStocks,
            lastUpdated: now
        };
        await updateStockCache(newData);

        console.log('[API] Cache updated.');
        return NextResponse.json({
            stocks: updatedStocks,
            lastUpdated: now,
            source: 'fresh'
        });

    } catch (error) {
        console.error('[API] Error updating stocks:', error);
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
