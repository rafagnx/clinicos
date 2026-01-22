
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function resetAuthTables() {
    const client = await pool.connect();
    try {
        console.log("RESETTING Auth Tables with Quotes (CamelCase)...");

        // DROP existing
        await client.query(`DROP TABLE IF EXISTS "account" CASCADE;`);
        await client.query(`DROP TABLE IF EXISTS "session" CASCADE;`);
        await client.query(`DROP TABLE IF EXISTS "user" CASCADE;`);
        await client.query(`DROP TABLE IF EXISTS "verification" CASCADE;`);
        console.log("Dropped tables.");

        // CREATE with Quotes to force CamelCase

        // 1. User
        await client.query(`
            CREATE TABLE "user" (
                "id" TEXT PRIMARY KEY,
                "name" TEXT NOT NULL,
                "email" TEXT NOT NULL UNIQUE,
                "emailVerified" BOOLEAN NOT NULL DEFAULT FALSE,
                "image" TEXT,
                "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
                "phone" TEXT,
                "specialty" TEXT,
                "user_type" TEXT
            );
        `);
        console.log("Created 'user' with CamelCase columns.");

        // 2. Session
        await client.query(`
            CREATE TABLE "session" (
                "id" TEXT PRIMARY KEY,
                "expiresAt" TIMESTAMP NOT NULL,
                "token" TEXT NOT NULL UNIQUE,
                "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
                "ipAddress" TEXT,
                "userAgent" TEXT,
                "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
            );
        `);
        console.log("Created 'session' with CamelCase columns.");

        // 3. Account
        await client.query(`
            CREATE TABLE "account" (
                "id" TEXT PRIMARY KEY,
                "accountId" TEXT NOT NULL,
                "providerId" TEXT NOT NULL,
                "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
                "accessToken" TEXT,
                "refreshToken" TEXT,
                "idToken" TEXT,
                "accessTokenExpiresAt" TIMESTAMP,
                "refreshTokenExpiresAt" TIMESTAMP,
                "scope" TEXT,
                "password" TEXT,
                "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
            );
        `);
        console.log("Created 'account' with CamelCase columns.");

        // 4. Verification
        await client.query(`
            CREATE TABLE "verification" (
                "id" TEXT PRIMARY KEY,
                "identifier" TEXT NOT NULL,
                "value" TEXT NOT NULL,
                "expiresAt" TIMESTAMP NOT NULL,
                "createdAt" TIMESTAMP DEFAULT NOW(),
                "updatedAt" TIMESTAMP DEFAULT NOW()
            );
        `);
        console.log("Created 'verification' with CamelCase columns.");

    } catch (err) {
        console.error("Error resetting tables:", err);
    } finally {
        client.release();
        pool.end();
    }
}

resetAuthTables();
