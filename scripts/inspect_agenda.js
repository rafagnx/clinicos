
import pg from 'pg';
const { Client } = pg;

const client = new Client({
    connectionString: 'postgresql://neondb_owner:npg_aTCURwPX20Au@ep-dawn-cloud-ahadf3o4-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

async function inspect() {
    try {
        await client.connect();

        console.log('\n--- ALL PROFESSIONALS (Raw) ---');
        const all = await client.query("SELECT * FROM professionals");
        if (all.rows.length > 0) {
            console.log('Keys:', Object.keys(all.rows[0]));
            all.rows.forEach(r => {
                console.log(JSON.stringify(r));
            });
        } else {
            console.log('No rows found in professionals table.');
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

inspect();
