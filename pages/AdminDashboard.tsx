import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Activity,
    Users,
    ShoppingCart,
    Eye,
    TrendingUp,
    TrendingDown,
    DollarSign,
    MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAdminTheme } from "./admin/AdminLayout";

export default function AdminDashboard() {
    const { isDark } = useAdminTheme();

    // Stats Configuration (Zeroed out for fresh start)
    const stats = [
        {
            title: "Receita Total",
            value: "R$ 0,00",
            trend: "0%",
            trendUp: true,
            icon: DollarSign,
            color: "text-emerald-500",
            bgColor: "bg-emerald-500/10",
            barColor: "bg-emerald-500",
            progress: 0
        },
        {
            title: "Usuários Ativos",
            value: "1", // Just the admin for now
            trend: "+1",
            trendUp: true,
            icon: Users,
            color: "text-blue-500",
            bgColor: "bg-blue-500/10",
            barColor: "bg-blue-500",
            progress: 100
        },
        {
            title: "Total de Vendas",
            value: "0",
            trend: "0%",
            trendUp: true,
            icon: ShoppingCart,
            color: "text-purple-500",
            bgColor: "bg-purple-500/10",
            barColor: "bg-purple-500",
            progress: 0
        },
        {
            title: "Visualizações",
            value: "12", // Simulation
            trend: "+12%",
            trendUp: true,
            icon: Eye,
            color: "text-orange-500",
            bgColor: "bg-orange-500/10",
            barColor: "bg-orange-500",
            progress: 10
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header / Welcome */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                    <p className={isDark ? "text-slate-400" : "text-slate-500"}>
                        Bem-vindo de volta, Rafa! Aqui está o resumo de hoje.
                    </p>
                </div>
            </div>

            {/* Top Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <Card
                        key={i}
                        className={cn(
                            "border-none shadow-lg relative overflow-hidden transition-all duration-300",
                            isDark ? "bg-[#1C2333]" : "bg-white"
                        )}
                    >
                        <CardContent className="p-6 relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <div className="space-y-1">
                                    <p className={cn("text-xs font-medium uppercase tracking-wider", isDark ? "text-slate-400" : "text-slate-500")}>
                                        {stat.title}
                                    </p>
                                    <h3 className={cn("text-3xl font-bold", isDark ? "text-white" : "text-slate-900")}>
                                        {stat.value}
                                    </h3>
                                </div>
                                <div className={cn("p-2 rounded-lg", stat.bgColor)}>
                                    <stat.icon className={cn("w-5 h-5", stat.color)} />
                                </div>
                            </div>

                            <div className="flex items-center justify-between mt-4">
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    <span className={stat.trendUp ? "text-emerald-500" : "text-red-500"}>
                                        {stat.trend}
                                    </span>
                                    <span className={isDark ? "text-slate-500" : "text-slate-400"}>vs mês anterior</span>
                                </div>
                            </div>

                            {/* Progress Bar visual at bottom */}
                            <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-800/50">
                                <div
                                    className={cn("h-full transition-all duration-1000 ease-out", stat.barColor)}
                                    style={{ width: `${stat.progress}%` }}
                                ></div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Charts Section Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Overview (Bar Chart Simulation) */}
                <Card className={cn("lg:col-span-2 border-none shadow-lg", isDark ? "bg-[#1C2333]" : "bg-white")}>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className={cn("text-lg font-semibold", isDark ? "text-white" : "text-slate-900")}>
                                Visão Geral de Receita
                            </CardTitle>
                            <p className="text-sm text-slate-500">Receitas e despesas mensais</p>
                        </div>
                        <div className="flex gap-4 text-xs font-medium">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                                <span className={isDark ? "text-slate-300" : "text-slate-600"}>Receita</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-slate-600"></span>
                                <span className={isDark ? "text-slate-300" : "text-slate-600"}>Despesas</span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full flex items-end justify-between gap-2 pt-8 px-2">
                            {[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0].map((h, i) => (
                                <div key={i} className="flex-1 flex gap-1 h-full items-end group">
                                    <div
                                        className="flex-1 bg-indigo-500 rounded-t-sm hover:bg-indigo-400 transition-all cursor-pointer relative"
                                        style={{ height: `5%` }} // Minimum height for visual
                                    >
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                            ${h}k
                                        </div>
                                    </div>
                                    <div
                                        className="flex-1 bg-slate-700/50 rounded-t-sm hover:bg-slate-600 transition-all cursor-pointer"
                                        style={{ height: `5%` }} // Minimum height for visual
                                    ></div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between mt-4 text-xs text-slate-500 px-2 uppercase font-medium">
                            {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].map(m => (
                                <span key={m}>{m}</span>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Categories (Donut Chart Simulation) */}
                <Card className={cn("lg:col-span-1 border-none shadow-lg", isDark ? "bg-[#1C2333]" : "bg-white")}>
                    <CardHeader>
                        <CardTitle className={cn("text-lg font-semibold", isDark ? "text-white" : "text-slate-900")}>
                            Vendas por Categoria
                        </CardTitle>
                        <p className="text-sm text-slate-500">Distribuição de produtos</p>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center pt-8">
                        <div className="relative w-48 h-48 rounded-full border-[1.5rem] border-transparent"
                            style={{
                                backgroundImage: `conic-gradient(#6366f1 0deg 0deg, #334155 0deg 360deg)`
                            }}
                        >
                            <div className={cn("absolute inset-0 m-auto w-32 h-32 rounded-full", isDark ? "bg-[#1C2333]" : "bg-white")}></div>
                        </div>

                        <div className="w-full mt-8 space-y-4">
                            <p className="text-center text-sm text-slate-500">Sem dados suficientes</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
