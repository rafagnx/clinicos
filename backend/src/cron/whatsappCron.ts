import cron from 'node-cron';
import { prisma } from '../services/prisma.js';
import { whatsappService } from '../services/whatsappService.js';
import { format } from 'date-fns';

export function startWhatsAppCron() {
    // Run every day at 08:00 AM
    cron.schedule('0 8 * * *', async () => {
        console.log('Running daily WhatsApp confirmation cron...');

        try {
            // Get tomorrow's date range
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);

            const tomorrowEnd = new Date(tomorrow);
            tomorrowEnd.setHours(23, 59, 59, 999);

            // Find appointments for tomorrow
            const appointments = await (prisma.appointment as any).findMany({
                where: {
                    startTime: {
                        gte: tomorrow,
                        lte: tomorrowEnd
                    },
                    status: 'scheduled', // Only scheduled ones
                    organization: {
                        evolutionInstanceName: { not: null }, // Only orgs with WhatsApp configured
                        evolutionToken: { not: null }
                    }
                },
                include: {
                    patient: true,
                    professional: true,
                    organization: true
                }
            });

            console.log(`Found ${appointments.length} appointments for tomorrow.`);

            for (const appt of appointments as any[]) {
                if (!appt.organizationId || !appt.patient?.phone) continue;

                // Check preferences if implemented
                // const prefs = await prisma.notificationPreference.findFirst({ where: { userId: appt.patient.userId } });
                // if (!prefs?.whatsappEnabled && prefs) continue;

                try {
                    const variables = {
                        nome: appt.patient.name.split(' ')[0],
                        data: format(appt.startTime, 'dd/MM'),
                        hora: format(appt.startTime, 'HH:mm'),
                        profissional: appt.professional?.name || 'Clínica'
                    };

                    await whatsappService.sendTemplateMessage(
                        appt.organizationId,
                        appt.patient.phone,
                        'lembrete_24h',
                        variables
                    );

                    console.log(`Confirmation sent to ${appt.patient.name}`);
                } catch (error) {
                    console.error(`Failed to send to ${appt.patient.name}:`, error);
                }
            }
        } catch (error) {
            console.error('Error in WhatsApp cron:', error);
        }
    });
}
