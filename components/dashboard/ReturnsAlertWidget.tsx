import React, { useState, useEffect } from "react";
import { base44 } from "@/lib/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Clock, AlertCircle, ArrowRight, MessageSquare } from "lucide-react";
import { format, addDays, isBefore, isAfter, differenceInDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/lib/utils";

export default function ReturnsAlertWidget() {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReturns = async () => {
            try {
                // 1. Fetch Procedure Types with Return Interval
                const procedures = await base44.entities.ProcedureType.list();
                const recallProcedures = procedures.filter(p => p.return_interval && p.return_interval > 0);
                const recallMap = recallProcedures.reduce((acc, p) => ({ ...acc, [p.name]: p.return_interval }), {});

                if (Object.keys(recallMap).length === 0) {
                    setLoading(false);
                    return;
                }

                // 2. Fetch Recent Appointments (Completed)
                // In a real scenario, we might want to filter by date range on the server to avoid over-fetching
                // For now, let's fetch last 1000 appointments or so.
                // Assuming list returns all or recent.
                const appointments = await base44.entities.Appointment.list();

                // 3. Process Appointments to Find Recalls
                const today = new Date();
                const upcomingRecalls = [];

                // Group by patient to avoid duplicates? Or show per procedure? Per procedure is better.
                appointments.forEach(apt => {
                    if (apt.status !== 'realizado' && apt.status !== 'completed') return;

                    const interval = recallMap[apt.procedure_name];
                    if (!interval) return;

                    const completedDate = new Date(apt.start_time || apt.date);
                    const returnDate = addDays(completedDate, interval);
                    const diffDays = differenceInDays(returnDate, today);

                    // Alert logic:
                    // If return date is passed (negative diff) -> Overdue (Red)
                    // If return date is within next 30 days -> Upcoming (Yellow)
                    // If return date is far future -> Ignore (Green/Hidden)

                    if (diffDays < 30) {
                        upcomingRecalls.push({
                            id: apt.id,
                            patient: apt.patient,
                            patientId: apt.patient_id,
                            procedure: apt.procedure_name,
                            lastDate: completedDate,
                            dueDate: returnDate,
                            daysUntil: diffDays,
                            status: diffDays < 0 ? 'overdue' : 'upcoming'
                        });
                    }
                });

                // Sort by due date (most urgent first)
                upcomingRecalls.sort((a, b) => a.daysUntil - b.daysUntil);

                setAlerts(upcomingRecalls.slice(0, 10)); // Show top 10

            } catch (error) {
                console.error("Failed to fetch returns alerts", error);
            } finally {
                setLoading(false);
            }
        };

        fetchReturns();
    }, []);

    if (loading) {
        return (
            <Card className="h-full border-0 shadow-lg bg-white/50 backdrop-blur-sm animate-pulse">
                <CardHeader>
                    <div className="h-6 w-32 bg-slate-200 rounded"></div>
                </CardHeader>
            </Card>
        );
    }

    if (alerts.length === 0) {
        return (
            <Card className="h-full border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-slate-500" />
                        <CardTitle className="text-lg">Retornos Pendentes</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-8 text-slate-500">
                    <AlertCircle className="w-10 h-10 mb-2 opacity-20" />
                    <p>Nenhum retorno pendente para os próximos 30 dias.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-full border-0 shadow-lg bg-white/90 backdrop-blur-sm">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-amber-100 rounded-lg">
                            <Clock className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">Alertas de Retorno</CardTitle>
                            <CardDescription>Pacientes devendo retorno de procedimento</CardDescription>
                        </div>
                    </div>
                    <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                        {alerts.length} pendentes
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="h-[300px] overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-slate-200">
                {alerts.map((alert, idx) => (
                    <div key={`${alert.id}-${idx}`} className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-100 hover:shadow-md transition-all group">
                        <Avatar className="w-10 h-10 border border-slate-100">
                            <AvatarImage src={alert.patient?.photo_url} />
                            <AvatarFallback className="bg-slate-100 text-slate-500 font-bold">
                                {alert.patient?.name?.substring(0, 2).toUpperCase() || "P"}
                            </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                                <h4 className="font-semibold text-sm text-slate-800 truncate pr-2">
                                    {alert.patient?.name || "Paciente Removido"}
                                </h4>
                                {alert.status === 'overdue' ? (
                                    <Badge variant="destructive" className="text-[10px] px-1.5 h-5">
                                        -{Math.abs(alert.daysUntil)} dias
                                    </Badge>
                                ) : (
                                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-0 text-[10px] px-1.5 h-5">
                                        Em {alert.daysUntil} dias
                                    </Badge>
                                )}
                            </div>

                            <p className="text-xs text-slate-500 flex items-center gap-1 mb-2">
                                <span className="font-medium text-indigo-600">{alert.procedure}</span>
                                <span className="text-slate-300">•</span>
                                <span>Realizado em {format(alert.lastDate, "dd/MM/yy")}</span>
                            </p>

                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <a
                                    href={`https://wa.me/${alert.patient?.phone?.replace(/\D/g, '')}?text=Olá ${alert.patient?.name?.split(' ')[0]}, notamos que já faz um tempo desde seu último ${alert.procedure}. Que tal agendarmos seu retorno?`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex-1"
                                >
                                    <Button size="sm" variant="outline" className="w-full h-7 text-xs gap-1 border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800">
                                        <MessageSquare className="w-3 h-3" />
                                        WhatsApp
                                    </Button>
                                </a>
                                <Link to={createPageUrl(`Patients?id=${alert.patientId}`)}>
                                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 rounded-full">
                                        <ArrowRight className="w-4 h-4 text-slate-400" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
