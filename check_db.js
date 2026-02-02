
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
    connectionString: "postgres://clinicos_it4q_user:89gR2c63v5r2zD3R6Xp2789fI4Xy7J5n@dpg-cub2k9m3652c73d9e8g0-a.oregon-postgres.render.com/clinicos_it4q",
    ssl: { rejectUnauthorized: false }
});

async function check() {
    try {
        const patients = await pool.query('SELECT count(*) FROM patients');
        const records = await pool.query('SELECT count(*) FROM medical_records');
        const procs = await pool.query('SELECT count(*) FROM procedure_types');
        const orgs = await pool.query('SELECT count(*) FROM organization');
        const users = await pool.query('SELECT count(*) FROM "user"');

        console.log("DB Stats:");
        console.log("- Organizations:", orgs.rows[0].count);
        console.log("- Users:", users.rows[0].count);
        console.log("- Patients:", patients.rows[0].count);
        console.log("- Records:", records.rows[0].count);
        console.log("- ProcedureTypes:", procs.rows[0].count);

        if (parseInt(patients.rows[0].count) > 0) {
            const sample = await pool.query('SELECT id, name, organization_id FROM patients LIMIT 2');
            console.log("Sample Patients:", JSON.stringify(sample.rows, null, 2));
        }

        if (parseInt(records.rows[0].count) > 0) {
            const sampleRecs = await pool.query('SELECT id, patient_id, organization_id, content FROM medical_records LIMIT 2');
            console.log("Sample Records:", JSON.stringify(sampleRecs.rows, null, 2));
        }

        process.exit(0);
    } catch (err) {
        console.error("DB Check Failed:", err);
        process.exit(1);
    }
}

check();
