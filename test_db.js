
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

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

console.log('Testing connection with:', { ...dbConfig, password: '***' });

const pool = new Pool(dbConfig);

pool.connect((err, client, release) => {
    if (err) {
        console.error('Connection Error:', err.message);
        process.exit(1);
    }
    console.log('Successfully connected to Database!');
    release();
    process.exit(0);
});
