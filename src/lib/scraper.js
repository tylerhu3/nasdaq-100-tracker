import axios from 'axios';


const API_URL = 'https://api.nasdaq.com/api/quote/list-type/nasdaq100';

export async function scrapeStocks() {
    try {
        const { data } = await axios.get(API_URL, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (data?.data?.data?.rows) {
            return data.data.data.rows.map(stock => ({
                symbol: stock.symbol,
                name: stock.companyName,
                price: stock.lastSalePrice,
                change: stock.netChange,
                percentChange: stock.percentageChange,
                marketCap: stock.marketCap
            }));
        }

        return [];
    } catch (error) {
        console.error('API fetch failed:', error);
        return [];
    }
}
