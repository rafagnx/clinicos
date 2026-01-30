
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function run() {
    try {
        console.log("--- AUDITING CORE TABLES FOR DATA INTEGRITY ---");

        // 1. List all tables
        const res = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
        const tables = res.rows.map(r => r.table_name);
        console.log("Tables found:", tables.join(", "));

        // 2. Check for 'anamnesis' equivalent
        const anamnesisCandidates = tables.filter(t => t.includes('anam') || t.includes('hist') || t.includes('clini') || t.includes('record'));
        console.log("Potential Anamnesis Tables:", anamnesisCandidates);

        // 3. Inspect critical tables for segregation column (organization_id)
        const criticalTables = ['patients', 'appointments', ...anamnesisCandidates];

        for (const table of criticalTables) {
            if (!tables.includes(table)) continue;

            const cols = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = $1
        `, [table]);

            const hasOrgId = cols.rows.some(c => c.column_name === 'organization_id');
            console.log(`Table '${table}': Segregation Safe? ${hasOrgId ? '✅ YES' : '❌ NO'}`);
            if (!hasOrgId) {
                console.warn(`   !!! WARNING: Table '${table}' missing organization_id !!!`);
            }
        }

    } catch (e) {
        console.error("Audit failed:", e);
    } finally {
        await pool.end();
    }
}

run();
