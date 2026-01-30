
import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try multiple paths for .env
const possiblePaths = [
    path.resolve(__dirname, '../server/.env'),
    path.resolve(__dirname, '../.env'),
    path.resolve(__dirname, '.env')
];

let loadedPath = null;
for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
        console.log('Found .env at:', p);
        dotenv.config({ path: p });
        loadedPath = p;
        break;
    }
}

if (!loadedPath) {
    console.warn('⚠️ No .env file found in common locations.');
}

// Log loaded keys (masked) to debug
console.log('Environment keys loaded:', Object.keys(process.env).filter(k => k.startsWith('DB_') || k.startsWith('DATA') || k === 'NODE_ENV'));

// Fix SSL for self-signed certs (Supabase pooler etc)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const dbConfig = process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    }
    : {
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'clinicOS',
        password: process.env.DB_PASSWORD || 'password',
        port: process.env.DB_PORT || 5432,
    };

console.log('Connecting to database:', process.env.DATABASE_URL ? 'Using Connection String' : `Using Host: ${dbConfig.host}`);

const pool = new Pool(dbConfig);

async function runMigration() {
    const client = await pool.connect();
    try {
        const schemaPath = path.resolve(__dirname, '../database/schema_blocked_days.sql');
        console.log('Reading schema from:', schemaPath);
        const sql = fs.readFileSync(schemaPath, 'utf8');

        console.log('Executing migration...');
        await client.query(sql);
        console.log('✅ Migration applied successfully!');
    } catch (err) {
        console.error('❌ Migration failed:', err);
        console.error('Check your database credentials or if the server is running.');
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration();
