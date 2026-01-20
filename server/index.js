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
        "https://clinicos-ruby.vercel.app"
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
            "https://clinicos-ruby.vercel.app"
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
} catch (e) {
    console.error('Failed to generate node handler:', e);
}

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


// ------------------------------------------------------------------
// ROUTES
// ------------------------------------------------------------------

// Test Route
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'ClinicOS Server is running' });
});


const userScopedEntities = ['NotificationPreference'];

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
