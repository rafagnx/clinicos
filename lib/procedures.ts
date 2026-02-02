
export const PROCEDURE_CATEGORIES = {
    "Toxina": { color: "#3b82f6", items: ["Toxina Botulínica"], duration: 60, interval: 120 },
    "Preenchimentos": { color: "#ec4899", items: ["8point", "Comissura", "Lábio", "Malar", "Mandíbula", "Mento", "Pré Jowls", "Nariz", "Olheira", "Sulco Naso", "Têmpora", "Glabela", "Marionete"], duration: 60, interval: 365 },
    "Fios": { color: "#8b5cf6", items: ["Fio PDO Liso", "Fio PDO Tração"], duration: 60, interval: 180 },
    "Bioestimuladores": { color: "#10b981", items: ["Bioestimulador", "PDRN", "Exossomos", "Lavieen", "Hipro", "Bioestimulador Corporal", "Bioestimulador Glúteo"], duration: 60, interval: 90 },
    "Corporal": { color: "#f97316", items: ["Glúteo Max", "Gordura Localizada", "Preenchimento Glúteo", "Protocolo 40 dias", "Protocolo Hipertrofia"], duration: 60, interval: 30 },
    "Tratamentos": { color: "#06b6d4", items: ["Microagulhamento", "Hialuronidase", "Endolaser Full Face", "Endolaser Região", "Endolaser Pescoço"], duration: 60, interval: 30 },
    "Transplante": { color: "#64748b", items: ["TP1", "TP2", "TP3"], duration: 60, interval: 0 },
    "Cirurgias": { color: "#ef4444", items: ["Alectomia", "Bichectomia", "Brow Lift", "Lip Lift", "Slim Tip", "Lipo de Papada", "Blefaro", "Rinoplastia"], duration: 60, interval: 0 }
};

export function getGroupedProcedures(procedures: any[]) {
    // 1. UNIQUE PROCEDURES (Deduplicate by name)
    const uniqueProcedures = procedures.filter((proc, index, self) =>
        index === self.findIndex((t) => t.name.toLowerCase().trim() === proc.name.toLowerCase().trim())
    );

    const renderedIds = new Set();
    const groupedList = [];

    // 2. Process Defined Categories
    Object.entries(PROCEDURE_CATEGORIES).forEach(([catName, data]) => {
        const items = uniqueProcedures.filter(p => {
            if (renderedIds.has(p.id)) return false;

            // Strict Match: Use Word Boundaries
            return data.items.some(k => {
                const escapedKey = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(`\\b${escapedKey}\\b`, 'i');
                if (k.includes(' ')) {
                    return p.name.toLowerCase().includes(k.toLowerCase());
                }
                return regex.test(p.name);
            });
        });

        if (items.length > 0) {
            items.forEach(p => renderedIds.add(p.id));
            groupedList.push({ title: catName, items, color: data.color });
        }
    });

    // 3. Process "Outros"
    const others = uniqueProcedures.filter(p => !renderedIds.has(p.id));
    if (others.length > 0) {
        groupedList.push({ title: "Outros Procedimentos", items: others, color: "#94a3b8" });
    }

    return groupedList;
}

export function getUniqueProcedures(procedures: any[]) {
    return procedures.filter((proc, index, self) =>
        index === self.findIndex((t) => t.name.toLowerCase().trim() === proc.name.toLowerCase().trim())
    );
}
