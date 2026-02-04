import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const statusConfig = {
    agendado: { label: "Agendado", class: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
    confirmado: { label: "Confirmado", class: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
    aguardando: { label: "Aguardando", class: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
    em_atendimento: { label: "Em atendimento", class: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300" },
    finalizado: { label: "Finalizado", class: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
    faltou: { label: "Faltou", class: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300" },
    cancelado: { label: "Cancelado", class: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400" }
};

export default function TodayAppointments({ isDark, appointments, patients, professionals, onStatusChange }) {

    const header = (
        <div className={cn(
            "p-5 border-b",
            isDark ? "bg-gradient-to-r from-blue-900/10 to-indigo-900/10 border-slate-800" : "bg-gradient-to-r from-blue-50 to-indigo-50 border-slate-100"
        )}>
            <h3 className={cn("font-bold", isDark ? "text-white" : "text-slate-800")}>📅 Agenda do Dia</h3>
            <p className={cn("text-sm mt-1", isDark ? "text-slate-400" : "text-slate-600")}>
                {appointments?.length || 0} consultas agendadas
            </p>
        </div>
    );

    if (!appointments || appointments.length === 0) {
        return (
            <Card className={cn(
                "backdrop-blur-sm border-0 shadow-lg overflow-hidden transition-all duration-300",
                isDark ? "bg-slate-900/50 border-slate-800" : "bg-white/80"
            )}>
                {header}
                <div className={cn("p-12 text-center", isDark ? "text-slate-500" : "text-slate-400")}>
                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhuma consulta para hoje</p>
                </div>
            </Card>
        );
    }

    return (
        <Card className={cn(
            "backdrop-blur-sm border-0 shadow-lg overflow-hidden transition-all duration-300",
            isDark ? "bg-slate-900/50 border-slate-800" : "bg-white/80"
        )}>
            {header}
            <div className={cn("divide-y", isDark ? "divide-slate-800" : "divide-slate-50")}>
                {appointments.map((apt) => {
                    const status = statusConfig[apt.status] || statusConfig.agendado;

                    // Resolve patient and professional names
                    const patientName = apt.patient?.full_name ||
                        patients?.find(p => p.id === apt.patient_id)?.full_name ||
                        apt.patient_name ||
                        "Paciente sem nome";

                    const professionalName = apt.professional?.full_name ||
                        professionals?.find(p => p.id === apt.professional_id)?.full_name ||
                        apt.professional_name ||
                        "Profissional";

                    return (
                        <div key={apt.id} className={cn(
                            "p-4 transition-all border-l-4 border-transparent",
                            isDark
                                ? "hover:bg-slate-800/50 hover:border-blue-500"
                                : "hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/30 hover:border-blue-500"
                        )}>
                            <div className="flex items-center gap-4">
                                <div className={cn("text-center min-w-[70px] rounded-xl p-2", isDark ? "bg-slate-950" : "bg-slate-50")}>
                                    <p className={cn("text-lg font-bold", isDark ? "text-slate-200" : "text-slate-800")}>
                                        {apt.start_time?.includes('T') ? new Date(apt.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : (apt.start_time || "--:--").substring(0, 5)}
                                    </p>
                                    <p className={cn("text-xs font-medium", isDark ? "text-slate-500" : "text-slate-500")}>
                                        {apt.end_time?.includes('T') ? new Date(apt.end_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : (apt.end_time || "--:--").substring(0, 5)}
                                    </p>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={cn("font-semibold truncate", isDark ? "text-slate-200" : "text-slate-800")}>{patientName}</p>
                                    <p className={cn("text-sm truncate flex items-center gap-1", isDark ? "text-slate-400" : "text-slate-600")}>
                                        <User className="w-3 h-3" />
                                        {professionalName}
                                    </p>
                                </div>
                                <Badge variant="outline" className={`${status.class} border-0 font-semibold shadow-sm`}>
                                    {status.label}
                                </Badge>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className={cn("h-8 w-8", isDark ? "text-slate-400 hover:text-white hover:bg-slate-800" : "")}>
                                            <MoreVertical className="w-4 h-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className={cn(isDark ? "bg-slate-900 border-slate-800 text-slate-200" : "")}>
                                        <DropdownMenuItem onClick={() => onStatusChange(apt.id, "confirmado")}>
                                            Confirmar
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onStatusChange(apt.id, "aguardando")}>
                                            Paciente chegou
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onStatusChange(apt.id, "em_atendimento")}>
                                            Iniciar atendimento
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onStatusChange(apt.id, "finalizado")}>
                                            Finalizar
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onStatusChange(apt.id, "faltou")} className="text-rose-600">
                                            Marcar falta
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onStatusChange(apt.id, "cancelado")} className="text-slate-500">
                                            Cancelar
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
}
