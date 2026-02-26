import fs from 'fs';
import path from 'path';

const ACCOUNTS_FILE = path.join(process.cwd(), 'accounts.json');

/**
 * Load accounts from JSON file
 * @returns {Array} Array of account objects
 */
export function loadAccounts() {
    try {
        if (fs.existsSync(ACCOUNTS_FILE)) {
            const data = fs.readFileSync(ACCOUNTS_FILE, 'utf8');
            return JSON.parse(data);
        }
        return [];
    } catch (error) {
        console.error('Error loading accounts:', error);
        return [];
    }
}

/**
 * Save accounts to JSON file
 * @param {Array} accounts - Array of account objects
 * @returns {boolean} Success status
 */
export function saveAccounts(accounts) {
    try {
        // Ensure data directory exists (root usually exists)
        // const dataDir = path.dirname(ACCOUNTS_FILE);
        // if (!fs.existsSync(dataDir)) {
        //     fs.mkdirSync(dataDir, { recursive: true });
        // }

        fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving accounts:', error);
        return false;
    }
}
