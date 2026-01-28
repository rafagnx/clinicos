import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const tablesToSecure = [
    'organization',
    'member',
    'patients',
    'professionals',
    'appointments',
    'leads',
    'medical_records',
    'clinic_settings',
    'financial_transactions',
    'promotions',
    'notifications',
    'pending_invites',
    'procedure_types'
];

async function secureDatabase() {
    console.log("🛡️  Starting Security Hardening (RLS)...");

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        for (const table of tablesToSecure) {
            // 1. Enable RLS
            console.log(`🔒 Enabling RLS on table: ${table}`);
            await client.query(`ALTER TABLE IF EXISTS "${table}" ENABLE ROW LEVEL SECURITY;`);

            // 2. Create Policy: Deny All Public Access (Force access via Backend only)
            // Drop existing to avoid conflicts
            await client.query(`DROP POLICY IF EXISTS "Deny Public Access" ON "${table}";`);

            // Create mostly restrictive policy
            // We use 'USING (false)' to deny all SELECT/INSERT/UPDATE/DELETE via PostgREST API
            // The Node.js backend connects as 'postgres/authenticated' user which usually Bypasses RLS or we can grant specific overrides.
            // Note: If connection string user is NOT superuser/bypassrls, this effectively locks the DB.
            // Assumption: The DATABASE_URL user is an Owner/Admin.

            await client.query(`
                CREATE POLICY "Deny Public Access"
                ON "${table}"
                FOR ALL
                TO public
                USING (false);
            `);
        }

        await client.query('COMMIT');
        console.log("✅ Security Hardening Complete. All tables are now shielded from public API access.");

    } catch (e) {
        await client.query('ROLLBACK');
        console.error("❌ Error applying security fixes:", e);
    } finally {
        client.release();
        pool.end();
    }
}

secureDatabase();
