
import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();

async function checkQuote() {
    console.log("--- Inspecting TSLA Quote Object ---");
    try {
        const quote = await yahooFinance.quote('TSLA');
        // Check for ANY key that looks like a price target
        const keys = Object.keys(quote).filter(k => k.toLowerCase().includes('target') || k.toLowerCase().includes('mean'));

        console.log("Matching keys found in quote:", keys);
        console.log("Direct access attempt (quote.targetMeanPrice):", quote.targetMeanPrice);
    } catch (e) {
        console.error(e);
    }
}

checkQuote();
