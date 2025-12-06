import * as yf from 'yahoo-finance2';
console.log('Keys:', Object.keys(yf));
console.log('Default:', yf.default);
try {
    console.log('Default is class?', yf.default.toString().substring(0, 50));
} catch (e) { }
