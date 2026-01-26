import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import * as PatientController from '../controllers/patient.controller.js';
import * as ProfessionalController from '../controllers/professional.controller.js';
import * as AppointmentController from '../controllers/appointment.controller.js';
import * as GenericController from '../controllers/generic.controller.js';
import * as OrgController from '../controllers/organization.controller.js';
import * as NotificationController from '../controllers/notification.controller.js';
import * as UserController from '../controllers/user.controller.js';

export const entityRouter = Router();

// User context
entityRouter.get('/user/organizations', requireAuth, OrgController.listUserOrganizations);
entityRouter.get('/user/me', requireAuth, UserController.getMe);
entityRouter.put('/user/profile', requireAuth, UserController.updateProfile);

// Patients
entityRouter.get('/Patient', requireAuth, PatientController.listPatients);
entityRouter.post('/Patient', requireAuth, PatientController.createPatient);
entityRouter.get('/Patient/:id', requireAuth, PatientController.getPatient);
entityRouter.put('/Patient/:id', requireAuth, PatientController.updatePatient);
entityRouter.delete('/Patient/:id', requireAuth, PatientController.deletePatient);

// Professionals
entityRouter.get('/Professional', requireAuth, ProfessionalController.listProfessionals);
entityRouter.post('/Professional', requireAuth, ProfessionalController.createProfessional);
entityRouter.put('/Professional/:id', requireAuth, ProfessionalController.updateProfessional);
entityRouter.delete('/Professional/:id', requireAuth, ProfessionalController.deleteProfessional);

// Appointments
entityRouter.get('/Appointment', requireAuth, AppointmentController.listAppointments);
entityRouter.post('/Appointment', requireAuth, AppointmentController.createAppointment);
entityRouter.delete('/Appointment/:id', requireAuth, AppointmentController.deleteAppointment);

// Minor Entities (Generic CRUD)
const registerGeneric = (modelName: string, urlName?: string) => {
    const routePath = urlName || modelName;
    entityRouter.get(`/${routePath}`, requireAuth, GenericController.listEntity(modelName));
    entityRouter.post(`/${routePath}`, requireAuth, GenericController.createEntity(modelName));
    entityRouter.get(`/${routePath}/:id`, requireAuth, GenericController.getEntity(modelName));
    entityRouter.put(`/${routePath}/:id`, requireAuth, GenericController.updateEntity(modelName));
    entityRouter.delete(`/${routePath}/:id`, requireAuth, GenericController.deleteEntity(modelName));
};

registerGeneric('ProcedureType');
registerGeneric('ClinicSetting', 'ClinicSettings'); // Alias for frontend pluralization
registerGeneric('Notification');
registerGeneric('NotificationPreference');
registerGeneric('Promotion');
registerGeneric('Lead');
registerGeneric('FinancialTransaction');
registerGeneric('MedicalRecord');
registerGeneric('Message');
registerGeneric('Conversation');
