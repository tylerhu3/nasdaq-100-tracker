import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();

export async function getYahooData(symbol) {
    console.log(`Fetching ${symbol} from Yahoo...`);
    try {
        const quote = await yahooFinance.quote(symbol);
        let targetMeanPrice = null;

        try {
            const summary = await yahooFinance.quoteSummary(symbol, { modules: ['financialData'] });
            if (summary && summary.financialData && summary.financialData.targetMeanPrice) {
                targetMeanPrice = summary.financialData.targetMeanPrice;
            }
        } catch (e) {
            console.warn(`Yahoo quoteSummary failed for ${symbol}:`, e.message);
        }

        if (quote) {
            console.log(`Success Yahoo ${symbol} ${quote}`);
            return {
                symbol: quote.symbol,
                name: quote.longName || quote.shortName,
                price: quote.regularMarketPrice,
                change: quote.regularMarketChange,
                percentChange: `${(quote.regularMarketChangePercent || 0).toFixed(2)}%`,
                marketCap: (quote.marketCap || 0).toLocaleString(),
                volume: quote.regularMarketVolume,
                dayLow: quote.regularMarketDayLow,
                dayHigh: quote.regularMarketDayHigh,
                yearLow: quote.fiftyTwoWeekLow,
                yearHigh: quote.fiftyTwoWeekHigh,
                exchange: quote.exchange,
                timestamp: Math.floor(Date.now() / 1000),
                previousClose: quote.regularMarketPreviousClose,
                targetMeanPrice: targetMeanPrice
            };
        }
        console.warn(`Yahoo returned no data for ${symbol}`);
        return null;
    } catch (error) {
        console.error(`Error fetching data for ${symbol} from Yahoo:`, error.message);
        return null;
    }
}
