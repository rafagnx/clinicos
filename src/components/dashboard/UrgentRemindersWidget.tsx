import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Calendar, Users, Tag } from "lucide-react";
import { format, addDays, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function UrgentRemindersWidget({ appointments, patients, promotions }) {
    const today = format(new Date(), "yyyy-MM-dd");
    const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");

    const reminders = [];

    // Consultas não confirmadas para amanhã
    const tomorrowUnconfirmed = appointments.filter(apt =>
        apt.date === tomorrow && apt.status === "agendado"
    );
    if (tomorrowUnconfirmed.length > 0) {
        reminders.push({
            icon: Calendar,
            color: "text-amber-600",
            bgColor: "bg-amber-50",
            title: `${tomorrowUnconfirmed.length} consultas não confirmadas para amanhã`,
            action: "Enviar confirmações"
        });
    }

    // Pacientes que faltaram hoje
    const todayNoShows = appointments.filter(apt =>
        apt.date === today && apt.status === "faltou"
    );
    if (todayNoShows.length > 0) {
        reminders.push({
            icon: Users,
            color: "text-rose-600",
            bgColor: "bg-rose-50",
            title: `${todayNoShows.length} pacientes faltaram hoje`,
            action: "Entrar em contato"
        });
    }

    // Promoções expirando em breve
    const expiringPromos = promotions.filter(promo => {
        if (promo.status !== "ativa" || !promo.end_date) return false;
        const daysUntilEnd = differenceInDays(new Date(promo.end_date), new Date());
        return daysUntilEnd >= 0 && daysUntilEnd <= 7;
    });
    if (expiringPromos.length > 0) {
        reminders.push({
            icon: Tag,
            color: "text-purple-600",
            bgColor: "bg-purple-50",
            title: `${expiringPromos.length} promoções expirando em 7 dias`,
            action: "Revisar promoções"
        });
    }

    // Consultas de hoje aguardando
    const todayWaiting = appointments.filter(apt =>
        apt.date === today && apt.status === "aguardando"
    );
    if (todayWaiting.length > 0) {
        reminders.push({
            icon: AlertCircle,
            color: "text-blue-600",
            bgColor: "bg-blue-50",
            title: `${todayWaiting.length} pacientes aguardando atendimento`,
            action: "Verificar agenda"
        });
    }

    return (
        <Card className="p-5 bg-white/90 backdrop-blur-sm border-0 shadow-lg h-full">
            <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-rose-600" />
                <h3 className="font-semibold text-slate-800">Lembretes Urgentes</h3>
            </div>

            {reminders.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-sm text-slate-400 mb-2">Nenhum lembrete urgente</p>
                    <p className="text-xs text-slate-300">Tudo está em dia! 🎉</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {reminders.map((reminder, idx) => (
                        <div key={idx} className={`p-4 rounded-xl ${reminder.bgColor} border border-current/10`}>
                            <div className="flex items-start gap-3">
                                <reminder.icon className={`w-5 h-5 shrink-0 ${reminder.color}`} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-800 mb-1">{reminder.title}</p>
                                    <Badge variant="outline" className="text-xs">
                                        {reminder.action}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
}
