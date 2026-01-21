import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigration() {
    const client = await pool.connect();

    try {
        console.log('🔄 Running migration: Add Stripe subscription columns...');

        const migrationSQL = fs.readFileSync(
            path.join(__dirname, '../database/migrations/001_add_subscription_columns.sql'),
            'utf8'
        );

        await client.query(migrationSQL);

        console.log('✅ Migration completed successfully!');

        // Verify
        const result = await client.query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'organization' 
        AND column_name IN ('subscription_status', 'stripe_customer_id', 'stripe_subscription_id', 'trial_ends_at')
      ORDER BY column_name;
    `);

        console.log('\n📊 Verified columns:');
        console.table(result.rows);

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration().catch(console.error);
