import React from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function UpcomingAppointmentsWidget({ appointments, patients }) {
    const today = format(new Date(), "yyyy-MM-dd");
    const upcoming = appointments
        .filter(apt => apt.date >= today && apt.status !== "cancelado")
        .slice(0, 5);

    return (
        <Card className="p-5 bg-white/90 backdrop-blur-sm border-0 shadow-lg h-full">
            <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-slate-800">Próximas Consultas</h3>
            </div>

            {upcoming.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">Nenhuma consulta próxima</p>
            ) : (
                <div className="space-y-3">
                    {upcoming.map((apt) => {
                        const patient = patients.find(p => p.id === apt.patient_id);
                        const patientName = apt.patient?.full_name || patient?.full_name || apt.patient_name || "Paciente sem nome";
                        const professionalName = apt.professional?.full_name || apt.professional_name;

                        return (
                            <div key={apt.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={patient?.photo_url} />
                                    <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                                        {patientName.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm text-slate-800 truncate">{patientName}</p>
                                    <p className="text-xs text-slate-600 truncate font-medium">
                                        {apt.procedure_name} {professionalName && `• ${professionalName}`}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                        <Clock className="w-3 h-3" />
                                        {format(new Date(apt.date), "dd/MM", { locale: ptBR })} às {
                                            apt.start_time.includes('T') && isValid(parseISO(apt.start_time))
                                                ? format(parseISO(apt.start_time), "HH:mm")
                                                : (apt.start_time || "--:--").substring(0, 5)
                                        }
                                    </div>
                                </div>
                                <Badge variant="outline" className="text-xs">
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
