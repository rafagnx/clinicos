import express from 'express';

export const router = express.Router();

// Mock Data Storage
const db = {
    professionals: [
        { id: "1", full_name: "Dr. Rafael", email: "rafael@clinic.com", speciality: "Ortodontia" },
        { id: "2", full_name: "Dra. Leticia", email: "leticia@clinic.com", speciality: "Clínico Geral" }
    ],
    appointments: [ // Mock appointments
        { id: "1", patient_name: "João Silva", procedure_name: "Limpeza", start_time: "09:00", end_time: "10:00", professional_id: "1", status: "confirmado", type: "consulta", date: new Date().toISOString().split('T')[0] },
        { id: "2", patient_name: "Maria Souza", procedure_name: "Avaliação", start_time: "10:30", end_time: "11:00", professional_id: "2", status: "aguardando", type: "consulta", date: new Date().toISOString().split('T')[0] }
    ],
    patients: [
        { id: "1", name: "João Silva", phone: "11999999999" },
        { id: "2", name: "Maria Souza", phone: "11988888888" }
    ],
    "clinic-settings": [
        { name: "ClinicOS Demo", phone: "1133334444" }
    ],
    notifications: [
        { id: "1", title: "Novo Agendamento", message: "João Silva agendou para amanhã", read: false }
    ],
    leads: [],
    messages: [],
    conversations: [],
    promotions: []
};

// Generic CRUD Generator
const createCrud = (path, key) => {
    // LIST
    router.get(`/${path}`, (req, res) => {
        let data = db[key];

        // Simple Filtering
        const filters = req.query;
        if (filters) {
            data = data.filter(item => {
                return Object.keys(filters).every(fKey => {
                    // loose equality for strings/numbers interaction
                    return filters[fKey] === 'all' || item[fKey] == filters[fKey];
                });
            });
        }

        res.json(data);
    });

    // GET
    router.get(`/${path}/:id`, (req, res) => {
        const item = db[key].find(i => i.id == req.params.id);
        if (item) res.json(item);
        else res.status(404).json({ error: "Not found" });
    });

    // CREATE
    router.post(`/${path}`, (req, res) => {
        const newItem = { id: Date.now().toString(), ...req.body };
        db[key].push(newItem);
        res.json(newItem);
    });

    // UPDATE
    router.put(`/${path}/:id`, (req, res) => {
        const index = db[key].findIndex(i => i.id == req.params.id);
        if (index !== -1) {
            db[key][index] = { ...db[key][index], ...req.body };
            res.json(db[key][index]);
        } else {
            res.status(404).json({ error: "Not found" });
        }
    });

    // DELETE
    router.delete(`/${path}/:id`, (req, res) => {
        const index = db[key].findIndex(i => i.id == req.params.id);
        if (index !== -1) {
            const deleted = db[key].splice(index, 1);
            res.json(deleted[0]);
        } else {
            res.status(404).json({ error: "Not found" });
        }
    });
};

// Register Routes
createCrud('professionals', 'professionals');
createCrud('appointments', 'appointments');
createCrud('patients', 'patients');
createCrud('clinic-settings', 'clinic-settings');
createCrud('notifications', 'notifications');
createCrud('leads', 'leads');
createCrud('messages', 'messages');
createCrud('conversations', 'conversations');
createCrud('promotions', 'promotions');

