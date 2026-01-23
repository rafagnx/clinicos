import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../http/middlewares/auth';

export async function organizationRoutes(app: FastifyInstance) {
    app.addHook('preHandler', authMiddleware);

    // GET /api/organization/:id
    app.get('/:id', async (req, reply) => {
        const { id } = req.params as { id: string };
        const { ability } = req as any;

        try {
            const org = await prisma.organization.findUnique({
                where: { id }
            });

            if (!org) {
                return reply.status(404).send({ message: 'Organization not found' });
            }

            return org;
        } catch (error) {
            req.log.error(error);
            return reply.status(500).send({ message: 'Internal Server Error' });
        }
    });

    // POST /api/organization (Create)
    app.post('/', async (req, reply) => {
        const { name, slug } = req.body as { name: string; slug: string };
        const { user } = req as any;

        try {
            const org = await prisma.organization.create({
                data: {
                    name,
                    slug,
                    ownerId: user.id,
                    members: {
                        create: {
                            userId: user.id,
                            role: 'ADMIN' // Founder is Admin
                        }
                    }
                }
            });
            return org;
        } catch (error) {
            req.log.error(error);
            return reply.status(500).send(error);
        }
    });
}
