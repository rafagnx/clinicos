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
        console.log('🔄 Adding source field to appointments table...');
        
        // Add column
        await client.query(`
            ALTER TABLE appointments 
            ADD COLUMN IF NOT EXISTS source VARCHAR(100);
        `);
        
        console.log('✅ Column source added successfully!');

        // Add column to treatment plans as well (future proofing)
         await client.query(`
            ALTER TABLE treatment_plans
            ADD COLUMN IF NOT EXISTS source VARCHAR(100);
        `);
         console.log('✅ Column source added to treatment_plans successfully!');

    } catch (e) {
        console.error('❌ Migration failed:', e);
    } finally {
        client.release();
        await pool.end();
    }
}

run();
