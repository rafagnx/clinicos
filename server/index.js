import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';
import { stripeService } from './stripe-service.js';
import { startCleanupJob } from './jobs/cleanup.js';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

// FIX FOR RENDER SSL ISSUES with internal libraries like better-auth
// This allows connections to Postgres with self-signed certs (common in Render internal network)
// FIX FOR SSL ISSUES (Local Supabase Pooler & Render)
// This allows connections to Postgres with self-signed certs
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const app = express();
app.set('trust proxy', 1); // Trust first proxy (Render Load Balancer) - Required for Secure Cookies
const PORT = process.env.PORT || 3001;

// Database Connection Config
const dbConfig = process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    }
    : {
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'clinicOS',
        password: process.env.DB_PASSWORD || 'password',
        port: process.env.DB_PORT || 5432,
    };

const pool = new Pool(dbConfig);

// SUPABASE AUTH SETUP
// Using hardcoded keys allowed by user for immediate migration fix
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://yhfjhovhemgcamigimaj.supabase.co";
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloZmpob3ZoZW1nY2FtaWdpbWFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNzE1NzAsImV4cCI6MjA4NDY0NzU3MH0.6a8aSDM12eQwTRZES5r_hqFDGq2akKt9yMOys3QzodQ";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// AUTH MIDDLEWARE (Definition)
const requireAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    // Allow options/preflight to pass if not caught by cors? cors handles it.

    // If using Bearer Token
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            const { data: { user }, error } = await supabase.auth.getUser(token);
            if (!error && user) {
                // AUTO-SYNC: Ensure Supabase user exists in DB table
                try {
                    // Optimized sync: Try to update by ID first, if not exists, try to update by EMAIL, if still not exists, INSERT.
                    // This handles cases where Supabase ID might have changed for the same email (e.g. account recreation)
                    const existingByEmail = await pool.query('SELECT id FROM "user" WHERE email = $1', [user.email]);

                    if (existingByEmail.rows.length > 0 && existingByEmail.rows[0].id !== user.id) {
                        // User exists with same email but DIFFERENT ID - update the old record with new ID
                        console.log(`[Auth] Updating User ID for ${user.email} from ${existingByEmail.rows[0].id} to ${user.id}`);
                        await pool.query(`
                            UPDATE "user" SET 
                                id = $1, 
                                name = $2, 
                                image = $3, 
                                "updatedAt" = NOW() 
                            WHERE email = $4
                        `, [user.id, user.user_metadata?.full_name || user.email.split('@')[0], user.user_metadata?.avatar_url || null, user.email]);
                    } else {
                        // Standard Upsert by ID
                        await pool.query(`
                            INSERT INTO "user" (id, name, email, "emailVerified", image, "createdAt", "updatedAt")
                            VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
                            ON CONFLICT (id) DO UPDATE SET
                                name = EXCLUDED.name,
                                email = EXCLUDED.email,
                                image = EXCLUDED.image,
                                "updatedAt" = NOW()
                        `, [
                            user.id,
                            user.user_metadata?.full_name || user.email.split('@')[0],
                            user.email,
                            user.email_confirmed_at ? true : false,
                            user.user_metadata?.avatar_url || null
                        ]);
                    }
                } catch (syncError) {
                    console.warn("[Auth] User sync warning:", syncError.message);
                    // Continue even if sync fails - not critical for auth
                }

                const isSystemAdmin = user.email === "rafamarketingdb@gmail.com";
                req.auth = {
                    userId: user.id,
                    organizationId: req.headers['x-organization-id'],
                    user: { ...user, role: isSystemAdmin ? 'admin' : (user.user_metadata?.role || 'user') },
                    isSystemAdmin: isSystemAdmin
                };
                return next();
            }
        } catch (err) {
            console.error(`[Auth] Token Validation Error for ${authHeader.substring(0, 10)}... :`, err.message);
            if (err.status === 401 || err.status === 403) {
                // Supabase rejected the token specifically
                console.error("[Auth] Supabase rejected token. Reason:", err);
            }
        }
    } else {
        console.warn("[Auth] No Bearer Token provided in header");
    }

    // If authentication failed
    return res.status(401).json({ error: "Unauthorized: Invalid Session" });
};

// Middleware
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        const allowedOrigins = [
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:5175",
            "http://localhost:5176",
            "http://localhost:3001",
            "https://clinicos.unaux.com",
            "https://www.clinicos.unaux.com",
            "http://clinicos.unaux.com",
            "https://clinicos-ruby.vercel.app",
            "https://clinicos-black.vercel.app",
            "https://clinicos-eta.vercel.app",
            "https://clinicosapp.vercel.app"
        ];

        if (allowedOrigins.indexOf(origin) === -1) {
            console.log("BLOCKED CORS ORIGIN:", origin); // Debug log
            var msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true // Required for auth cookies
}));

// STRIPE WEBHOOK (Must be before bodyParser to access raw body)
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const signature = req.headers['stripe-signature'];
    try {
        // Pass the raw body directly
        const result = await stripeService.handleWebhook(signature, req.body, pool);
        res.json(result);
    } catch (err) {
        console.error("Webhook Error:", err);
        res.status(400).send(`Webhook Error: ${err.message}`);
    }
});

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../dist')));

// Auth routes handled by Supabase direct integration
// Manual routes for Organization/Admin exist below.

// MANUAL MIGRATION ENDPOINT (Emergency Fix for Database)
app.post("/api/debug/migrate", async (req, res) => {
    try {
        console.log("Starting manual migration via initSchema...");
        await initSchema();
        res.json({ success: true, message: "Migration completed successfully via initSchema" });
    } catch (error) {
        console.error("Migration failed:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Initial Schema Setup (Auto-Migration)
const initSchema = async () => {
    try {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Extensions
            await client.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');
            await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

            // 1. Ensure CORE tables exist
            await client.query(`
                CREATE TABLE IF NOT EXISTS "user" (
                    id TEXT PRIMARY KEY,
                    name TEXT,
                    email TEXT UNIQUE,
                    image TEXT,
                    "emailVerified" BOOLEAN,
                    "createdAt" TIMESTAMP DEFAULT NOW(),
                    "updatedAt" TIMESTAMP DEFAULT NOW()
                );
                CREATE TABLE IF NOT EXISTS "organization" (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    slug TEXT UNIQUE,
                    logo TEXT,
                    "createdAt" TIMESTAMP DEFAULT NOW(),
                    "updatedAt" TIMESTAMP DEFAULT NOW()
                );
                CREATE TABLE IF NOT EXISTS "member" (
                    id TEXT PRIMARY KEY,
                    "organizationId" TEXT NOT NULL,
                    "userId" TEXT NOT NULL,
                    role TEXT NOT NULL,
                    "createdAt" TIMESTAMP DEFAULT NOW(),
                    "updatedAt" TIMESTAMP DEFAULT NOW(),
                    UNIQUE("organizationId", "userId")
                );
                CREATE TABLE IF NOT EXISTS "pending_invites" (
                    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                    "email" TEXT NOT NULL,
                    "organization_id" TEXT NOT NULL,
                    "role" TEXT DEFAULT 'user',
                    "created_by" TEXT,
                    "created_at" TIMESTAMP DEFAULT NOW()
                );
            `);

            await client.query(`
                CREATE TABLE IF NOT EXISTS "patients" (
                    id SERIAL PRIMARY KEY,
                    name TEXT NOT NULL,
                    email TEXT,
                    phone TEXT,
                    created_at TIMESTAMP DEFAULT NOW()
                );
            `);

            await client.query(`
                CREATE TABLE IF NOT EXISTS "professionals" (
                    id SERIAL PRIMARY KEY,
                    name TEXT NOT NULL,
                    email TEXT,
                    created_at TIMESTAMP DEFAULT NOW()
                );
            `);

            await client.query(`
                CREATE TABLE IF NOT EXISTS "appointments" (
                    id SERIAL PRIMARY KEY,
                    start_time TIMESTAMP NOT NULL,
                    end_time TIMESTAMP NOT NULL,
                    created_at TIMESTAMP DEFAULT NOW()
                );
            `);

            await client.query(`
                CREATE TABLE IF NOT EXISTS "notifications" (
                    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                    "title" TEXT,
                    "message" TEXT,
                    "user_id" TEXT NOT NULL,
                    "read" BOOLEAN DEFAULT FALSE,
                    "action_url" TEXT,
                    "organization_id" TEXT,
                    "created_at" TIMESTAMP DEFAULT NOW(),
                    "updated_at" TIMESTAMP DEFAULT NOW()
                );
                CREATE TABLE IF NOT EXISTS "clinic_settings" (
                    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                    "clinic_name" TEXT,
                    "logo_url" TEXT,
                    "phone" TEXT,
                    "email" TEXT,
                    "address" TEXT,
                    "website" TEXT,
                    "instagram" TEXT,
                    "meta_integration" JSONB DEFAULT '{}',
                    "organization_id" TEXT,
                    "created_at" TIMESTAMP DEFAULT NOW(),
                    "updated_at" TIMESTAMP DEFAULT NOW()
                );
                CREATE TABLE IF NOT EXISTS "leads" (
                    "id" SERIAL PRIMARY KEY,
                    "name" TEXT,
                    "email" TEXT,
                    "phone" TEXT,
                    "status" TEXT DEFAULT 'new',
                    "source" TEXT,
                    "notes" TEXT,
                    "organization_id" TEXT,
                    "created_at" TIMESTAMP DEFAULT NOW()
                );
                CREATE TABLE IF NOT EXISTS "medical_records" (
                    "id" SERIAL PRIMARY KEY,
                    "patient_id" INTEGER,
                    "professional_id" INTEGER,
                    "content" TEXT,
                    "date" TIMESTAMP DEFAULT NOW(),
                    "organization_id" TEXT,
                    "created_at" TIMESTAMP DEFAULT NOW()
                );
                CREATE TABLE IF NOT EXISTS "financial_transactions" (
                    "id" SERIAL PRIMARY KEY,
                    "description" TEXT,
                    "amount" NUMERIC(10, 2),
                    "type" TEXT,
                    "category" TEXT,
                    "status" TEXT,
                    "date" DATE,
                    "organization_id" TEXT,
                    "created_at" TIMESTAMP DEFAULT NOW()
                );
                CREATE TABLE IF NOT EXISTS "promotions" (
                    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                    "name" TEXT,
                    "discount_value" NUMERIC(10, 2),
                    "active" BOOLEAN DEFAULT TRUE,
                    "organization_id" TEXT,
                    "created_at" TIMESTAMP DEFAULT NOW()
                );
            `);

            // 2. Add organization_id to key tables if missing
            const tablesToCheck = ['patients', 'professionals', 'appointments', 'leads', 'financial_transactions', 'medical_records'];
            for (const table of tablesToCheck) {
                const tableExists = await client.query(`SELECT EXISTS(SELECT FROM information_schema.tables WHERE table_name = $1);`, [table]);
                if (tableExists.rows[0].exists) {
                    const colExists = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = $1 AND column_name = 'organization_id';`, [table]);
                    if (colExists.rows.length === 0) {
                        await client.query(`ALTER TABLE "${table}" ADD COLUMN "organization_id" TEXT; `);
                        await client.query(`CREATE INDEX IF NOT EXISTS "idx_${table}_org_id" ON "${table}"("organization_id"); `);
                    }
                }
            }

            // 3. Update Professionals Columns
            const profCols = [
                { name: 'status', type: 'VARCHAR(50) DEFAULT \'ativo\'' },
                { name: 'role_type', type: 'VARCHAR(50) DEFAULT \'profissional\'' },
                { name: 'council_number', type: 'VARCHAR(50)' },
                { name: 'council_state', type: 'VARCHAR(10)' },
                { name: 'phone', type: 'VARCHAR(20)' },
                { name: 'color', type: 'VARCHAR(100) DEFAULT \'#3B82F6\'' },
                { name: 'appointment_duration', type: 'INTEGER DEFAULT 30' }
            ];
            for (const col of profCols) {
                const colCheck = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'professionals' AND column_name = $1;`, [col.name]);
                if (colCheck.rows.length === 0) {
                    await client.query(`ALTER TABLE "professionals" ADD COLUMN "${col.name}" ${col.type}; `);
                }
            }

            // 4. Update Patients Columns
            const patientCols = [
                { name: 'name', type: 'TEXT' },
                { name: 'email', type: 'VARCHAR(255)' },
                { name: 'phone', type: 'VARCHAR(50)' },
                { name: 'cpf', type: 'VARCHAR(50)' },
                { name: 'birth_date', type: 'DATE' },
                { name: 'photo_url', type: 'TEXT' },
                { name: 'whatsapp', type: 'VARCHAR(20)' },
                { name: 'gender', type: 'VARCHAR(50)' },
                { name: 'address', type: 'TEXT' },
                { name: 'city', type: 'VARCHAR(255)' },
                { name: 'marketing_source', type: 'VARCHAR(100)' },
                { name: 'notes', type: 'TEXT' },
                { name: 'status', type: 'VARCHAR(50) DEFAULT \'ativo\'' }
            ];
            for (const col of patientCols) {
                const colCheck = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'patients' AND column_name = $1;`, [col.name]);
                if (colCheck.rows.length === 0) {
                    await client.query(`ALTER TABLE "patients" ADD COLUMN "${col.name}" ${col.type}; `);
                }
            }

            // 5. Update Appointments Columns
            const aptCols = [
                { name: 'patient_id', type: 'INTEGER' },
                { name: 'professional_id', type: 'INTEGER' },
                { name: 'procedure_name', type: 'VARCHAR(255)' },
                { name: 'duration', type: 'INTEGER DEFAULT 60' },
                { name: 'scheduled_by', type: 'VARCHAR(255)' },
                { name: 'promotion_id', type: 'UUID' },
                { name: 'date', type: 'DATE' },
                { name: 'time', type: 'VARCHAR(20)' }
            ];
            for (const col of aptCols) {
                const colCheck = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = $1;`, [col.name]);
                if (colCheck.rows.length === 0) {
                    await client.query(`ALTER TABLE "appointments" ADD COLUMN "${col.name}" ${col.type}; `);
                }
            }

            await client.query('COMMIT');
            console.log('Database schema verified and migrated.');
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('Schema/Auto Migration Failed:', err);
    }
};

// Test connection
pool.connect(async (err, client, release) => {
    if (err) {
        console.error('Error acquiring client', err.stack);
    } else {
        console.log('Connected to PostgreSQL database!');
        await initSchema();
        release();
    }
});

// ------------------------------------------------------------------
// MIDDLEWARE: Require Auth & Organization
// ------------------------------------------------------------------
// ------------------------------------------------------------------
// MIDDLEWARE: Require Auth & Organization
// ------------------------------------------------------------------
// requireAuth is defined above using Supabase logic

// ADMIN ROUTES (System Admin Only)
app.get('/api/admin/organizations', requireAuth, async (req, res) => {
    if (!req.auth.isSystemAdmin) {
        return res.status(403).json({ error: "Access Denied: System Admin Only" });
    }
    try {
        const { rows } = await pool.query('SELECT * FROM "organization" ORDER BY "createdAt" DESC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Manual Organization Create (Bypass Better-Auth plugin if failing)
app.post('/api/admin/organization/create', requireAuth, async (req, res) => {
    // Basic validation
    const { name, slug } = req.body;
    const { user } = req.auth;

    if (!name || !slug) return res.status(400).json({ error: "Name and Slug required" });

    try {
        // 1. Check if slug exists
        const check = await pool.query('SELECT id FROM "organization" WHERE slug = $1', [slug]);
        if (check.rows.length > 0) {
            return res.status(400).json({ error: "Slug already exists" });
        }

        // 2. Create Organization
        const orgId = uuidv4();
        const now = new Date();
        const newOrg = await pool.query(
            `INSERT INTO "organization"(id, name, slug, "createdAt", "updatedAt")
VALUES($1, $2, $3, $4, $5) RETURNING * `,
            [orgId, name, slug, now, now]
        );

        // 3. Add User as Owner/Admin Member
        const memberId = uuidv4();
        await pool.query(
            `INSERT INTO "member"(id, "organizationId", "userId", role, "createdAt", "updatedAt")
VALUES($1, $2, $3, $4, $5, $6)`,
            [memberId, orgId, user.id, "owner", now, now]
        );

        res.json(newOrg.rows[0]);

    } catch (error) {
        console.error("Manual Org Create Error:", error);
        res.status(500).json({ error: error.message });
    }
});


// ------------------------------------------------------------------
// ROUTES
// ------------------------------------------------------------------

// Test Route
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'ClinicOS Server is running' });
});

// Diagnostics Route (Check DB)
app.get('/api/diagnostics', async (req, res) => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW()');
        client.release();

        res.json({
            status: 'ok',
            database: 'connected',
            time: result.rows[0].now,
            env: {
                node_env: process.env.NODE_ENV,
                has_db_url: !!process.env.DATABASE_URL,
                has_auth_secret: !!process.env.BETTER_AUTH_SECRET,
                backend_url: process.env.VITE_BACKEND_URL
            }
        });
    } catch (error) {
        console.error('Diagnostics Error:', error);
        res.status(500).json({
            status: 'error',
            database: 'disconnected',
            error: error.message,
            env: {
                node_env: process.env.NODE_ENV,
                has_db_url: !!process.env.DATABASE_URL
            }
        });
    }
});


const userScopedEntities = ['NotificationPreference', 'Notification'];

// Admin Bypass Subscription (Super Admin Only)
app.post('/api/admin/organizations/:id/bypass', requireAuth, async (req, res) => {
    const { id } = req.params;
    const { active } = req.body;
    const { user } = req.auth;

    console.log(`[Admin Bypass] Attempt by ${user.email} for Org ${id} to active=${active}`);

    const authorizedEmails = ['rafamarketingdb@gmail.com', process.env.SUPER_ADMIN_EMAIL].filter(Boolean);

    if (!authorizedEmails.includes(user.email)) {
        console.warn(`[Admin Bypass] Denied: ${user.email} is not authorized.`);
        return res.status(403).json({ error: "Access Denied. Super Admin only." });
    }

    try {
        // active can be boolean true/false
        const status = active ? 'active' : 'canceled'; // Changed from 'manual_override' to 'active' to match Stripe status enums usually
        // Or keep manual_override if your frontend logic checks specifically for that. 
        // Let's stick to 'active' which usually grants access everywhere.
        // Actually, let's use 'manual_override' if that's what the logic expects, but 'active' implies PRO.

        // Let's use 'active' to simulate a real subscription
        const finalStatus = active ? 'active' : 'canceled';

        const result = await pool.query(`
            UPDATE "organization" 
            SET "subscription_status" = $1, 
                "updatedAt" = NOW()
            WHERE id = $2
            RETURNING *
        `, [finalStatus, id]);

        console.log(`[Admin Bypass] Success. New Status: ${finalStatus}`);
        res.json({ success: true, organization: result.rows[0] });
    } catch (error) {
        console.error('[Admin Bypass] DB Error', error);
        res.status(500).json({ error: 'Failed to bypass subscription' });
    }
});

// GET User's Organizations (Critical for Login Context)
app.get('/api/user/organizations', requireAuth, async (req, res) => {
    const { user } = req.auth;

    try {
        const { rows } = await pool.query(`
            SELECT 
                m.id as "membershipId",
                m.role,
                m."organizationId",
                o.name as "organizationName",
                o.slug,
                o.logo,
                o.subscription_status,
                o."createdAt"
            FROM "member" m
            INNER JOIN "organization" o ON o.id = m."organizationId"
            WHERE m."userId" = $1
            ORDER BY m."createdAt" DESC
        `, [user.id]);

        // AUTO-CREATE ORG FOR MASTER ADMIN if doesn't have one
        if (user.email === 'rafamarketingdb@gmail.com' && rows.length === 0) {
            console.log("[Auto-Org] Creating default organization for Master Admin");
            const orgId = uuidv4();
            const now = new Date();

            // Check if org already exists first
            const existingOrg = await pool.query('SELECT id FROM "organization" WHERE slug = $1', ['master-admin']);

            const finalOrgId = existingOrg.rows.length > 0 ? existingOrg.rows[0].id : orgId;

            if (existingOrg.rows.length === 0) {
                await pool.query(`
                    INSERT INTO "organization" (id, name, slug, subscription_status, "createdAt", "updatedAt")
                    VALUES ($1, $2, $3, $4, $5, $6)
                `, [orgId, 'ClinicOS Master', 'master-admin', 'active', now, now]);
            }

            // Create membership
            const memberId = uuidv4();
            await pool.query(`
                INSERT INTO "member" (id, "organizationId", "userId", role, "createdAt", "updatedAt")
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT DO NOTHING
            `, [memberId, finalOrgId, user.id, 'owner', now, now]);

            // Re-fetch organizations
            const refetch = await pool.query(`
                SELECT 
                    m.id as "membershipId",
                    m.role,
                    m."organizationId",
                    o.name as "organizationName",
                    o.slug,
                    o.logo,
                    o.subscription_status,
                    o."createdAt"
                FROM "member" m
                INNER JOIN "organization" o ON o.id = m."organizationId"
                WHERE m."userId" = $1
                ORDER BY m."createdAt" DESC
            `, [user.id]);

            return res.json(refetch.rows);
        }

        res.json(rows);
    } catch (error) {
        console.error("Error fetching user orgs:", error);
        res.status(500).json({ error: "Failed to fetch organizations" });
    }
});

app.delete('/api/admin/organizations/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    const { user } = req.auth;
    const authorizedEmails = ['rafamarketingdb@gmail.com', process.env.SUPER_ADMIN_EMAIL].filter(Boolean);

    if (!authorizedEmails.includes(user.email)) {
        return res.status(403).json({ error: "Access Denied" });
    }

    try {
        await pool.query('DELETE FROM "organization" WHERE id = $1', [id]);
        res.json({ success: true, message: "Deleted" });
    } catch (err) {
        console.error("Delete Org Error:", err);
        if (err.code === '23503') return res.status(400).json({ error: "Cannot delete org with active data" });
        res.status(500).json({ error: err.message });
    }
});

// User Profile Sync (Dummy for now to prevent 404/400)
app.put('/api/user/profile', requireAuth, async (req, res) => {
    // Ideally we would sync separate Users table here
    // For now success to allow frontend flow to complete
    res.json({ success: true });
});

// Pending Invites System (Replaces Better Auth Invites)
app.post('/api/admin/invites', requireAuth, async (req, res) => {
    const { email, organizationId, role } = req.body;
    const { user } = req.auth;

    const authorizedEmails = ['rafamarketingdb@gmail.com', process.env.SUPER_ADMIN_EMAIL].filter(Boolean);
    if (!authorizedEmails.includes(user.email)) {
        return res.status(403).json({ error: "Access Denied" });
    }

    try {
        // Create pending_invites table if not exists
        await pool.query(`
            CREATE TABLE IF NOT EXISTS "pending_invites" (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                email TEXT NOT NULL,
                organization_id TEXT NOT NULL,
                role TEXT DEFAULT 'admin',
                created_at TIMESTAMP DEFAULT NOW(),
                created_by TEXT
            );
        `);

        // Insert invite
        const result = await pool.query(`
            INSERT INTO "pending_invites" (email, organization_id, role, created_by)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `, [email, organizationId, role || 'admin', user.id]);

        res.json({ success: true, invite: result.rows[0] });
    } catch (err) {
        console.error("Invite Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Process Pending Invites (Auto-Accept by Email)
app.post('/api/user/invites/process', requireAuth, async (req, res) => {
    const { user } = req.auth;
    const now = new Date();

    try {
        // Find invites for this email
        const invites = await pool.query('SELECT * FROM "pending_invites" WHERE email = $1', [user.email]);

        const results = [];

        for (const invite of invites.rows) {
            // Add to member table
            const memberId = uuidv4();
            await pool.query(`
                INSERT INTO "member" (id, "organizationId", "userId", role, "createdAt", "updatedAt")
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT ("organizationId", "userId") DO NOTHING
            `, [memberId, invite.organization_id, user.id, invite.role, now, now]);

            results.push(invite);

            // Delete invite
            await pool.query('DELETE FROM "pending_invites" WHERE id = $1', [invite.id]);
        }

        res.json({ processed: results.length, invites: results });
    } catch (err) {
        console.error("Process Invites Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// List pending invites for organization
app.get('/api/admin/invites/:orgId', requireAuth, async (req, res) => {
    const { orgId } = req.params;
    const { user } = req.auth;

    const authorizedEmails = ['rafamarketingdb@gmail.com', process.env.SUPER_ADMIN_EMAIL].filter(Boolean);
    if (!authorizedEmails.includes(user.email)) {
        return res.status(403).json({ error: "Access Denied" });
    }

    try {
        const { rows } = await pool.query(`
            SELECT * FROM "pending_invites" 
            WHERE organization_id = $1 
            ORDER BY created_at DESC
        `, [orgId]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GENERIC READ (List/Filter)
app.get('/api/:entity', requireAuth, async (req, res) => {
    const { entity } = req.params;
    const { organizationId, isSystemAdmin, user } = req.auth;

    const tableMap = {
        'Professional': 'professionals',
        'Patient': 'patients',
        'Appointment': 'appointments',
        'MedicalRecord': 'medical_records',
        'Notification': 'notifications',
        'Promotion': 'promotions',
        'Lead': 'leads',
        'Message': 'messages',
        'Conversation': 'conversations',
        'ClinicSettings': 'clinic_settings',
        'NotificationPreference': 'notification_preferences',
        'ProcedureType': 'procedure_types',
        'FinancialTransaction': 'financial_transactions'
    };

    const tableName = tableMap[entity];
    if (!tableName) return res.status(400).json({ error: 'Invalid entity' });

    const isUserScoped = userScopedEntities.includes(entity);

    if (!organizationId && !isUserScoped) {
        if (isSystemAdmin) {
            return res.json([]);
        }
        return res.status(400).json({ error: "Organization Context Required (Header: x-organization-id)" });
    }

    try {
        let query = `SELECT * FROM ${tableName} `;
        let params = [];
        let whereClauses = [];
        let paramIndex = 1;

        if (isUserScoped) {
            whereClauses.push(`user_id = $${paramIndex++} `);
            params.push(user.id);
        } else {
            whereClauses.push(`organization_id = $${paramIndex++} `);
            params.push(organizationId);
        }

        if (req.query.id) {
            whereClauses.push(`id = $${paramIndex++} `);
            params.push(req.query.id);
        }

        // Generic Filtering
        const reservedParams = ['id', 'limit', 'sort', 'include', 'fields'];
        Object.keys(req.query).forEach(key => {
            if (reservedParams.includes(key)) return;
            // Skip invalid keys to avoid SQL errors (simple regex to allow alphanum + underscore)
            if (!/^[a-zA-Z0-9_]+$/.test(key)) return;

            const value = req.query[key];

            if (typeof value === 'object' && value !== null) {
                // Handle Operators
                if (value._gte) {
                    whereClauses.push(`"${key}" >= $${paramIndex++} `);
                    params.push(value._gte);
                }
                if (value._gt) {
                    whereClauses.push(`"${key}" > $${paramIndex++} `);
                    params.push(value._gt);
                }
                if (value._lt) {
                    whereClauses.push(`"${key}" < $${paramIndex++} `);
                    params.push(value._lt);
                }
                if (value._lte) {
                    whereClauses.push(`"${key}" <= $${paramIndex++} `);
                    params.push(value._lte);
                }
            } else {
                // Exact Match
                whereClauses.push(`"${key}" = $${paramIndex++} `);
                params.push(value);
            }
        });

        if (whereClauses.length > 0) {
            query += ` WHERE ` + whereClauses.join(' AND ');
        }

        if (tableName === 'appointments') {
            query += ` ORDER BY start_time ASC`;
        } else {
            query += ` ORDER BY created_at DESC`;
        }

        if (req.query.limit) {
            query += ` LIMIT $${paramIndex++} `;
            params.push(parseInt(req.query.limit));
        }

        const { rows } = await pool.query(query, params);

        // DATA FIX: Map 'name' back to 'full_name' for frontend compatibility
        const mappedRows = rows.map(row => ({
            ...row,
            full_name: row.full_name || row.name || ""
        }));

        res.json(mappedRows);
    } catch (error) {
        console.error(`Error fetching ${entity}: `, error);
        res.status(500).json({ error: error.message });
    }
});

// Helper to prevent SQL Injection in column names
const isValidColumn = (key) => /^[a-zA-Z0-9_]+$/.test(key);

// GENERIC CREATE
app.post('/api/:entity', requireAuth, async (req, res) => {
    const { entity } = req.params;
    const { organizationId, user } = req.auth;

    const tableMap = {
        'Professional': 'professionals',
        'Patient': 'patients',
        'Appointment': 'appointments',
        'MedicalRecord': 'medical_records',
        'Notification': 'notifications',
        'Promotion': 'promotions',
        'Lead': 'leads',
        'Message': 'messages',
        'Conversation': 'conversations',
        'ClinicSettings': 'clinic_settings',
        'NotificationPreference': 'notification_preferences'
    };
    const tableName = tableMap[entity];
    if (!tableName) return res.status(400).json({ error: 'Invalid entity' });

    const isUserScoped = userScopedEntities.includes(entity);

    if (!organizationId && !isUserScoped && !req.auth.isSystemAdmin && req.auth.user?.role?.toLowerCase() !== 'admin') {
        return res.status(400).json({ error: "Organization Context Required" });
    }

    const data = req.body;
    delete data.id; // Ensure ID is generated

    // DATA FIX: Map 'full_name' to 'name' for Professionals and Patients if needed
    if ((entity === 'Professional' || entity === 'Patient') && data.full_name) {
        data.name = data.full_name;
        delete data.full_name;
    }

    // DATA FIX: Ensure 'rating' is a number
    if (entity === 'Professional' && data.rating) {
        data.rating = parseFloat(data.rating);
    }

    // Inject Context ID
    if (isUserScoped) {
        data.user_id = user.id;
    } else {
        data.organization_id = organizationId;
    }

    console.log(`[DEBUG] Creating ${entity} in ${tableName}`);
    console.log(`[DEBUG] Raw Data:`, JSON.stringify(data));

    try {
        // SECURITY FIX: Filter invalid columns
        const keys = Object.keys(data).filter(key => isValidColumn(key));
        console.log(`[DEBUG] Filtered Keys:`, keys);

        if (keys.length === 0) {
            return res.status(400).json({ error: "No valid data provided" });
        }

        const values = keys.map(key => {
            const v = data[key];
            return (typeof v === 'object' ? JSON.stringify(v) : v);
        });

        const placeholders = keys.map((_, i) => `$${i + 1} `).join(', ');

        const query = `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES(${placeholders}) RETURNING * `;
        console.log(`[DEBUG] Query:`, query);
        console.log(`[DEBUG] Values:`, values);

        const { rows } = await pool.query(query, values);

        res.json(rows[0]);
    } catch (error) {
        const errorLog = `[${new Date().toISOString()}] Error creating ${entity}: ${error.message} \nDetail: ${error.detail} \nCode: ${error.code} \nData: ${JSON.stringify(data)}\n\n`;
        console.error(errorLog);

        try {
            const fs = await import('fs');
            const path = await import('path');
            fs.appendFileSync(path.join(__dirname, 'server_error.log'), errorLog);
        } catch (e) { console.error("Could not write to log file", e); }

        // DEBUG MODE: Return actual error
        res.status(500).json({
            error: "DEBUG_ERROR: " + error.message,
            detail: error.detail,
            code: error.code,
            pg_query: "See Server Logs"
        });
    }
});

// GENERIC UPDATE
app.put('/api/:entity/:id', requireAuth, async (req, res) => {
    const { entity, id } = req.params;
    const { organizationId, user } = req.auth;

    const tableMap = {
        'Professional': 'professionals',
        'Patient': 'patients',
        'Appointment': 'appointments',
        'MedicalRecord': 'medical_records',
        'Notification': 'notifications',
        'Promotion': 'promotions',
        'Lead': 'leads',
        'Message': 'messages',
        'Conversation': 'conversations',
        'ClinicSettings': 'clinic_settings',
        'NotificationPreference': 'notification_preferences',
        'ProcedureType': 'procedure_types'
    };
    const tableName = tableMap[entity];
    if (!tableName) return res.status(400).json({ error: 'Invalid entity' });

    const isUserScoped = userScopedEntities.includes(entity);

    if (!organizationId && !isUserScoped) {
        return res.status(400).json({ error: "Organization Context Required" });
    }

    const data = req.body;

    // DATA FIX: Map 'full_name' to 'name' for Professionals and Patients if needed
    if ((entity === 'Professional' || entity === 'Patient') && data.full_name) {
        data.name = data.full_name;
        delete data.full_name;
    }

    try {
        // SECURITY FIX: Filter invalid columns
        const keys = Object.keys(data).filter(key => isValidColumn(key));

        if (keys.length === 0) {
            return res.status(400).json({ error: "No valid data to update" });
        }

        const values = keys.map(key => {
            const v = data[key];
            return (typeof v === 'object' ? JSON.stringify(v) : v);
        });

        const setClause = keys.map((k, i) => `${k} = $${i + 1} `).join(', ');

        let query = `UPDATE ${tableName} SET ${setClause} WHERE id = $${keys.length + 1} `;
        const queryParams = [...values, id];

        if (isUserScoped) {
            query += ` AND user_id = $${keys.length + 2} `;
            queryParams.push(user.id);
        } else {
            query += ` AND organization_id = $${keys.length + 2} `;
            queryParams.push(organizationId);
        }

        query += ` RETURNING * `;

        const { rows } = await pool.query(query, queryParams);

        if (rows.length === 0) {
            return res.status(404).json({ error: "Item not found or access denied" });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error(`Error updating ${entity}: `, error);
        res.status(500).json({ error: "Internal Server Error" }); // Security: Hide DB error
    }
});

// GENERIC DELETE
app.delete('/api/:entity/:id', requireAuth, async (req, res) => {
    const { entity, id } = req.params;
    const { organizationId, user } = req.auth;

    const tableMap = {
        'Professional': 'professionals',
        'Patient': 'patients',
        'Appointment': 'appointments',
        'MedicalRecord': 'medical_records',
        'Notification': 'notifications',
        'Promotion': 'promotions',
        'Lead': 'leads',
        'Message': 'messages',
        'Conversation': 'conversations',
        'ClinicSettings': 'clinic_settings',
        'NotificationPreference': 'notification_preferences',
        'ProcedureType': 'procedure_types'
    };
    const tableName = tableMap[entity];
    if (!tableName) return res.status(400).json({ error: 'Invalid entity' });

    const isUserScoped = userScopedEntities.includes(entity);

    if (!organizationId && !isUserScoped) {
        return res.status(400).json({ error: "Organization Context Required" });
    }

    try {
        // SPECIAL HANDLING: Professional Deletion (Handle FK Constraint)
        if (entity === 'Professional') {
            console.log(`[Delete] Professional ${id}: Nullifying appointments references first.`);
            await pool.query(
                `UPDATE appointments SET professional_id = NULL WHERE professional_id = $1`,
                [id]
            );
        }

        let query = `DELETE FROM ${tableName} WHERE id = $1`;
        const params = [id];

        if (isUserScoped) {
            query += ` AND user_id = $2`;
            params.push(user.id);
        } else {
            query += ` AND organization_id = $2`;
            params.push(organizationId);
        }

        const result = await pool.query(query, params);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Item not found or access denied" });
        }
        res.json({ success: true });
    } catch (error) {
        console.error(`Error deleting ${entity}: `, error);

        // Handle FK Constraints nicely if still hits
        if (error.code === '23503') {
            return res.status(400).json({ error: "Não é possível excluir este item pois ele possui registros vinculados." });
        }

        res.status(500).json({ error: error.message });
    }
});

// ADMIN: Get Invite Link (to share via WhatsApp)
app.get('/api/admin/get-invite-link', requireAuth, async (req, res) => {
    const { email } = req.query;
    const { organizationId } = req.auth;

    if (!email || !organizationId) return res.status(400).json({ error: "Email and Org required" });

    try {
        // Better Auth uses "id" as the token in the URL usually
        // Table "invitation" must be queried. Lowercase or CamelCase? 
        // We created it with CamelCase "invitation" (invitationId, email, organizationId...)
        // Wait, init_org_tables.js used "organizationId" (camel).
        // Let's try to select id from invitation.

        const result = await pool.query(`
            SELECT "id" FROM "invitation" 
            WHERE "email" = $1 AND "organizationId" = $2 
            ORDER BY "createdAt" DESC LIMIT 1
         `, [email, organizationId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Invite not found" });
        }

        const inviteId = result.rows[0].id;
        // Construct Frontend URL (assuming VITE_FRONTEND_URL is set or deduce from origin)
        const baseUrl = process.env.VITE_FRONTEND_URL || req.headers.origin || "https://clinicos.app";
        const link = `${baseUrl}/accept-invitation/${inviteId}`;

        res.json({ link });
    } catch (error) {
        console.error("Error fetching invite link:", error);
        res.status(500).json({ error: "Internal Error" });
    }
});

// The "catchall" handler
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    try {
        console.log("Verifying database schema...");
        await initSchema();
    } catch (err) {
        console.error("Schema init failed:", err);
    }
    startCleanupJob(pool);
});
