import pg from 'pg';
const { Pool } = pg;

// Use the production connection string (assuming it's in .env or passed via env var)
// Since we are running locally, we need the remote connection string. 
// Assuming the user has a local .env with DATABASE_URL pointing to the remote DB or we rely on the user to run this in a context where ENV is set?
// Actually, I can't easily run this locally against Render DB unless I have the connection string.
// I will assume the script will be run with `DATABASE_URL=... node script.js` or uses the local .env if valid.
// Wait, the user's .env has a DATABASE_URL. Let's hope it's correct.

const connectionString = process.env.DATABASE_URL || "postgres://clinicos_db_user:sfpD1k1X4qZ4qZ4qZ4qZ@dpg-cTQ1X4qZ4qZ4qZ4qZ-a.oregon-postgres.render.com/clinicos_db"; // Example placeholder, will rely on process.env

const pool = new Pool({
    connectionString: process.env.DATABASE_URL, // Must be set in environment
    ssl: { rejectUnauthorized: false }
});

async function checkUser() {
    const email = 'marketingorofacial@gmail.com';
    console.log(`Checking DB for ${email}...`);

    try {
        const userRes = await pool.query('SELECT * FROM "user" WHERE email = $1', [email]);
        if (userRes.rows.length === 0) {
            console.log("❌ User NOT FOUND in 'user' table.");
        } else {
            console.log("✅ User FOUND:", userRes.rows[0]);
            const userId = userRes.rows[0].id;

            // Check Membership
            const memberRes = await pool.query('SELECT * FROM "member" WHERE "userId" = $1', [userId]);
            console.log(`Found ${memberRes.rows.length} memberships.`);
            memberRes.rows.forEach(m => console.log(` - Org: ${m.organizationId}, Role: ${m.role}`));

            // Check Ownership (Legacy)
            const ownerRes = await pool.query('SELECT * FROM "organization" WHERE "owner_id" = $1', [userId]);
            console.log(`Found ${ownerRes.rows.length} owned organizations (Legacy column).`);
        }
    } catch (err) {
        console.error("DB Error:", err);
    } finally {
        await pool.end();
    }
}

checkUser();
