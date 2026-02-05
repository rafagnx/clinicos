import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function testChatPersistence() {
    console.log('--- Testing Chat Persistence ---');

    try {
        // 1. Check if tables exist
        const tables = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name IN ('conversations', 'messages', 'conversation_members')
        `);
        console.log('Existing tables:', tables.rows.map(r => r.table_name));

        // 2. Identify a test user and organization
        const userRes = await pool.query('SELECT id, email FROM "user" LIMIT 1');
        if (userRes.rows.length === 0) {
            console.log('No users found in database. Cannot run test.');
            return;
        }
        const testUser = userRes.rows[0];
        console.log(`Using test user: ${testUser.email} (${testUser.id})`);

        const orgRes = await pool.query('SELECT "organizationId" FROM member WHERE "userId" = $1 LIMIT 1', [testUser.id]);
        if (orgRes.rows.length === 0) {
            console.log('User has no organization member record.');
            return;
        }
        const orgId = orgRes.rows[0].organizationId;
        console.log(`Using organization: ${orgId}`);

        // 3. Create a test conversation
        console.log('Creating test conversation...');
        const convRes = await pool.query(`
            INSERT INTO conversations (organization_id, professional_id, status, last_message_at, title)
            VALUES ($1, $2, 'active', NOW(), $3)
            RETURNING id
        `, [orgId, testUser.id, 'Test Conversation']);
        const convId = convRes.rows[0].id;
        console.log(`Conversation created with ID: ${convId}`);

        // 4. Create a test message
        console.log('Creating test message...');
        const msgRes = await pool.query(`
            INSERT INTO messages (conversation_id, sender_id, content, organization_id, created_at)
            VALUES ($1, $2, $3, $4, NOW())
            RETURNING *
        `, [convId, testUser.id, 'Test message persistence', orgId]);
        const msg = msgRes.rows[0];
        console.log('Message saved:', msg.content);

        // 5. Verify persistence
        console.log('Verifying persistence via query...');
        const verifyRes = await pool.query('SELECT * FROM messages WHERE conversation_id = $1', [convId]);
        if (verifyRes.rows.length > 0 && verifyRes.rows[0].content === 'Test message persistence') {
            console.log('✅ Persistence verified!');
        } else {
            console.log('❌ Persistence verification failed.');
        }

        // 6. Cleanup (optional)
        // await pool.query('DELETE FROM messages WHERE conversation_id = $1', [convId]);
        // await pool.query('DELETE FROM conversations WHERE id = $1', [convId]);
        // console.log('Test data cleaned up.');

    } catch (err) {
        console.error('Test failed with error:', err);
        if (err.detail) console.log('Detail:', err.detail);
        if (err.hint) console.log('Hint:', err.hint);
        if (err.where) console.log('Where:', err.where);
    } finally {
        await pool.end();
    }
}

testChatPersistence();
