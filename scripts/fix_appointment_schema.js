import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
        console.log('🔄 Fixing Appointments table schema...');

        const queries = [
            `ALTER TABLE appointments ADD COLUMN IF NOT EXISTS source VARCHAR(255);`,
            `ALTER TABLE appointments ADD COLUMN IF NOT EXISTS promotion_id INTEGER;`,
            `ALTER TABLE appointments ADD COLUMN IF NOT EXISTS scheduled_by VARCHAR(255);`,
            `ALTER TABLE appointments ADD COLUMN IF NOT EXISTS procedure_name VARCHAR(255);`
        ];

        for (const query of queries) {
            await client.query(query);
            console.log(`✅ Executed: ${query}`);
        }

        console.log('🎉 Schema update completed successfully!');

    } catch (e) {
        console.error('❌ Migration failed:', e);
    } finally {
        client.release();
        await pool.end();
    }
}

run();
