import { Request, Response } from 'express';
import { prisma } from '../services/prisma.js';

export const listProfessionals = async (req: Request, res: Response) => {
    let orgId = req.headers['x-organization-id'] as string;
    const userId = (req as any).user?.id;

    try {
        if (!orgId && userId) {
            // Fallback: find user's first organization
            const membership = await prisma.member.findFirst({
                where: { userId },
                select: { organizationId: true }
            });
            if (membership) orgId = membership.organizationId;
        }

        if (!orgId) return res.json({ data: [], meta: { total: 0 } });

        const professionals = await prisma.professional.findMany({
            where: { organizationId: orgId },
            orderBy: { name: 'asc' }
        });

        const mapped = professionals.map(p => {
            let role_type = p.roleType;
            // Map legacy strings to new categories
            if (role_type === "HOF ou Biomédico") role_type = "profissional";

            return {
                ...p,
                full_name: p.name,
                role_type,
                council_number: p.councilNumber,
                council_state: p.councilState,
                appointment_duration: p.appointmentDuration,
                // @ts-ignore
                photo_url: p.photoUrl
            };
        });

        res.json({
            data: mapped,
            meta: { total: mapped.length }
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch professionals" });
    }
};

export const createProfessional = async (req: Request, res: Response) => {
    const organizationId = req.headers['x-organization-id'] as string;
    if (!organizationId) return res.status(400).json({ error: "Organization Context Required" });

    try {
        const body = req.body;
        const data: any = {
            name: body.full_name || body.name,
            email: body.email,
            status: body.status,
            roleType: body.role_type,
            councilNumber: body.council_number,
            councilState: body.council_state,
            phone: body.phone,
            color: body.color,
            appointmentDuration: body.appointment_duration,
            photoUrl: body.photo_url,
            organizationId
        };

        const professional = await prisma.professional.create({ data });
        res.status(201).json(professional);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const updateProfessional = async (req: Request, res: Response) => {
    const { id } = req.params;
    const organizationId = req.headers['x-organization-id'] as string;

    try {
        const body = req.body;
        const data: any = {
            name: body.full_name || body.name,
            email: body.email,
            status: body.status,
            roleType: body.role_type,
            councilNumber: body.council_number,
            councilState: body.council_state,
            phone: body.phone,
            color: body.color,
            appointmentDuration: body.appointment_duration,
            photoUrl: body.photo_url
        };

        Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);

        const result = await prisma.professional.updateMany({
            where: { id: Number(id), organizationId },
            data
        });

        if (result.count === 0) return res.status(404).json({ error: "Not found" });

        const updated = await prisma.professional.findUnique({ where: { id: Number(id) } });
        res.json({
            ...updated,
            full_name: updated?.name,
            role_type: updated?.roleType,
            council_number: updated?.councilNumber,
            council_state: updated?.councilState,
            appointment_duration: updated?.appointmentDuration,
            // @ts-ignore
            photo_url: updated?.photoUrl
        });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const deleteProfessional = async (req: Request, res: Response) => {
    const { id } = req.params;
    const organizationId = req.headers['x-organization-id'] as string;

    try {
        const result = await prisma.professional.deleteMany({
            where: { id: Number(id), organizationId }
        });

        if (result.count === 0) return res.status(404).json({ error: "Not found" });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Deletion failed" });
    }
};
