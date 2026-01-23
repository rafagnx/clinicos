
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
    const client = await pool.connect();
    try {
        console.log("--- Adding 'date' column to appointments ---");
        await client.query(`ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "date" DATE`);
        console.log("✅ Added 'date' column.");
    } catch (e) {
        console.error("❌ Failed:", e.message);
    } finally {
        client.release();
        process.exit(0);
    }
};

run();
