import { FastifyInstance } from 'fastify';

export async function adminRoutes(app: FastifyInstance) {
    // GET /api/admin/get-invite-link
    app.get('/get-invite-link', async (req, reply) => {
        const { email } = req.query as { email: string };
        // MOCK: Generate a fake link since we don't have SMTP or Auth system fully integrated
        return {
            link: `http://localhost:5173/join?token=mock-token-for-${email}`
        };
    });
}
