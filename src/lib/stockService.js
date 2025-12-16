import { Redis } from '@upstash/redis';
import { getStockData } from '@/lib/fmp';
import { getYahooData } from '@/lib/yahoo';
import { scrapeStocks } from '@/lib/scraper';

const RedisClient = Redis.fromEnv();

export const FALLBACK_SYMBOLS = [
    "AAPL", "AMAT", "AMGN", "CMCSA", "INTC", "KLAC", "PCAR", "CTAS", "PAYX", "LRCX",
    "ADSK", "ROST", "MNST", "MSFT", "ADBE", "FAST", "EA", "CSCO", "REGN", "IDXX",
    "VRTX", "BIIB", "ODFL", "QCOM", "GILD", "SNPS", "SBUX", "INTU", "MCHP", "ORLY",
    "COST", "CPRT", "ASML", "TTWO", "AMZN", "MSTR", "CTSH", "CSGP", "NVDA", "BKNG",
    "ON", "ISRG", "MRVL", "ADI", "AEP", "AMD", "ADP", "AZN", "CDNS", "CSX",
    "HON", "MAR", "MU", "XEL", "EXC", "PEP", "ROP", "TXN", "AXON", "MDLZ",
    "NFLX", "GOOGL", "DXCM", "TMUS", "LULU", "MELI", "KDP", "AVGO", "VRSK", "FTNT",
    "CHTR", "TSLA", "NXPI", "FANG", "META", "PANW", "WDAY", "CDW", "GOOG", "PYPL",
    "SHOP", "KHC", "TEAM", "CCEP", "TTD", "BKR", "ZS", "PDD", "CRWD", "DDOG",
    "PLTR", "ABNB", "DASH", "APP", "GFS", "CEG", "WBD", "GEHC", "LIN", "ARM",
    "TRI"
];

export async function getCachedStocks() {
    try {
        const dbData = await RedisClient.get('stocks_data');
        return dbData || { stocks: [], lastUpdated: null };
    } catch (e) {
        console.error("Redis error:", e);
        return { stocks: [], lastUpdated: null };
    }
}

export async function updateStockCache(data) {
    try {
        await RedisClient.set('stocks_data', data);
    } catch (e) {
        console.error("Redis set error:", e);
    }
}

export async function resolveSymbols(currentStocks) {
    let symbols = [];

    // Use existing symbols from DB if available
    if (currentStocks.length > 0) {
        symbols = currentStocks.map(s => s.symbol);
    } else {
        // DB is empty, try to scrape the official list
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
        symbols = FALLBACK_SYMBOLS;
    }

    return symbols;
}

export async function fetchStockWithFallback(symbol, existingStock = null) {
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
            timestamp: fmpData.timestamp,
            previousClose: fmpData.previousClose,
            targetMeanPrice: null // FMP requires separate call for this, leaving as null for now
        };
    }

    // Fallback to existing data if both fail
    return existingStock;
}

export async function refreshAllStocks(currentStocks) {
    const symbols = await resolveSymbols(currentStocks);
    const updatedStocks = [];
    const batchSize = 5;

    for (let i = 0; i < symbols.length; i += batchSize) {
        const batch = symbols.slice(i, i + batchSize);
        const promises = batch.map(async (symbol) => {
            const existingStock = currentStocks.find(s => s.symbol === symbol);
            return fetchStockWithFallback(symbol, existingStock);
        });

        const results = await Promise.all(promises);
        updatedStocks.push(...results.filter(Boolean));
    }

    return updatedStocks;
}
