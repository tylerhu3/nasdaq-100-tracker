import axios from 'axios';

const BASE_URL = 'https://financialmodelingprep.com/stable';

export async function getStockData(symbol) {
    const apiKey = process.env.FMP_API_KEY;
    if (!apiKey) {
        console.error('FMP_API_KEY is not defined');
        return null;
    }

    // console.log(`Fetching ${symbol} from FMP...`);
    try {
        const response = await axios.get(`${BASE_URL}/quote`, {
            params: {
                symbol: symbol,
                apikey: apiKey,
            },
        });

        if (response.data && response.data.length > 0) {
            console.log(`Success FMP ${symbol}`);
            return response.data[0];
        }
        console.warn(`FMP returned no data for ${symbol}`);
        return null;
    } catch (error) {
        console.error(`Error fetching data for ${symbol} from FMP:`, error.message);
        return null;
    }
}
