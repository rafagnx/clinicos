const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://neondb_owner:npg_aTCURwPX20Au@ep-dawn-cloud-ahadf3o4-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require' });
pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'conversation_members'")
    .then(r => {
        r.rows.forEach(x => console.log('MEMB_COL: ' + x.column_name));
        return pool.end();
    })
    .catch(console.error);
