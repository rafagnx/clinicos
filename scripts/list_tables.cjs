const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://neondb_owner:npg_aTCURwPX20Au@ep-dawn-cloud-ahadf3o4-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require' });
pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
    .then(r => {
        const tables = r.rows.map(x => x.table_name);
        const chatTables = ['conversations', 'messages', 'conversation_members'];
        chatTables.forEach(t => {
            console.log(`Table '${t}' exists: ${tables.includes(t)}`);
        });
        return pool.end();
    })
    .catch(console.error);
