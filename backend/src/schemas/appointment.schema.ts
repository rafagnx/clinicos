import { z } from 'zod';

export const appointmentSchema = z.object({
    patientId: z.number(),
    professionalId: z.number(),
    // Supports legacy strings or modern DateTime
    startTime: z.string().or(z.date()).transform(val => new Date(val)),
    endTime: z.string().or(z.date()).transform(val => new Date(val)),
    procedureName: z.string().optional(),
    duration: z.number().default(30),
    notes: z.string().optional(),
    status: z.string().default('scheduled'),
});
