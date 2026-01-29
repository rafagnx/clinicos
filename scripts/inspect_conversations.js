
import pg from 'pg';
const { Client } = pg;

const client = new Client({
    connectionString: 'postgresql://neondb_owner:npg_aTCURwPX20Au@ep-dawn-cloud-ahadf3o4-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

async function deepInspect() {
    try {
        await client.connect();
        console.log('Connected to DB');

        console.log('--- FIND TABLE ---');
        const tables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name ILIKE '%onversat%'
        `);
        console.log('Tables found:', tables.rows);

        const tableName = tables.rows[0]?.table_name || 'conversations';

        console.log(`--- TABLE: ${tableName} ---`);
        const cols = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = '${tableName}'
        `);
        console.table(cols.rows);

        console.log('\n--- CONSTRAINTS ---');
        const constraints = await client.query(`
            SELECT conname, pg_get_constraintdef(oid) as def
            FROM pg_constraint
            WHERE conrelid = 'conversations'::regclass
        `);
        console.table(constraints.rows);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

deepInspect();
