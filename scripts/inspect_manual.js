import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

const pool = new pg.Pool({
    connectionString: 'postgresql://neondb_owner:npg_aTCURwPX20Au@ep-dawn-cloud-ahadf3o4-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require'
});

async function inspect() {
    try {
        for (const table of ['conversations', 'messages', 'conversation_members']) {
            const res = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = '${table}'`);
            console.log(`--- ${table} ---`);
            res.rows.forEach(r => console.log(r.column_name));
        }
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
inspect();
