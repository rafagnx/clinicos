import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../http/middlewares/auth';

export async function professionalRoutes(app: FastifyInstance) {
    // Apply Auth Middleware
    app.addHook('preHandler', authMiddleware);

    // Schema for Validation
    const createSchema = z.object({
        name: z.string().min(1),
        email: z.string().email(),
        roleType: z.string().default('profissional'),
        specialty: z.string().optional(),
        councilNumber: z.string().optional(),
        councilState: z.string().optional(),
        phone: z.string().optional(),
        color: z.string().optional(),
        appointmentDuration: z.number().int().default(30),
        photoUrl: z.string().optional()
    });

    // GET /professionals (List)
    app.get('/', async (req, reply) => {
        const { ability, user } = req as any;
        const organizationId = req.headers['x-organization-id'] as string;
        const query = req.query as { search?: string };

        if (!ability?.can('read', 'Professional')) {
            return reply.status(403).send({ message: 'Forbidden' });
        }

        const professionals = await prisma.professional.findMany({
            where: {
                organizationId,
                name: query.search ? { contains: query.search, mode: 'insensitive' } : undefined
            },
            orderBy: { name: 'asc' }
        });

        return professionals;
    });

    // POST /professionals (Create)
    app.post('/', async (req, reply) => {
        const { ability } = req as any;
        const organizationId = req.headers['x-organization-id'] as string;

        if (!ability?.can('create', 'Professional')) {
            return reply.status(403).send({ message: 'Forbidden' });
        }

        try {
            // Manual Validation
            const data = createSchema.parse(req.body);

            const professional = await prisma.professional.create({
                data: {
                    ...data,
                    organizationId
                }
            });

            return reply.status(201).send(professional);
        } catch (error: any) {
            // Error handling picked up by global handler if ZodError or generic
            throw error;
        }
    });
}
