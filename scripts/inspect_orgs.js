import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_aTCURwPX20Au@ep-dawn-cloud-ahadf3o4-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

async function listOrgs() {
    const client = await pool.connect();
    try {
        console.log('--- ORGANIZATIONS ---');
        const orgs = await client.query('SELECT id, name FROM organization');
        for (const org of orgs.rows) {
            const count = await client.query('SELECT count(*) FROM patients WHERE organization_id = $1', [org.id]);
            console.log(`[${org.id}] ${org.name} - Patients: ${count.rows[0].count}`);
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

listOrgs();
