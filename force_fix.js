import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        console.log('Attempting to drop NOT NULL from professional_id...');
        const res = await pool.query('ALTER TABLE "blocked_days" ALTER COLUMN "professional_id" DROP NOT NULL');
        console.log('RESULT:', res);

        const check = await pool.query(`
            SELECT is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'blocked_days' AND column_name = 'professional_id'
        `);
        console.log('NEW NULLABILITY:', check.rows[0].is_nullable);

    } catch (e) {
        console.error('ERROR:', e.message);
    } finally {
        await pool.end();
    }
}

run();
