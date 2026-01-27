import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config(); // Root
dotenv.config({ path: path.join(__dirname, '.env') }); // Server

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function nukeAndRebuild() {
    const client = await pool.connect();
    try {
        console.log("NUKING table clinic_settings...");
        await client.query('DROP TABLE IF EXISTS clinic_settings CASCADE');

        console.log("REBUILDING table clinic_settings...");
        await client.query(`
            CREATE TABLE clinic_settings (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                clinic_name TEXT,
                logo_url TEXT,
                phone TEXT,
                whatsapp TEXT,
                email TEXT,
                address TEXT,
                website TEXT,
                instagram TEXT,
                facebook TEXT,
                linkedin TEXT,
                twitter TEXT,
                google_maps_url TEXT,
                meta_integration JSONB DEFAULT '{}',
                organization_id TEXT,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `);
        console.log("DONE.");
    } finally {
        client.release();
        process.exit(0);
    }
}

nukeAndRebuild();
