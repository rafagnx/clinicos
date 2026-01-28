
import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function run() {
    try {
        console.log("--- Listing Tables ---");
        const res = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);

        const tables = res.rows.map(r => r.table_name);
        console.log(tables);
        fs.writeFileSync('server/tables_log.txt', tables.join('\n'));

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

run();
