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
        console.log('🔄 Adding "type" column to appointments...');

        await client.query(`
            ALTER TABLE appointments 
            ADD COLUMN IF NOT EXISTS type VARCHAR(50);
        `);

        console.log('✅ Added "type" column.');

        // Also checking if promotion_id needs to be INTEGER or UUID
        // Most IDs here are integers (patient_id: 2930). 
        // If promotion_id is UUID but promotions table uses INT, it's a mismatch.
        // But changing column type is risky if data exists. 
        // For now, type is the guaranteed crasher.

    } catch (e) {
        console.error('❌ Migration failed:', e);
    } finally {
        client.release();
        await pool.end();
    }
}

run();
