import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
    PORT: z.string().default('3001'),
    DATABASE_URL: z.string(),
    JWT_SECRET: z.string().min(8),
    CORS_ORIGIN: z.string().default('*')
});

export const env = envSchema.parse(process.env);
