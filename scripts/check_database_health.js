import pkg from 'pg';
const { Pool } = pkg;

const connectionString = "postgres://clinicos_db_8932_user:S6G6R2UuR4oAn2XU0VvWq85E3y6C74zI@db.it4q.onrender.com/clinicos_db_8932?ssl=true";

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000 // 5 seconds timeout
});

async function checkHealth() {
    console.log("--- DATABASE HEALTH CHECK ---");
    const client = await pool.connect();
    try {
        console.log("1. Checking active connections...");
        const connRes = await client.query('SELECT count(*) FROM pg_stat_activity');
        console.log(`Active connections: ${connRes.rows[0].count}`);

        console.log("2. Checking for locks...");
        const locksRes = await client.query('SELECT count(*) FROM pg_locks');
        console.log(`Active locks: ${locksRes.rows[0].count}`);

        console.log("3. Checking user record for Dra Leticia...");
        const userRes = await client.query('SELECT id, email, name FROM "user" WHERE email = $1', ['letty-galhardojandre@outlook.com']);
        console.log("Result:", userRes.rows);

        if (userRes.rows.length > 0) {
            console.log("4. Checking memberships for this user...");
            const memRes = await client.query('SELECT * FROM "member" WHERE "userId" = $1', [userRes.rows[0].id]);
            console.log("Memberships:", memRes.rows);
        }

    } catch (err) {
        console.error("Health Check Failed:", err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

checkHealth();
