import { getYahooData } from './src/lib/yahoo.js';

async function test() {
    console.log('Testing Yahoo Finance Adapter...');
    const symbol = 'AAPL';
    const data = await getYahooData(symbol);
    if (data) {
        console.log('Success:', data);
    } else {
        console.error('Failed to get data for', symbol);
    }
}

test();
