
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function fixAuthSchemaCase() {
    const client = await pool.connect();
    try {
        console.log("Fixing Auth Schema Case Sensitivity...");

        // Helper to rename safely
        const rename = async (table, oldName, newName) => {
            try {
                // Check if old column exists first to avoid errors
                await client.query(`ALTER TABLE "${table}" RENAME COLUMN "${oldName}" TO "${newName}";`);
                console.log(`Renamed ${table}.${oldName} -> ${newName}`);
            } catch (e) {
                console.log(`Skipped ${table}.${oldName}: ${e.message}`);
            }
        };

        // USER Table
        await rename('user', 'emailverified', 'emailVerified');
        await rename('user', 'createdat', 'createdAt');
        await rename('user', 'updatedat', 'updatedAt');

        // SESSION Table
        await rename('session', 'expiresat', 'expiresAt');
        await rename('session', 'createdat', 'createdAt');
        await rename('session', 'updatedat', 'updatedAt');
        await rename('session', 'ipaddress', 'ipAddress');
        await rename('session', 'useragent', 'userAgent');
        await rename('session', 'userid', 'userId');

        // ACCOUNT Table
        await rename('account', 'accountid', 'accountId');
        await rename('account', 'providerid', 'providerId');
        await rename('account', 'userid', 'userId');
        await rename('account', 'accesstoken', 'accessToken');
        await rename('account', 'refreshtoken', 'refreshToken');
        await rename('account', 'idtoken', 'idToken');
        await rename('account', 'accesstokenexpiresat', 'accessTokenExpiresAt');
        await rename('account', 'refreshtokenexpiresat', 'refreshTokenExpiresAt');
        await rename('account', 'createdat', 'createdAt');
        await rename('account', 'updatedat', 'updatedAt');

        // VERIFICATION Table
        await rename('verification', 'expiresat', 'expiresAt');
        await rename('verification', 'createdat', 'createdAt');
        await rename('verification', 'updatedat', 'updatedAt');

        console.log("Schema Case Fix Complete.");

    } catch (err) {
        console.error("Fatal Error during fix:", err);
    } finally {
        client.release();
        pool.end();
    }
}

fixAuthSchemaCase();
