import { z } from 'zod';

export const professionalSchema = z.object({
    name: z.string().min(2),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
    councilNumber: z.string().optional(),
    councilState: z.string().optional(),
    color: z.string().regex(/^#/, "Invalid color hex").default('#3B82F6'),
    appointmentDuration: z.number().min(5).default(30),
    roleType: z.enum(['profissional', 'recepcionista', 'admin']).default('profissional'),
    status: z.enum(['ativo', 'inativo']).default('ativo'),
});

export const updateProfessionalSchema = professionalSchema.partial();
