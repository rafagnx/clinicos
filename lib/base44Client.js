import axios from "axios";
import { supabase } from "./supabaseClient";
import { blockedDaysApi } from "./blockedDaysClient";
import { holidaysApi } from "./holidaysClient";

// USE PROXY (Relative path) to ensure cookies and CORS work
const BASE_URL = "";
// If VITE_BACKEND_URL is set, use it (for production build without proxy), otherwise use relative /api
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ? `${import.meta.env.VITE_BACKEND_URL}/api` : "/api";

const api = axios.create({
    baseURL: BACKEND_URL,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json"
    }
});

console.log("ClinicOS Client v1.2 Loaded - Supabase Mode");
console.log("Backend URL:", BACKEND_URL);
console.log("Environment:", import.meta.env.MODE);

// Interceptor to add Organization ID and Auth Token
api.interceptors.request.use(async (config) => {
    if (!config) config = {};
    if (!config.headers) config.headers = {};

    // 1. Inject Supabase JWT Token (Bearer)
    // This solves Cross-Site cookie issues on Render/Vercel
    try {
        const { data } = await supabase.auth.getSession();

        // Critical Fix: Ensure we have a valid session token not expired
        // Sometimes getSession() returns cached stale session, try refreshSession if needed? (Axios handles retries generally better)

        if (data?.session?.access_token) {
            config.headers["Authorization"] = `Bearer ${data.session.access_token}`;
        } else {
            // Second attempt: Try to refresh explicitly if user is logged in
            const { data: refreshData } = await supabase.auth.refreshSession();
            if (refreshData?.session?.access_token) {
                config.headers["Authorization"] = `Bearer ${refreshData.session.access_token}`;
            } else {
                // Fallback: Check for Dev/Manual Token or Hash Fragment (OAuth Redirect just happened)
                const hashParams = new URLSearchParams(window.location.hash.slice(1)); // remove #
                const hashToken = hashParams.get("access_token");

                const manualToken = localStorage.getItem("clinicos-token") || hashToken;

                if (manualToken) {
                    config.headers["Authorization"] = `Bearer ${manualToken}`;
                } else {
                    console.warn("[Client] No token found for request to", config.url);
                }
            }
        }
    } catch (err) {
        console.error("[Client] Error injecting token", err);
    }

    // 2. Active Org context
    const activeOrgId = localStorage.getItem("active-org-id");
    if (activeOrgId) {
        config.headers["x-organization-id"] = activeOrgId;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Generic Entity Handler Factory
const createEntityHandler = (entityName) => ({
    list: async (params = {}) => {
        let requestParams = {};
        if (params && typeof params === 'object') {
            requestParams = { ...params };
        }
        try {
            const response = await api.get(`/${entityName}`, { params: requestParams });
            // New Backend returns { data: [], meta: {} } for lists
            if (response.data && response.data.data && Array.isArray(response.data.data)) {
                return response.data.data;
            }
            // Fallback for array response
            return Array.isArray(response.data) ? response.data : [];
        } catch (error) {
            console.error(`Error listing ${entityName}:`, error);
            // Return empty array on error to prevent crashes
            return [];
        }
    },
    read: async (params = {}) => {
        try {
            let queryParams = {};
            if (params && typeof params === 'object' && params.filter) {
                Object.assign(queryParams, params.filter);
            }
            const response = await api.get(`/${entityName}`, { params: queryParams });

            // Handle { data: [], meta: {} }
            if (response.data && response.data.data && Array.isArray(response.data.data)) {
                return response.data.data;
            }

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
    // Utility for generic entity access
    read: (entity, params) => base44.entities[entity]?.read(params),
    list: (entity, params) => base44.entities[entity]?.list(params),
    create: (entity, data) => base44.entities[entity]?.create(data),
    update: (entity, id, data) => base44.entities[entity]?.update(id, data),
    delete: (entity, id) => base44.entities[entity]?.delete(id),

    // Entities
    entities: {
        Professional: createEntityHandler("Professional"),
        Patient: createEntityHandler("Patient"),
        Appointment: createEntityHandler("Appointment"),
        MedicalRecord: createEntityHandler("MedicalRecord"),
        Notification: createEntityHandler("Notification"),
        Promotion: createEntityHandler("Promotion"),
        Lead: createEntityHandler("Lead"),
        Message: createEntityHandler("Message"),
        Conversation: createEntityHandler("Conversation"),
        ClinicSettings: createEntityHandler("ClinicSettings"),
        NotificationPreference: createEntityHandler("NotificationPreference"),
        ProcedureType: createEntityHandler("ProcedureType"),
        FinancialTransaction: createEntityHandler("FinancialTransaction"),
        Organization: createEntityHandler("Organization"),
    },

    // Auth (Supabase Integration)
    auth: {
        me: async () => {
            const devToken = localStorage.getItem("clinicos-token");
            if (devToken === "dev-token") {
                return {
                    id: '7c49b5f9-17cb-4932-977e-d75c6fb2c01f', // Real Admin ID
                    email: 'rafamarketingdb@gmail.com',
                    name: 'Rafa (Rescue)',
                    role: 'admin',
                    active_organization_id: localStorage.getItem("active-org-id")
                };
            }
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // Fetch from Backend DB to get persisted profile data
                let dbUser = {};
                try {
                    const { data } = await api.get('/user/profile');
                    dbUser = data || {};
                } catch (e) {
                    console.warn("DB Profile fetch failed", e);
                }

                return {
                    id: user.id,
                    email: user.email,
                    // Priority: DB -> Metadata -> Email fallback
                    name: dbUser.name || user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0],
                    photo_url: dbUser.image || user.user_metadata?.avatar_url || user.user_metadata?.image,
                    phone: dbUser.phone || user.user_metadata?.phone,
                    specialty: dbUser.specialty || user.user_metadata?.specialty,
                    user_type: dbUser.user_type || user.user_metadata?.user_type,
                    role: user.user_metadata?.role || 'user',
                    active_organization_id: localStorage.getItem("active-org-id")
                };
            }
            return null;
        },
        updateMe: async (data) => {
            const { data: updatedUser, error } = await supabase.auth.updateUser({
                data: {
                    full_name: data.display_name || data.name,
                    image: data.photo_url,
                    phone: data.phone,
                    specialty: data.specialty,
                    user_type: data.user_type,
                    role: data.role
                }
            });

            if (error) throw error;

            // Sync with backend database
            try {
                await api.put('/user/profile', data);
            } catch (err) {
                console.warn("Backend sync failed:", err);
            }

            return {
                ...updatedUser.user,
                name: updatedUser.user.user_metadata.full_name
            };
        },
        logout: async () => {
            await supabase.auth.signOut();
            localStorage.removeItem("clinicos-token");
            localStorage.removeItem("active-org-id");
            window.location.href = "/login";
        },
        getUserOrganizations: async () => {
            try {
                const response = await api.get("/user/organizations");
                return response.data;
            } catch (error) {
                console.error("Error fetching user organizations:", error);
                return [];
            }
        },
        processPendingInvites: async () => {
            try {
                await api.post("/user/invites/process");
            } catch (error) {
                console.warn("Error processing invites:", error);
            }
        }
    },

    // Admin Helper
    admin: {
        listOrganizations: async () => {
            const response = await api.get("/admin/organizations");
            return response.data;
        },
        acceptInvite: async (token) => {
            try {
                const response = await api.post("/admin/accept-invite", { token });
                return { data: response.data, error: null };
            } catch (err) {
                return { data: null, error: err.response?.data?.error || err.message };
            }
        },
        getMembers: async (orgId) => {
            const response = await api.get(`/admin/members/${orgId}`);
            return response.data;
        }
    },

    // Mock Storage
    storage: {
        upload: async (file) => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result);
                reader.onerror = (error) => reject(error);
            });
        }
    },

    // Mock Cloud Functions
    functions: {
        invoke: async () => ({ success: true })
    },

    // Blocked Days & Holidays
    blockedDays: blockedDaysApi,
    holidays: holidaysApi
};
