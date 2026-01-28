import pg from 'pg';
import dotenv from 'dotenv';
const { Pool } = pg;

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

(async () => {
    try {
        console.log("--- Querying Admin View Data ---");
        const adminRes = await pool.query(`
            SELECT 
                o.id, o.slug, o.name,
                (SELECT u.email FROM "member" om JOIN "user" u ON u.id = om."userId" WHERE om."organizationId" = o.id AND om.role = 'owner' LIMIT 1) as "ownerEmail"
            FROM "organization" o
            ORDER BY o."createdAt" DESC
            LIMIT 5
        `);
        console.table(adminRes.rows.map(r => ({ slug: r.slug, owner: r.ownerEmail || 'NULL' })));

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
})();
