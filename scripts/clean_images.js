import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function cleanDatabase() {
    console.log('Cleaning massive image blobs from database...');
    const tables = ['user', 'patients', 'professionals'];

    for (const table of tables) {
        try {
            // 1. Detect which column holds the image
            const res = await pool.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = $1 
                AND column_name IN ('image', 'avatar_url', 'photo_url', 'picture')
            `, [table]);

            if (res.rows.length === 0) {
                console.log(`Skipping ${table}: No image column found.`);
                continue;
            }

            const colName = res.rows[0].column_name;
            console.log(`Detected image column for ${table}: ${colName}`);

            // 2. Clear ONLY if it looks like base64 (very long string)
            // We use length > 2000 as a heuristic. URLs are usually shorter.
            const updateRes = await pool.query(`
                UPDATE "${table}" 
                SET "${colName}" = NULL 
                WHERE length("${colName}") > 2000
            `);

            console.log(`Updated ${updateRes.rowCount} rows in ${table} (cleared ${colName}).`);
        } catch (err) {
            console.error(`Error processing table ${table}:`, err.message);
        }
    }
    console.log('Database cleanup finished!');
    await pool.end();
}

cleanDatabase();
