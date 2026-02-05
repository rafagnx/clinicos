import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function inspect() {
    try {
        const tables = ['conversations', 'messages'];
        for (const table of tables) {
            const res = await pool.query(`SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = '${table}'`);
            console.log(`\n=== DATA_${table} ===`);
            res.rows.forEach(r => console.log(JSON.stringify(r)));
        }
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
inspect();
