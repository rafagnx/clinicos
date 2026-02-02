import { app } from './app.js';
import { env } from './config/env.js';
import { prisma } from './services/prisma.js';

import { startWhatsAppCron } from './cron/whatsappCron.js';
import { startCampaignCron } from './cron/campaignCron.js';

const PORT = env.PORT;

const startServer = async () => {
    try {
        await prisma.$connect();
        console.log('✅ Database connected');

        // Start Cron Jobs
        startWhatsAppCron();
        startCampaignCron();

        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('❌ Server failed to start:', error);
        process.exit(1);
    }
};

startServer();
