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

import { supabase } from "@/lib/supabaseClient";

// ...

// Interceptor to add Organization ID and Auth Token
api.interceptors.request.use(async (config) => {
    if (!config) config = {};
    if (!config.headers) config.headers = {};

    // 1. Inject Supabase JWT Token (Bearer)
    // This solves Cross-Site cookie issues on Render/Vercel
    const { data } = await supabase.auth.getSession();
    if (data?.session?.access_token) {
        config.headers["Authorization"] = `Bearer ${data.session.access_token}`;
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

// ... (Entity Handlers remain same)

auth: {
    me: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            // Map Supabase User to our App User Shape
            return {
                id: user.id,
                email: user.email,
                name: user.user_metadata?.full_name || user.email?.split('@')[0],
                photo_url: user.user_metadata?.avatar_url || user.user_metadata?.image,
                role: user.user_metadata?.role || 'user',
                active_organization_id: localStorage.getItem("active-org-id") // Client-side context
            };
        }
        throw new Error("Not authenticated");
    },
        updateMe: async (data) => {
            const { data: updatedUser, error } = await supabase.auth.updateUser({
                data: {
                    full_name: data.display_name || data.name,
                    image: data.photo_url,
                    phone: data.phone,
                    specialty: data.specialty
                }
            });

            if (error) throw error;
            return {
                ...updatedUser.user,
                name: updatedUser.user.user_metadata.full_name
            }; // Return mapped
        },
            logout: async () => {
                await supabase.auth.signOut();
                localStorage.removeItem("clinicos-token");
                localStorage.removeItem("active-org-id");
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
    upload: async (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    }
},
functions: {
    invoke: async () => ({ success: true })
}
};
