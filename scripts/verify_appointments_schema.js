import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    const client = await pool.connect();

    try {
        console.log('🔍 Checking appointments table structure...\n');

        const result = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'appointments'
            ORDER BY ordinal_position
        `);

        console.log('📋 Columns in appointments table:');
        result.rows.forEach(r => {
            console.log(`   - ${r.column_name} (${r.data_type})`);
        });

        // Check specific columns we need
        const columns = result.rows.map(r => r.column_name);
        const required = ['source', 'scheduled_by', 'type', 'procedure_name', 'promotion_id'];

        console.log('\n🎯 Required columns check:');
        required.forEach(col => {
            if (columns.includes(col)) {
                console.log(`   ✅ ${col} - EXISTS`);
            } else {
                console.log(`   ❌ ${col} - MISSING`);
            }
        });

    } catch (e) {
        console.error('\n❌ ERROR:', e.message);
    } finally {
        client.release();
        await pool.end();
    }
}

run();
