import { base44 } from './lib/base44Client.js';

const TARGETS = [
    {
        full_name: "Dra. Letícia (Corporal)",
        role_type: "profissional",
        specialty: "Biomédico esteta",
        council_number: "59817",
        council_state: "RJ",
        is_admin: false,
        color: "#F59E0B" // Orange/Gold
    },
    {
        full_name: "Tainara",
        role_type: "secretaria",
        specialty: "Recepcionista",
        is_admin: false,
        color: "#3B82F6" // Blue
    },
    {
        full_name: "Dr. Bittencourt",
        role_type: "profissional",
        specialty: "HOF",
        council_number: "35095",
        council_state: "RJ",
        is_admin: false,
        color: "#3B82F6"
    },
    {
        full_name: "Dra. Letícia (Facial)",
        role_type: "profissional",
        specialty: "Biomédica Esteta",
        council_number: "59817",
        council_state: "RJ",
        is_admin: false,
        color: "#EC4899" // Pink
    },
    {
        full_name: "Rafa",
        role_type: "marketing",
        specialty: "Marketing",
        is_admin: true,
        color: "#10B981" // Green
    }
];

const main = async () => {
    try {
        console.log("Fetching current professionals...");
        // Calling list() without string arg to avoid Axios error
        const currentProfs = await base44.entities.Professional.list();
        console.log(`Found ${currentProfs.length} existing professionals.`);

        // 1. Identification
        const toKeep = [];
        const toDelete = [];
        const toCreate = [...TARGETS]; // Start with all, remove found ones

        for (const prof of currentProfs) {
            const matchIndex = toCreate.findIndex(t => t.full_name.toLowerCase() === prof.full_name.toLowerCase());

            if (matchIndex >= 0) {
                // Found a match, keep it and update it
                toKeep.push({ existing: prof, target: toCreate[matchIndex] });
                toCreate.splice(matchIndex, 1); // Remove from create list
            } else {
                // No match in targets, delete it
                toDelete.push(prof);
            }
        }

        // 2. Deletion
        console.log(`Creating ${toCreate.length}, Updating ${toKeep.length}, Deleting ${toDelete.length}`);

        for (const prof of toDelete) {
            console.log(`Deleting ${prof.full_name}...`);
            await base44.entities.Professional.delete(prof.id);
        }

        // 3. Updates
        for (const { existing, target } of toKeep) {
            console.log(`Updating ${existing.full_name}...`);
            await base44.entities.Professional.update(existing.id, {
                ...target,
                status: "ativo",
                // Preserve photo if exists, otherwise generate
                photo_url: existing.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(target.full_name)}&background=random`
            });
        }

        // 4. Creations
        for (const target of toCreate) {
            console.log(`Creating ${target.full_name}...`);
            await base44.entities.Professional.create({
                ...target,
                status: "ativo",
                photo_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(target.full_name)}&background=random`,
                appointment_duration: 30
            });
        }

        console.log("Sync complete!");

    } catch (error) {
        console.error("Sync failed:", error?.message || error);
        if (error?.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", JSON.stringify(error.response.data, null, 2));
        }
    }
};

main();
