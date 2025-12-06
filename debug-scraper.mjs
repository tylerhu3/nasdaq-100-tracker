import axios from 'axios';
import fs from 'fs';

const URL = 'https://www.nasdaq.com/market-activity/quotes/nasdaq-ndx-index';

async function debug() {
    try {
        const { data } = await axios.get(URL, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        fs.writeFileSync('debug.html', data);
        console.log('Saved HTML to debug.html');
    } catch (error) {
        console.error('Failed:', error);
    }
}

debug();
