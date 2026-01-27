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

async function runDirectQuery() {
    const data = { "clinic_name": "Clinic OS Test", "logo_url": "", "phone": "", "email": "", "address": "", "website": "", "instagram": "", "facebook": "", "meta_integration": {}, "organization_id": "6f619247-da81-432e-99c4-3db5c80599cb" };
    const keys = ["clinic_name", "logo_url", "phone", "email", "address", "website", "instagram", "facebook", "meta_integration", "organization_id"];
    const values = ["Clinic OS Test", "", "", "", "", "", "", "", "{}", "6f619247-da81-432e-99c4-3db5c80599cb"];
    const placeholders = "$1, $2, $3, $4, $5, $6, $7, $8, $9, $10";

    const client = await pool.connect();
    try {
        console.log("Checking if column facebook exists in information_schema...");
        const colRes = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'clinic_settings' AND column_name = 'facebook'");
        console.log("Column found:", colRes.rows);

        console.log("Running INSERT query...");
        const query = `INSERT INTO "clinic_settings" (${keys.map(k => `"${k}"`).join(", ")}) VALUES(${placeholders}) RETURNING *`;
        console.log("SQL:", query);
        const res = await client.query(query, values);
        console.log("Success:", res.rows[0]);
    } catch (e) {
        console.error("FAILED:", e.message);
        console.error("CODE:", e.code);
    } finally {
        client.release();
        process.exit(0);
    }
}

runDirectQuery();
