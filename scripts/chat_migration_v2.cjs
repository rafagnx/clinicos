const { Pool } = require('pg');
const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_aTCURwPX20Au@ep-dawn-cloud-ahadf3o4-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    const queries = [
        // 1. Ensure Conversations Table & Columns
        `CREATE TABLE IF NOT EXISTS "conversations" (id SERIAL PRIMARY KEY)`,
        `DO $$ BEGIN
            BEGIN ALTER TABLE "conversations" ADD COLUMN "organization_id" TEXT; EXCEPTION WHEN duplicate_column THEN END;
            BEGIN ALTER TABLE "conversations" ADD COLUMN "professional_id" TEXT; EXCEPTION WHEN duplicate_column THEN END;
            BEGIN ALTER TABLE "conversations" ADD COLUMN "recipient_professional_id" TEXT; EXCEPTION WHEN duplicate_column THEN END;
            BEGIN ALTER TABLE "conversations" ADD COLUMN "patient_id" INTEGER; EXCEPTION WHEN duplicate_column THEN END;
            BEGIN ALTER TABLE "conversations" ADD COLUMN "status" TEXT DEFAULT 'active'; EXCEPTION WHEN duplicate_column THEN END;
            BEGIN ALTER TABLE "conversations" ADD COLUMN "is_group" BOOLEAN DEFAULT FALSE; EXCEPTION WHEN duplicate_column THEN END;
            BEGIN ALTER TABLE "conversations" ADD COLUMN "title" TEXT; EXCEPTION WHEN duplicate_column THEN END;
            BEGIN ALTER TABLE "conversations" ADD COLUMN "image" TEXT; EXCEPTION WHEN duplicate_column THEN END;
            BEGIN ALTER TABLE "conversations" ADD COLUMN "admin_ids" TEXT[]; EXCEPTION WHEN duplicate_column THEN END;
            BEGIN ALTER TABLE "conversations" ADD COLUMN "last_message_at" TIMESTAMP; EXCEPTION WHEN duplicate_column THEN END;
            BEGIN ALTER TABLE "conversations" ADD COLUMN "created_at" TIMESTAMP DEFAULT NOW(); EXCEPTION WHEN duplicate_column THEN END;
        END $$;`,

        // 2. Ensure Messages Table & Columns
        `CREATE TABLE IF NOT EXISTS "messages" (id SERIAL PRIMARY KEY)`,
        `DO $$ BEGIN
            BEGIN ALTER TABLE "messages" ADD COLUMN "conversation_id" INTEGER; EXCEPTION WHEN duplicate_column THEN END;
            BEGIN ALTER TABLE "messages" ADD COLUMN "sender_id" TEXT; EXCEPTION WHEN duplicate_column THEN END;
            BEGIN ALTER TABLE "messages" ADD COLUMN "content" TEXT; EXCEPTION WHEN duplicate_column THEN END;
            BEGIN ALTER TABLE "messages" ADD COLUMN "organization_id" TEXT; EXCEPTION WHEN duplicate_column THEN END;
            BEGIN ALTER TABLE "messages" ADD COLUMN "created_at" TIMESTAMP DEFAULT NOW(); EXCEPTION WHEN duplicate_column THEN END;
        END $$;`,

        // 3. Ensure Conversation Members Table
        `CREATE TABLE IF NOT EXISTS "conversation_members" (
            "conversation_id" INTEGER,
            "user_id" TEXT,
            "role" TEXT DEFAULT 'member',
            "joined_at" TIMESTAMP DEFAULT NOW(),
            PRIMARY KEY ("conversation_id", "user_id")
        )`
    ];

    try {
        console.log('Starting migration...');
        for (const q of queries) {
            await pool.query(q);
        }
        console.log('Migration completed successfully!');
    } catch (e) {
        console.error('Migration failed:', e);
    } finally {
        await pool.end();
    }
}

migrate();
