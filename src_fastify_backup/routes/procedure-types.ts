
import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function procedureTypeRoutes(app: FastifyInstance) {
    const api = app.withTypeProvider<ZodTypeProvider>();

    api.get('/', {
        schema: {
            tags: ['ProcedureType'],
            summary: 'List Procedure Types',
            response: {
                200: z.array(z.any())
            }
        }
    }, async (req, reply) => {
        return [];
    });
}
