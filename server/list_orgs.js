
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
        console.log("--- Listing Organizations ---");
        const res = await pool.query('SELECT id, name, slug FROM organization');
        console.log(JSON.stringify(res.rows, null, 2));
        fs.writeFileSync('server/orgs_log.txt', JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

run();
