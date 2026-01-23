process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

// Fallback to local defaults if env not set
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
        console.log("Starting Schema Update for MVP...");
        const client = await pool.connect();

        // Patients Extra Columns
        const patientCols = [
            { name: 'gender', type: 'TEXT' },
            { name: 'whatsapp', type: 'TEXT' },
            { name: 'address', type: 'TEXT' },
            { name: 'city', type: 'TEXT' },
            { name: 'marketing_source', type: 'TEXT' },
            { name: 'notes', type: 'TEXT' }
        ];

        for (const col of patientCols) {
            try {
                await client.query(`ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "${col.name}" ${col.type}`);
                console.log(`Added ${col.name} to patients`);
            } catch (err) {
                console.log(`Skipping ${col.name} (maybe exists or error): ${err.message}`);
            }
        }

        // Appointments Extra Columns
        const apptCols = [
            { name: 'procedure_name', type: 'TEXT' },
            { name: 'duration', type: 'INT' },
            { name: 'scheduled_by', type: 'TEXT' },
            { name: 'promotion_id', type: 'TEXT' }
        ];

        for (const col of apptCols) {
            try {
                await client.query(`ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "${col.name}" ${col.type}`);
                console.log(`Added ${col.name} to appointments`);
            } catch (err) {
                console.log(`Skipping ${col.name}: ${err.message}`);
            }
        }

        console.log("Schema Update Complete!");
        client.release();
        process.exit(0);
    } catch (e) {
        console.error("Error:", e);
        process.exit(1);
    }
};

run();
