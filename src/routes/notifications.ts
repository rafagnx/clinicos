
import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function notificationRoutes(app: FastifyInstance) {
    const api = app.withTypeProvider<ZodTypeProvider>();

    api.get('/', {
        schema: {
            tags: ['Notifications'],
            summary: 'List Notifications',
            response: {
                200: z.array(z.any())
            }
        }
    }, async (req, reply) => {
        return [];
    });
}
