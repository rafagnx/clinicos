import axios from "axios";

// --- MOCK DATABASE (In-Memory) ---
// Temporary solution to allow the app to work while DB connection is blocked by host.
const uuidv4 = () => "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));

const MOCK_DB = {
    Professional: [
        { id: "prof_1", full_name: "Dr. Bittencourt", role_type: "dentist", specialty: "Harmonização", is_active: true, photo_url: "https://i.pravatar.cc/150?u=1", created_date: new Date().toISOString() },
        { id: "prof_2", full_name: "Dra. Letícia", role_type: "dentist", specialty: "Corporal", is_active: true, photo_url: "https://i.pravatar.cc/150?u=2", created_date: new Date().toISOString() }
    ],
    Patient: [
        { id: "pat_1", full_name: "Rafaela Silva", phone: "11999999999", email: "rafa@email.com", photo_url: "https://i.pravatar.cc/150?u=3", created_date: new Date().toISOString() }
    ],

    Appointment: [],
    MedicalRecord: [],
    Notification: [],
    Promotion: [],
    Conversation: [
        {
            id: "conv_1",
            participants: ["admin", "prof_1"],
            last_message: "Olá, tudo bem?",
            last_message_at: new Date().toISOString(),
            unread_count: 1,
            professional_id: "prof_1"
        }
    ],
    Message: [
        {
            id: "msg_1",
            conversation_id: "conv_1",
            sender_id: "prof_1",
            text: "Olá, tudo bem?",
            created_date: new Date().toISOString()
        }
    ]
};

// Helper: Simulate delay for realism
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const createEntityHandler = (entityName) => ({
    list: async (params = {}) => {
        await delay(300);
        let data = MOCK_DB[entityName] || [];

        // Handle if params is just a sort string (e.g. "-created_date")
        let sortField = null;
        let search = "";

        if (typeof params === 'string') {
            sortField = params;
        } else {
            search = params.search;
            if (params.sort) sortField = params.sort; // If complex sort object
        }

        if (search && typeof search === 'string') {
            const lower = search.toLowerCase();
            data = data.filter(i => JSON.stringify(i).toLowerCase().includes(lower));
        }

        // Simple string sort handling (e.g. "-date" or "date")
        if (typeof sortField === 'string') {
            const desc = sortField.startsWith("-");
            const field = desc ? sortField.substring(1) : sortField;
            data.sort((a, b) => {
                const valA = a[field] || "";
                const valB = b[field] || "";
                return desc ? (valA < valB ? 1 : -1) : (valA > valB ? 1 : -1);
            });
        }

        return [...data]; // Return copy
    },
    read: async (params = {}) => {
        await delay(300);
        let data = MOCK_DB[entityName] || [];

        // Simple filter logic
        if (params.filter) {
            Object.keys(params.filter).forEach(key => {
                const val = params.filter[key];
                if (typeof val === 'object' && val._ilike && typeof val._ilike === 'string') {
                    const term = val._ilike.replace(/%/g, '').toLowerCase();
                    data = data.filter(i => String(i[key]).toLowerCase().includes(term));
                } else if (typeof val !== 'object') {
                    data = data.filter(i => i[key] == val);
                }
            });
        }

        // Sort logic
        if (params.sort && params.sort[0]) {
            const { field, direction } = params.sort[0];
            data.sort((a, b) => {
                const valA = a[field] || "";
                const valB = b[field] || "";
                return direction === "asc" ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
            });
        }

        return [...data];
    },
    filter: async (query) => {
        // Alias to read for now
        return createEntityHandler(entityName).read({ filter: query });
    },
    create: async (data) => {
        await delay(300); // reduced delay
        const newItem = { id: uuidv4(), created_date: new Date().toISOString(), ...data };

        // Mock Relationships
        if (entityName === "Appointment" && newItem.patient_id) {
            newItem.patient = MOCK_DB.Patient.find(p => p.id === newItem.patient_id);
            newItem.professional = MOCK_DB.Professional.find(p => p.id === newItem.professional_id);
        }

        if (!MOCK_DB[entityName]) MOCK_DB[entityName] = [];
        MOCK_DB[entityName].push(newItem);
        return newItem;
    },
    update: async (id, data) => {
        await delay(300);
        const list = MOCK_DB[entityName];
        const idx = list.findIndex(i => i.id === id);
        if (idx > -1) {
            list[idx] = { ...list[idx], ...data };
            return list[idx];
        }
        throw new Error("Not found");
    },
    delete: async (id) => {
        await delay(300);
        MOCK_DB[entityName] = MOCK_DB[entityName].filter(i => i.id !== id);
        return { success: true };
    },
    subscribe: (callback) => {
        // Mock subscription - return unsubscribe function
        return () => { };
    }
});

export const base44 = {
    // Generic methods forwarding to entity handlers
    list: (e, p) => createEntityHandler(e).list(p),
    read: (e, p) => createEntityHandler(e).read(p),
    filter: (e, p) => createEntityHandler(e).filter(p),
    create: (e, d) => createEntityHandler(e).create(d),
    update: (e, i, d) => createEntityHandler(e).update(i, d),
    delete: (e, i) => createEntityHandler(e).delete(i),

    entities: {
        Professional: createEntityHandler("Professional"),
        Patient: createEntityHandler("Patient"),
        Appointment: createEntityHandler("Appointment"),
        MedicalRecord: createEntityHandler("MedicalRecord"),
        Notification: createEntityHandler("Notification"),
        Promotion: createEntityHandler("Promotion"),
        Conversation: createEntityHandler("Conversation"),
        Message: createEntityHandler("Message"),
    },

    auth: {
        me: async () => ({ id: "admin", full_name: "Administrador", email: "admin@clinicos.com", role: "admin" }),
        login: async () => ({ token: "mock", user: { id: "admin" } }),
        logout: async () => true
    },
    storage: {
        upload: async () => "https://via.placeholder.com/150"
    },
    functions: {
        invoke: async () => ({ success: true })
    }
};
