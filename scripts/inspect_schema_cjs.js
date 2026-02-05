const { Pool } = require('pg');
require('dotenv').config({ path: './.env' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function inspect() {
    try {
        const tables = ['conversations', 'messages'];
        for (const table of tables) {
            const res = await pool.query("SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = $1 ORDER BY column_name", [table]);
            console.log("\n--- " + table.toUpperCase() + " ---");
            res.rows.forEach(r => {
                console.log("COL:" + r.column_name + "|TYPE:" + r.data_type + "|NULL:" + r.is_nullable + "|DEF:" + r.column_default);
            });
        }
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
inspect();
