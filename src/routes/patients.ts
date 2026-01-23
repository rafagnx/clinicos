import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../http/middlewares/auth';

export async function patientRoutes(app: FastifyInstance) {
    app.addHook('preHandler', authMiddleware);

    // Schema
    const createSchema = z.object({
        name: z.string().min(1),
        email: z.string().email().optional().or(z.literal('')),
        phone: z.string().optional(),
        whatsapp: z.string().optional(),
        cpf: z.string().optional(),
        birthDate: z.string().optional(),
        gender: z.string().optional(),
        address: z.string().optional(),
        marketingSource: z.string().optional(),
        notes: z.string().optional(),
    });

    // GET /patients
    app.get('/', async (req, reply) => {
        const { ability } = req as any;
        const organizationId = req.headers['x-organization-id'] as string;
        const query = req.query as { search?: string };

        if (!ability?.can('read', 'Patient')) {
            return reply.status(403).send({ message: 'Forbidden' });
        }

        const patients = await prisma.patient.findMany({
            where: {
                organizationId,
                name: query.search ? { contains: query.search, mode: 'insensitive' } : undefined
            },
            orderBy: { name: 'asc' }
        });

        return patients;
    });

    // POST /patients
    app.post('/', async (req, reply) => {
        const { ability } = req as any;
        const organizationId = req.headers['x-organization-id'] as string;

        if (!ability?.can('create', 'Patient')) {
            return reply.status(403).send({ message: 'Forbidden' });
        }

        try {
            const data = createSchema.parse(req.body);

            // Handle date conversion if needed
            let birthDate: Date | undefined;
            if (data.birthDate) {
                birthDate = new Date(data.birthDate);
            }

            const patient = await prisma.patient.create({
                data: {
                    name: data.name,
                    email: data.email || null,
                    phone: data.phone,
                    whatsapp: data.whatsapp,
                    cpf: data.cpf,
                    birthDate,
                    gender: data.gender,
                    address: data.address,
                    marketingSource: data.marketingSource,
                    notes: data.notes,
                    organizationId
                }
            });

            return reply.status(201).send(patient);
        } catch (error: any) {
            // Global handler will catch ZodError
            throw error;
        }
    });
}
