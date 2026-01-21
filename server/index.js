import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";
import { toNodeHandler } from "better-auth/node";

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

// FIX FOR RENDER SSL ISSUES with internal libraries like better-auth
// This allows connections to Postgres with self-signed certs (common in Render internal network)
if (process.env.NODE_ENV === 'production') {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const app = express();
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

// Better Auth Initialization
const auth = betterAuth({
    database: pool,
    secret: process.env.BETTER_AUTH_SECRET || "clinic_os_fallback_secret_secure_enough_for_now_123", // Fallback to unblock deploy
    baseURL: process.env.VITE_BACKEND_URL || "https://clinicos-it4q.onrender.com",
    plugins: [
        organization()
    ],
    emailAndPassword: {
        enabled: true
    },
    user: {
        additionalFields: {
            phone: {
                type: "string",
                required: false,
            },
            specialty: {
                type: "string",
                required: false
            },
            user_type: {
                type: "string",
                required: false
            }
        }
    },
    advanced: {
        cookiePrefix: "clinicos",
        useSecureCookies: true, // Force secure cookies
        crossSubdomainCookies: {
            enabled: true,
            domain: ".onrender.com" // Help with Render subdomains if needed, though unaux is external
        },
        defaultCookieAttributes: {
            sameSite: "none", // REQUIRED for cross-site (Frontend on unaux, Backend on render)
            secure: true, // REQUIRED for sameSite: none
            httpOnly: true
        }
    },
    rateLimit: {
        window: 10, // 10 seconds (short window)
        max: 100, // Allow 100 requests per window (very permissive for debugging)
    },
    trustedOrigins: [
        "http://localhost:5173",
        "http://localhost:3001",
        "https://clinicos.unaux.com",
        "https://www.clinicos.unaux.com",
        "http://clinicos.unaux.com",
        "https://clinicos-ruby.vercel.app",
        "https://clinicos-black.vercel.app",
        "https://clinicos-eta.vercel.app"
    ]
});

// Middleware
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        const allowedOrigins = [
            "http://localhost:5173",
            "http://localhost:3001",
            "https://clinicos.unaux.com",
            "https://www.clinicos.unaux.com",
            "http://clinicos.unaux.com",
            "https://clinicos-ruby.vercel.app",
            "https://clinicos-black.vercel.app",
            "https://clinicos-eta.vercel.app"
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
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../dist')));

// ------------------------------------------------------------------
// BETTER AUTH ROUTE HANDLER
// ------------------------------------------------------------------
console.log('Auth initialized:', !!auth);
console.log('toNodeHandler type:', typeof toNodeHandler);
try {
    const handler = toNodeHandler(auth);
    console.log('Handler generated type:', typeof handler);
    app.all("/api/auth/*", handler);
    app.all("/api/organization/*", handler);
} catch (e) {
    console.error('Failed to generate node handler:', e);
}

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

            // 2. Add organization_id to key tables if missing
            const tablesToCheck = ['patients', 'professionals', 'appointments', 'leads', 'financial_transactions', 'medical_records'];

            for (const table of tablesToCheck) {
                // Check if table exists first
                const tableExists = await client.query(`
                    SELECT EXISTS (
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
                        WHERE table_name=$1 AND column_name='organization_id';
                    `, [table]);

                    if (colExists.rows.length === 0) {
                        console.log(`Adding organization_id to ${table}`);
                        // Determine type. Usually TEXT for our new schema, might be INT for legacy.
                        // Let's use TEXT to be compatible with Better Auth organization IDs.
                        // We set it nullable first to avoid errors on existing data, then you can backfill.
                        await client.query(`ALTER TABLE "${table}" ADD COLUMN "organization_id" TEXT;`);
                        await client.query(`CREATE INDEX IF NOT EXISTS "idx_${table}_org_id" ON "${table}" ("organization_id");`);
                    } else {
                        console.log(`organization_id already exists in ${table}`);
                    }
                } else {
                    console.log(`Table ${table} does not exist yet.`);
                }
            }

            // 3. Ensure 'organization' table has correct columns (Better Auth)
            const orgColExists = await client.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='organization' AND column_name='createdAt';
            `);
            if (orgColExists.rows.length === 0) {
                await client.query(`ALTER TABLE "organization" ADD COLUMN "createdAt" TIMESTAMP DEFAULT NOW();`);
                await client.query(`ALTER TABLE "organization" ADD COLUMN "updatedAt" TIMESTAMP DEFAULT NOW();`);
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
            console.log('Running Schema Migration...');
            // We need to split commands potentially, but pg usually handles script blocks if simple.
            // However, typical pg query() might not handle multiple statements without strict mode or splitting.
            // For now, we assume the schema file is well-formed for single execute or we simple log it.
            // Better Auth handles IT'S own tables usually via 'generate'/'migrate' but here we manually included SQL.

            // NOTE: Ideally we use 'better-auth cli' to migrate, but since we manually added definitions to schema.sql,
            // we will try to run it.
            await pool.query(sql);
            console.log('Schema Migration Success!');
        } else {
            console.warn('Schema file not found at:', schemaPath);
        }
    } catch (err) {
        console.error('Schema Migration Failed:', err);
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
const requireAuth = async (req, res, next) => {
    try {
        const session = await auth.api.getSession({
            headers: req.headers
        });

        if (!session) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        // SYSTEM ADMIN CHECK (Hardcoded for MVP safety)
        const isSystemAdmin = session.user.email === "rafamarketingdb@gmail.com";

        // If SysAdmin, we might add flag to user object
        if (isSystemAdmin) {
            session.user.role = "admin";
        }

        // Check for active organization
        let orgId = req.headers['x-organization-id'] || session.session.activeOrganizationId;

        // If System Admin AND no orgId is provided, they might be in "Global View" mode.
        // But the generic routes demand an orgId usually. 
        // We will allow continuing without orgId only if it's a specific admin route (handled below)
        // or if we decide to fallback.

        if (!orgId && !isSystemAdmin) {
            // Non-admins need context for most things, but we'll let individual routes decide
        }

        req.auth = {
            user: session.user,
            session: session.session,
            organizationId: orgId,
            isSystemAdmin: isSystemAdmin
        };

        next();
    } catch (error) {
        console.error("Auth Middleware Error:", error);
        res.status(500).json({ error: "Auth Check Failed" });
    }
};

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
            `INSERT INTO "organization" (id, name, slug, "createdAt", "updatedAt") 
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [orgId, name, slug, now, now]
        );

        // 3. Add User as Owner/Admin Member
        const memberId = uuidv4();
        await pool.query(
            `INSERT INTO "member" (id, "organizationId", "userId", role, "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4, $5, $6)`,
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
        let query = `SELECT * FROM ${tableName}`;
        let params = [];
        let whereClauses = [];
        let paramIndex = 1;

        if (isUserScoped) {
            whereClauses.push(`user_id = $${paramIndex++}`);
            params.push(user.id);
        } else {
            whereClauses.push(`organization_id = $${paramIndex++}`);
            params.push(organizationId);
        }

        if (req.query.id) {
            whereClauses.push(`id = $${paramIndex++}`);
            params.push(req.query.id);
        }

        // Support filter by user_id explicit (for Profile.tsx compat)
        if (req.query.user_id && isUserScoped) {
            // already handled by implicit scope above, but if needed we can ignore or validate
        }

        if (whereClauses.length > 0) {
            query += ` WHERE ` + whereClauses.join(' AND ');
        }

        if (tableName === 'appointments') {
            query += ` ORDER BY start_time ASC`;
        } else {
            query += ` ORDER BY created_at DESC`;
        }

        if (req.query.limit) {
            query += ` LIMIT $${paramIndex++}`;
            params.push(parseInt(req.query.limit));
        }

        const { rows } = await pool.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error(`Error fetching ${entity}:`, error);
        res.status(500).json({ error: error.message });
    }
});

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

    // Inject Context ID
    if (isUserScoped) {
        data.user_id = user.id;
    } else {
        data.organization_id = organizationId;
    }

    try {
        const keys = Object.keys(data);
        const values = Object.values(data).map(v => (typeof v === 'object' ? JSON.stringify(v) : v));
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');

        const query = `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`;

        const { rows } = await pool.query(query, values);

        res.json(rows[0]);
    } catch (error) {
        console.error(`Error creating ${entity}:`, error);
        res.status(500).json({ error: error.message });
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
    try {
        const keys = Object.keys(data);
        const values = Object.values(data).map(v => (typeof v === 'object' ? JSON.stringify(v) : v));

        const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');

        let query = `UPDATE ${tableName} SET ${setClause} WHERE id = $${keys.length + 1}`;
        const queryParams = [...values, id];

        if (isUserScoped) {
            query += ` AND user_id = $${keys.length + 2}`;
            queryParams.push(user.id);
        } else {
            query += ` AND organization_id = $${keys.length + 2}`;
            queryParams.push(organizationId);
        }

        query += ` RETURNING *`;

        const { rows } = await pool.query(query, queryParams);

        if (rows.length === 0) {
            return res.status(404).json({ error: "Item not found or access denied" });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error(`Error updating ${entity}:`, error);
        res.status(500).json({ error: error.message });
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
        console.error(`Error deleting ${entity}:`, error);
        res.status(500).json({ error: error.message });
    }
});

// The "catchall" handler
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
