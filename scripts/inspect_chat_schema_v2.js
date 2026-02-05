
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

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
        res.rows.forEach(row => console.log(JSON.stringify(row)));

        console.log("\nInspecting 'messages' table...");
        const resMsg = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'messages';
        `);
        resMsg.rows.forEach(row => console.log(JSON.stringify(row)));

    } catch (err) {
        console.error("Error:", err);
    } finally {
        pool.end();
    }
}

inspect();
