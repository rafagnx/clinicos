import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/lib/base44Client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    Calendar, Stethoscope, Clock, FileText,
    ChevronRight, Image as ImageIcon, Download,
    ZoomIn, Activity
} from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

export default function PatientTimeline({ patientId, className }) {
    const { data: appointments = [] } = useQuery({
        queryKey: ["appointments"],
        queryFn: () => base44.entities.Appointment.list("-date")
    });

    const { data: medicalRecords = [] } = useQuery({
        queryKey: ["medical-records", patientId],
        queryFn: async () => {
            // Filter supports only one argument for criteria, formatting/sorting done in JS if needed
            const results = await base44.entities.MedicalRecord.filter({ patient_id: patientId });
            return results;
        },
        enabled: !!patientId
    });

    // Combine and sort events
    const events = React.useMemo(() => {
        const apps = appointments
            .filter(a => a.patient_id === patientId)
            .map(a => {
                // Fix date timezone issue
                const dateStr = a.date?.includes('T') ? a.date.split('T')[0] : a.date;
                const timeStr = a.start_time?.includes('T') ? format(parseISO(a.start_time), "HH:mm") : (a.start_time || "00:00").substring(0, 5);

                return {
                    id: `apt-${a.id}`,
                    type: 'appointment',
                    date: dateStr,
                    time: timeStr,
                    fullDate: new Date(`${dateStr}T${timeStr}:00`),
                    data: a
                };
            });

        const records = medicalRecords.map(r => {
            // Record date usually includes time or is just date
            const dateObj = new Date(r.date);
            const dateStr = r.date?.split('T')[0];

            return {
                id: `rec-${r.id}`,
                type: 'record',
                date: dateStr,
                time: isValid(dateObj) ? format(dateObj, "HH:mm") : "00:00",
                fullDate: dateObj,
                data: r
            };
        });

        // Use getTime() for arithmetic
        return [...apps, ...records].sort((a, b) => b.fullDate.getTime() - a.fullDate.getTime());
    }, [appointments, medicalRecords, patientId]);

    if (!patientId) return null;

    if (events.length === 0) {
        return (
            <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed">
                <Activity className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-slate-500 font-medium">Nenhum evento registrado</p>
                <p className="text-sm text-slate-400">O histórico deste paciente está vazio.</p>
            </div>
        );
    }

    return (
        <div className={cn("space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent", className)}>
            {events.map((event) => (
                <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">

                    {/* Icon Bubble */}
                    <div className={cn(
                        "flex items-center justify-center w-10 h-10 rounded-full border-4 border-slate-50 shadow-sm z-10 shrink-0 md:absolute md:left-1/2 md:-translate-x-1/2",
                        event.type === 'appointment'
                            ? (event.data.status === 'concluido' ? "bg-emerald-100 text-emerald-600 border-emerald-50" : "bg-indigo-100 text-indigo-600 border-indigo-50")
                            : "bg-amber-100 text-amber-600 border-amber-50"
                    )}>
                        {event.type === 'appointment' ? <Calendar className="w-4 h-4" /> : <Stethoscope className="w-4 h-4" />}
                    </div>

                    {/* Content Card */}
                    <Card className={cn(
                        "w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-5 transition-all hover:shadow-md border-slate-100",
                        event.type === 'record' ? "bg-amber-50/30" : "bg-white"
                    )}>
                        {/* Header */}
                        <div className="flex justify-between items-start mb-3">
                            <Badge variant="outline" className={cn(
                                "font-bold text-[10px] uppercase tracking-wide",
                                event.type === 'appointment'
                                    ? "bg-indigo-50 text-indigo-600 border-indigo-100"
                                    : "bg-amber-50 text-amber-600 border-amber-100"
                            )}>
                                {event.type === 'appointment' ? 'Agendamento' :
                                    event.data.type === 'anamnesis' ? 'Anamnese' : 'Evolução'}
                            </Badge>
                            <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {format(event.fullDate, "d 'de' MMM, HH:mm", { locale: ptBR })}
                            </span>
                        </div>

                        {/* Title */}
                        <h3 className="font-bold text-slate-800 mb-2">
                            {event.type === 'appointment'
                                ? (event.data.procedure_name || "Consulta")
                                : (event.data.type === 'anamnesis' ? "Ficha de Anamnese" : "Atendimento Clínico")}
                        </h3>

                        {/* Body */}
                        {event.type === 'appointment' ? (
                            <div className="space-y-2">
                                <p className="text-sm text-slate-500">
                                    Profissional: <span className="font-medium text-slate-700">{event.data.professional_name || "N/A"}</span>
                                </p>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    <Badge className={cn(
                                        "capitalize",
                                        event.data.status === 'concluido' ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" :
                                            event.data.status === 'cancelado' ? "bg-rose-100 text-rose-700 hover:bg-rose-200" :
                                                "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                    )}>
                                        {event.data.status}
                                    </Badge>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {/* Text Content */}
                                {event.data.content && (
                                    <p className="text-sm text-slate-600 leading-relaxed bg-white/60 p-3 rounded-lg border border-amber-100/50">
                                        {event.data.content}
                                    </p>
                                )}

                                {/* Attachments / Photos */}
                                {event.data.attachments && Array.isArray(event.data.attachments) && event.data.attachments.length > 0 && (
                                    <div className="mt-3">
                                        <p className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1">
                                            <ImageIcon className="w-3 h-3" /> Fotos e Anexos ({event.data.attachments.length})
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {event.data.attachments.map((url, idx) => (
                                                <Dialog key={idx}>
                                                    <DialogTrigger asChild>
                                                        <div className="relative group cursor-zoom-in w-16 h-16 rounded-lg overflow-hidden border border-slate-200">
                                                            <img
                                                                src={url}
                                                                alt={`Anexo ${idx + 1}`}
                                                                className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                                            />
                                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                                        </div>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-3xl p-0 overflow-hidden bg-black/90 border-0">
                                                        <img src={url} alt="Full size" className="w-full h-full object-contain max-h-[80vh]" />
                                                    </DialogContent>
                                                </Dialog>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </Card>
                </div>
            ))}
        </div>
    );
}
