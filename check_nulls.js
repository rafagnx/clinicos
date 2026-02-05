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
            SELECT column_name, is_nullable, column_default, data_type
            FROM information_schema.columns 
            WHERE table_name = 'blocked_days'
        `);
        console.log('COLUMNS INFO:');
        res.rows.forEach(c => console.log(`${c.column_name}: Nullable=${c.is_nullable}, Default=${c.column_default}, Type=${c.data_type}`));

        const constraints = await pool.query(`
            SELECT conname, pg_get_constraintdef(c.oid)
            FROM pg_constraint c
            JOIN pg_namespace n ON n.oid = c.connamespace
            WHERE conrelid = 'blocked_days'::regclass
        `);
        console.log('\nCONSTRAINTS:');
        constraints.rows.forEach(r => console.log(`${r.conname}: ${r.pg_get_constraintdef}`));

    } catch (e) {
        console.error('ERROR:', e.message);
    } finally {
        await pool.end();
    }
}

run();
