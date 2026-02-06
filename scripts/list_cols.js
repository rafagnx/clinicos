import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
async function checkCols() {
    const tables = ['user', 'patients', 'professionals'];
    for (const table of tables) {
        const res = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = '${table}'`);
        console.log(`Columns for ${table}:`, res.rows.map(r => r.column_name).join(', '));
    }
    await pool.end();
}
checkCols();
