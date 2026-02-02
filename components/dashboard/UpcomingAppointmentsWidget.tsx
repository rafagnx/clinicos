import React from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useOutletContext } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function UpcomingAppointmentsWidget({ appointments, patients, professionals }) {
    const { isDark } = useOutletContext<{ isDark: boolean }>();
    const today = format(new Date(), "yyyy-MM-dd");
    const upcoming = appointments
        .filter(apt => {
            if (!apt.date || apt.status === "cancelado") return false;
            // Handle both "2026-02-02" and "2026-02-02T00:00:00Z" formats
            const aptDate = apt.date.includes('T') ? apt.date.split('T')[0] : apt.date;
            return aptDate >= today;
        })
        .slice(0, 5);

    return (
        <Card className={cn(
            "p-5 backdrop-blur-sm shadow-lg h-full transition-all duration-300",
            isDark ? "bg-slate-900/50 border-slate-800" : "bg-white/90 border-0"
        )}>
            <div className="flex items-center gap-2 mb-4">
                <Calendar className={cn("w-5 h-5", isDark ? "text-blue-400" : "text-blue-600")} />
                <h3 className={cn("font-semibold", isDark ? "text-white" : "text-slate-800")}>Próximas Consultas</h3>
            </div>

            {upcoming.length === 0 ? (
                <p className={cn("text-sm text-center py-8", isDark ? "text-slate-500" : "text-slate-400")}>Nenhuma consulta próxima</p>
            ) : (
                <div className="space-y-3">
                    {upcoming.map((apt) => {
                        const patient = patients.find(p => p.id === apt.patient_id);
                        const patientName = apt.patient?.full_name || patient?.full_name || apt.patient_name || "Paciente sem nome";

                        const professional = professionals?.find(p => p.id === apt.professional_id);
                        const professionalName = apt.professional?.full_name || apt.professional_name || professional?.full_name || professional?.name;

                        return (
                            <div key={apt.id} className={cn(
                                "flex items-center gap-3 p-3 rounded-lg transition-colors border",
                                isDark
                                    ? "bg-slate-950/50 hover:bg-slate-900 border-slate-800"
                                    : "bg-slate-50 hover:bg-slate-100 border-transparent"
                            )}>
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={patient?.photo_url} />
                                    <AvatarFallback className={cn("text-xs", isDark ? "bg-blue-900/30 text-blue-300" : "bg-blue-100 text-blue-600")}>
                                        {patientName.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className={cn("font-medium text-sm truncate", isDark ? "text-slate-200" : "text-slate-800")}>{patientName}</p>
                                    <p className={cn("text-xs truncate font-medium", isDark ? "text-slate-400" : "text-slate-600")}>
                                        {apt.procedure_name} {professionalName && `• ${professionalName}`}
                                    </p>
                                    <div className={cn("flex items-center gap-2 text-xs mt-0.5", isDark ? "text-slate-500" : "text-slate-500")}>
                                        <Clock className="w-3 h-3" />
                                        {(() => {
                                            // Extract just the date part to avoid timezone issues
                                            const datePart = apt.date.includes('T') ? apt.date.split('T')[0] : apt.date;
                                            const [year, month, day] = datePart.split('-').map(Number);
                                            const displayDate = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}`;

                                            const timeDisplay = apt.start_time.includes('T') && isValid(parseISO(apt.start_time))
                                                ? format(parseISO(apt.start_time), "HH:mm")
                                                : (apt.start_time || "--:--").substring(0, 5);

                                            return `${displayDate} às ${timeDisplay}`;
                                        })()}
                                    </div>
                                </div>
                                <Badge variant="outline" className={cn("text-xs", isDark ? "border-slate-700 text-slate-400" : "")}>
                                    {apt.type}
                                </Badge>
                            </div>
                        );
                    })}
                </div>
            )}
        </Card>
    );
}
