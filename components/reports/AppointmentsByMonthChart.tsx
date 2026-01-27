import React from "react";
import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, subMonths, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "lucide-react";

export default function AppointmentsByMonthChart({ appointments, timeRange }) {
    const getMonthsBack = () => {
        if (timeRange === "1month") return 1;
        if (timeRange === "3months") return 3;
        if (timeRange === "6months") return 6;
        if (timeRange === "12months") return 12;
        return 12;
    };

    const monthsBack = getMonthsBack();
    const months = [];

    for (let i = monthsBack - 1; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        months.push({
            date: startOfMonth(date),
            label: format(date, "MMM/yy", { locale: ptBR })
        });
    }

    const data = months.map(month => {
        const monthStr = format(month.date, "yyyy-MM");
        const monthAppointments = appointments.filter(apt => apt.date?.startsWith(monthStr));

        return {
            name: month.label,
            total: monthAppointments.length,
            confirmados: monthAppointments.filter(a => a.status === "confirmado" || a.status === "finalizado").length,
            cancelados: monthAppointments.filter(a => a.status === "cancelado" || a.status === "faltou").length
        };
    });

    return (
        <Card className="p-6 bg-white border-0 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                    <h3 className="font-semibold text-slate-800">Agendamentos por Mês</h3>
                    <p className="text-sm text-slate-500">Evolução mensal dos agendamentos</p>
                </div>
            </div>

            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                        dataKey="name"
                        stroke="#94a3b8"
                        style={{ fontSize: '12px' }}
                    />
                    <YAxis
                        stroke="#94a3b8"
                        style={{ fontSize: '12px' }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                    />
                    <Legend />
                    <Line
                        type="monotone"
                        dataKey="total"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        name="Total"
                        dot={{ fill: '#3b82f6', r: 4 }}
                    />
                    <Line
                        type="monotone"
                        dataKey="confirmados"
                        stroke="#10b981"
                        strokeWidth={2}
                        name="Confirmados"
                        dot={{ fill: '#10b981', r: 4 }}
                    />
                    <Line
                        type="monotone"
                        dataKey="cancelados"
                        stroke="#ef4444"
                        strokeWidth={2}
                        name="Cancelados"
                        dot={{ fill: '#ef4444', r: 4 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </Card>
    );
}
