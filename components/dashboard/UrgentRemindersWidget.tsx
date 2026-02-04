import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, Calendar, Users, Tag, Cake, Clock, UserX, Phone } from "lucide-react";
import { format, addDays, differenceInDays, differenceInMonths, isToday, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/lib/utils";

export default function UrgentRemindersWidget({ appointments, patients, promotions }) {
    const today = format(new Date(), "yyyy-MM-dd");
    const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");
    const now = new Date();

    const reminders = [];

    // 1. Consultas não confirmadas para amanhã
    const tomorrowUnconfirmed = appointments.filter(apt =>
        apt.date === tomorrow && apt.status === "agendado"
    );
    if (tomorrowUnconfirmed.length > 0) {
        reminders.push({
            icon: Calendar,
            color: "text-amber-600 dark:text-amber-400",
            bgColor: "bg-amber-50 dark:bg-amber-900/10",
            title: `${tomorrowUnconfirmed.length} consulta${tomorrowUnconfirmed.length > 1 ? 's' : ''} não confirmada${tomorrowUnconfirmed.length > 1 ? 's' : ''} para amanhã`,
            action: "Enviar confirmações",
            link: "/Agenda",
            priority: 1
        });
    }

    // 2. Pacientes que faltaram hoje
    const todayNoShows = appointments.filter(apt =>
        apt.date === today && apt.status === "faltou"
    );
    if (todayNoShows.length > 0) {
        reminders.push({
            icon: UserX,
            color: "text-rose-600 dark:text-rose-400",
            bgColor: "bg-rose-50 dark:bg-rose-900/10",
            title: `${todayNoShows.length} paciente${todayNoShows.length > 1 ? 's' : ''} faltou hoje`,
            action: "Entrar em contato",
            link: "/Patients",
            priority: 2
        });
    }

    // 3. Pacientes aguardando atendimento
    const todayWaiting = appointments.filter(apt =>
        apt.date === today && apt.status === "aguardando"
    );
    if (todayWaiting.length > 0) {
        reminders.push({
            icon: Clock,
            color: "text-blue-600 dark:text-blue-400",
            bgColor: "bg-blue-50 dark:bg-blue-900/10",
            title: `${todayWaiting.length} paciente${todayWaiting.length > 1 ? 's' : ''} aguardando atendimento`,
            action: "Verificar agenda",
            link: "/Agenda",
            priority: 1
        });
    }



    // 5. 📞 Pacientes sem retorno há mais de 3 meses
    const patientLastVisit = {};
    appointments.forEach(apt => {
        if (apt.patient_id && apt.status === "concluido") {
            const aptDate = new Date(apt.date);
            if (!patientLastVisit[apt.patient_id] || aptDate > patientLastVisit[apt.patient_id]) {
                patientLastVisit[apt.patient_id] = aptDate;
            }
        }
    });

    const patientsWithoutReturn = patients.filter(patient => {
        const lastVisit = patientLastVisit[patient.id];
        if (!lastVisit) return false; // Never had a completed appointment
        const monthsAgo = differenceInMonths(now, lastVisit);
        return monthsAgo >= 3;
    });

    if (patientsWithoutReturn.length > 0) {
        reminders.push({
            icon: Phone,
            color: "text-orange-600 dark:text-orange-400",
            bgColor: "bg-orange-50 dark:bg-orange-900/10",
            title: `${patientsWithoutReturn.length} paciente${patientsWithoutReturn.length > 1 ? 's' : ''} sem retorno há +3 meses`,
            action: "Agendar retorno",
            link: "/Patients",
            priority: 4
        });
    }

    // 6. Promoções expirando em breve
    const expiringPromos = (promotions || []).filter(promo => {
        if (promo.status !== "ativa" || !promo.end_date) return false;
        const daysUntilEnd = differenceInDays(new Date(promo.end_date), now);
        return daysUntilEnd >= 0 && daysUntilEnd <= 7;
    });
    if (expiringPromos.length > 0) {
        reminders.push({
            icon: Tag,
            color: "text-purple-600 dark:text-purple-400",
            bgColor: "bg-purple-50 dark:bg-purple-900/10",
            title: `${expiringPromos.length} promoção${expiringPromos.length > 1 ? 'ões' : ''} expirando em 7 dias`,
            action: "Revisar promoções",
            link: "/Promotions",
            priority: 5
        });
    }

    // 7. Pacientes sem telefone cadastrado
    const patientsNoPhone = patients.filter(p => !p.phone && !p.whatsapp);
    if (patientsNoPhone.length > 0 && patientsNoPhone.length <= 10) {
        reminders.push({
            icon: Users,
            color: "text-slate-600 dark:text-slate-400",
            bgColor: "bg-slate-50 dark:bg-slate-800/30",
            title: `${patientsNoPhone.length} paciente${patientsNoPhone.length > 1 ? 's' : ''} sem telefone cadastrado`,
            action: "Atualizar cadastro",
            link: "/Patients",
            priority: 6
        });
    }

    // Sort by priority
    reminders.sort((a, b) => a.priority - b.priority);

    return (
        <Card className="p-5 bg-white/90 backdrop-blur-sm border-0 shadow-lg h-full dark:bg-[#151A25] dark:border dark:border-slate-800">
            <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                <h3 className="font-semibold text-slate-800 dark:text-slate-100">Lembretes Urgentes</h3>
                {reminders.length > 0 && (
                    <Badge className="bg-rose-600 text-white ml-auto">{reminders.length}</Badge>
                )}
            </div>

            {reminders.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-sm text-slate-400 dark:text-slate-500 mb-2">Nenhum lembrete urgente</p>
                    <p className="text-xs text-slate-300 dark:text-slate-600">Tudo está em dia! 🎉</p>
                </div>
            ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {reminders.slice(0, 5).map((reminder, idx) => (
                        <Link
                            key={idx}
                            to={createPageUrl(reminder.link?.replace('/', '') || 'Dashboard')}
                            className="block"
                        >
                            <div className={`p-4 rounded-xl ${reminder.bgColor} border border-current/10 hover:shadow-md transition-all cursor-pointer dark:border-white/5`}>
                                <div className="flex items-start gap-3">
                                    <reminder.icon className={`w-5 h-5 shrink-0 ${reminder.color}`} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-1">{reminder.title}</p>
                                        <Badge variant="outline" className="text-xs dark:border-slate-700 dark:text-slate-300">
                                            {reminder.action}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                    {reminders.length > 5 && (
                        <p className="text-xs text-center text-slate-400">
                            +{reminders.length - 5} lembretes adicionais
                        </p>
                    )}
                </div>
            )}
        </Card>
    );
}
