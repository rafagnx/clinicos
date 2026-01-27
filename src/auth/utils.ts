import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma';
import { createAppAbility } from './permissions';
import { defineAbilityFor } from '@casl/ability'; // fallback if needed, but we use our fn
import { z } from 'zod';
import { supabase } from '../lib/supabase'; // We might need to create this for backend validation if not just trusting token

// We assume the token is validated via a previous hook (e.g. fastify-jwt or similar)
// But here is the logic extracting user from DB based on header

export async function getCurrentUser(req: FastifyRequest) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return null;

    // In a real scenario, verify JWT here. 
    // For now, let's assume we decode it or trust the existing middleware logic we had.
    // To match transcript: verify token, get userId.

    // Mock for migration phase if needed, OR verify with Supabase
    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) return null;

    return user;
}

export async function getUserPermissions(userId: string, organizationId: string) {
    const member = await prisma.member.findUnique({
        where: {
            organizationId_userId: {
                organizationId,
                userId
            }
        },
        include: {
            user: true
        }
    });

    if (!member) {
        return null;
    }

    return createAppAbility(member.user, member);
}
