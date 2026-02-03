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
        console.log('🛠️  Creating missing organization record...');

        // Schema: id, name, slug, logo, createdAt, updatedAt, subscription_status, metadata
        const result = await client.query(`
            INSERT INTO organization (id, name, slug, logo, "createdAt", "updatedAt", subscription_status, metadata)
            VALUES ($1, $2, $3, NULL, NOW(), NOW(), 'pro', '{}')
            ON CONFLICT (id) DO NOTHING
            RETURNING *
        `, [targetOrgId, 'Orofacial Clinic (Kris)', 'orofacial-kris']);

        if (result.rows.length > 0) {
            console.log('✅ Created organization:', result.rows[0]);
        } else {
            console.log('⚠️ Organization already exists or could not be created.');
        }

        // Verify
        const verify = await client.query('SELECT * FROM organization WHERE id = $1', [targetOrgId]);
        console.log('\n📋 Organization Record:', verify.rows[0]);

        // Re-test appointment insertion
        console.log('\n🔄 Re-testing Appointment INSERT...');
        const testData = {
            start_time: "2026-02-03T11:00:00.000Z",
            date: "2026-02-03",
            time: "08:00",
            scheduled_by: "Kris Miranda",
            promotion_id: null,
            source: "Tráfego Pago (Google)",
            patient_id: 2931,
            professional_id: 21,
            type: "Consulta",
            duration: 60,
            procedure_name: "Toxina Botulínica",
            end_time: "2026-02-03T12:00:00.000Z",
            organization_id: targetOrgId
        };

        const keys = Object.keys(testData);
        const values = keys.map(k => testData[k]);
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');

        const query = `INSERT INTO appointments (${keys.join(', ')}) VALUES (${placeholders}) RETURNING id`;

        const insertResult = await client.query(query, values);
        console.log('✅ SUCCESS! Inserted appointment ID:', insertResult.rows[0].id);

        // Cleanup test row
        await client.query('DELETE FROM appointments WHERE id = $1', [insertResult.rows[0].id]);
        console.log('🧹 Cleaned up test row.');

    } catch (e) {
        console.error('\n❌ POSTGRES ERROR:', e.message);
        console.error('   Detail:', e.detail);
        console.error('   Constraint:', e.constraint);
    } finally {
        client.release();
        await pool.end();
    }
}

run();
