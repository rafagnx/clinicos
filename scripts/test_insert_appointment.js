import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL not found in .env");
    process.exit(1);
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    const client = await pool.connect();
    try {
        console.log('🔄 Simulating Appointment INSERT...\n');
        
        // Simulate exact payload from frontend
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
            organization_id: "3f8cb77d-da2e-4820-919b-88dc59394bfb" // From headers
        };

        const keys = Object.keys(testData);
        const values = keys.map(k => testData[k]);
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
        
        const query = `INSERT INTO appointments (${keys.join(', ')}) VALUES (${placeholders}) RETURNING id`;
        
        console.log('📝 Query:', query);
        console.log('📝 Values:', values);
        console.log('');

        const result = await client.query(query, values);
        console.log('✅ SUCCESS! Inserted appointment ID:', result.rows[0].id);
        
        // Cleanup test row
        await client.query('DELETE FROM appointments WHERE id = $1', [result.rows[0].id]);
        console.log('🧹 Cleaned up test row.');

    } catch (e) {
        console.error('\n❌ POSTGRES ERROR:');
        console.error('   Message:', e.message);
        console.error('   Detail:', e.detail);
        console.error('   Code:', e.code);
        console.error('   Constraint:', e.constraint);
        console.error('   Table:', e.table);
        console.error('   Column:', e.column);
    } finally {
        client.release();
        await pool.end();
    }
}

run();
