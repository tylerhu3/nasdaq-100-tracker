import { JSONFilePreset } from 'lowdb/node';

/**
 * Database Configuration
 * 
 * This file sets up a lightweight, local JSON database using 'lowdb'.
 * It persists data to 'db.json' in the project root.
 * 
 * Structure:
 * - stocks: Array of stock objects (symbol, price, changes, etc.)
 * - lastUpdated: Timestamp of the last successful data fetch
 */

// Initialize DB with default data
// If db.json doesn't exist, it will be created with this structure
const defaultData = { stocks: [], lastUpdated: null };

// Create the database instance
// JSONFilePreset is a helper that sets up the adapter and reads the file
const db = await JSONFilePreset('db.json', defaultData);

export default db;
