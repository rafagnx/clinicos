
import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
    connectionString: 'postgresql://postgres:v3Nzal54m5@db.it4q.onrender.com/clinicos_db_8932',
    ssl: {
        rejectUnauthorized: false
    }
});

async function run() {
    try {
        await client.connect();
        const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
        console.log('Tables:', res.rows.map(r => r.table_name));
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

run();
