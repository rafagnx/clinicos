import React from "react";
import { Card } from "@/components/ui/card";
import { DollarSign, TrendingUp, Calendar } from "lucide-react";
import { format } from "date-fns";

export default function FinancialSummaryWidget({ appointments }) {
    const today = format(new Date(), "yyyy-MM-dd");

    const todayAppointments = appointments.filter(apt =>
        apt.date === today && apt.status === "finalizado"
    );

    const todayRevenue = todayAppointments.reduce((sum, apt) => sum + (apt.value || 0), 0);
    const todayCount = todayAppointments.length;

    const thisMonth = format(new Date(), "yyyy-MM");
    const monthAppointments = appointments.filter(apt =>
        apt.date?.startsWith(thisMonth) && apt.status === "finalizado"
    );
    const monthRevenue = monthAppointments.reduce((sum, apt) => sum + (apt.value || 0), 0);

    return (
        <Card className="p-5 bg-gradient-to-br from-emerald-500 to-teal-600 border-0 shadow-lg h-full text-white">
            <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-5 h-5" />
                <h3 className="font-semibold">Resumo Financeiro</h3>
            </div>

            <div className="space-y-4">
                <div>
                    <p className="text-emerald-100 text-sm mb-1">Hoje</p>
                    <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-bold">R$ {todayRevenue.toFixed(2)}</p>
                        <span className="text-emerald-100 text-sm">({todayCount} consultas)</span>
                    </div>
                </div>

                <div className="border-t border-emerald-400/30 pt-4">
                    <p className="text-emerald-100 text-sm mb-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Este mês
                    </p>
                    <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold">R$ {monthRevenue.toFixed(2)}</p>
                        <span className="text-emerald-100 text-sm">({monthAppointments.length})</span>
                    </div>
                </div>
            </div>
        </Card>
    );
}
