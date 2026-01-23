
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

// MOCK FUNCTION from server/index.js
const isValidColumn = (key) => /^[a-zA-Z0-9_]+$/.test(key);

const run = async () => {
    const client = await pool.connect();
    try {
        console.log("--- DEBUGGING EXACT PROFESSIONAL INSERT ---");

        // 1. Get Organization ID
        const orgRes = await client.query('SELECT id FROM organization LIMIT 1');
        if (orgRes.rows.length === 0) throw new Error("No organization found");
        const organizationId = orgRes.rows[0].id;
        console.log("Using Org ID:", organizationId);

        // 2. Mock Data from Frontend (Professionals.tsx)
        // BEFORE transform
        const frontendData = {
            full_name: "Dr. Repro Exact",
            role_type: "profissional",
            specialty: "Reprology",
            council_number: "123-REP",
            council_state: "SP",
            phone: "11999999999",
            email: "repro@exact.com",
            color: "#3B82F6",
            appointment_duration: 30, // Number
            status: "ativo",
            photo_url: ""
        };

        // 3. APPLY SERVER LOGIC (Copied from index.js)
        const entity = 'Professional';
        const data = { ...frontendData }; // copy

        if (entity === 'Professional' && data.rating) {
            data.rating = parseFloat(data.rating);
        }

        // Context
        const isUserScoped = false; // Professionals are Org Scoped
        if (isUserScoped) {
            // data.user_id = ...
        } else {
            data.organization_id = organizationId;
        }

        // Data Fix
        if ((entity === 'Professional' || entity === 'Patient') && data.full_name) {
            data.name = data.full_name;
            delete data.full_name;
        }

        // Security Filter
        const keys = Object.keys(data).filter(key => isValidColumn(key));

        console.log("Filtered Keys:", keys);

        const values = keys.map(key => {
            const v = data[key];
            return (typeof v === 'object' ? JSON.stringify(v) : v);
        });

        const placeholders = keys.map((_, i) => `$${i + 1} `).join(', ');
        const tableName = 'professionals';
        const query = `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES(${placeholders}) RETURNING * `;

        console.log("Executing Query:", query);
        console.log("Values:", values);

        await client.query(query, values);
        console.log("✅ Success! Professional Inserted.");

    } catch (e) {
        console.error("❌ FAILED:", e.message);
        if (e.detail) console.error("Detail:", e.detail);
        if (e.code) console.error("Code:", e.code);
    } finally {
        client.release();
        process.exit(0);
    }
};

run();
