import pkg from 'pg';
const { Pool } = pkg;

const connectionString = "postgres://clinicos_db_8932_user:S6G6R2UuR4oAn2XU0VvWq85E3y6C74zI@db.it4q.onrender.com/clinicos_db_8932?ssl=true";

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function inspectUser() {
    const client = await pool.connect();
    try {
        console.log("Inspecting user: letty-galhardojandre@outlook.com");
        const res = await client.query('SELECT id, email, length(name) as name_len, length(image::text) as img_len FROM "user" WHERE email = $1', ['letty-galhardojandre@outlook.com']);
        console.log("User summary:", res.rows);

        if (res.rows.length > 0) {
            const orgs = await client.query('SELECT "organizationId" FROM "member" WHERE "userId" = $1', [res.rows[0].id]);
            console.log("Orgs count:", orgs.rows.length);
        }
    } catch (err) {
        console.error("Query failed:", err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

inspectUser();
