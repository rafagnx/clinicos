const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://neondb_owner:npg_aTCURwPX20Au@ep-dawn-cloud-ahadf3o4-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require' });
pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'messages'")
    .then(r => {
        console.log('MSG_COLS: ' + JSON.stringify(r.rows.map(x => x.column_name)));
        return pool.end();
    })
    .catch(console.error);
