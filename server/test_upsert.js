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

const isValidColumn = (key) => /^[a-zA-Z0-9_]+$/.test(key);

async function testUpsert() {
    const data = {
        clinic_name: "Test Clinic",
        logo_url: "",
        phone: "123",
        email: "test@test.com",
        address: "street 1",
        website: "test.com",
        instagram: "@test",
        facebook: "fb.com/test",
        meta_integration: {},
        organization_id: "6f619247-da81-432e-99c4-3db5c80599cb"
    };

    const keys = Object.keys(data).filter(key => isValidColumn(key));
    console.log("Keys:", keys);

    const client = await pool.connect();
    try {
        console.log("Checking if exists...");
        const existing = await client.query('SELECT id FROM clinic_settings WHERE organization_id = $1', [data.organization_id]);

        if (existing.rows.length > 0) {
            console.log("Exists. Updating...");
            const updateKeys = keys.filter(k => k !== 'organization_id');
            const updateValues = updateKeys.map(k => {
                const v = data[k];
                return (typeof v === 'object' ? JSON.stringify(v) : v);
            });
            const setClause = updateKeys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
            const query = `UPDATE "clinic_settings" SET ${setClause} WHERE organization_id = $${updateKeys.length + 1} RETURNING *`;
            console.log("Query:", query);
            const res = await client.query(query, [...updateValues, data.organization_id]);
            console.log("Update Success!");
        } else {
            console.log("Does not exist. Inserting...");
            const values = keys.map(key => {
                const v = data[key];
                return (typeof v === 'object' ? JSON.stringify(v) : v);
            });
            const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
            const query = `INSERT INTO "clinic_settings" (${keys.map(k => `"${k}"`).join(', ')}) VALUES(${placeholders}) RETURNING *`;
            console.log("Query:", query);
            const res = await client.query(query, values);
            console.log("Insert Success!");
        }
    } catch (e) {
        console.error("Test Failed:", e.message);
        console.error("Detail:", e.detail);
    } finally {
        client.release();
        process.exit(0);
    }
}

testUpsert();
