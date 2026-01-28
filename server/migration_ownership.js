
import { v4 as uuidv4 } from 'uuid';

export async function runOwnershipMigration(pool) {
    console.log("--- Starting Ownership Migration (Production) ---");

    try {
        // 1. Get Users
        const rafa = await pool.query('SELECT id FROM "user" WHERE email = $1', ['rafamarketingdb@gmail.com']);
        const marketing = await pool.query('SELECT id FROM "user" WHERE email = $1', ['marketingorofacial@gmail.com']);

        if (rafa.rows.length === 0) {
            console.log("Migration Skipped: User rafamarketingdb not found");
            return;
        }

        const rafaId = rafa.rows[0].id;
        let marketingId = null;
        if (marketing.rows.length > 0) {
            marketingId = marketing.rows[0].id;
        }

        // ==========================================
        // FIX 1: ClinicOS Master -> Rafa
        // ==========================================
        const masterOrgSlug = 'master-admin';
        let masterOrg = await pool.query('SELECT id FROM "organization" WHERE slug = $1', [masterOrgSlug]);

        if (masterOrg.rows.length === 0) {
            console.log(`Org ${masterOrgSlug} not found. Creating...`);
            const newId = uuidv4();
            await pool.query(`
                INSERT INTO "organization"(id, name, slug, subscription_status, "createdAt", "updatedAt")
                VALUES($1, 'ClinicOS Master', $2, 'active', NOW(), NOW())
            `, [newId, masterOrgSlug]);
            masterOrg = { rows: [{ id: newId }] };
        }

        const masterId = masterOrg.rows[0].id;

        // Check current owner
        const currentMasterOwner = await pool.query('SELECT "userId" FROM "member" WHERE "organizationId" = $1 AND role = $2', [masterId, 'owner']);

        if (currentMasterOwner.rows.length === 0 || currentMasterOwner.rows[0].userId !== rafaId) {
            console.log("Fixing ClinicOS Master Owner...");
            await pool.query('DELETE FROM "member" WHERE "organizationId" = $1 AND role = $2', [masterId, 'owner']);

            // Check if rafa is member
            const rafaMem = await pool.query('SELECT id FROM "member" WHERE "organizationId" = $1 AND "userId" = $2', [masterId, rafaId]);
            if (rafaMem.rows.length > 0) {
                await pool.query('UPDATE "member" SET role = $1 WHERE id = $2', ['owner', rafaMem.rows[0].id]);
            } else {
                await pool.query(`INSERT INTO "member"(id, "organizationId", "userId", role, "createdAt", "updatedAt") VALUES(gen_random_uuid(), $1, $2, 'owner', NOW(), NOW())`, [masterId, rafaId]);
            }
            console.log("✅ Rafa assigned to ClinicOS Master");
        } else {
            console.log("✓ ClinicOS Master already owned by Rafa");
        }

        // ==========================================
        // FIX 2: Orofacial Clinic -> Marketing
        // ==========================================
        if (marketingId) {
            // Try known slugs from screenshot + my DB discovery
            const slugsToTry = ['orofacial-clinic', 'orofacial-clinic-main'];
            let orofacialId = null;

            for (const slug of slugsToTry) {
                const res = await pool.query('SELECT id FROM "organization" WHERE slug = $1', [slug]);
                if (res.rows.length > 0) {
                    orofacialId = res.rows[0].id;
                    break;
                }
            }

            if (orofacialId) {
                const currentOroOwner = await pool.query('SELECT "userId" FROM "member" WHERE "organizationId" = $1 AND role = $2', [orofacialId, 'owner']);

                if (currentOroOwner.rows.length === 0 || currentOroOwner.rows[0].userId !== marketingId) {
                    console.log(`Fixing Orofacial Owner for ID ${orofacialId}...`);
                    await pool.query('DELETE FROM "member" WHERE "organizationId" = $1 AND role = $2', [orofacialId, 'owner']);

                    const markMem = await pool.query('SELECT id FROM "member" WHERE "organizationId" = $1 AND "userId" = $2', [orofacialId, marketingId]);
                    if (markMem.rows.length > 0) {
                        await pool.query('UPDATE "member" SET role = $1 WHERE id = $2', ['owner', markMem.rows[0].id]);
                    } else {
                        await pool.query(`INSERT INTO "member"(id, "organizationId", "userId", role, "createdAt", "updatedAt") VALUES(gen_random_uuid(), $1, $2, 'owner', NOW(), NOW())`, [orofacialId, marketingId]);
                    }
                    console.log("✅ Marketing assigned to Orofacial Clinic");
                } else {
                    console.log("✓ Orofacial Clinic already owned by Marketing");
                }
            } else {
                console.log("⚠️ Orofacial Clinic org not found (tried slugs: " + slugsToTry.join(', ') + ")");
            }
        }

    } catch (error) {
        console.error("Migration Error:", error);
    }
}
