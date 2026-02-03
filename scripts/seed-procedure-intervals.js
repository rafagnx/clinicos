/**
 * Script to populate return_interval for all procedures
 * Based on the default intervals from lib/procedures.ts
 */

import { base44 } from '../lib/base44Client.js';

const PROCEDURE_INTERVALS = {
    // Toxina
    "Toxina Botulínica": 120,

    // Preenchimentos (1 year)
    "8point": 365,
    "Comissura": 365,
    "Lábio": 365,
    "Malar": 365,
    "Mandíbula": 365,
    "Mento": 365,
    "Pré Jowls": 365,
    "Nariz": 365,
    "Olheira": 365,
    "Sulco Naso": 365,
    "Têmpora": 365,
    "Glabela": 365,
    "Marionete": 365,

    // Also handle prefixed versions
    "Preenchimento 8point": 365,
    "Preenchimento Comissura": 365,
    "Preenchimento Lábio": 365,
    "Preenchimento Malar": 365,
    "Preenchimento Mandíbula": 365,
    "Preenchimento Mento": 365,
    "Preenchimento Pré Jowls": 365,
    "Preenchimento Nariz": 365,
    "Preenchimento Olheira": 365,
    "Preenchimento Sulco Naso": 365,
    "Preenchimento Têmpora": 365,
    "Preenchimento Glabela": 365,
    "Preenchimento Marionete": 365,

    // Fios (180 days)
    "Fio PDO Liso": 180,
    "Fio PDO Tração": 180,

    // Bioestimuladores (90 days)
    "Bioestimulador": 90,
    "PDRN": 90,
    "Exossomos": 90,
    "Lavieen": 90,
    "Hipro": 90,
    "Bioestimulador Corporal": 90,
    "Bioestimulador Glúteo": 90,

    // Corporal (30 days)
    "Glúteo Max": 30,
    "Gordura Localizada": 30,
    "Preenchimento Glúteo": 30,
    "Protocolo 40 dias": 30,
    "Protocolo Hipertrofia": 30,

    // Tratamentos (30 days)
    "Microagulhamento": 30,
    "Hialuronidase": 30,
    "Endolaser Full Face": 30,
    "Endolaser Região": 30,
    "Endolaser Pescoço": 30,

    // Transplante (no return - 0)
    "TP1": 0,
    "TP2": 0,
    "TP3": 0,

    // Cirurgias (no return - 0)
    "Alectomia": 0,
    "Bichectomia": 0,
    "Brow Lift": 0,
    "Lip Lift": 0,
    "Slim Tip": 0,
    "Lipo de Papada": 0,
    "Blefaro": 0,
    "Rinoplastia": 0
};

async function updateProcedureIntervals() {
    console.log("🔧 Starting procedure interval update...\n");

    try {
        // Fetch all procedures
        const procedures = await base44.entities.ProcedureType.list();
        console.log(`📋 Found ${procedures.length} procedures in database\n`);

        let updatedCount = 0;
        let skippedCount = 0;
        let notFoundCount = 0;

        for (const proc of procedures) {
            // Check if procedure has a defined interval
            let interval = null;

            // Try exact match first
            if (PROCEDURE_INTERVALS[proc.name]) {
                interval = PROCEDURE_INTERVALS[proc.name];
            } else {
                // Try fuzzy match (case-insensitive, partial)
                const matchKey = Object.keys(PROCEDURE_INTERVALS).find(key =>
                    proc.name.toLowerCase().includes(key.toLowerCase()) ||
                    key.toLowerCase().includes(proc.name.toLowerCase())
                );

                if (matchKey) {
                    interval = PROCEDURE_INTERVALS[matchKey];
                }
            }

            if (interval !== null) {
                // Check if already has the correct value
                if (proc.return_interval === interval) {
                    console.log(`⏭️  SKIP: "${proc.name}" already has interval ${interval} days`);
                    skippedCount++;
                } else {
                    // Update the procedure
                    await base44.entities.ProcedureType.update(proc.id, {
                        ...proc,
                        return_interval: interval
                    });
                    console.log(`✅ UPDATE: "${proc.name}" → ${interval} days (was: ${proc.return_interval || 0})`);
                    updatedCount++;
                }
            } else {
                console.log(`⚠️  NOT FOUND: "${proc.name}" - no default interval defined`);
                notFoundCount++;
            }
        }

        console.log("\n" + "=".repeat(60));
        console.log("📊 Summary:");
        console.log(`   ✅ Updated: ${updatedCount}`);
        console.log(`   ⏭️  Skipped (already correct): ${skippedCount}`);
        console.log(`   ⚠️  Not found in defaults: ${notFoundCount}`);
        console.log("=".repeat(60));
        console.log("\n✨ Done! Smart Retention should now show opportunities.\n");

    } catch (error) {
        console.error("❌ Error updating procedures:", error);
        process.exit(1);
    }
}

// Run the script
updateProcedureIntervals();
