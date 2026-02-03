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
        console.log('🔍 Checking patients table structure...\n');

        const result = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'patients'
            ORDER BY ordinal_position
        `);

        const columns = result.rows.map(r => r.column_name);
        console.log('📋 Columns in patients table:', columns.join(', '));

        const newCols = ['temperature', 'behavioral_profile'];
        let added = false;

        for (const col of newCols) {
            if (!columns.includes(col)) {
                console.log(`❌ ${col} - MISSING. Adding...`);
                await client.query(`ALTER TABLE patients ADD COLUMN IF NOT EXISTS "${col}" VARCHAR(50);`);
                console.log(`✅ ${col} - ADDED.`);
                added = true;
            } else {
                console.log(`✅ ${col} - EXISTS.`);
            }
        }

        if (added) {
            console.log('\n🎉 Schema updated successfully!');
        } else {
            console.log('\n👍 Schema already up to date.');
        }

    } catch (e) {
        console.error('\n❌ ERROR:', e.message);
    } finally {
        client.release();
        await pool.end();
    }
}

run();
