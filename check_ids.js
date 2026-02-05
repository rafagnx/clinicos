import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        const res = await pool.query(`
            SELECT table_name, column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name IN ('blocked_days', 'professionals') 
            AND column_name IN ('id', 'professional_id')
        `);
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (e) {
        console.error('ERROR:', e.message);
    } finally {
        await pool.end();
    }
}

run();
