const { Pool } = require('pg');
const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_aTCURwPX20Au@ep-dawn-cloud-ahadf3o4-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

async function addReadBy() {
    try {
        await pool.query('ALTER TABLE messages ADD COLUMN IF NOT EXISTS read_by TEXT[]');
        console.log('read_by column added successfully');
    } catch (e) {
        console.error('Failed to add read_by:', e);
    } finally {
        await pool.end();
    }
}

addReadBy();
