
import { getYahooData } from './src/lib/yahoo.js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function verify() {
    console.log("--- Verifying Yahoo Finance Data ---");

    const stocks = ["TSLA", "COST", "AAPL"];

    for (const symbol of stocks) {
        console.log(`\nFetching ${symbol}...`);
        const data = await getYahooData(symbol);

        if (data) {
            console.log(`[PASS] ${symbol} fetched successfully.`);
            console.log(`       Price: ${data.price}`);
            console.log(`       1y Target: ${data.targetMeanPrice}`);
            if (data.targetMeanPrice) {
                console.log(`[PASS] 1y Target is present.`);
            } else {
                console.log(`[WARN] 1y Target is MISSING.`);
            }
        } else {
            console.log(`[FAIL] Failed to fetch ${symbol}`);
        }
    }
}

verify();
