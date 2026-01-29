import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_aTCURwPX20Au@ep-dawn-cloud-ahadf3o4-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

const TARGET_ORG_ID = 'bc550e05-d94f-461e-92da-bd3e3c8e2460'; // Orofacial Clinic

async function deletePatients() {
    const client = await pool.connect();
    try {
        console.log(`Checking patients for Org: ${TARGET_ORG_ID}`);

        const countResult = await client.query('SELECT count(*) FROM patients WHERE organization_id = $1', [TARGET_ORG_ID]);
        const count = parseInt(countResult.rows[0].count);

        console.log(`Found ${count} patients.`);

        if (count > 0) {
            console.log('Deleting...');
            await client.query('DELETE FROM patients WHERE organization_id = $1', [TARGET_ORG_ID]);
            console.log('✅ Deleted successfully.');
        } else {
            console.log('Nothing to delete.');
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

deletePatients();
