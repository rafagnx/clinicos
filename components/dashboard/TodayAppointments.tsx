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
            "p-6 md:p-8 border-b border-white/5 relative overflow-hidden group",
            isDark ? "bg-slate-950/40" : "bg-white/40"
        )}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-3xl pointer-events-none group-hover:scale-150 transition-transform duration-1000" />
            <div className="relative z-10 flex items-center justify-between">
                <div>
                    <h3 className={cn("text-2xl font-black tracking-tighter leading-none", isDark ? "text-white" : "text-slate-900")}>AGENDA DO DIA</h3>
                    <p className={cn("text-[10px] font-black mt-2 uppercase tracking-[0.2em] text-blue-500")}>
                        {appointments?.length || 0} COMPROMISSOS AGENDADOS
                    </p>
                </div>
                <div className="hidden sm:block">
                    <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                </div>
            </div>
        </div>
    );

    if (!appointments || appointments.length === 0) {
        return (
            <Card className={cn(
                "glass-premium border-white/10 overflow-hidden transition-all duration-500 rounded-[2rem]",
                isDark ? "bg-slate-950/40" : "bg-white/40"
            )}>
                {header}
                <div className={cn("p-16 text-center", isDark ? "text-slate-500" : "text-slate-400")}>
                    <Clock className="w-16 h-16 mx-auto mb-4 opacity-20 animate-pulse-slow" />
                    <p className="font-bold tracking-tight text-xl">Nenhuma consulta para hoje</p>
                </div>
            </Card>
        );
    }

    return (
        <Card className={cn(
            "glass-premium border-white/10 overflow-hidden transition-all duration-500 rounded-[2rem]",
            isDark ? "bg-slate-950/40" : "bg-white/40"
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
                            "p-5 transition-all border-l-[6px] border-transparent group/item",
                            isDark
                                ? "hover:bg-white/5 hover:border-blue-500"
                                : "hover:bg-slate-50/50 hover:border-blue-500 shadow-sm"
                        )}>
                            <div className="flex items-center gap-6">
                                <div className={cn(
                                    "text-center min-w-[80px] rounded-2xl p-2.5 glass-premium border-white/5 shadow-inner transition-transform group-hover/item:scale-105",
                                    isDark ? "bg-slate-950/80" : "bg-white"
                                )}>
                                    <p className={cn("text-xl font-black tracking-tighter", isDark ? "text-white" : "text-slate-900")}>
                                        {apt.start_time?.includes('T') ? new Date(apt.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : (apt.start_time || "--:--").substring(0, 5)}
                                    </p>
                                    <p className={cn("text-[10px] font-black tracking-widest opacity-40 uppercase")}>
                                        ATÉ {apt.end_time?.includes('T') ? new Date(apt.end_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : (apt.end_time || "--:--").substring(0, 5)}
                                    </p>
                                </div>
                                <div className="flex-1 min-w-0 space-y-1">
                                    <p className={cn("text-lg font-black tracking-tight truncate group-hover/item:text-blue-400 transition-colors", isDark ? "text-white" : "text-slate-900")}>
                                        {patientName}
                                    </p>
                                    <div className={cn("flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-50")}>
                                        <User className="w-3 h-3 text-blue-500" />
                                        {professionalName}
                                        <span className="mx-1 opacity-50">•</span>
                                        <span className="text-blue-500">{apt.type || "Consulta"}</span>
                                    </div>

                                    {/* Patient Badges */}
                                    {(() => {
                                        const patient = apt.patient || patients?.find((p: any) => p.id === apt.patient_id);
                                        if (!patient) return null;

                                        return (
                                            <div className="flex flex-wrap gap-1 mt-1.5">
                                                {/* Origin Badge */}
                                                {patient.origin && (
                                                    <span className={cn(
                                                        "text-[8px] px-1 py-0.5 rounded-full font-bold uppercase tracking-wider",
                                                        patient.origin.toLowerCase().includes('ads') ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
                                                            patient.origin.toLowerCase().includes('indica') ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" :
                                                                "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
                                                    )}>
                                                        {patient.origin}
                                                    </span>
                                                )}

                                                {/* Profile Badge */}
                                                {patient.behavior_profile && (
                                                    <span className={cn(
                                                        "text-[8px] px-1 py-0.5 rounded-full font-bold uppercase tracking-wider",
                                                        patient.behavior_profile.toLowerCase() === 'analítico' ? "bg-purple-500/10 text-purple-600 dark:text-purple-400" :
                                                            patient.behavior_profile.toLowerCase() === 'emocional' ? "bg-pink-500/10 text-pink-600 dark:text-pink-400" :
                                                                patient.behavior_profile.toLowerCase() === 'exigente' ? "bg-slate-800/10 text-slate-700 dark:text-slate-300" :
                                                                    "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                                    )}>
                                                        {patient.behavior_profile.substring(0, 3)}
                                                    </span>
                                                )}

                                                {/* Temperature Badge */}
                                                {(patient.temperature || patient.funnel_status) && (
                                                    <span className={cn(
                                                        "text-[8px] px-1 py-0.5 rounded-full font-bold uppercase tracking-wider",
                                                        (patient.temperature === 'hot' || patient.funnel_status === 'hot') ? "bg-rose-500/10 text-rose-600 dark:text-rose-400" :
                                                            (patient.temperature === 'warm' || patient.funnel_status === 'warm') ? "bg-orange-500/10 text-orange-600 dark:text-orange-400" :
                                                                "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                                    )}>
                                                        {(patient.temperature || patient.funnel_status) === 'hot' ? 'QUENTE' : (patient.temperature || patient.funnel_status) === 'warm' ? 'MORNO' : 'FRIO'}
                                                    </span>
                                                )}

                                                {/* Temperament Badge */}
                                                {patient.temperament && (
                                                    <span className={cn(
                                                        "text-[8px] px-1 py-0.5 rounded-full font-bold uppercase tracking-wider bg-violet-500/10 text-violet-600 dark:text-violet-400"
                                                    )}>
                                                        {patient.temperament === 'analitico' ? '🧠 ANALÍTICO' :
                                                            patient.temperament === 'executor' ? '🚀 EXECUTOR' :
                                                                patient.temperament === 'comunicador' ? '💬 COMUNICADOR' :
                                                                    patient.temperament === 'planejador' ? '📋 PLANEJADOR' :
                                                                        patient.temperament.toUpperCase()}
                                                    </span>
                                                )}

                                                {/* Motivation Badge */}
                                                {patient.main_motivation && (
                                                    <span className={cn(
                                                        "text-[8px] px-1 py-0.5 rounded-full font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                                    )}>
                                                        {patient.main_motivation === 'dor' ? '💊 DOR' :
                                                            patient.main_motivation === 'prazer' ? '✨ PRAZER' :
                                                                patient.main_motivation === 'status' ? '💎 STATUS' :
                                                                    patient.main_motivation === 'seguranca' ? '🛡️ SEGURANÇA' :
                                                                        patient.main_motivation.toUpperCase()}
                                                    </span>
                                                )}

                                                {/* Conscience Level Badge */}
                                                {patient.conscience_level && (
                                                    <span className={cn(
                                                        "text-[8px] px-1 py-0.5 rounded-full font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
                                                    )}>
                                                        {patient.conscience_level === 'unaware' ? 'INCONSCIENTE' :
                                                            patient.conscience_level === 'problem_aware' ? 'PROBLEMA' :
                                                                patient.conscience_level === 'solution_aware' ? 'SOLUÇÃO' :
                                                                    patient.conscience_level === 'product_aware' ? 'PRODUTO' :
                                                                        patient.conscience_level === 'most_aware' ? 'TOTALMENTE' :
                                                                            patient.conscience_level.toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm",
                                        status.class,
                                        "border-white/10"
                                    )}>
                                        {status.label}
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className={cn("h-10 w-10 rounded-xl", isDark ? "text-slate-500 hover:text-white hover:bg-white/10" : "hover:bg-slate-100")}>
                                                <MoreVertical className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className={cn("rounded-2xl glass-premium border-white/10 p-2", isDark ? "bg-slate-900 text-slate-200" : "bg-white")}>
                                            <DropdownMenuItem className="rounded-xl font-bold text-[11px] uppercase tracking-widest" onClick={() => onStatusChange(apt.id, "confirmado")}>
                                                Confirmar
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="rounded-xl font-bold text-[11px] uppercase tracking-widest" onClick={() => onStatusChange(apt.id, "aguardando")}>
                                                Paciente chegou
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="rounded-xl font-bold text-[11px] uppercase tracking-widest" onClick={() => onStatusChange(apt.id, "em_atendimento")}>
                                                Iniciar atendimento
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="rounded-xl font-bold text-[11px] uppercase tracking-widest" onClick={() => onStatusChange(apt.id, "finalizado")}>
                                                Finalizar
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="rounded-xl font-bold text-[11px] uppercase tracking-widest text-rose-500" onClick={() => onStatusChange(apt.id, "faltou")}>
                                                Marcar falta
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="rounded-xl font-bold text-[11px] uppercase tracking-widest text-slate-500" onClick={() => onStatusChange(apt.id, "cancelado")}>
                                                Cancelar
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
}
