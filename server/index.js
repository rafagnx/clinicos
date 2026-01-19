import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const { Pool } = pg;
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../dist')));

// Database Connection
let pool;

if (process.env.DATABASE_URL) {
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false // Required for Render/Railway
        }
    });
} else {
    pool = new Pool({
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'clinicOS',
        password: process.env.DB_PASSWORD || 'password',
        port: process.env.DB_PORT || 5432,
    });
}

// Test connection
pool.connect((err, client, release) => {
    if (err) {
        console.error('Error acquiring client', err.stack);
        console.log('SUGGESTION: Ensure your DATABASE_URL is correct and the database is running.');
    } else {
        console.log('Connected to PostgreSQL database!');
        release();
    }
});

// --- Generic CRUD Helpers ---
const generateId = () => uuidv4();

// --- Routes ---

// Test Route
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'ClinicOS Server is running' });
});

// AUTH: Me (Simulated)
app.get('/api/auth/me', async (req, res) => {
    try {
        const { rows } = await pool.query("SELECT * FROM professionals WHERE role_type = 'admin' LIMIT 1");
        if (rows.length > 0) {
            const user = rows[0];
            delete user.password;
            res.json(user);
        } else {
            res.json({ id: 'temp-admin', full_name: 'Admin Temp', email: 'admin@temp.com', role: 'admin' });
        }
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

// GENERIC READ (List/Filter)
app.get('/api/:entity', async (req, res) => {
    const { entity } = req.params;
    const tableMap = {
        'Professional': 'professionals',
        'Patient': 'patients',
        'Appointment': 'appointments',
        'MedicalRecord': 'medical_records',
        'Notification': 'notifications',
        'Promotion': 'promotions'
    };

    const tableName = tableMap[entity];
    if (!tableName) return res.status(400).json({ error: 'Invalid entity' });

    try {
        let query = `SELECT * FROM ${tableName}`;
        let params = [];
        let whereClauses = [];
        let paramIndex = 1;

        if (req.query.id) {
            whereClauses.push(`id = $${paramIndex++}`);
            params.push(req.query.id);
        }

        if (whereClauses.length > 0) {
            query += ` WHERE ` + whereClauses.join(' AND ');
        }

        // Add Sort
        if (tableName === 'appointments') {
            query += ` ORDER BY start_time ASC`;
        } else {
            query += ` ORDER BY created_at DESC`; // Switched to created_at (standard in schema)
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
app.post('/api/:entity', async (req, res) => {
    const { entity } = req.params;
    const tableMap = {
        'Professional': 'professionals',
        'Patient': 'patients',
        'Appointment': 'appointments',
        'MedicalRecord': 'medical_records',
        'Notification': 'notifications',
        'Promotion': 'promotions'
    };
    const tableName = tableMap[entity];
    if (!tableName) return res.status(400).json({ error: 'Invalid entity' });

    const data = req.body;
    // Postgres SERIAL handles IDs, but if uuid is needed allow it. 
    // Schema says SERIAL, so we typically omit ID unless we changed schema back to UUID.
    // The previous code generated UUIDs. The new schema uses SERIAL (integers).
    // If the frontend expects UUIDs, this might be a break. 
    // BUT the user approved the plan which said "Change to SERIAL". 
    // So we should NOT generate ID manually if it's SERIAL.
    // However, if the frontend sends an ID, we might ignore it or error.
    delete data.id;

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
app.put('/api/:entity/:id', async (req, res) => {
    const { entity, id } = req.params;
    const tableMap = {
        'Professional': 'professionals',
        'Patient': 'patients',
        'Appointment': 'appointments',
        'MedicalRecord': 'medical_records',
        'Notification': 'notifications',
        'Promotion': 'promotions'
    };
    const tableName = tableMap[entity];
    if (!tableName) return res.status(400).json({ error: 'Invalid entity' });

    const data = req.body;
    try {
        const keys = Object.keys(data);
        const values = Object.values(data).map(v => (typeof v === 'object' ? JSON.stringify(v) : v));

        const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
        const query = `UPDATE ${tableName} SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *`;

        const { rows } = await pool.query(query, [...values, id]);

        res.json(rows[0]);
    } catch (error) {
        console.error(`Error updating ${entity}:`, error);
        res.status(500).json({ error: error.message });
    }
});

// GENERIC DELETE
app.delete('/api/:entity/:id', async (req, res) => {
    const { entity, id } = req.params;
    const tableMap = {
        'Professional': 'professionals',
        'Patient': 'patients',
        'Appointment': 'appointments',
        'MedicalRecord': 'medical_records',
        'Notification': 'notifications',
        'Promotion': 'promotions'
    };
    const tableName = tableMap[entity];
    if (!tableName) return res.status(400).json({ error: 'Invalid entity' });

    try {
        await pool.query(`DELETE FROM ${tableName} WHERE id = $1`, [id]);
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
