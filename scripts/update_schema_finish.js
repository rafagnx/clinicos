process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const dbConfig = process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    }
    : {
        user: 'postgres',
        host: 'localhost',
        database: 'clinicOS',
        password: 'password',
        port: 5432,
    };

const { Pool } = pg;
const pool = new Pool(dbConfig);

const run = async () => {
    try {
        console.log("Starting FINAL MVP Schema Update...");
        const client = await pool.connect();

        // 1. Professionals Columns
        const profCols = [
            { name: 'role_type', type: 'TEXT DEFAULT \'profissional\'' },
            { name: 'council_number', type: 'TEXT' },
            { name: 'council_state', type: 'TEXT' },
            { name: 'color', type: 'TEXT DEFAULT \'#3B82F6\'' },
            { name: 'appointment_duration', type: 'INT DEFAULT 30' },
            { name: 'photo_url', type: 'TEXT' },
            { name: 'phone', type: 'TEXT' } // Just in case
        ];

        for (const col of profCols) {
            try {
                await client.query(`ALTER TABLE "professionals" ADD COLUMN IF NOT EXISTS "${col.name}" ${col.type}`);
                console.log(`Verified/Added ${col.name} to professionals`);
            } catch (err) {
                console.log(`Skipping ${col.name}: ${err.message}`);
            }
        }

        // 2. Fix 'ProcedureType' table (sometimes called procedure_types)
        // Check if table exists
        try {
            await client.query(`
                CREATE TABLE IF NOT EXISTS "procedure_types" (
                  "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
                  "organization_id" TEXT NOT NULL,
                  "name" TEXT NOT NULL,
                  "duration_minutes" INT DEFAULT 30,
                  "price" DECIMAL(10, 2),
                  "color" TEXT DEFAULT '#3b82f6',
                  "category" TEXT,
                  "active" BOOLEAN DEFAULT TRUE,
                  "created_at" TIMESTAMP DEFAULT NOW(),
                  "updated_at" TIMESTAMP DEFAULT NOW()
                );
             `);
            console.log("Verified procedure_types table");

            // Ensure 'category' column exists
            await client.query(`ALTER TABLE "procedure_types" ADD COLUMN IF NOT EXISTS "category" TEXT`);
        } catch (e) {
            console.log("Error checking procedure_types:", e.message);
        }

        console.log("Final Schema Update Complete!");
        client.release();
        process.exit(0);
    } catch (e) {
        console.error("Critical Error:", e);
        process.exit(1);
    }
};

run();
