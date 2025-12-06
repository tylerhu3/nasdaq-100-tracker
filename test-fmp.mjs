import { getStockData } from './src/lib/fmp.js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function test() {
    console.log('Testing FMP Adapter...');
    const symbol = 'AAPL';
    const data = await getStockData(symbol);
    if (data) {
        console.log('Success:', data);
    } else {
        console.error('Failed to get data for', symbol);
    }
}

test();
