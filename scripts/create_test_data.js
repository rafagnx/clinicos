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
        console.log('🛠️  Creating test data for Kris organization...\n');

        // 1. Create Professional "Kris Miranda"
        console.log('👩‍⚕️ Creating Professional...');
        const proResult = await client.query(`
            INSERT INTO professionals (name, specialty, phone, email, organization_id, status, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
            ON CONFLICT DO NOTHING
            RETURNING id, name
        `, ['Kris Miranda', 'Harmonização Orofacial', '11999999999', 'kris@orofacial.com', targetOrgId, 'active']);

        if (proResult.rows.length > 0) {
            console.log(`   ✅ Created: ${proResult.rows[0].name} (ID: ${proResult.rows[0].id})`);
        } else {
            const existingPro = await client.query(`SELECT id, name FROM professionals WHERE organization_id = $1 LIMIT 1`, [targetOrgId]);
            if (existingPro.rows.length > 0) {
                console.log(`   ℹ️ Already exists: ${existingPro.rows[0].name} (ID: ${existingPro.rows[0].id})`);
            }
        }

        // 2. Create Test Patient
        console.log('\n👤 Creating Test Patient...');
        const patResult = await client.query(`
            INSERT INTO patients (name, phone, email, cpf, organization_id, status, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
            ON CONFLICT DO NOTHING
            RETURNING id, name
        `, ['Paciente Teste Kris', '11988888888', 'paciente@teste.com', '12345678901', targetOrgId, 'active']);

        if (patResult.rows.length > 0) {
            console.log(`   ✅ Created: ${patResult.rows[0].name} (ID: ${patResult.rows[0].id})`);
        } else {
            const existingPat = await client.query(`SELECT id, name FROM patients WHERE organization_id = $1 LIMIT 1`, [targetOrgId]);
            if (existingPat.rows.length > 0) {
                console.log(`   ℹ️ Already exists: ${existingPat.rows[0].name} (ID: ${existingPat.rows[0].id})`);
            }
        }

        // 3. Summary
        console.log('\n📋 Current data for organization:');
        const pros = await client.query(`SELECT id, name FROM professionals WHERE organization_id = $1`, [targetOrgId]);
        const pats = await client.query(`SELECT id, name FROM patients WHERE organization_id = $1`, [targetOrgId]);

        console.log('\n   Professionals:');
        if (pros.rows.length === 0) console.log('     (none)');
        else pros.rows.forEach(r => console.log(`     ID ${r.id} - ${r.name}`));

        console.log('\n   Patients:');
        if (pats.rows.length === 0) console.log('     (none)');
        else pats.rows.forEach(r => console.log(`     ID ${r.id} - ${r.name}`));

        console.log('\n✅ Done! User should now logout/login and try creating an appointment.');

    } catch (e) {
        console.error('\n❌ ERROR:', e.message);
        console.error('   Detail:', e.detail);
    } finally {
        client.release();
        await pool.end();
    }
}

run();
