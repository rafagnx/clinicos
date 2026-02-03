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
        console.log('🔄 Connecting to Database...');

        // Show masked connection info
        const dbUrl = process.env.DATABASE_URL;
        console.log(`📡 Host: ${dbUrl.split('@')[1].split(':')[0]}`); // Extract host

        console.log('🔍 Inspecting "appointments" table columns:');

        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'appointments'
            ORDER BY column_name;
        `);

        if (res.rows.length === 0) {
            console.error('❌ Table "appointments" not found!');
        } else {
            console.table(res.rows.map(r => ({ Column: r.column_name, Type: r.data_type })));

            // Check specifically for our missing cols
            const cols = res.rows.map(r => r.column_name);
            const check = ['source', 'promotion_id', 'scheduled_by', 'procedure_name'];

            check.forEach(c => {
                if (cols.includes(c)) {
                    console.log(`✅ Column '${c}' EXISTS.`);
                } else {
                    console.log(`❌ Column '${c}' MISSING.`);
                }
            });
        }

    } catch (e) {
        console.error('❌ Error:', e);
    } finally {
        client.release();
        await pool.end();
    }
}

run();
