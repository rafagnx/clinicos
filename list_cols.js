import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'blocked_days'");
        console.log('COLUMNS:', res.rows.map(c => c.column_name).join(', '));

        const idx = await pool.query("SELECT indexname FROM pg_indexes WHERE tablename = 'blocked_days'");
        console.log('INDEXES:', idx.rows.map(x => x.indexname).join(', '));

        const h = await pool.query("SELECT conname FROM pg_constraint WHERE conrelid = 'holidays'::regclass");
        console.log('HOLIDAY CONSTRAINTS:', h.rows.map(x => x.conname).join(', '));

    } catch (e) {
        console.error('ERROR:', e.message);
    } finally {
        await pool.end();
    }
}

run();
