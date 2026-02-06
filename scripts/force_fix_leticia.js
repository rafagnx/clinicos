import pkg from 'pg';
const { Client } = pkg;

const connectionString = "postgres://clinicos_db_8932_user:S6G6R2UuR4oAn2XU0VvWq85E3y6C74zI@db.it4q.onrender.com/clinicos_db_8932?ssl=true";

async function forceFix() {
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000
    });

    try {
        await client.connect();
        console.log("Connected. Searching for Leticia...");

        // 1. Find her by email
        const res = await client.query('SELECT id FROM "user" WHERE email = $1', ['letty-galhardojandre@outlook.com']);
        if (res.rows.length > 0) {
            const dbId = res.rows[0].id;
            console.log("Found DB ID:", dbId);

            // 2. Clear image to reduce size
            await client.query('UPDATE "user" SET image = NULL WHERE id = $1', [dbId]);
            console.log("Cleared image.");

            // 3. Verify organizations
            const orgs = await client.query('SELECT "organizationId" FROM "member" WHERE "userId" = $1', [dbId]);
            console.log("Found orgs:", orgs.rows.map(r => r.organizationId));
        } else {
            console.log("User not found by email.");
        }
    } catch (err) {
        console.error("Critical Failure:", err.message);
    } finally {
        await client.end();
    }
}

forceFix();
