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
    const targetOrgId = '3f8cb77d-da2e-4820-919b-88dc59394bfb';

    try {
        // 1. Check schema of organization table
        console.log('📋 Organization Table Schema:');
        const schema = await client.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'organization'
            ORDER BY ordinal_position;
        `);
        schema.rows.forEach(r => console.log(`   ${r.column_name} (${r.data_type}) ${r.is_nullable === 'NO' ? 'NOT NULL' : ''}`));

        // 2. Check if org exists
        console.log('\n🔍 Checking existing organizations:');
        const orgs = await client.query('SELECT id, name FROM organization LIMIT 10');
        orgs.rows.forEach(r => console.log(`   ${r.id} - ${r.name}`));

        if (orgs.rows.length === 0) {
            console.log('   (No organizations found)');
        }

        // 3. Check what org_id is being used by existing professionals
        console.log('\n🔍 Checking professionals and their org_ids:');
        const pros = await client.query('SELECT id, name, organization_id FROM professionals LIMIT 5');
        pros.rows.forEach(r => console.log(`   ${r.id} - ${r.name} -> ${r.organization_id}`));

    } catch (e) {
        console.error('❌ ERROR:', e.message);
    } finally {
        client.release();
        await pool.end();
    }
}

run();
