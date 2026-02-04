import React from "react";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Activity } from "lucide-react";

export default function ProceduresChart({ appointments, timeRange }: any) {
    const procedureCounts: any = {};

    appointments.forEach((apt: any) => {
        if (apt.procedure_name) {
            procedureCounts[apt.procedure_name] = (procedureCounts[apt.procedure_name] || 0) + 1;
        }
    });

    const data = Object.entries(procedureCounts)
        .map(([name, count]) => ({
            name,
            total: count
        }))
        .sort((a: any, b: any) => b.total - a.total)
        .slice(0, 10);

    return (
        <Card className="p-6 bg-white border border-slate-100 shadow-sm dark:bg-[#151A25] dark:border-slate-800">
            <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center dark:bg-orange-900/20">
                    <Activity className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                    <h3 className="font-semibold text-slate-800 dark:text-white">Procedimentos Mais Realizados</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Top 10 procedimentos</p>
                </div>
            </div>

            {data.length === 0 ? (
                <div className="flex items-center justify-center h-[300px] text-slate-400">
                    Nenhum procedimento registrado
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="opacity-10" />
                        <XAxis type="number" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                        <YAxis
                            dataKey="name"
                            type="category"
                            stroke="#94a3b8"
                            style={{ fontSize: '11px' }}
                            width={150}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgb(21 26 37 / 0.9)',
                                border: '1px solid #1e293b',
                                borderRadius: '8px',
                                color: '#f8fafc'
                            }}
                            itemStyle={{ color: '#f8fafc' }}
                        />
                        <Bar
                            dataKey="total"
                            fill="#f59e0b"
                            radius={[0, 8, 8, 0]}
                            name="Quantidade"
                        />
                    </BarChart>
                </ResponsiveContainer>
            )}
        </Card>
    );
}
