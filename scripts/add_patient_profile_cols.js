import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from root
dotenv.config({ path: path.join(__dirname, '../.env') });

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL not found in .env");
    process.exit(1);
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    const client = await pool.connect();
    try {
        console.log('🔄 Adding behavioral profile fields to patients table...');

        const queries = [
            `ALTER TABLE patients ADD COLUMN IF NOT EXISTS temperament VARCHAR(50);`,
            `ALTER TABLE patients ADD COLUMN IF NOT EXISTS main_motivation VARCHAR(100);`,
            `ALTER TABLE patients ADD COLUMN IF NOT EXISTS conscience_level VARCHAR(50);`
        ];

        for (const query of queries) {
            await client.query(query);
        }

        console.log('✅ Columns added successfully!');

    } catch (e) {
        console.error('❌ Migration failed:', e);
    } finally {
        client.release();
        await pool.end();
    }
}

run();
