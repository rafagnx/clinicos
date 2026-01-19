import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

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
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'clinicOS'
};

let pool;

async function initDB() {
    try {
        if (process.env.DATABASE_URL) {
            // Use connection string if available (Railway/Render standard)
            pool = mysql.createPool(process.env.DATABASE_URL);
        } else {
            // Fallback to individual variables
            pool = mysql.createPool(dbConfig);
        }
        console.log('Database pool created successfully.');

        // Test connection
        const connection = await pool.getConnection();
        console.log('Connected to MySQL database!');
        connection.release();
    } catch (error) {
        console.error('FINAL ERROR CONNECTING TO DATABASE:');
        console.error('Code:', error.code);
        console.error('Message:', error.message);
        console.error('Stack:', error.stack);
        console.log('------------------------------------------------');
        console.log('SUGGESTION: Most free hosting providers (like Ezyro/Byet/InfinityFree) BLOCK remote connections.');
        console.log('You might need to install MySQL locally (XAMPP) or use a paid host.');
    }
}

initDB();

// --- Generic CRUD Helpers ---
const generateId = () => uuidv4();

// --- Routes ---

// Test Route
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'ClinicOS Server is running' });
});

// AUTH: Me (Simulated for now, usually would involve tokens)
app.get('/api/auth/me', async (req, res) => {
    // For now, return the first admin user found, or a hardcoded one if DB behaves oddly
    try {
        const [rows] = await pool.query("SELECT * FROM professionals WHERE role_type = 'admin' LIMIT 1");
        if (rows.length > 0) {
            const user = rows[0];
            delete user.password; // Don't send password
            res.json(user);
        } else {
            // Fallback if no admin in DB yet
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

        if (req.query.id) {
            query += ` WHERE id = ?`;
            params.push(req.query.id);
        }

        // Add Sort
        if (tableName === 'appointments') {
            query += ` ORDER BY start_time ASC`;
        } else {
            query += ` ORDER BY created_date DESC`;
        }

        if (req.query.limit) {
            query += ` LIMIT ?`;
            params.push(parseInt(req.query.limit));
        }

        const [rows] = await pool.query(query, params);
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
    if (!data.id) data.id = generateId();

    try {
        // Construct INSERT query dynamically
        const keys = Object.keys(data);
        const values = Object.values(data).map(v => (typeof v === 'object' ? JSON.stringify(v) : v));
        const placeholders = keys.map(() => '?').join(', ');

        const query = `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders})`;

        await pool.query(query, values);

        // Return created item
        res.json(data);
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

        const setClause = keys.map(k => `${k} = ?`).join(', ');
        const query = `UPDATE ${tableName} SET ${setClause} WHERE id = ?`;

        await pool.query(query, [...values, id]);

        res.json({ id, ...data });
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
        await pool.query(`DELETE FROM ${tableName} WHERE id = ?`, [id]);
        res.json({ success: true });
    } catch (error) {
        console.error(`Error deleting ${entity}:`, error);
        res.status(500).json({ error: error.message });
    }
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
