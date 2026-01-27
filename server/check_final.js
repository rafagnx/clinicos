import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config(); // Root
dotenv.config({ path: path.join(__dirname, '.env') }); // Server

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function check() {
    console.log("DB URL (masked):", process.env.DATABASE_URL.replace(/:[^:@]+@/, ':***@'));
    const client = await pool.connect();
    try {
        const res = await client.query("SELECT current_database(), current_user");
        console.log("DB Context:", res.rows[0]);

        const cols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'clinic_settings'");
        console.log("Columns:", cols.rows.map(r => r.column_name));
    } finally {
        client.release();
        process.exit(0);
    }
}

check();
