import React from "react";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { DollarSign } from "lucide-react";

export default function RevenueByProfessionalChart({ appointments, professionals, timeRange }: any) {
    const revenueByProfessional: any = {};

    appointments.forEach((apt: any) => {
        if (apt.value && apt.professional_id) {
            if (!revenueByProfessional[apt.professional_id]) {
                revenueByProfessional[apt.professional_id] = {
                    name: apt.professional_name || "Desconhecido",
                    total: 0
                };
            }
            revenueByProfessional[apt.professional_id].total += apt.value;
        }
    });

    const data = Object.values(revenueByProfessional)
        .sort((a: any, b: any) => b.total - a.total);

    const formatCurrency = (value) => {
        return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    };

    return (
        <Card className="p-6 bg-white border-0 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                    <h3 className="font-semibold text-slate-800">Faturamento por Profissional</h3>
                    <p className="text-sm text-slate-500">Receita gerada por cada profissional</p>
                </div>
            </div>

            {data.length === 0 ? (
                <div className="flex items-center justify-center h-[300px] text-slate-400">
                    Nenhum faturamento registrado
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis
                            dataKey="name"
                            stroke="#94a3b8"
                            style={{ fontSize: '12px' }}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                        />
                        <YAxis
                            stroke="#94a3b8"
                            style={{ fontSize: '12px' }}
                            tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'white',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px'
                            }}
                            formatter={(value) => [formatCurrency(value), "Faturamento"]}
                        />
                        <Bar
                            dataKey="total"
                            fill="#10b981"
                            radius={[8, 8, 0, 0]}
                            name="Faturamento"
                        />
                    </BarChart>
                </ResponsiveContainer>
            )}
        </Card>
    );
}
