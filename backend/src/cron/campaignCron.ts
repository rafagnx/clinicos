import cron from 'node-cron';
import { prisma } from '../services/prisma.js';
import { whatsappService } from '../services/whatsappService.js';
import { subDays, format, isSameDay } from 'date-fns';

export function startCampaignCron() {
    // Run every day at 09:00 AM
    cron.schedule('0 9 * * *', async () => {
        console.log('Running daily Campaign cron...');

        try {
            const today = new Date();
            const yesterday = subDays(today, 1);
            const ninetyDaysAgo = subDays(today, 90);

            // 1. Birthday Campaign
            const patients = await (prisma.patient as any).findMany({
                where: {
                    status: 'ativo',
                    birthDate: { not: null },
                    organization: {
                        evolutionInstanceName: { not: null }
                    }
                },
                include: { organization: true }
            });

            for (const patient of patients as any[]) {
                if (!patient.birthDate || !patient.organizationId || !patient.phone) continue;

                const birth = new Date(patient.birthDate);
                // Check if today is birthday (ignoring year)
                if (birth.getDate() === today.getDate() && birth.getMonth() === today.getMonth()) {
                    // Send Birthday Message
                    try {
                        await whatsappService.sendTemplateMessage(
                            patient.organizationId,
                            patient.phone,
                            'promocao', // Using 'promocao' or generic template for now, or add specific 'aniversario'
                            {
                                nome: patient.name.split(' ')[0],
                                promocao: "Feliz Aniversário! 🎂 Ganhe 10% de desconto no seu próximo procedimento.",
                                valor: "Consulte"
                            }
                        );
                        console.log(`Birthday message sent to ${patient.name}`);
                    } catch (e) {
                        console.error(`Failed birthday msg to ${patient.name}`, e);
                    }
                }
            }

            // 2. Post-Consultation (Yesterday)
            const yesterdaysAppointments = await (prisma.appointment as any).findMany({
                where: {
                    startTime: {
                        gte: new Date(yesterday.setHours(0, 0, 0, 0)),
                        lte: new Date(yesterday.setHours(23, 59, 59, 999))
                    },
                    status: 'realizado', // Only completed
                    organization: { evolutionInstanceName: { not: null } }
                },
                include: { patient: true, organization: true, professional: true }
            });

            for (const appt of yesterdaysAppointments as any[]) {
                if (!appt.patient?.phone || !appt.organizationId) continue;
                try {
                    await whatsappService.sendTemplateMessage(
                        appt.organizationId,
                        appt.patient.phone,
                        'pos_consulta',
                        {
                            nome: appt.patient.name.split(' ')[0],
                            profissional: appt.professional?.name || "Nossa equipe"
                        }
                    );
                    console.log(`Post-consult message sent to ${appt.patient.name}`);
                } catch (e) {
                    console.error(e);
                }
            }

            // 3. Return 90 Days (Retention)
            // Find appointments exactly 90 days ago
            const oldAppointments = await (prisma.appointment as any).findMany({
                where: {
                    startTime: {
                        gte: new Date(ninetyDaysAgo.setHours(0, 0, 0, 0)),
                        lte: new Date(ninetyDaysAgo.setHours(23, 59, 59, 999))
                    },
                    status: 'realizado',
                    organization: { evolutionInstanceName: { not: null } }
                },
                include: { patient: true, organization: true }
            });

            for (const appt of oldAppointments as any[]) {
                if (!appt.patientId || !appt.patient?.phone || !appt.organizationId) continue;

                // Check if patient came back since then or has future appointment
                const recentOrFuture = await prisma.appointment.findFirst({
                    where: {
                        patientId: appt.patientId,
                        startTime: { gt: appt.endTime }
                    }
                });

                if (!recentOrFuture) {
                    // Send Return Invitation
                    try {
                        await whatsappService.sendTemplateMessage(
                            appt.organizationId,
                            appt.patient.phone,
                            'promocao', // abusing promocao template for retention
                            {
                                nome: appt.patient.name.split(' ')[0],
                                promocao: "Faz 3 meses que não te vemos! Que tal agendar um retorno para avaliação?",
                                valor: "Especial"
                            }
                        );
                        console.log(`Return 90d message sent to ${appt.patient.name}`);
                    } catch (e) {
                        console.error(e);
                    }
                }
            }

        } catch (error) {
            console.error('Error in Campaign cron:', error);
        }
    });
}
