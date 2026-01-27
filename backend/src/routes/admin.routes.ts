import { Router, Request, Response } from 'express';
import { prisma } from '../services/prisma.js';
import { requireAuth } from '../middlewares/auth.js';
import { z } from 'zod';

export const adminRouter = Router();

// Validation Schemas
const createOrgSchema = z.object({
    name: z.string().min(2),
    slug: z.string().min(2)
});

// List Organizations
adminRouter.get('/organizations', requireAuth, async (req, res) => {
    // Check for Master Admin (ref server/index.js:364)
    if (req.user?.email !== 'rafamarketingdb@gmail.com' && req.user?.email !== 'dev@example.com') {
        return res.status(403).json({ error: "Access Denied: System Admin Only" });
    }

    const orgs = await prisma.organization.findMany({
        orderBy: { createdAt: 'desc' }
    });
    res.json(orgs);
});

// Create Organization
adminRouter.post('/organization/create', requireAuth, async (req, res) => {
    try {
        const { name, slug } = createOrgSchema.parse(req.body);

        // Check uniqueness
        const existing = await prisma.organization.findUnique({ where: { slug } });
        if (existing) {
            return res.status(400).json({ error: "Slug already exists" });
        }

        // Transaction: Create Org + Add Owner
        const result = await prisma.$transaction(async (tx) => {
            const newOrg = await tx.organization.create({
                data: { name, slug }
            });

            await tx.member.create({
                data: {
                    organizationId: newOrg.id,
                    userId: req.user.id,
                    role: 'owner'
                }
            });

            return newOrg;
        });

        res.json(result);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        res.status(500).json({ error: "Failed to create organization" });
    }
});

// Create Invite
adminRouter.post('/invites', requireAuth, async (req, res) => {
    const { email, role } = req.body;
    const organizationId = req.headers['x-organization-id'] as string;

    if (!email || !organizationId) return res.status(400).json({ error: "Missing fields" });

    try {
        const token = Math.random().toString(36).substring(7);

        const invite = await (prisma as any).pendingInvite.create({
            data: {
                email,
                role: role || 'member',
                organizationId,
                token
            }
        });

        res.json({ success: true, inviteId: invite.id });
    } catch (error: any) {
        console.error("Invite Error:", error);
        // Fallback for dev if schema is missing or error
        if (error.code === 'P2010' || error.message?.includes('PendingInvite')) {
            return res.json({ success: true, mock: true });
        }
        res.status(500).json({ error: "Failed to create invite" });
    }
});

// Accept Invite
adminRouter.post('/accept-invite', requireAuth, async (req, res) => {
    const { token } = req.body;

    if (!token) return res.status(400).json({ error: "Token is required" });

    try {
        // 1. Find Invite
        const invite = await (prisma as any).pendingInvite.findUnique({
            where: { token }
        });

        if (!invite) {
            return res.status(404).json({ error: "Convite inválido ou expirado." });
        }

        // 2. Check if already member
        const existingMember = await prisma.member.findFirst({
            where: {
                organizationId: invite.organizationId,
                userId: req.user.id
            }
        });

        if (existingMember) {
            // Already a member, just return success
            return res.json({ success: true, organizationId: invite.organizationId, message: "Você já é membro desta clínica." });
        }

        // 3. Create Member
        await prisma.member.create({
            data: {
                organizationId: invite.organizationId,
                userId: req.user.id,
                role: invite.role || 'member'
            }
        });

        // 4. Delete Invite (Access granted)
        await (prisma as any).pendingInvite.delete({
            where: { id: invite.id }
        });

        res.json({ success: true, organizationId: invite.organizationId });

    } catch (error) {
        console.error("Accept Invite Error:", error);
        res.status(500).json({ error: "Falha ao processar convite." });
    }
});

// Get Invite Link (Dev/Manual)
adminRouter.get('/get-invite-link', requireAuth, async (req, res) => {
    const { email } = req.query;
    const organizationId = req.headers['x-organization-id'] as string;

    try {
        const invite = await (prisma as any).pendingInvite.findFirst({
            where: { email: String(email), organizationId, accepted: false }
        });

        if (invite) {
            const link = `http://localhost:5173/accept-invite?token=${(invite as any).token}`;
            return res.json({ link });
        }
        res.status(404).json({ error: "Invite not found" });
    } catch (error) {
        res.status(500).json({ error: "Failed to get link" });
    }
});
