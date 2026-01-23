
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const dbConfig = process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
    : { user: 'postgres', host: 'localhost', database: 'clinicOS', password: 'password', port: 5432 };

const pool = new pg.Pool(dbConfig);

const run = async () => {
    const client = await pool.connect();
    try {
        console.log("=== SYSTEM HEALTH CHECK ===");

        // 1. Check Error Log
        const logPath = path.join(__dirname, '../server/server_error.log');
        if (fs.existsSync(logPath)) {
            console.log("\n[SERVER ERROR LOG FOUND]");
            const logs = fs.readFileSync(logPath, 'utf8');
            console.log(logs.slice(-2000)); // Last 2000 chars
        } else {
            console.log("\n[NO SERVER ERROR LOG FOUND]");
        }

        // 2. Check Table Columns
        console.log("\n[PROFESSIONALS COLUMNS]");
        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'professionals';
        `);
        res.rows.forEach(r => console.log(`- ${r.column_name} (${r.data_type})`));

        // 3. Check Organizations
        console.log("\n[ORGANIZATIONS]");
        const orgs = await client.query('SELECT id, name FROM organization');
        orgs.rows.forEach(r => console.log(`- ${r.name}: ${r.id}`));

    } catch (e) {
        console.error("Health Check Error:", e);
    } finally {
        client.release();
        process.exit(0);
    }
};

run();
