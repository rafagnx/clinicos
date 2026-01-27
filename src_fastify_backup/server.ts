import fastify from 'fastify';
import cors from '@fastify/cors';
import fastifySwagger from '@fastify/swagger';
// import { jsonSchemaTransform, ZodTypeProvider } from 'fastify-type-provider-zod'; // CAUSES CRASH
import apiReference from '@scalar/fastify-api-reference';
import { z, ZodError } from 'zod';

// Standard Fastify
const app = fastify();

// Register CORS
app.register(cors, {
    origin: true, // Allow all origins (dev mode)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
});

// Register Swagger
app.register(fastifySwagger, {
    openapi: {
        info: {
            title: 'ClinicOS API v2',
            description: 'Next-Gen API for ClinicOS with Fastify & Zod',
            version: '2.0.0',
        },
        servers: [
            {
                url: 'http://localhost:3333',
                description: 'Local Server',
            },
        ],
    },
    // transform: jsonSchemaTransform, // Disabled due to crash
});

import { toNodeHandler } from 'better-auth/node';
import { auth } from './auth/auth';

// Register Scalar API Reference (Docs)
app.register(apiReference, {
    routePrefix: '/docs',
    configuration: {
        theme: 'deepSpace',
        spec: {
            content: () => app.swagger(),
        },
    },
});

// Better Auth Handler
app.all('/api/auth/*', async (req, reply) => {
    return toNodeHandler(auth)(req.raw, reply.raw);
});

app.setErrorHandler((error, request, reply) => {
    console.error("❌ BACKEND ERROR:", error);

    // Formatting Zod Errors nicely
    if (error instanceof ZodError) {
        return reply.status(400).send({
            message: 'Validation Error',
            errors: (error as ZodError).issues
        });
    }

    reply.status(500).send({
        message: "Internal Server Error",
        error: error.message,
    });
});

import { professionalRoutes } from './routes/professionals';
import { patientRoutes } from './routes/patients';
import { appointmentRoutes } from './routes/appointments';

import { clinicSettingsRoutes } from './routes/clinic-settings';
import { notificationRoutes } from './routes/notifications';
import { procedureTypeRoutes } from './routes/procedure-types';
import { organizationRoutes } from './routes/organizations';
import { adminRoutes } from './routes/admin';

// Register Routes
app.register(professionalRoutes, { prefix: '/api/professionals' });
app.register(professionalRoutes, { prefix: '/api/Professional' });
app.register(patientRoutes, { prefix: '/api/patients' });
app.register(patientRoutes, { prefix: '/api/Patient' });
app.register(appointmentRoutes, { prefix: '/api/appointments' });
app.register(appointmentRoutes, { prefix: '/api/Appointment' });
app.register(organizationRoutes, { prefix: '/api/organization' });
app.register(organizationRoutes, { prefix: '/api/Organization' }); // Legacy
app.register(adminRoutes, { prefix: '/api/admin' });

// Mock Routes
app.register(clinicSettingsRoutes, { prefix: '/api/ClinicSettings' });
app.register(notificationRoutes, { prefix: '/api/Notification' });
app.register(procedureTypeRoutes, { prefix: '/api/ProcedureType' });

// Health
app.get('/health', async () => {
    return {
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    };
});

// Start Server
const start = async () => {
    try {
        await app.listen({ port: 3333, host: '0.0.0.0' });
        console.log('🚀 Fastify Server Running on http://localhost:3333');
        console.log('📚 Docs available at http://localhost:3333/docs');
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

start();
