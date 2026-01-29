
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../server/.env') });

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function inspect() {
    try {
        console.log("Inspecting 'conversations' table...");
        const res = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'conversations';
        `);
        console.table(res.rows);

        console.log("\nInspecting 'messages' table...");
        const resMsg = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'messages';
        `);
        console.table(resMsg.rows);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        pool.end();
    }
}

inspect();
