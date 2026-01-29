
import pg from 'pg';
const { Client } = pg;

const client = new Client({
    connectionString: 'postgresql://neondb_owner:npg_aTCURwPX20Au@ep-dawn-cloud-ahadf3o4-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    try {
        await client.connect();

        console.log('\n--- ADDING COLUMN: recipient_professional_id ---');
        await client.query(`
            ALTER TABLE conversations 
            ADD COLUMN IF NOT EXISTS recipient_professional_id INTEGER REFERENCES professionals(id);
        `);
        console.log('Column added successfully.');

        console.log('\n--- VERIFY SCHEMA ---');
        const cols = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'conversations'
        `);
        console.table(cols.rows);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

migrate();
