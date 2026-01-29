
import pg from 'pg';
const { Client } = pg;

const client = new Client({
    connectionString: 'postgresql://neondb_owner:npg_aTCURwPX20Au@ep-dawn-cloud-ahadf3o4-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    try {
        await client.connect();
        console.log('Connected to DB...');


        // Find correct table name
        const tables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name ILIKE 'conversation%'
        `);
        const tableName = tables.rows[0]?.table_name;
        if (!tableName) {
            console.error('❌ Could not find Conversation table!');
            return;
        }
        console.log(`Found table: "${tableName}"`);
        const quotedTable = `"${tableName}"`;

        // 1. Add recipient_professional_id
        try {
            await client.query(`
                ALTER TABLE ${quotedTable} 
                ADD COLUMN IF NOT EXISTS recipient_professional_id UUID REFERENCES professionals(id);
            `);
            console.log('✅ Added recipient_professional_id column');
        } catch (e) {
            console.log('Note on adding column:', e.message);
        }

        // 2. Make patient_id nullable
        try {
            await client.query(`
                ALTER TABLE ${quotedTable} 
                ALTER COLUMN patient_id DROP NOT NULL;
            `);
            console.log('✅ Made patient_id nullable');
        } catch (e) {
            console.log('Note on altering patient_id:', e.message);
        }

        console.log('Migration complete.');

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
}

migrate();
