import axios from "axios";

// PRODUCTION BACKEND URL
// Replace this with your actual backend URL if it changes
const BACKEND_URL = "https://clinicos-it4q.onrender.com/api";

const api = axios.create({
    baseURL: BACKEND_URL,
    headers: {
        "Content-Type": "application/json"
    }
});

const createEntityHandler = (entityName) => ({
    list: async (params = {}) => {
        try {
            // Convert params to query string if needed
            // Currently our backend accepts generic query params
            const response = await api.get(`/${entityName}`, { params });
            return response.data;
        } catch (error) {
            console.error(`Error listing ${entityName}:`, error);
            return [];
        }
    },
    read: async (params = {}) => {
        try {
            // Backend supports ID filtering via query param
            // If params has filter object, try to extract ID or other fields
            let queryParams = {};

            if (params.filter) {
                // Flatten filter object for simple backend
                // Supporting ID specifically as per our backend logic
                if (params.filter.id) queryParams.id = params.filter.id;
            }

            // If the caller passed an ID directly or complex object, adjust strategy
            // For now, assuming standard usage matches our backend expectations
            const response = await api.get(`/${entityName}`, { params: queryParams });
            return response.data;
        } catch (error) {
            console.error(`Error reading ${entityName}:`, error);
            return [];
        }
    },
    filter: async (query) => {
        // Alias to read
        return createEntityHandler(entityName).read({ filter: query });
    },
    create: async (data) => {
        try {
            const response = await api.post(`/${entityName}`, data);
            return response.data;
        } catch (error) {
            console.error(`Error creating ${entityName}:`, error);
            throw error;
        }
    },
    update: async (id, data) => {
        try {
            const response = await api.put(`/${entityName}/${id}`, data);
            return response.data;
        } catch (error) {
            console.error(`Error updating ${entityName}:`, error);
            throw error;
        }
    },
    delete: async (id) => {
        try {
            const response = await api.delete(`/${entityName}/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error deleting ${entityName}:`, error);
            throw error;
        }
    },
    subscribe: (callback) => {
        // Realtime not implemented in MVP, return dummy unsubscribe
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
        // Mock Auth for MVP - in strict mode this should call /api/auth/me
        me: async () => {
            try {
                const res = await api.get('/auth/me');
                return res.data;
            } catch (e) {
                return null;
            }
        },
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
