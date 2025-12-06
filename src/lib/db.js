import { JSONFilePreset } from 'lowdb/node';

// Initialize DB with default data
const defaultData = { stocks: [], lastUpdated: null };
const db = await JSONFilePreset('db.json', defaultData);

export default db;
