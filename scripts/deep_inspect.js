import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_aTCURwPX20Au@ep-dawn-cloud-ahadf3o4-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

async function deepInspect() {
    const client = await pool.connect();
    try {
        console.log('--- COLUMN CONSTRAINTS ---');
        const cols = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'professionals'
        `);
        console.table(cols.rows);

        console.log('\n--- ENUM: role_type ---');
        // Try to fetch enum values if postgres
        try {
            const result = await client.query(`
                SELECT unnest(enum_range(NULL::role_type)) as value
            `);
            console.log('Enum values:', result.rows.map(r => r.value));
        } catch (e) {
            console.log('Could not fetch enum role_type directly (might be text or different name).', e.message);
        }

        console.log('\n--- ENUM: user_role ---');
        try {
            const result = await client.query(`
                SELECT unnest(enum_range(NULL::user_role)) as value
            `);
            console.log('Enum values:', result.rows.map(r => r.value));
        } catch (e) { console.log(e.message); }

    } catch (err) {
        console.error(err);
    } finally {
        client.release();
        await pool.end();
    }
}

deepInspect();
