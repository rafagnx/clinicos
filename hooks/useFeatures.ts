import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/lib/base44Client";

export const useFeatures = () => {
    const { data: organization } = useQuery({
        queryKey: ["active-org-features"],
        queryFn: async () => {
            // In a real app, we might check local storage cache or hit an endpoint.
            // Here we assume base44.auth.me() or similar has loaded the org context, 
            // OR we fetch the org details again.
            // Since 'Layout' already fetches the organization, we can try to leverage cache
            // or just fetch strictly.

            const activeOrgId = localStorage.getItem("active-org-id");
            if (!activeOrgId) return null;

            const orgs = await base44.auth.getUserOrganizations();
            return orgs.find(o => o.organizationId === activeOrgId || o.id === activeOrgId);
        },
        staleTime: 1000 * 60 * 5 // 5 min cache
    });

    const { data: user } = useQuery<any>({ queryKey: ["auth-user"] });

    const hasFeature = (featureName: string) => {
        // 1. System Admin / Specific Email Override (Dev/Demo)
        if (user?.email === 'marketingorofacial@gmail.com' || user?.email === 'rafamarketingdb@gmail.com') {
            return true;
        }

        // 1.1 Orofacial Clinic PRO Override
        if (organization?.name?.toLowerCase()?.includes('orofacial') || organization?.slug?.includes('orofacial')) {
            return true;
        }

        // Hardcode fallback for Orofacial Clinic (temporary fix for visibility)
        const activeOrgId = localStorage.getItem("active-org-id");
        if (activeOrgId === 'bc550e05-d94f-461e-92da-bd3e3c8e2460' && featureName === 'marketing') {
            return true;
        }

        if (!organization) return false;

        // 2. Check metadata
        const metadata = organization.metadata;
        // Handle both string JSON or object
        let features: any = {};

        if (typeof metadata === 'string') {
            try {
                const parsed = JSON.parse(metadata);
                features = parsed.features || parsed; // Support {"features":...} or direct keys
            } catch (e) { features = {}; }
        } else {
            features = metadata?.features || metadata || {};
        }

        if (featureName === 'marketing') return true; // Enabled for everyone by default as per user request

        return features[featureName] === true;
    };

    return { hasFeature, organization };
};
