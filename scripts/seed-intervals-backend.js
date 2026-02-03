// Script para popular return_interval nos procedimentos
// Execute com: node scripts/seed-intervals-backend.js

const fetch = require('node-fetch');

const API_URL = 'http://localhost:3001/api';

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

    // Prefixed versions
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

    // Fios
    "Fio PDO Liso": 180,
    "Fio PDO Tração": 180,

    // Bioestimuladores
    "Bioestimulador": 90,
    "PDRN": 90,
    "Exossomos": 90,
    "Lavieen": 90,
    "Hipro": 90,
    "Bioestimulador Corporal": 90,
    "Bioestimulador Glúteo": 90,

    // Corporal
    "Glúteo Max": 30,
    "Gordura Localizada": 30,
    "Preenchimento Glúteo": 30,
    "Protocolo 40 dias": 30,
    "Protocolo Hipertrofia": 30,

    // Tratamentos
    "Microagulhamento": 30,
    "Hialuronidase": 30,
    "Endolaser Full Face": 30,
    "Endolaser Região": 30,
    "Endolaser Pescoço": 30,

    // Transplante
    "TP1": 0,
    "TP2": 0,
    "TP3": 0,

    // Cirurgias
    "Alectomia": 0,
    "Bichectomia": 0,
    "Brow Lift": 0,
    "Lip Lift": 0,
    "Slim Tip": 0,
    "Lipo de Papada": 0,
    "Blefaro": 0,
    "Rinoplastia": 0
};

async function updateProcedures() {
    console.log("🔧 Atualizando intervalos de retorno dos procedimentos...\n");

    try {
        // Fetch procedures
        const response = await fetch(`${API_URL}/ProcedureType`);
        if (!response.ok) {
            throw new Error(`Erro ao buscar procedimentos: ${response.status}`);
        }

        const procedures = await response.json();
        console.log(`📋 Encontrados ${procedures.length} procedimentos\n`);

        let updated = 0;
        let skipped = 0;
        let notFound = 0;

        for (const proc of procedures) {
            // Find matching interval
            let interval = null;

            if (PROCEDURE_INTERVALS[proc.name]) {
                interval = PROCEDURE_INTERVALS[proc.name];
            } else {
                // Fuzzy match
                const matchKey = Object.keys(PROCEDURE_INTERVALS).find(key =>
                    proc.name.toLowerCase().includes(key.toLowerCase()) ||
                    key.toLowerCase().includes(proc.name.toLowerCase())
                );

                if (matchKey) {
                    interval = PROCEDURE_INTERVALS[matchKey];
                }
            }

            if (interval !== null) {
                if (proc.return_interval === interval) {
                    console.log(`⏭️  JÁ OK: "${proc.name}" → ${interval} dias`);
                    skipped++;
                } else {
                    // Update via PATCH
                    const updateRes = await fetch(`${API_URL}/ProcedureType/${proc.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ return_interval: interval })
                    });

                    if (updateRes.ok) {
                        console.log(`✅ ATUALIZADO: "${proc.name}" → ${interval} dias (era: ${proc.return_interval || 0})`);
                        updated++;
                    } else {
                        console.error(`❌ ERRO ao atualizar "${proc.name}"`);
                    }
                }
            } else {
                console.log(`⚠️  SEM PADRÃO: "${proc.name}"`);
                notFound++;
            }
        }

        console.log("\n" + "=".repeat(60));
        console.log("📊 Resumo:");
        console.log(`   ✅ Atualizados: ${updated}`);
        console.log(`   ⏭️  Já estavam corretos: ${skipped}`);
        console.log(`   ⚠️  Sem padrão definido: ${notFound}`);
        console.log("=".repeat(60));
        console.log("\n✨ Pronto! O Smart Retention agora deve mostrar oportunidades.\n");

    } catch (error) {
        console.error("❌ Erro:", error.message);
        process.exit(1);
    }
}

updateProcedures();
