import React from "react";
import { useAdminTheme } from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, Activity, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminFinancial() {
    const { isDark } = useAdminTheme();

    return (
        <div className="space-y-8 p-6 lg:p-10 max-w-[1600px] mx-auto min-h-screen">
            {/* Header Liquid */}
            <div className="flex flex-col gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 w-fit">
                    <Wallet className="w-3 h-3" />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                        ADMINISTRAÇÃO
                    </span>
                </div>
                <div>
                    <h1 className={cn("text-4xl font-black tracking-tighter", isDark ? "text-white" : "text-slate-900")}>
                        FINANCEIRO <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">GLOBAL</span>
                    </h1>
                    <p className={cn("text-sm font-medium mt-2 max-w-2xl", isDark ? "text-slate-400" : "text-slate-500")}>
                        Visão consolidada do faturamento SaaS e métricas de desempenho de todas as organizações.
                    </p>
                </div>
            </div>

            {/* KPI Cards Liquid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { title: "Receita Total (Mês)", value: "R$ 0,00", icon: DollarSign, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
                    { title: "Ticket Médio", value: "R$ 0,00", icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
                    { title: "Custo Operacional", value: "R$ 0,00", icon: TrendingDown, color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20" },
                    { title: "LTV Geral", value: "R$ 0,00", icon: Activity, color: "text-indigo-500", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
                ].map((stat, i) => (
                    <Card key={i} className={cn(
                        "border shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl group relative overflow-hidden backdrop-blur-xl",
                        isDark ? "bg-slate-900/60 border-white/5" : "bg-white/60 border-white/50"
                    )}>
                        <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-white/5 to-transparent pointer-events-none")} />

                        <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                            <CardTitle className={cn("text-[10px] font-black uppercase tracking-[0.2em]", isDark ? "text-slate-500" : "text-slate-400")}>
                                {stat.title}
                            </CardTitle>
                            <div className={cn("p-2.5 rounded-xl border transition-colors group-hover:bg-white/10", stat.bg, stat.border)}>
                                <stat.icon className={cn("w-4 h-4", stat.color)} />
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className={cn("text-3xl font-black tracking-tighter", isDark ? "text-white" : "text-slate-900")}>
                                {stat.value}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Empty State / Charts Placeholder */}
            <Card className={cn(
                "border shadow-xl backdrop-blur-xl transition-all",
                isDark ? "bg-slate-900/40 border-white/5" : "bg-white/60 border-white/50"
            )}>
                <CardHeader>
                    <CardTitle className={cn("text-lg font-black tracking-tight", isDark ? "text-white" : "text-slate-900")}>
                        Histórico de Assinaturas (SaaS)
                    </CardTitle>
                </CardHeader>
                <CardContent className="h-80 flex flex-col items-center justify-center gap-4 relative overflow-hidden">
                    <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />

                    <div className={cn(
                        "p-6 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center animate-pulse",
                        isDark ? "border-slate-800 bg-slate-900/50" : "border-slate-200 bg-white/50"
                    )}>
                        <Activity className={cn("w-10 h-10 mb-2 opacity-50", isDark ? "text-slate-600" : "text-slate-400")} />
                        <p className={cn("text-xs font-bold uppercase tracking-widest opacity-50", isDark ? "text-slate-500" : "text-slate-400")}>
                            Sem dados suficientes
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
