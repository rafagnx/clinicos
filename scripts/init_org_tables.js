
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function initOrgTables() {
    const client = await pool.connect();
    try {
        console.log("Initializing Organization Plugin Tables (Member, Invitation)...");

        // MEMBER Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS "member" (
                "id" TEXT PRIMARY KEY,
                "organizationId" TEXT NOT NULL, 
                "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
                "role" TEXT NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
            );
        `);
        console.log("Checked/Created 'member' table.");

        // INVITATION Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS "invitation" (
                "id" TEXT PRIMARY KEY,
                "organizationId" TEXT NOT NULL,
                "email" TEXT NOT NULL,
                "role" TEXT,
                "status" TEXT NOT NULL DEFAULT 'pending',
                "expiresAt" TIMESTAMP NOT NULL,
                "inviterId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
                "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
            );
        `);
        console.log("Checked/Created 'invitation' table.");

    } catch (err) {
        console.error("Error creating org tables:", err);
    } finally {
        client.release();
        pool.end();
    }
}

initOrgTables();
