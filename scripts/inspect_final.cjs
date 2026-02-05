const { Pool } = require('pg');
require('dotenv').config({ path: './.env' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function inspect() {
    try {
        const tables = ['conversations', 'messages'];
        for (const table of tables) {
            const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1", [table]);
            console.log(table + ": [" + res.rows.map(r => r.column_name).join(", ") + "]");
        }
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
inspect();
