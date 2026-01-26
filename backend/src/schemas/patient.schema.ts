import { z } from 'zod';

export const patientSchema = z.object({
    name: z.string().min(2, "Name is required"),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
    cpf: z.string().optional(),
    birthDate: z.coerce.date().optional(), // Coerce handles string -> date
    gender: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    notes: z.string().optional(),
    status: z.enum(['ativo', 'inativo', 'arquivado']).default('ativo'),
});

export const updatePatientSchema = patientSchema.partial();
