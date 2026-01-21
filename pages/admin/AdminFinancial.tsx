import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, Activity } from "lucide-react";

export default function AdminFinancial() {
    return (
        <div className="p-8 space-y-8">
            <h1 className="text-3xl font-bold text-slate-900">Financeiro Global</h1>
            <p className="text-slate-500">Visão geral do faturamento de todas as clínicas.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { title: "Receita Total (Mês)", value: "R$ 452.000,00", icon: DollarSign, color: "text-emerald-600 bg-emerald-50" },
                    { title: "Ticket Médio", value: "R$ 850,00", icon: TrendingUp, color: "text-blue-600 bg-blue-50" },
                    { title: "Custo Operacional", value: "R$ 125.000,00", icon: TrendingDown, color: "text-red-600 bg-red-50" },
                    { title: "LTV Geral", value: "R$ 4.200,00", icon: Activity, color: "text-indigo-600 bg-indigo-50" },
                ].map((stat, i) => (
                    <Card key={i} className="border-none shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500">{stat.title}</CardTitle>
                            <div className={`p-2 rounded-lg ${stat.color}`}>
                                <stat.icon className="w-4 h-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Histórico de Assinaturas (SaaS)</CardTitle>
                </CardHeader>
                <CardContent className="h-64 flex items-center justify-center text-slate-400">
                    Gráfico de Receita vs Tempo (Em Breve)
                </CardContent>
            </Card>
        </div>
    );
}
