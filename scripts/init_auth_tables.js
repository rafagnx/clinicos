
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

// Fix for self-signed certs if needed
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function initAuthTables() {
    const client = await pool.connect();
    try {
        console.log("Initializing Better Auth Tables...");

        // 1. User Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS "user" (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                emailVerified BOOLEAN NOT NULL DEFAULT FALSE,
                image TEXT,
                createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
                updatedAt TIMESTAMP NOT NULL DEFAULT NOW(),
                phone TEXT,
                specialty TEXT,
                user_type TEXT
            );
        `);
        console.log("Checked/Created 'user' table.");

        // 2. Session Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS "session" (
                id TEXT PRIMARY KEY,
                expiresAt TIMESTAMP NOT NULL,
                token TEXT NOT NULL UNIQUE,
                createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
                updatedAt TIMESTAMP NOT NULL DEFAULT NOW(),
                ipAddress TEXT,
                userAgent TEXT,
                userId TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
            );
        `);
        console.log("Checked/Created 'session' table.");

        // 3. Account Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS "account" (
                id TEXT PRIMARY KEY,
                accountId TEXT NOT NULL,
                providerId TEXT NOT NULL,
                userId TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
                accessToken TEXT,
                refreshToken TEXT,
                idToken TEXT,
                accessTokenExpiresAt TIMESTAMP,
                refreshTokenExpiresAt TIMESTAMP,
                scope TEXT,
                password TEXT,
                createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
                updatedAt TIMESTAMP NOT NULL DEFAULT NOW()
            );
        `);
        console.log("Checked/Created 'account' table.");

        // 4. Verification Table (CamelCase columns based on better-auth defaults usually)
        // Better Auth typically uses camelCase for JS objects but snake_case in DB?
        // Let's use camelCase columns in DB to match standard Better Auth schema without mapping config.
        // Actually, better-auth v1 uses camelCase by default in schema unless configured otherwise.

        await client.query(`
            CREATE TABLE IF NOT EXISTS "verification" (
                id TEXT PRIMARY KEY,
                identifier TEXT NOT NULL,
                value TEXT NOT NULL,
                expiresAt TIMESTAMP NOT NULL,
                createdAt TIMESTAMP DEFAULT NOW(),
                updatedAt TIMESTAMP DEFAULT NOW()
            );
        `);
        console.log("Checked/Created 'verification' table.");

        // 5. Schema Fixes (Columns that might be named differently in snake_case versions)
        // Just in case, add alternate column names or mappings if errors persist.
        // But assuming standard setup.

        console.log("Auth Tables Initialization Complete.");

    } catch (err) {
        console.error("Error creating auth tables:", err);
    } finally {
        client.release();
        pool.end();
    }
}

initAuthTables();
