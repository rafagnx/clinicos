import { Router } from 'express';
import { adminRouter } from './admin.routes.js';
import { entityRouter } from './entity.routes.js';


export const router = Router();

router.get('/health', (req, res) => res.json({ status: 'ok' }));

router.get('/', (req, res) => {
    res.json({ message: 'Welcome to ClinicOS API' });
});

router.use('/admin', adminRouter);
router.use('/', entityRouter); // Mounts /Patient, /Professional directly under /api

