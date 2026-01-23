
import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function clinicSettingsRoutes(app: FastifyInstance) {
    const api = app.withTypeProvider<ZodTypeProvider>();

    api.get('/', {
        schema: {
            tags: ['ClinicSettings'],
            summary: 'Get Clinic Settings',
            response: {
                200: z.object({
                    name: z.string().optional(),
                    logo: z.string().optional(),
                }).optional()
            }
        }
    }, async (req, reply) => {
        // Return mock empty settings for now to satisfy 404
        return {};
    });
}
