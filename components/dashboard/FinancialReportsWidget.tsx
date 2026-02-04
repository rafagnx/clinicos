import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, PieChart, BarChart3, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, parseISO, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart as RePieChart, Pie
} from "recharts";

const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'];

export default function FinancialReportsWidget({ isDark, appointments }) {

    const stats = useMemo(() => {
        const now = new Date();
        const thisMonth = format(now, "yyyy-MM");
        const lastMonth = format(subMonths(now, 1), "yyyy-MM");

        // Filter appointments by month
        const thisMonthApts = appointments.filter(apt => {
            const aptDate = apt.date?.includes('T') ? apt.date.split('T')[0] : apt.date;
            return aptDate?.startsWith(thisMonth) && apt.status !== "cancelado";
        });

        const lastMonthApts = appointments.filter(apt => {
            const aptDate = apt.date?.includes('T') ? apt.date.split('T')[0] : apt.date;
            return aptDate?.startsWith(lastMonth) && apt.status !== "cancelado";
        });

        // Revenue calculation
        const thisMonthRevenue = thisMonthApts
            .filter(apt => apt.status === "finalizado" || apt.status === "concluido")
            .reduce((sum, apt) => sum + (parseFloat(apt.value) || 0), 0);

        const lastMonthRevenue = lastMonthApts
            .filter(apt => apt.status === "finalizado" || apt.status === "concluido")
            .reduce((sum, apt) => sum + (parseFloat(apt.value) || 0), 0);

        const revenueChange = lastMonthRevenue > 0
            ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100)
            : 0;

        // No-show rate
        const thisMonthTotal = thisMonthApts.length;
        const thisMonthNoShows = thisMonthApts.filter(apt => apt.status === "faltou").length;
        const noShowRate = thisMonthTotal > 0 ? (thisMonthNoShows / thisMonthTotal * 100) : 0;

        // Procedures ranking
        const procedureCounts = {};
        const procedureRevenue = {};
        thisMonthApts.forEach(apt => {
            const proc = apt.procedure_name || apt.type || "Outros";
            procedureCounts[proc] = (procedureCounts[proc] || 0) + 1;
            if (apt.status === "finalizado" || apt.status === "concluido") {
                procedureRevenue[proc] = (procedureRevenue[proc] || 0) + (parseFloat(apt.value) || 0);
            }
        });

        const topProcedures = Object.entries(procedureRevenue)
            .map(([name, value]) => ({ name, value: value as number, count: procedureCounts[name] || 0 }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        // Daily revenue for chart
        const monthStart = startOfMonth(now);
        const today = now;
        const daysInMonth = eachDayOfInterval({ start: monthStart, end: today });

        const dailyData = daysInMonth.map(day => {
            const dayStr = format(day, "yyyy-MM-dd");
            const dayApts = thisMonthApts.filter(apt => {
                const aptDate = apt.date?.includes('T') ? apt.date.split('T')[0] : apt.date;
                return aptDate === dayStr && (apt.status === "finalizado" || apt.status === "concluido");
            });
            const revenue = dayApts.reduce((sum, apt) => sum + (parseFloat(apt.value) || 0), 0);
            return {
                date: format(day, "dd"),
                value: revenue
            };
        });

        // Comparison data
        const comparisonData = [
            { name: format(subMonths(now, 1), "MMM", { locale: ptBR }), value: lastMonthRevenue },
            { name: format(now, "MMM", { locale: ptBR }), value: thisMonthRevenue }
        ];

        return {
            thisMonthRevenue,
            lastMonthRevenue,
            revenueChange,
            noShowRate,
            thisMonthNoShows,
            thisMonthTotal,
            topProcedures,
            dailyData,
            comparisonData
        };
    }, [appointments]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    return (
        <Card className={cn(
            "p-5 backdrop-blur-sm shadow-lg transition-all duration-300",
            isDark ? "bg-slate-900/50 border-slate-800" : "bg-white/90 border-0"
        )}>
            <div className="flex items-center gap-2 mb-5">
                <BarChart3 className={cn("w-5 h-5", isDark ? "text-emerald-400" : "text-emerald-600")} />
                <h3 className={cn("font-semibold", isDark ? "text-white" : "text-slate-800")}>
                    Relatórios Financeiros
                </h3>
                <Badge variant="outline" className="ml-auto text-xs">
                    {format(new Date(), "MMMM yyyy", { locale: ptBR })}
                </Badge>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-5">
                {/* Revenue Card */}
                <div className={cn(
                    "p-4 rounded-xl",
                    isDark ? "bg-emerald-900/20 border border-emerald-800/50" : "bg-emerald-50"
                )}>
                    <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="w-4 h-4 text-emerald-500" />
                        <span className={cn("text-xs font-medium", isDark ? "text-emerald-400" : "text-emerald-700")}>
                            Faturamento
                        </span>
                    </div>
                    <p className={cn("text-xl font-bold", isDark ? "text-white" : "text-slate-800")}>
                        {formatCurrency(stats.thisMonthRevenue)}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                        {stats.revenueChange >= 0 ? (
                            <TrendingUp className="w-3 h-3 text-emerald-500" />
                        ) : (
                            <TrendingDown className="w-3 h-3 text-rose-500" />
                        )}
                        <span className={cn(
                            "text-xs font-medium",
                            stats.revenueChange >= 0 ? "text-emerald-500" : "text-rose-500"
                        )}>
                            {stats.revenueChange >= 0 ? "+" : ""}{stats.revenueChange.toFixed(1)}% vs mês anterior
                        </span>
                    </div>
                </div>

                {/* No-Show Card */}
                <div className={cn(
                    "p-4 rounded-xl",
                    isDark ? "bg-rose-900/20 border border-rose-800/50" : "bg-rose-50"
                )}>
                    <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="w-4 h-4 text-rose-500" />
                        <span className={cn("text-xs font-medium", isDark ? "text-rose-400" : "text-rose-700")}>
                            Taxa de Faltas
                        </span>
                    </div>
                    <p className={cn("text-xl font-bold", isDark ? "text-white" : "text-slate-800")}>
                        {stats.noShowRate.toFixed(1)}%
                    </p>
                    <p className={cn("text-xs mt-1", isDark ? "text-slate-400" : "text-slate-500")}>
                        {stats.thisMonthNoShows} de {stats.thisMonthTotal} consultas
                    </p>
                </div>
            </div>

            {/* Daily Revenue Chart */}
            <div className="mb-5">
                <p className={cn("text-xs font-medium mb-2", isDark ? "text-slate-400" : "text-slate-600")}>
                    Faturamento Diário
                </p>
                <div className="h-24">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats.dailyData}>
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey="date"
                                tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#64748b' }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip
                                formatter={(value: number) => [formatCurrency(value), "Faturamento"]}
                                contentStyle={{
                                    backgroundColor: isDark ? '#1e293b' : '#fff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke="#6366f1"
                                fillOpacity={1}
                                fill="url(#colorValue)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Month Comparison */}
            <div className="mb-5">
                <p className={cn("text-xs font-medium mb-2", isDark ? "text-slate-400" : "text-slate-600")}>
                    Comparativo Mensal
                </p>
                <div className="h-16">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.comparisonData} layout="vertical">
                            <XAxis type="number" hide />
                            <YAxis
                                type="category"
                                dataKey="name"
                                tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }}
                                axisLine={false}
                                tickLine={false}
                                width={40}
                            />
                            <Tooltip
                                formatter={(value: number) => [formatCurrency(value), "Faturamento"]}
                                contentStyle={{
                                    backgroundColor: isDark ? '#1e293b' : '#fff',
                                    border: 'none',
                                    borderRadius: '8px'
                                }}
                            />
                            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                {stats.comparisonData.map((entry, index) => (
                                    <Cell key={index} fill={index === 1 ? '#6366f1' : '#94a3b8'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Top Procedures */}
            {stats.topProcedures.length > 0 && (
                <div>
                    <p className={cn("text-xs font-medium mb-2", isDark ? "text-slate-400" : "text-slate-600")}>
                        🏆 Top Procedimentos
                    </p>
                    <div className="space-y-2">
                        {stats.topProcedures.slice(0, 3).map((proc, idx) => (
                            <div key={proc.name} className="flex items-center gap-2">
                                <span className={cn(
                                    "w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold",
                                    idx === 0 ? "bg-amber-100 text-amber-700" :
                                        idx === 1 ? "bg-slate-100 text-slate-600" :
                                            "bg-orange-100 text-orange-700"
                                )}>
                                    {idx + 1}
                                </span>
                                <span className={cn(
                                    "flex-1 text-sm truncate",
                                    isDark ? "text-slate-300" : "text-slate-700"
                                )}>
                                    {proc.name}
                                </span>
                                <span className={cn(
                                    "text-sm font-semibold",
                                    isDark ? "text-white" : "text-slate-800"
                                )}>
                                    {formatCurrency(proc.value)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </Card>
    );
}
