import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
    baseURL: import.meta.env.VITE_BACKEND_URL || "http://localhost:3333",
    fetchOptions: {
        onRequest: ({ request, options }) => {
            console.log("Auth Request:", request, options);
        }
    },
    plugins: [
        organizationClient()
    ]
});

export const {
    signIn,
    signUp,
    signOut,
    useSession,
    useListOrganizations,
    useActiveOrganization
} = authClient;
