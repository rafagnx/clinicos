import { app } from './app.js';
import { env } from './config/env.js';
import { prisma } from './services/prisma.js';

const PORT = env.PORT;

const startServer = async () => {
    try {
        await prisma.$connect();
        console.log('✅ Database connected');

        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('❌ Server failed to start:', error);
        process.exit(1);
    }
};

startServer();
