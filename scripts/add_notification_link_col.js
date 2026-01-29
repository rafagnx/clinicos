
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
        console.log("Adding 'link' column to notifications table...");

        // Add column if not exists
        await pool.query(`
      ALTER TABLE notifications 
      ADD COLUMN IF NOT EXISTS link TEXT;
    `);

        console.log("✓ Column 'link' added successfully.");
    } catch (e) {
        console.error("Migration failed:", e);
    } finally {
        await pool.end();
    }
}

run();
