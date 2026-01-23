
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
        console.log("--- DEBUGGING INSERT PATIENT ---");
        // Payload simulado do Frontend (baseado no log do subagente)
        const patientData = {
            organization_id: 'test-org-id', // Vamos usar um ID fake ou pegar um real
            name: "Paciente Debug",
            phone: "11999999999",
            marketing_source: "Instagram",
            whatsapp: "11999999999",
            email: "debug@teste.com",
            address: "Rua Debug",
            city: "SP",
            gender: "masculino",
            notes: "Teste de debug",
            status: "ativo"
        };

        // Tentar pegar um org id real
        const orgRes = await client.query('SELECT id FROM organization LIMIT 1');
        if (orgRes.rows.length > 0) {
            patientData.organization_id = orgRes.rows[0].id;
        } else {
            console.log("No organization found, using fake ID (might fail referential integrity)");
        }

        const keys = Object.keys(patientData);
        const values = Object.values(patientData);
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');

        console.log("Executing Query:", `INSERT INTO patients (${keys.join(', ')}) VALUES (${placeholders})`);

        try {
            await client.query(`INSERT INTO patients (${keys.join(', ')}) VALUES (${placeholders})`, values);
            console.log("✅ Patient Insert Success!");
        } catch (e) {
            console.error("❌ Patient Insert Failed:", e.message);
            console.error("Code:", e.code);
            console.error("Detail:", e.detail);
        }

        console.log("\n--- DEBUGGING INSERT PROFESSIONAL ---");
        const profData = {
            organization_id: patientData.organization_id,
            name: "Dr. Debug",
            email: "drdebug@teste.com",
            role_type: "profissional",
            specialty: "Debugologia",
            council_number: "12345",
            council_state: "SP",
            color: "#000000",
            appointment_duration: 30,
            status: "ativo",
            phone: "1199999999"
        };

        const pKeys = Object.keys(profData);
        const pValues = Object.values(profData);
        const pPlaceholders = pKeys.map((_, i) => `$${i + 1}`).join(', ');

        try {
            await client.query(`INSERT INTO professionals (${pKeys.join(', ')}) VALUES (${pPlaceholders})`, pValues);
            console.log("✅ Professional Insert Success!");
        } catch (e) {
            console.error("❌ Professional Insert Failed:", e.message);
            console.error("Code:", e.code);
            console.error("Detail:", e.detail);
        }

    } catch (e) {
        console.error("Connection Error:", e);
    } finally {
        client.release();
        process.exit(0);
    }
};

run();
