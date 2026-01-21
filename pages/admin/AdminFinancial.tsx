import React from "react";
import { useAdminTheme } from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminFinancial() {
    const { isDark } = useAdminTheme();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Financeiro Global</h1>
                <p className={isDark ? "text-slate-400" : "text-slate-500"}>
                    Visão geral do faturamento de todas as organizações.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { title: "Receita Total (Mês)", value: "R$ 0,00", icon: DollarSign, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                    { title: "Ticket Médio", value: "R$ 0,00", icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-500/10" },
                    { title: "Custo Operacional", value: "R$ 0,00", icon: TrendingDown, color: "text-red-500", bg: "bg-red-500/10" },
                    { title: "LTV Geral", value: "R$ 0,00", icon: Activity, color: "text-indigo-500", bg: "bg-indigo-500/10" },
                ].map((stat, i) => (
                    <Card key={i} className={cn("border-none shadow-lg transition-all", isDark ? "bg-[#1C2333]" : "bg-white")}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className={cn("text-sm font-medium", isDark ? "text-slate-400" : "text-slate-500")}>
                                {stat.title}
                            </CardTitle>
                            <div className={cn("p-2 rounded-lg", stat.bg)}>
                                <stat.icon className={cn("w-4 h-4", stat.color)} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className={cn("text-2xl font-bold", isDark ? "text-white" : "text-slate-900")}>
                                {stat.value}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className={cn("border-none shadow-lg", isDark ? "bg-[#1C2333]" : "bg-white")}>
                <CardHeader>
                    <CardTitle className={cn(isDark ? "text-white" : "text-slate-900")}>Histórico de Assinaturas (SaaS)</CardTitle>
                </CardHeader>
                <CardContent className="h-64 flex flex-col items-center justify-center text-slate-500 gap-2">
                    <Activity className="w-8 h-8 opacity-50" />
                    <p>Nenhuma transação registrada ainda.</p>
                </CardContent>
            </Card>
        </div>
    );
}
