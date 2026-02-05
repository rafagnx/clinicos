const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config({ path: './.env' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_aTCURwPX20Au@ep-dawn-cloud-ahadf3o4-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

async function exportSchema() {
    try {
        const tables = ['conversations', 'messages', 'conversation_members'];
        const schema = {};

        for (const table of tables) {
            const res = await pool.query(`
                SELECT column_name, data_type, is_nullable, column_default 
                FROM information_schema.columns 
                WHERE table_name = $1 
                ORDER BY ordinal_position
            `, [table]);
            schema[table] = res.rows;
        }

        fs.writeFileSync('scripts/db_schema_audit.json', JSON.stringify(schema, null, 2));
        console.log('Schema exported to scripts/db_schema_audit.json');
    } catch (e) {
        console.error('Export failed:', e);
    } finally {
        await pool.end();
    }
}

exportSchema();
