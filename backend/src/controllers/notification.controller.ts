import { Request, Response } from 'express';
import { prisma } from '../services/prisma.js';

export const getPreferences = async (req: Request, res: Response) => {
    const { userId } = req.query; // FE sends ?user_id=... but we can check both
    const id = userId || req.query.user_id;

    if (!id) return res.status(400).json({ error: "User ID required" });

    try {
        const prefs = await prisma.notificationPreference.findMany({
            where: { userId: String(id) }
        });

        // Map BE camelCase to FE snake_case
        const mapped = prefs.map(p => ({
            ...p,
            email_enabled: p.emailEnabled,
            push_enabled: p.pushEnabled,
            whatsapp_enabled: p.whatsappEnabled,
            appointment_reminders: p.appointmentReminders,
            marketing_updates: p.marketingUpdates,
            user_id: p.userId
        }));

        res.json({ data: mapped, meta: { total: mapped.length } });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch preferences" });
    }
};

export const createPreference = async (req: Request, res: Response) => {
    try {
        const body = req.body;
        const data = {
            userId: body.user_id || body.userId,
            emailEnabled: body.email_enabled ?? body.emailEnabled,
            pushEnabled: body.push_enabled ?? body.pushEnabled,
            whatsappEnabled: body.whatsapp_enabled ?? body.whatsappEnabled,
            appointmentReminders: body.appointment_reminders ?? body.appointmentReminders,
            marketingUpdates: body.marketing_updates ?? body.marketingUpdates,
            organizationId: body.organizationId || req.headers['x-organization-id']
        };

        const item = await prisma.notificationPreference.create({ data });
        res.status(201).json({
            ...item,
            email_enabled: item.emailEnabled,
            push_enabled: item.pushEnabled,
            whatsapp_enabled: item.whatsappEnabled,
            appointment_reminders: item.appointmentReminders,
            marketing_updates: item.marketingUpdates,
            user_id: item.userId
        });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const updatePreference = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const body = req.body;
        const data: any = {};

        if (body.email_enabled !== undefined) data.emailEnabled = body.email_enabled;
        if (body.push_enabled !== undefined) data.pushEnabled = body.push_enabled;
        if (body.whatsapp_enabled !== undefined) data.whatsappEnabled = body.whatsapp_enabled;
        if (body.appointment_reminders !== undefined) data.appointmentReminders = body.appointment_reminders;
        if (body.marketing_updates !== undefined) data.marketingUpdates = body.marketing_updates;

        const updated = await prisma.notificationPreference.update({
            where: { id: Number(id) },
            data
        });

        res.json({
            ...updated,
            email_enabled: updated.emailEnabled,
            push_enabled: updated.pushEnabled,
            whatsapp_enabled: updated.whatsappEnabled,
            appointment_reminders: updated.appointmentReminders,
            marketing_updates: updated.marketingUpdates,
            user_id: updated.userId
        });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};
