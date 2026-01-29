import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_aTCURwPX20Au@ep-dawn-cloud-ahadf3o4-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

const TARGET_EMAILS = ['letty-galhardojandre@outlook.com', 'satyro.tainara06@gmail.com'];
const ORG_ID = 'bc550e05-d94f-461e-92da-bd3e3c8e2460'; // Orofacial

async function inspectMissing() {
    const client = await pool.connect();
    try {
        console.log('--- SEARCHING USERS ---');
        // Check public.users (if it exists) or try to find where users are stored
        // Assuming there is a users table synced from auth
        try {
            const users = await client.query(`SELECT * FROM "users" WHERE email = ANY($1)`, [TARGET_EMAILS]);
            console.log('Found in public.users:', users.rows);
        } catch (e) {
            console.log('Could not query public.users:', e.message);
        }

        console.log('\n--- SEARCHING PROFESSIONALS ---');
        try {
            const pros = await client.query(`SELECT * FROM "professionals" WHERE email = ANY($1)`, [TARGET_EMAILS]);
            console.log('Found in professionals:', pros.rows);
        } catch (e) { console.log(e.message); }

        console.log('\n--- ALL PROS IN ORG ---');
        const allPros = await client.query(`SELECT id, full_name, email, role_type FROM professionals WHERE organization_id = $1`, [ORG_ID]);
        console.table(allPros.rows);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

inspectMissing();
