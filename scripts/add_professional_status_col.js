
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function run() {
    try {
        console.log("Adding 'chat_status' column to professionals table...");

        // Add column if not exists
        await pool.query(`
      ALTER TABLE professionals 
      ADD COLUMN IF NOT EXISTS chat_status TEXT DEFAULT 'online';
    `);

        console.log("✓ Column 'chat_status' added successfully.");
    } catch (e) {
        console.error("Migration failed:", e);
    } finally {
        await pool.end();
    }
}

run();
