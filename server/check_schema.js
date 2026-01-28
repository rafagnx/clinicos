
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
        console.log("--- Checking pending_invites ---");
        // Get column names
        const res = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'pending_invites';
        `);

        const cols = res.rows.map(r => `${r.column_name} (${r.data_type})`);
        console.log(cols);
        fs.writeFileSync('server/schema_log.txt', JSON.stringify(cols, null, 2));

    } catch (err) {
        console.error(err);
        fs.writeFileSync('server/schema_log.txt', "ERROR: " + err.message);
    } finally {
        await pool.end();
    }
}

run();
