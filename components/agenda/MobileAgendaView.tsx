import React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    Calendar, Clock, MapPin, MoreVertical,
    ChevronLeft, ChevronRight, Plus, Ban
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface MobileAgendaViewProps {
    date: Date;
    onDateChange: (days: number) => void;
    onToday: () => void;
    appointments: any[];
    isDark: boolean;
    onSelectAppointment: (apt: any) => void;
    onNewAppointment: () => void;
}

const statusConfig = {
    agendado: { label: "Agendado", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
    confirmado: { label: "Confirmado", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
    aguardando: { label: "Aguardando", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
    em_atendimento: { label: "Em Atend.", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
    finalizado: { label: "Finalizado", color: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300" },
    faltou: { label: "Faltou", color: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300" },
    cancelado: { label: "Cancelado", color: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400" },
};

export default function MobileAgendaView({
    date,
    onDateChange,
    onToday,
    appointments,
    isDark,
    onSelectAppointment,
    onNewAppointment
}: MobileAgendaViewProps) {

    // Group appointments by hour for better visualization
    const sortedAppointments = [...appointments].sort((a, b) => {
        return (a.start_time || "").localeCompare(b.start_time || "");
    });

    return (
        <div className={cn("min-h-full flex flex-col", isDark ? "bg-[#151A25]" : "bg-white")}>

            {/* Header: Date Navigation */}
            <div className={cn(
                "sticky top-0 z-20 flex items-center justify-between p-4 border-b shadow-sm",
                isDark ? "bg-[#0B0E14] border-slate-800" : "bg-white border-slate-100"
            )}>
                <Button variant="ghost" size="icon" onClick={() => onDateChange(-1)}>
                    <ChevronLeft className={cn("w-6 h-6", isDark ? "text-slate-400" : "text-slate-600")} />
                </Button>

                <div className="flex flex-col items-center" onClick={onToday}>
                    <h2 className={cn("text-lg font-bold capitalize", isDark ? "text-white" : "text-slate-900")}>
                        {format(date, "EEEE", { locale: ptBR })}
                    </h2>
                    <span className={cn("text-xs font-medium uppercase tracking-wider", isDark ? "text-slate-500" : "text-slate-500")}>
                        {format(date, "d 'de' MMMM", { locale: ptBR })}
                    </span>
                </div>

                <Button variant="ghost" size="icon" onClick={() => onDateChange(1)}>
                    <ChevronRight className={cn("w-6 h-6", isDark ? "text-slate-400" : "text-slate-600")} />
                </Button>
            </div>

            {/* List Content */}
            <div className="flex-1 p-4 space-y-4 overflow-y-auto pb-24">
                {sortedAppointments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
                        <div className={cn("w-16 h-16 rounded-full flex items-center justify-center mb-4", isDark ? "bg-slate-800" : "bg-slate-100")}>
                            <Calendar className={cn("w-8 h-8", isDark ? "text-slate-500" : "text-slate-400")} />
                        </div>
                        <p className={cn("font-medium", isDark ? "text-slate-400" : "text-slate-600")}>
                            Sem agendamentos
                        </p>
                        <Button
                            variant="link"
                            className="text-indigo-500 mt-2"
                            onClick={onNewAppointment}
                        >
                            Agendar agora
                        </Button>
                    </div>
                ) : (
                    sortedAppointments.map((apt) => {
                        const status = statusConfig[apt.status] || statusConfig.agendado;
                        const time = apt.start_time?.substring(0, 5) || "--:--";

                        return (
                            <Card
                                key={apt.id}
                                onClick={() => onSelectAppointment(apt)}
                                className={cn(
                                    "flex items-stretch overflow-hidden border-l-4 shadow-sm active:scale-[0.98] transition-all",
                                    isDark ? "bg-[#1C2333] border-slate-800 border-l-indigo-500" : "bg-white border-slate-100 border-l-indigo-500"
                                )}
                            >
                                {/* Time Column */}
                                <div className={cn(
                                    "w-16 flex flex-col items-center justify-center border-r px-2 py-3",
                                    isDark ? "border-slate-800 bg-slate-900/30" : "border-slate-50 bg-slate-50"
                                )}>
                                    <span className={cn("text-sm font-bold", isDark ? "text-white" : "text-slate-900")}>{time}</span>
                                    <Clock className={cn("w-3 h-3 mt-1", isDark ? "text-slate-600" : "text-slate-400")} />
                                </div>

                                {/* Content */}
                                <div className="flex-1 p-3 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className={cn("font-bold truncate text-sm", isDark ? "text-slate-100" : "text-slate-800")}>
                                            {apt.patient?.full_name || "Paciente sem nome"}
                                        </h3>
                                    </div>

                                    {/* Patient Tags Row */}
                                    <div className="flex flex-wrap gap-1.5 mb-2">
                                        {apt.patient?.funnel_status && (
                                            <Badge className={cn(
                                                "h-5 text-[10px] px-1.5 border-0 font-bold uppercase",
                                                apt.patient.funnel_status === "hot" ? "bg-rose-500 hover:bg-rose-600 text-white" :
                                                    apt.patient.funnel_status === "warm" ? "bg-orange-500 hover:bg-orange-600 text-white" :
                                                        "bg-blue-500 hover:bg-blue-600 text-white"
                                            )}>
                                                {apt.patient.funnel_status === "hot" ? "🔥 Quente" :
                                                    apt.patient.funnel_status === "warm" ? "⚡ Morno" : "❄️ Frio"}
                                            </Badge>
                                        )}
                                        {apt.patient?.personality && (
                                            <Badge variant="secondary" className="h-5 text-[10px] px-1.5 border-0 font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                                                🧠 {apt.patient.personality}
                                            </Badge>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-1 mb-2 text-xs">
                                        <span className={cn("font-medium", isDark ? "text-slate-300" : "text-slate-600")}>
                                            {apt.professional?.full_name || "Profissional"}
                                        </span>
                                        <span className={cn("mx-1", isDark ? "text-slate-600" : "text-slate-300")}>•</span>
                                        <span className={cn("truncate", isDark ? "text-slate-400" : "text-slate-500")}>
                                            {apt.procedure_name || "Consulta"}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className={cn("text-[10px] h-5 border-0 font-bold uppercase px-2", status.color)}>
                                            {status.label}
                                        </Badge>
                                    </div>
                                </div>

                            </Card>
                        );
                    })
                )}
            </div>

            {/* Floating Action Button */}
            <div className="fixed bottom-6 right-6 z-30">
                <Button
                    size="icon"
                    className="w-14 h-14 rounded-full shadow-xl bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={onNewAppointment}
                >
                    <Plus className="w-6 h-6" />
                </Button>
            </div>
        </div>
    );
}
