import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function listAll() {
    const client = await pool.connect();
    try {
        const res = await client.query(`
            SELECT table_name, column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name LIKE '%clinic_settings%'
            ORDER BY table_name, column_name;
        `);
        console.log("Found columns:", JSON.stringify(res.rows, null, 2));
    } finally {
        client.release();
        process.exit(0);
    }
}

listAll();
