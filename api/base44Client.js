import axios from "axios";
import { authClient } from "@/lib/auth-client"; // Import for types if needed, or we rely on localStorage/hooks
// Note: Interacting with authClient state from outside React components is tricky. 
// We will rely on localStorage for active organization or let the interceptor fetch it if possible.
// Better Auth organizes active org in it's session, which is httpOnly cookie usually for server, but client needs to know.
// Client state is in useSession. 

// PRODUCTION BACKEND URL
const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
const BACKEND_URL = `${BASE_URL}/api`;

const api = axios.create({
    baseURL: BACKEND_URL,
    withCredentials: true, // IMPORTANT: Send cookies (session)
    headers: {
        "Content-Type": "application/json"
    }
});

// Interceptor to add Organization ID
api.interceptors.request.use(async (config) => {
    // Try to get active org from localStorage (we will set this in our React UI)
    const activeOrgId = localStorage.getItem("active-org-id");
    if (activeOrgId) {
        config.headers["x-organization-id"] = activeOrgId;
    }
    return config;
});

const createEntityHandler = (entityName) => ({
    list: async (params = {}) => {
        // Handle "params" being a string (legacy sort instruction from generated code)
        // Axios expects an object, so we must sanitize.
        const requestParams = (typeof params === 'object' && params !== null) ? params : {};

        try {
            const response = await api.get(`/${entityName}`, { params: requestParams });
            return response.data;
        } catch (error) {
            console.error(`Error listing ${entityName}:`, error);
            // Return empty array on error to prevent unnecessary crashes
            return [];
        }
    },
    read: async (params = {}) => {
        try {
            let queryParams = {};
            if (params.filter) {
                if (params.filter.id) queryParams.id = params.filter.id;
            }
            const response = await api.get(`/${entityName}`, { params: queryParams });
            return response.data;
        } catch (error) {
            console.error(`Error reading ${entityName}:`, error);
            return [];
        }
    },
    filter: async (query) => {
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
        Lead: createEntityHandler("Lead"),
        Message: createEntityHandler("Message"),
        Conversation: createEntityHandler("Conversation"), // Added missing entity
        ClinicSettings: createEntityHandler("ClinicSettings"), // Added for layout
    },

    auth: {
        // Updated to use the new endpoints via api instance 
        // But mainly for compatibility with existing calls.
        // Usually, we should switch to `authClient` from `better-auth`.
        me: async () => {
            // For layout compat
            const { data } = await authClient.getSession();
            return data?.user || null;
        },
        logout: async () => {
            await authClient.signOut();
            window.location.href = "/login";
        }
    },
    admin: {
        listOrganizations: async () => {
            const response = await api.get("/admin/organizations");
            return response.data;
        }
    },
    storage: {
        upload: async () => "https://via.placeholder.com/150"
    },
    functions: {
        invoke: async () => ({ success: true })
    }
};
