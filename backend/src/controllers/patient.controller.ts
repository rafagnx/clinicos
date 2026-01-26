import { Request, Response } from 'express';
import { prisma } from '../services/prisma.js';
import { patientSchema } from '../schemas/patient.schema.js';

export const listPatients = async (req: Request, res: Response) => {
    const organizationId = req.headers['x-organization-id'] as string;
    if (!organizationId) return res.status(400).json({ error: "Organization Context Required" });

    const { page = 1, limit = 50, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {
        organizationId,
        deleted: false,
        OR: search ? [
            { name: { contains: String(search), mode: 'insensitive' as const } },
            { email: { contains: String(search), mode: 'insensitive' as const } }
        ] : undefined
    };

    try {
        const [total, patients] = await Promise.all([
            prisma.patient.count({ where }),
            prisma.patient.findMany({
                where,
                skip,
                take: Number(limit),
                orderBy: { createdAt: 'desc' }
            })
        ]);

        res.json({
            data: patients.map(p => ({
                ...p,
                full_name: p.name,
                birth_date: p.birthDate ? p.birthDate.toISOString().split('T')[0] : null,
                marketing_source: p.marketingSource,
                photo_url: p.photoUrl
            })),
            meta: {
                total,
                page: Number(page),
                lastPage: Math.ceil(total / Number(limit))
            }
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch patients" });
    }
};

export const createPatient = async (req: Request, res: Response) => {
    const organizationId = req.headers['x-organization-id'] as string;
    if (!organizationId) return res.status(400).json({ error: "Organization Context Required" });

    try {
        const body = req.body;
        // Map FE snake_case to BE camelCase
        const data: any = {
            name: body.full_name || body.name,
            email: body.email || null,
            phone: body.phone || null,
            whatsapp: body.whatsapp || null,
            cpf: body.cpf || null,
            birthDate: (body.birth_date && body.birth_date !== "") ? new Date(body.birth_date) : null,
            gender: body.gender || null,
            address: body.address || null,
            city: body.city || null,
            marketingSource: body.marketing_source || null,
            notes: body.notes || null,
            status: body.status || "ativo",
            photoUrl: body.photo_url || null,
            organizationId
        };

        const patient = await prisma.patient.create({ data });
        console.log("Patient created:", patient.id);
        res.status(201).json({ ...patient, full_name: patient.name });
    } catch (error) {
        console.error("Create Patient Error:", error);
        if (error instanceof Error) res.status(400).json({ error: error.message });
    }
};

export const getPatient = async (req: Request, res: Response) => {
    const { id } = req.params;
    const organizationId = req.headers['x-organization-id'] as string;

    try {
        const patient = await prisma.patient.findUnique({
            where: { id: Number(id) }
        });

        if (!patient || patient.organizationId !== organizationId) {
            return res.status(404).json({ error: "Patient not found" });
        }

        res.json({
            ...patient,
            full_name: patient.name,
            birth_date: patient.birthDate ? patient.birthDate.toISOString().split('T')[0] : null,
            marketing_source: patient.marketingSource,
            photo_url: patient.photoUrl
        });
    } catch (error) {
        res.status(500).json({ error: "Fetch failed" });
    }
};

export const updatePatient = async (req: Request, res: Response) => {
    const { id } = req.params;
    const organizationId = req.headers['x-organization-id'] as string;

    try {
        const body = req.body;
        console.log("Updating Patient:", id, body);

        // Map FE snake_case to BE camelCase
        const data: any = {
            name: body.full_name || body.name,
            email: body.email,
            phone: body.phone,
            whatsapp: body.whatsapp,
            cpf: body.cpf,
            birthDate: (body.birth_date && body.birth_date !== "") ? new Date(body.birth_date) : null,
            gender: body.gender,
            address: body.address,
            city: body.city,
            marketingSource: body.marketing_source,
            notes: body.notes,
            status: body.status,
            photoUrl: body.photo_url
        };

        // Remove undefined fields
        Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);

        const result = await prisma.patient.updateMany({
            where: { id: Number(id), organizationId },
            data
        });

        if (result.count === 0) return res.status(404).json({ error: "Not found or access denied" });

        const updated = await prisma.patient.findUnique({ where: { id: Number(id) } });
        res.json({
            ...updated,
            full_name: updated?.name,
            birth_date: updated?.birthDate ? updated.birthDate.toISOString().split('T')[0] : null,
            marketing_source: updated?.marketingSource,
            photo_url: updated?.photoUrl
        });
    } catch (error: any) {
        console.error("Update Patient Error:", error);
        res.status(400).json({ error: error.message });
    }
};

export const deletePatient = async (req: Request, res: Response) => {
    const { id } = req.params;
    const organizationId = req.headers['x-organization-id'] as string;

    try {
        const result = await prisma.patient.deleteMany({
            where: { id: Number(id), organizationId }
        });

        if (result.count === 0) return res.status(404).json({ error: "Not found" });
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: "Failed to delete patient" });
    }
};
