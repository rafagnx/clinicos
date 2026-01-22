
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function fixDatabase() {
    const client = await pool.connect();
    try {
        console.log("Starting DB Fix...");

        // 1. Fix Organization Table
        console.log("Checking 'organization' table...");
        const columnsToAdd = [
            { name: 'stripe_customer_id', type: 'TEXT' },
            { name: 'stripe_subscription_id', type: 'TEXT' },
            { name: 'subscription_status', type: 'TEXT DEFAULT \'trialing\'' }, // Default to trialing
            { name: 'trial_ends_at', type: 'TIMESTAMP' },
            { name: 'plan', type: 'TEXT' }
        ];

        for (const col of columnsToAdd) {
            try {
                await client.query(`ALTER TABLE "organization" ADD COLUMN IF NOT EXISTS "${col.name}" ${col.type};`);
                console.log(`Added/Checked column: ${col.name}`);
            } catch (e) {
                console.log(`Error adding ${col.name}: ${e.message}`);
                // Ignore if exists
            }
        }

        // 2. Fix Professionals Table (full_name mapping issue root cause - although fixed in code, let's check schema)
        // Ensure status column
        await client.query(`ALTER TABLE "professionals" ADD COLUMN IF NOT EXISTS "status" VARCHAR(50) DEFAULT 'white';`);
        console.log("Checked 'professionals' status column.");

        // 3. Fix Missing organization_id in key tables
        const tables = ['patients', 'professionals', 'appointments', 'leads', 'financial_transactions', 'medical_records'];
        for (const table of tables) {
            try {
                // Check if table exists
                const res = await client.query(`SELECT to_regclass('${table}');`);
                if (res.rows[0].to_regclass) {
                    await client.query(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "organization_id" TEXT;`);
                    console.log(`Checked organization_id in ${table}`);
                }
            } catch (e) {
                console.log(`Error checking table ${table}: ${e.message}`);
            }
        }

        console.log("DB Fix Completed Successfully.");

    } catch (err) {
        console.error("Fatal Error during fix:", err);
    } finally {
        client.release();
        pool.end();
    }
}

fixDatabase();
