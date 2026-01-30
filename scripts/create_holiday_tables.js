
import pg from 'pg';
const { Client } = pg;
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const possiblePaths = [
    path.resolve(__dirname, '../server/.env'),
    path.resolve(__dirname, '../.env'),
    path.resolve(__dirname, '.env')
];

for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
        console.log('Found .env at:', p);
        dotenv.config({ path: p });
        break;
    }
}

// DB Config
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

const client = new Client(dbConfig);

async function createTables() {
    try {
        await client.connect();
        console.log('Connected to database to create tables...');

        await client.query(`
            CREATE TABLE IF NOT EXISTS blocked_days (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
                start_date TIMESTAMP NOT NULL,
                end_date TIMESTAMP NOT NULL,
                reason TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS holidays (
                id SERIAL PRIMARY KEY,
                organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
                date DATE NOT NULL,
                name TEXT NOT NULL,
                type TEXT NOT NULL DEFAULT 'local', 
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            CREATE INDEX IF NOT EXISTS idx_blocked_days_org_date ON blocked_days(organization_id, start_date, end_date);
            CREATE INDEX IF NOT EXISTS idx_holidays_org_date ON holidays(organization_id, date);
        `);

        console.log('Tables created successfully (or already existed).');

    } catch (err) {
        console.error('Error creating tables:', err);
    } finally {
        await client.end();
    }
}

createTables();
