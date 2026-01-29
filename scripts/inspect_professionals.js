import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_aTCURwPX20Au@ep-dawn-cloud-ahadf3o4-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

async function inspectSchema() {
    const client = await pool.connect();
    try {
        console.log('--- TABLE SCHEMA: professionals ---');
        const cols = await client.query(`
            SELECT column_name, data_type, udt_name, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'professionals'
        `);
        console.table(cols.rows);

        // Check if there is an enum for role_type
        const enumCheck = await client.query(`
            SELECT t.typname as enum_name, e.enumlabel as enum_value
            FROM pg_type t 
            JOIN pg_enum e ON t.oid = e.enumtypid  
            JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
            WHERE t.typname = 'user_role' OR t.typname = 'role_type'
        `);
        console.log('--- ENUM VALUES ---');
        console.table(enumCheck.rows);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

inspectSchema();
