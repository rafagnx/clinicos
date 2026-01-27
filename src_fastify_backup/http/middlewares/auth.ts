import { FastifyReply, FastifyRequest } from 'fastify';
import { supabase } from '../../lib/supabase';
import { prisma } from '../../lib/prisma';
import { createAppAbility } from '../../auth/permissions';

export async function authMiddleware(req: FastifyRequest, reply: FastifyReply) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return reply.status(401).send({ message: 'Unauthorized: No token provided' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: authUser }, error } = await supabase.auth.getUser(token);

    if (error || !authUser) {
        return reply.status(401).send({ message: 'Unauthorized: Invalid token' });
    }

    // Get Organization Context
    const organizationId = req.headers['x-organization-id'] as string;

    // Find User in DB (Sync if needed, or fail)
    let user = await prisma.user.findUnique({
        where: { id: authUser.id }
    });

    if (!user) {
        // Auto-create user if missing (Sync logic)
        user = await prisma.user.create({
            data: {
                id: authUser.id,
                email: authUser.email!,
                name: authUser.user_metadata?.full_name || 'Unknown',
                avatarUrl: authUser.user_metadata?.avatar_url,
                password: '', // Managed by Supabase
            }
        });
    }

    // If Org ID provided, load Membership and Permissions
    if (organizationId) {
        const member = await prisma.member.findUnique({
            where: {
                organizationId_userId: {
                    organizationId,
                    userId: user.id
                }
            }
        });

        if (member) {
            // Attach Ability to Request
            // We need to extend FastifyRequest type or just attach to 'req'
            (req as any).user = user;
            (req as any).member = member;
            (req as any).ability = createAppAbility(user, member);
        } else {
            // If org provided but no membership, user is valid but authorized?
            // Maybe 403 or just allow read public info? 
            // For strict RBAC, default to no ability or basic User ability.
            (req as any).user = user;
        }
    } else {
        (req as any).user = user;
    }
}
