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

const statusConfig = {
    agendado: { label: "Agendado", class: "bg-slate-100 text-slate-700" },
    confirmado: { label: "Confirmado", class: "bg-blue-100 text-blue-700" },
    aguardando: { label: "Aguardando", class: "bg-amber-100 text-amber-700" },
    em_atendimento: { label: "Em atendimento", class: "bg-violet-100 text-violet-700" },
    finalizado: { label: "Finalizado", class: "bg-emerald-100 text-emerald-700" },
    faltou: { label: "Faltou", class: "bg-rose-100 text-rose-700" },
    cancelado: { label: "Cancelado", class: "bg-slate-100 text-slate-500" }
};

export default function TodayAppointments({ appointments, patients, professionals, onStatusChange }) {
    if (!appointments || appointments.length === 0) {
        return (
            <Card className="p-8 bg-white border-0 shadow-sm">
                <div className="text-center text-slate-400">
                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhum agendamento para hoje</p>
                </div>
            </Card>
        );
    }

    return (
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                <h3 className="font-bold text-slate-800">📅 Agenda do Dia</h3>
                <p className="text-sm text-slate-600 mt-1">{appointments.length} consultas agendadas</p>
            </div>
            <div className="divide-y divide-slate-50">
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
                        <div key={apt.id} className="p-4 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/30 transition-all border-l-4 border-transparent hover:border-blue-500">
                            <div className="flex items-center gap-4">
                                <div className="text-center min-w-[70px] bg-slate-50 rounded-xl p-2">
                                    <p className="text-lg font-bold text-slate-800">
                                        {apt.start_time.includes('T') ? new Date(apt.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : (apt.start_time || "--:--").substring(0, 5)}
                                    </p>
                                    <p className="text-xs text-slate-500 font-medium">
                                        {apt.end_time.includes('T') ? new Date(apt.end_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : (apt.end_time || "--:--").substring(0, 5)}
                                    </p>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-slate-800 truncate">{patientName}</p>
                                    <p className="text-sm text-slate-600 truncate flex items-center gap-1">
                                        <User className="w-3 h-3" />
                                        {professionalName}
                                    </p>
                                </div>
                                <Badge variant="outline" className={`${status.class} border-0 font-semibold shadow-sm`}>
                                    {status.label}
                                </Badge>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreVertical className="w-4 h-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
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
