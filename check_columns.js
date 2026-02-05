import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkSchema() {
    try {
        const res = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'blocked_days'
        `);
        console.log('COLUMNS:', JSON.stringify(res.rows, null, 2));
    } catch (e) {
        console.error('ERROR:', e.message);
    } finally {
        await pool.end();
    }
}

checkSchema();
