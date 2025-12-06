import yahooFinance from 'yahoo-finance2';

try {
    const yf = new yahooFinance();
    console.log('Instance created');
    console.log('Instance keys:', Object.keys(yf));
    console.log('Instance prototype keys:', Object.getOwnPropertyNames(Object.getPrototypeOf(yf)));
    console.log('Has quote?', typeof yf.quote);
} catch (e) {
    console.error('Error creating instance:', e);
}
