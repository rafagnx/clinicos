import { Request, Response } from 'express';
import { prisma } from '../services/prisma.js';
import { appointmentSchema } from '../schemas/appointment.schema.js';

export const listAppointments = async (req: Request, res: Response) => {
    const organizationId = req.headers['x-organization-id'] as string;
    if (!organizationId) return res.status(400).json({ error: "Organization Context Required" });

    // Filters: Date Range
    const start = req.query.start ? new Date(req.query.start as string) : undefined;
    const end = req.query.end ? new Date(req.query.end as string) : undefined;

    try {
        const appointments = await prisma.appointment.findMany({
            where: {
                organizationId,
                startTime: (start && end) ? { gte: start, lte: end } : undefined
            },
            include: {
                patient: { select: { id: true, name: true, phone: true } },
                professional: { select: { id: true, name: true, color: true } }
            },
            orderBy: { startTime: 'asc' }
        });

        // Map for frontend compatibility (Snake Case + Formatting)
        const mapped = appointments.map(apt => ({
            ...apt,
            start_time: apt.startTime.toISOString().split('T')[1].substring(0, 5),
            end_time: apt.endTime.toISOString().split('T')[1].substring(0, 5),
            date: apt.startTime.toISOString().split('T')[0],
            patient: apt.patient ? { ...apt.patient, full_name: apt.patient.name } : null,
            professional: apt.professional ? { ...apt.professional, full_name: apt.professional.name } : null,
            procedure_name: apt.procedureName
        }));

        res.json({
            data: mapped,
            meta: { total: mapped.length }
        });
    } catch (error) {
        console.error("List Appointments Error:", error);
        res.status(500).json({ error: "Failed to fetch appointments" });
    }
};

export const createAppointment = async (req: Request, res: Response) => {
    const organizationId = req.headers['x-organization-id'] as string;
    if (!organizationId) return res.status(400).json({ error: "Organization Context Required" });

    try {
        const data = appointmentSchema.parse(req.body);

        // Conflict Check could go here

        const appointment = await prisma.appointment.create({
            data: {
                ...data,
                organizationId,
                // Legacy fields sync
                date: data.startTime,
                time: data.startTime.toISOString().split('T')[1].substring(0, 5)
            }
        });
        res.status(201).json(appointment);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const deleteAppointment = async (req: Request, res: Response) => {
    const { id } = req.params;
    const organizationId = req.headers['x-organization-id'] as string;

    // Allow deleting multiple if needed, but standard is by ID
    try {
        const result = await prisma.appointment.deleteMany({
            where: { id: Number(id), organizationId }
        });
        if (result.count === 0) return res.status(404).json({ error: "Not found" });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Delete failed" });
    }
}
