import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

async function testFetch() {
    try {
        console.log("Fetching quote for AAPL...");
        const quote = await yahooFinance.quote('AAPL');
        console.log("Quote keys:", Object.keys(quote));
        console.log("regularMarketPreviousClose:", quote.regularMarketPreviousClose);
        console.log("targetMeanPrice:", quote.targetMeanPrice); // Check if this exists

        if (!quote.targetMeanPrice) {
            console.log("\nFetching quoteSummary for AAPL with financialData...");
            const summary = await yahooFinance.quoteSummary('AAPL', { modules: ['financialData'] });
            console.log("Financial Data keys:", Object.keys(summary.financialData));
            console.log("targetMeanPrice from summary:", summary.financialData.targetMeanPrice);
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

testFetch();
