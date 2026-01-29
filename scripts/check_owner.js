import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_aTCURwPX20Au@ep-dawn-cloud-ahadf3o4-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

const EMAIL = 'marketingorofacial@gmail.com';

async function checkOwner() {
    const client = await pool.connect();
    try {
        console.log(`Checking professional record for: ${EMAIL}`);
        const res = await client.query('SELECT * FROM professionals WHERE email = $1', [EMAIL]);
        if (res.rows.length === 0) {
            console.log('❌ Not found in professionals table.');
        } else {
            console.log('✅ Found:', res.rows[0]);
        }
    } catch (err) {
        console.error(err);
    } finally {
        client.release();
        await pool.end();
    }
}

checkOwner();
