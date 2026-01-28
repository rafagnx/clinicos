
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
        console.log("--- Checking Columns ---");
        const tables = ['patients', 'appointments', 'professionals', 'notifications', 'promotions', 'leads', 'financial_transactions', 'clinic_settings', 'member'];

        const output = {};

        for (const t of tables) {
            const res = await pool.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = $1
            `, [t]);
            output[t] = res.rows.map(r => r.column_name).filter(c => c.toLowerCase().includes('org'));
        }

        console.log(JSON.stringify(output, null, 2));
        fs.writeFileSync('server/columns_log.txt', JSON.stringify(output, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

run();
