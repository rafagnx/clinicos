import React from "react";
import { Card } from "@/components/ui/card";

export default function LeadSourceChart({ patients }: { patients: any[] }) {
    return (
        <Card className="p-6 bg-white border border-slate-100 shadow-sm dark:bg-[#151A25] dark:border-slate-800">
            <h3 className="font-semibold text-slate-800 mb-4 dark:text-white">Origem dos Pacientes</h3>
            <div className="flex items-center justify-center h-64 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-slate-400 dark:bg-slate-900/50 dark:border-slate-800 dark:text-slate-500">
                Gráfico de Origem (Placeholder)
            </div>
        </Card>

    );
}

