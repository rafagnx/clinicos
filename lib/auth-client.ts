import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
    baseURL: import.meta.env.VITE_BACKEND_URL || "",
    fetchOptions: {
        onRequest: (context) => {
            console.log("Auth Request Context:", context);
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
