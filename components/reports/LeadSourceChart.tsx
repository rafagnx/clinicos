import React from "react";
import { Card } from "@/components/ui/card";

export default function LeadSourceChart({ patients }: { patients: any[] }) {
    return (
        <Card className="p-6">
            <h3 className="font-semibold text-slate-800 mb-4">Origem dos Pacientes</h3>
            <div className="flex items-center justify-center h-64 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-slate-400">
                Gráfico de Origem (Placeholder)
            </div>
        </Card>
    );
}
