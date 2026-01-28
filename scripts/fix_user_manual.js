import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function fixUser() {
    const user = {
        id: '2b2c6abe-7792-4df6-b3c5-fd946c3ddfb1', // FROM SCREENSHOT
        email: 'marketingorofacial@gmail.com',
        name: 'ofc marketing',
        image: 'https://lh3.googleusercontent.com/a/ACg8ocI5pacRT_y2XOeHMo9Rt4YSJtmDSciMFIxjpDbkJkix3gnduKY=s96-c'
    };

    console.log(`Attemping to INSERT user ${user.email} (${user.id})...`);

    try {
        const res = await pool.query(`
            INSERT INTO "user" (id, name, email, "emailVerified", image, "createdAt", "updatedAt")
            VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
            RETURNING *
        `, [
            user.id,
            user.name,
            user.email,
            true, // emailVerified boolean
            user.image
        ]);
        console.log("✅ User INSERTED Successfully:", res.rows[0]);
    } catch (err) {
        console.error("❌ INSERT FAILED:", err);

        // If it failed, maybe check schema?
        try {
            const schema = await pool.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'user'
            `);
            console.log("--- Schema Dump ---");
            schema.rows.forEach(r => console.log(`${r.column_name}: ${r.data_type}`));
        } catch (e) { console.error("Schema check failed:", e); }
    } finally {
        await pool.end();
    }
}

fixUser();
