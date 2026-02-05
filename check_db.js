import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '.env');
dotenv.config({ path: envPath });

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function check() {
    try {
        const res = await pool.query('SELECT * FROM blocked_days');
        console.log('COUNT:', res.rows.length);
        console.log('ROWS:', JSON.stringify(res.rows, null, 2));
    } catch (e) {
        console.error('ERROR:', e.message);
    } finally {
        await pool.end();
    }
}

check();
