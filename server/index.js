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
            console.error("Auth Token Error:", err);
        }
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
        console.log("Starting manual migration...");
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Create Notifications Table (missing in logs)
            await client.query(`
                CREATE TABLE IF NOT EXISTS "notifications" (
                    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
                    "title" TEXT,
                    "message" TEXT,
                    "user_id" TEXT NOT NULL REFERENCES "user"("id"),
                    "read" BOOLEAN DEFAULT FALSE,
                    "action_url" TEXT,
                    "organization_id" TEXT,
                    "created_at" TIMESTAMP DEFAULT NOW(),
                    "updated_at" TIMESTAMP DEFAULT NOW()
                );
            `);
            console.log("Checked/Created notifications table");

            // STRIPE MIGRATION
            // Add Stripe Columns to organization table
            console.log("Checking Stripe columns in organization table...");
            const orgTableExists = await client.query(`SELECT to_regclass('public.organization'); `);
            if (orgTableExists.rows[0].to_regclass) {
                const stripeCols = [
                    { name: 'stripe_customer_id', type: 'TEXT' },
                    { name: 'stripe_subscription_id', type: 'TEXT' },
                    { name: 'subscription_status', type: 'TEXT' },
                    { name: 'trial_ends_at', type: 'TIMESTAMP' }
                ];

                for (const col of stripeCols) {
                    const colCheck = await client.query(`
                       SELECT column_name FROM information_schema.columns 
                       WHERE table_name = 'organization' AND column_name = $1;
`, [col.name]);

                    if (colCheck.rows.length === 0) {
                        console.log(`Adding ${col.name} to organization table`);
                        await client.query(`ALTER TABLE "organization" ADD COLUMN "${col.name}" ${col.type}; `);
                    }
                }
            }

            // 2. Add organization_id to key tables if missing
            const tablesToCheck = ['patients', 'professionals', 'appointments', 'leads', 'financial_transactions', 'medical_records'];

            for (const table of tablesToCheck) {
                // Check if table exists first
                const tableExists = await client.query(`
                    SELECT EXISTS(
    SELECT FROM information_schema.tables 
                        WHERE table_schema = 'public' 
                        AND table_name = $1
);
`, [table]);

                if (tableExists.rows[0].exists) {
                    // Check if column exists
                    const colExists = await client.query(`
                        SELECT column_name 
                        FROM information_schema.columns 
                        WHERE table_name = $1 AND column_name = 'organization_id';
`, [table]);

                    if (colExists.rows.length === 0) {
                        console.log(`Adding organization_id to ${table} `);
                        // Determine type. Usually TEXT for our new schema, might be INT for legacy.
                        // Let's use TEXT to be compatible with Better Auth organization IDs.
                        // We set it nullable first to avoid errors on existing data, then you can backfill.
                        await client.query(`ALTER TABLE "${table}" ADD COLUMN "organization_id" TEXT; `);
                        await client.query(`CREATE INDEX IF NOT EXISTS "idx_${table}_org_id" ON "${table}"("organization_id"); `);
                    } else {
                        console.log(`organization_id already exists in ${table} `);
                    }
                } else {
                    console.log(`Table ${table} does not exist yet.`);
                }
            }

            // 4. Ensure 'professionals' table has 'status' column
            const profStatusExists = await client.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'professionals' AND column_name = 'status';
`);

            if (profStatusExists.rows.length === 0) {
                console.log("Adding status column to professionals table");
                await client.query(`ALTER TABLE "professionals" ADD COLUMN "status" VARCHAR(50) DEFAULT 'ativo'; `);
            }

            // 3. Ensure 'organization' table has correct columns (Better Auth)
            const orgColExists = await client.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'organization' AND column_name = 'createdAt';
`);
            if (orgColExists.rows.length === 0) {
                await client.query(`ALTER TABLE "organization" ADD COLUMN "createdAt" TIMESTAMP DEFAULT NOW(); `);
                await client.query(`ALTER TABLE "organization" ADD COLUMN "updatedAt" TIMESTAMP DEFAULT NOW(); `);
            }

            await client.query('COMMIT');
            res.json({ success: true, message: "Migration completed successfully" });
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Migration failed:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Initial Schema Setup (Auto-Migration)
const initSchema = async () => {
    try {
        const schemaPath = path.join(__dirname, '../database/schema.sql');
        const fs = await import('fs');
        if (fs.existsSync(schemaPath)) {
            const sql = fs.readFileSync(schemaPath, 'utf8');
            console.log('Running Schema check...');
            // We verify if tables exist first to avoid errors re-running schema
            // For now, let's rely on IF NOT EXISTS in SQL or just try/catch
            try {
                // This might fail if tables exist and syntax isn't idempotent, but we'll try
                // Actually, the improved schema.sql uses IF NOT EXISTS, so should be safe-ish.
                // But better to do targeted migrations below.
            } catch (e) { }
        }

        // AUTO-MIGRATION: Ensure critical columns exist
        const client = await pool.connect();
        try {
            console.log("Checking DB structure...");

            // 1. Ensure 'professionals' table has 'status' column
            // Only run if table exists
            const tableExists = await client.query(`SELECT 1 FROM information_schema.tables WHERE table_name = 'professionals'`);
            if (tableExists.rows.length > 0) {
                const profStatusExists = await client.query(`
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'professionals' AND column_name = 'status';
`);

                if (profStatusExists.rows.length === 0) {
                    console.log("Auto-Migration: Adding status column to professionals table");
                    await client.query(`ALTER TABLE "professionals" ADD COLUMN "status" VARCHAR(50) DEFAULT 'ativo'; `);
                }
            }

            // 2. Ensure 'organization' has createdAt (fix for Better Auth)
            const orgTableExists = await client.query(`SELECT 1 FROM information_schema.tables WHERE table_name = 'organization'`);
            if (orgTableExists.rows.length > 0) {
                const orgColExists = await client.query(`
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'organization' AND column_name = 'createdAt';
`);
                if (orgColExists.rows.length === 0) {
                    console.log("Auto-Migration: Adding timestamps to organization table");
                    await client.query(`ALTER TABLE "organization" ADD COLUMN "createdAt" TIMESTAMP DEFAULT NOW(); `);
                    await client.query(`ALTER TABLE "organization" ADD COLUMN "updatedAt" TIMESTAMP DEFAULT NOW(); `);
                }
            }

            console.log('Database structure verified.');
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
        res.json(rows);
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

    if (!organizationId && !isUserScoped) {
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

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    startCleanupJob(pool);
});
