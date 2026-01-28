import pg from 'pg';
import { v4 as uuidv4 } from 'uuid';
const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function createOrg() {
    const userId = '2b2c6abe-7792-4df6-b3c5-fd946c3ddfb1';
    const orgId = uuidv4();
    const memberId = uuidv4();
    const settingsId = uuidv4();

    console.log(`Creating Org for User ${userId}...`);

    try {
        // 1. Create Organization
        const orgRes = await pool.query(`
            INSERT INTO "organization" (id, name, slug, "createdAt", "updatedAt")
            VALUES ($1, $2, $3, NOW(), NOW())
            RETURNING *
        `, [orgId, 'Orofacial Clinic', 'orofacial-clinic-main']);
        console.log("✅ Organization Created:", orgRes.rows[0].name, orgRes.rows[0].id);

        // 2. Create Membership
        const memberRes = await pool.query(`
            INSERT INTO "member" (id, "organizationId", "userId", role, "createdAt", "updatedAt")
            VALUES ($1, $2, $3, 'owner', NOW(), NOW())
            RETURNING *
        `, [memberId, orgId, userId]);
        console.log("✅ Member Linked:", memberRes.rows[0].role);

        // 3. Create Default Settings (to prevent 404 in settings page)
        await pool.query(`
            INSERT INTO "clinic_settings" (id, "organization_id", clinic_name, created_at, updated_at)
            VALUES ($1, $2, 'Orofacial Clinic', NOW(), NOW())
        `, [settingsId, orgId]);
        console.log("✅ Clinic Settings Initialized");

    } catch (err) {
        console.error("❌ Creation Failed:", err);
    } finally {
        await pool.end();
    }
}

createOrg();
