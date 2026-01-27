
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function fixSchema() {
    const client = await pool.connect();
    try {
        console.log("Checking clinic_settings schema...");
        const res = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'clinic_settings';
        `);

        const columns = res.rows.map(r => r.column_name);
        console.log("Current columns:", columns);

        if (columns.includes('key') && columns.includes('value') && !columns.includes('clinic_name')) {
            console.log("Detected OLD schema (Key-Value). Dropping table to recreate...");
            await client.query(`DROP TABLE "clinic_settings";`);
            console.log("Table dropped.");
        }

        console.log("Creating new clinic_settings table...");
        await client.query(`
            CREATE TABLE IF NOT EXISTS "clinic_settings" (
                "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                "clinic_name" TEXT,
                "logo_url" TEXT,
                "phone" TEXT,
                "whatsapp" TEXT,
                "email" TEXT,
                "address" TEXT,
                "website" TEXT,
                "instagram" TEXT,
                "facebook" TEXT,
                "linkedin" TEXT,
                "twitter" TEXT,
                "google_maps_url" TEXT,
                "meta_integration" JSONB DEFAULT '{}',
                "organization_id" TEXT,
                "created_at" TIMESTAMP DEFAULT NOW(),
                "updated_at" TIMESTAMP DEFAULT NOW()
            );
        `);

        // Migration: Ensure all columns exist if table already existed
        const missingCols = [
            { name: 'whatsapp', type: 'TEXT' },
            { name: 'facebook', type: 'TEXT' },
            { name: 'linkedin', type: 'TEXT' },
            { name: 'twitter', type: 'TEXT' },
            { name: 'google_maps_url', type: 'TEXT' }
        ];

        for (const col of missingCols) {
            if (!columns.includes(col.name)) {
                console.log(`Adding missing column: ${col.name}`);
                await client.query(`ALTER TABLE "clinic_settings" ADD COLUMN IF NOT EXISTS "${col.name}" ${col.type}`);
            }
        }
        console.log("Table created/verified.");

        // Add constraints/indices
        await client.query(`CREATE INDEX IF NOT EXISTS "idx_clinic_settings_org" ON "clinic_settings"("organization_id");`);

        console.log("Migration successful.");
    } catch (err) {
        console.error("Migration Error:", err);
    } finally {
        client.release();
        process.exit(0);
    }
}

fixSchema();
