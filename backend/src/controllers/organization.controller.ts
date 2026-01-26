import { Request, Response } from 'express';
import { prisma } from '../services/prisma.js';

export const listUserOrganizations = async (req: Request, res: Response) => {
    // Current authenticated user
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    try {
        // Find organizations where user is a member
        const memberships = await prisma.member.findMany({
            where: { userId },
            include: { organization: true }
        });

        const organizations = memberships.map(m => m.organization);
        res.json(organizations);
    } catch (error) {
        console.error("List User Organizations Error:", error);
        res.status(500).json({ error: "Failed to fetch organizations" });
    }
};
