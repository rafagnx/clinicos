import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../http/middlewares/auth';

export async function appointmentRoutes(app: FastifyInstance) {
    app.addHook('preHandler', authMiddleware);

    // Schema
    const createSchema = z.object({
        patient_id: z.string().optional().nullable(),
        professional_id: z.string().uuid(),
        start_time: z.string().datetime(),
        end_time: z.string().datetime(),
        date: z.string(),
        status: z.string().default('scheduled'),
        notes: z.string().optional(),
        service: z.string().optional(),
    });

    // GET /appointments
    app.get('/', async (req, reply) => {
        const { ability } = req as any;
        const organizationId = req.headers['x-organization-id'] as string;
        const query = req.query as { date?: string; professional_id?: string };

        if (!ability?.can('read', 'Appointment')) {
            return reply.status(403).send({ message: 'Forbidden' });
        }

        const where: any = { organizationId };
        if (query.date) {
            where.date = new Date(query.date);
        }
        if (query.professional_id) {
            where.professionalId = query.professional_id;
        }

        const appointments = await prisma.appointment.findMany({
            where,
            include: {
                patient: true,
                professional: true
            }
        });

        // Map to Calendar format
        return appointments.map(appt => ({
            id: appt.id,
            title: appt.patient?.name || 'Sem Paciente',
            start: appt.startTime.toISOString(),
            end: appt.endTime.toISOString(),
            backgroundColor: appt.professional?.color || '#3788d8',
            borderColor: appt.professional?.color || '#3788d8',
            extendedProps: {
                patientId: appt.patientId,
                professionalId: appt.professionalId,
                status: appt.status
            }
        }));
    });

    // POST /appointments
    app.post('/', async (req, reply) => {
        const { ability } = req as any;
        const organizationId = req.headers['x-organization-id'] as string;

        if (!ability?.can('create', 'Appointment')) {
            return reply.status(403).send({ message: 'Forbidden' });
        }

        try {
            const data = createSchema.parse(req.body);

            const appointment = await prisma.appointment.create({
                data: {
                    organizationId,
                    patientId: data.patient_id,
                    professionalId: data.professional_id,
                    startTime: new Date(data.start_time),
                    endTime: new Date(data.end_time),
                    date: new Date(data.date),
                    status: data.status,
                    notes: data.notes,
                    procedureName: data.service
                }
            });

            return reply.status(201).send(appointment);
        } catch (error: any) {
            throw error;
        }
    });
}
