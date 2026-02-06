import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function check() {
    try {
        const users = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'user'`);
        const patients = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'patients'`);
        const professionals = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'professionals'`);

        console.log('USER columns:', users.rows.map(r => r.column_name).join(', '));
        console.log('PATIENTS columns:', patients.rows.map(r => r.column_name).join(', '));
        console.log('PROFESSIONALS columns:', professionals.rows.map(r => r.column_name).join(', '));
    } catch (e) { console.error(e); }
    await pool.end();
}
check();
