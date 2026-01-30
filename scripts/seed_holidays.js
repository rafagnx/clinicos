import pg from 'pg';
const { Client } = pg;
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const possiblePaths = [
    path.resolve(__dirname, '../server/.env'),
    path.resolve(__dirname, '../.env'),
    path.resolve(__dirname, '.env')
];

for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
        console.log('Found .env at:', p);
        dotenv.config({ path: p });
        break;
    }
}

// DB Config
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

const client = new Client(dbConfig);

async function seedHolidays() {
    try {
        await client.connect();
        console.log('Connected to database');

        // 1. Get all organizations
        const orgsRes = await client.query('SELECT id FROM organizations');
        const orgs = orgsRes.rows;
        console.log(`Found ${orgs.length} organizations`);

        // 2. Load holidays JSON
        const jsonPath = path.resolve(__dirname, '../server/data/brazilian_holidays.json');
        const rawData = fs.readFileSync(jsonPath, 'utf8');
        const holidaysData = JSON.parse(rawData);

        // 3. Insert holidays for each org
        let count = 0;

        for (const org of orgs) {
            const orgId = org.id;

            for (const year of Object.keys(holidaysData)) {
                for (const holiday of holidaysData[year]) {
                    // Check if exists
                    const checkRes = await client.query(
                        `SELECT id FROM holidays WHERE organization_id = $1 AND date = $2`,
                        [orgId, holiday.date]
                    );

                    if (checkRes.rowCount === 0) {
                        try {
                            await client.query(
                                `INSERT INTO holidays (organization_id, date, name, type) VALUES ($1, $2, $3, 'national')`,
                                [orgId, holiday.date, holiday.name]
                            );
                            count++;
                        } catch (insertErr) {
                            console.error(`Error inserting holiday ${holiday.date}:`, insertErr.message);
                        }
                    }
                }
            }
        }

        console.log(`Successfully seeded ${count} holidays across all organizations.`);

    } catch (err) {
        console.error('Error seeding holidays:', err);
    } finally {
        await client.end();
    }
}

seedHolidays();
