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
        // Check if patient_id 2931 exists
        console.log('🔍 Checking patient_id = 2931:');
        const patient = await client.query('SELECT id, name, organization_id FROM patients WHERE id = 2931');
        if (patient.rows.length > 0) {
            console.log('   ✅ EXISTS:', patient.rows[0]);
        } else {
            console.log('   ❌ NOT FOUND');

            // Check all patients with similar IDs
            console.log('\n   Looking for patients near ID 2931...');
            const nearPatients = await client.query('SELECT id, name, organization_id FROM patients WHERE id BETWEEN 2925 AND 2935 ORDER BY id');
            nearPatients.rows.forEach(r => console.log(`   ${r.id} - ${r.name} (org: ${r.organization_id})`));
        }

        // Check if professional_id 21 exists
        console.log('\n🔍 Checking professional_id = 21:');
        const professional = await client.query('SELECT id, name, organization_id FROM professionals WHERE id = 21');
        if (professional.rows.length > 0) {
            console.log('   ✅ EXISTS:', professional.rows[0]);
        } else {
            console.log('   ❌ NOT FOUND');

            console.log('\n   Looking for all professionals...');
            const allPros = await client.query('SELECT id, name, organization_id FROM professionals ORDER BY id');
            allPros.rows.forEach(r => console.log(`   ${r.id} - ${r.name} (org: ${r.organization_id})`));
        }

        // Check patients for target organization
        console.log(`\n🔍 Patients in organization ${targetOrgId}:`);
        const orgPatients = await client.query('SELECT id, name FROM patients WHERE organization_id = $1 LIMIT 10', [targetOrgId]);
        if (orgPatients.rows.length > 0) {
            orgPatients.rows.forEach(r => console.log(`   ${r.id} - ${r.name}`));
        } else {
            console.log('   (No patients found for this org)');
        }

    } catch (e) {
        console.error('❌ ERROR:', e.message);
    } finally {
        client.release();
        await pool.end();
    }
}

run();
