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

console.log("ClinicOS Client v1.1 Loaded - Debug Mode"); // Log to verify update

// Interceptor to add Organization ID
api.interceptors.request.use(async (config) => {
    if (!config) config = {};
    if (!config.headers) config.headers = {};

    // Try to get active org from localStorage (we will set this in our React UI)
    const activeOrgId = localStorage.getItem("active-org-id");
    if (activeOrgId) {
        config.headers["x-organization-id"] = activeOrgId;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

const createEntityHandler = (entityName) => ({
    list: async (params = {}) => {
        // Handle "params" safely. If it's a string (legacy), ignore it or wrap it.
        // Axios params MUST be an object.
        let requestParams = {};
        if (params && typeof params === 'object') {
            requestParams = { ...params };
        } else if (typeof params === 'string') {
            // If it's a string (like '-date'), we can't easily map it to generic params without knowing API specifics.
            // For now, we ignore it to prevent the crash, essentially listing default order.
            console.warn(`[Client] Ignoring string param for ${entityName}.list:`, params);
        }

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
            if (params && typeof params === 'object' && params.filter) {
                // Support all filters, not just ID
                Object.assign(queryParams, params.filter);
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
        NotificationPreference: createEntityHandler("NotificationPreference"), // Added missing entity
        ProcedureType: createEntityHandler("ProcedureType"), // Custom Procedures
        FinancialTransaction: createEntityHandler("FinancialTransaction"), // Financial Management
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
        updateMe: async (data) => {
            // Map legacy form data to better-auth keys
            // This is critical because Profile.tsx sends 'display_name' but user table has 'name'
            const updatePayload = {
                name: data.display_name || data.name || data.full_name,
                image: data.photo_url || data.image,
                phone: data.phone,
                specialty: data.specialty,
                user_type: data.user_type
            };

            // Remove undefined keys to prevent 400 Bad Request
            Object.keys(updatePayload).forEach(key => updatePayload[key] === undefined && delete updatePayload[key]);

            // If payload is empty, return early (or throw check)
            if (Object.keys(updatePayload).length === 0) return { data: null };

            const { data: updatedUser, error } = await authClient.updateUser(updatePayload);

            if (error) throw error;
            return updatedUser;
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
