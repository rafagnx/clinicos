
import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/lib/base44Client";
import { format, addDays, isPast, isToday, differenceInDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    MessageCircle, Calendar, AlertTriangle, CheckCircle2,
    Search, Filter, ArrowUpRight, Clock
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { PROCEDURE_CATEGORIES } from "@/lib/procedures";

export default function Retention() {
    const [searchTerm, setSearchTerm] = useState("");

    // 1. Fetch Data
    const { data: procedures = [] } = useQuery({
        queryKey: ["procedure-types"],
        queryFn: () => base44.entities.ProcedureType.list()
    });

    const { data: patients = [] } = useQuery({
        queryKey: ["patients"],
        queryFn: () => base44.list("Patient")
    });

    const { data: records = [], isLoading } = useQuery({
        queryKey: ["medical-records"],
        queryFn: () => base44.list("MedicalRecord")
        // typically filtering by recently active patients would be better for scale
    });

    // 2. Process Opportunities
    const opportunities = useMemo(() => {
        console.log("Retention: Records found:", records.length);
        console.log("Retention: DB Procedures found:", procedures.length);

        if (!records.length) return [];

        const opps = [];
        const processedKeys = new Set();

        const latestProcedures = new Map();

        records.forEach(record => {
            if (!record.content) return;
            try {
                const content = typeof record.content === 'string' ? JSON.parse(record.content) : record.content;
                const procList = content.selected_procedures || [];

                if (procList.length > 0) {
                    console.log(`Processing record ${record.id} for patient ${record.patient_id} with procedures:`, procList);
                }

                procList.forEach(procName => {
                    const key = `${record.patient_id}_${procName}`;
                    const existing = latestProcedures.get(key);
                    const recordDate = parseISO(record.date);

                    if (!existing || recordDate > existing.date) {
                        latestProcedures.set(key, {
                            patientId: record.patient_id,
                            procName: procName,
                            date: recordDate, // Latest date
                            recordId: record.id
                        });
                    }
                });

            } catch (e) {
                // ignore parsing error
            }
        });

        // Now calculate due dates
        latestProcedures.forEach((item) => {
            // Find interval
            // 1. Try DB procedure
            let interval = 0;
            const dbProc = procedures.find(p => p.name.toLowerCase() === item.procName.toLowerCase());

            if (dbProc && dbProc.return_interval) {
                interval = dbProc.return_interval;
            } else {
                // 2. Fallback to Lib categories (approximate)
                // This is a safety net if DB name doesn't match exactly
                for (const cat of Object.values(PROCEDURE_CATEGORIES)) {
                    // @ts-ignore
                    if (cat.items.includes(item.procName) || cat.items.some(i => item.procName.includes(i))) {
                        // @ts-ignore
                        interval = cat.interval;
                        break;
                    }
                }
            }

            if (interval > 0) {
                const dueDate = addDays(item.date, interval);
                const daysUntilDue = differenceInDays(dueDate, new Date());

                console.log(`Interval for ${item.procName}: ${interval} days. Due: ${format(dueDate, "dd/MM/yyyy")}. Days left: ${daysUntilDue}`);

                if (daysUntilDue < 45) {
                    const patient = patients.find(p => String(p.id) === String(item.patientId));
                    if (patient) {
                        opps.push({
                            id: `${item.recordId}_${item.procName}`,
                            patient,
                            procName: item.procName,
                            lastDate: item.date,
                            dueDate,
                            daysUntilDue,
                            interval
                        });
                    }
                }
            }
        });

        // Sort: Most urgent first (Overdue -> Upcoming)
        return opps.sort((a, b) => a.daysUntilDue - b.daysUntilDue);

    }, [records, procedures, patients]);

    // Filter
    const filteredOpportunities = opportunities.filter(opp =>
        opp.patient.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opp.procName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleWhatsApp = (opp) => {
        const phone = opp.patient.phone?.replace(/\D/g, "");
        if (!phone) {
            toast.error("Paciente sem telefone cadastrado.");
            return;
        }

        const firstName = opp.patient.full_name.split(" ")[0];
        const dateStr = format(opp.lastDate, "dd/MM/yyyy");

        let message = "";
        if (opp.daysUntilDue < 0) {
            // Overdue
            message = `Oi ${firstName}, tudo bem? Notei aqui que seu procedimento de ${opp.procName} (feito em ${dateStr}) já completou o tempo ideal de retorno. Vamos agendar para manter o resultado?`;
        } else {
            // Upcoming
            message = `Oi ${firstName}, aqui é da clínica! Passando pra lembrar que seu ${opp.procName} completa o prazo ideal de retoque em breve. Que tal já deixarmos agendado?`;
        }

        const link = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
        window.open(link, "_blank");
    };

    return (
        <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <Clock className="w-8 h-8 text-blue-600" />
                        Smart Retention
                    </h1>
                    <p className="text-slate-500 mt-2">
                        Oportunidades de retorno baseadas no ciclo dos procedimentos.
                        <a href="/#/Settings/Retention" className="text-indigo-600 hover:text-indigo-700 font-semibold ml-2 underline">
                            Configurar intervalos →
                        </a>
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Buscar paciente ou procedimento..."
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-red-50 border-red-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-red-600 uppercase tracking-wider">Vencidos (Urgente)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-red-700">
                            {opportunities.filter(o => o.daysUntilDue < 0).length}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-amber-50 border-amber-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-amber-600 uppercase tracking-wider">Próximos 30 dias</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-amber-700">
                            {opportunities.filter(o => o.daysUntilDue >= 0 && o.daysUntilDue <= 30).length}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-blue-50 border-blue-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-blue-600 uppercase tracking-wider">Total Oportunidades</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-blue-700">
                            {opportunities.length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Fluxo de Retorno</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-10 text-slate-500">Carregando oportunidades...</div>
                    ) : filteredOpportunities.length === 0 ? (
                        <div className="text-center py-16 text-slate-400">
                            <CheckCircle2 className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p className="font-semibold text-slate-600 mb-2">Nenhuma oportunidade de retorno encontrada no momento.</p>
                            <p className="text-sm text-slate-500 max-w-md mx-auto">
                                Verifique se os procedimentos têm <strong>intervalos de retorno configurados</strong>.
                                {' '}
                                <a href="/#/Settings/Retention" className="text-indigo-600 hover:text-indigo-700 font-semibold underline">
                                    Configurar agora
                                </a>
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredOpportunities.map((opp) => (
                                <div key={opp.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-blue-100 hover:bg-blue-50/30 transition-all gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <Avatar className="w-12 h-12 border-2 border-white shadow-sm">
                                                <AvatarImage src={opp.patient.photo_url} />
                                                <AvatarFallback>{opp.patient.full_name?.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className={cn(
                                                "absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[10px] text-white font-bold",
                                                opp.daysUntilDue < 0 ? "bg-red-500" : (opp.daysUntilDue < 15 ? "bg-amber-500" : "bg-emerald-500")
                                            )}>
                                                !
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900">{opp.patient.full_name}</h3>
                                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                                <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-normal">
                                                    {opp.procName}
                                                </Badge>
                                                <span className="text-xs text-slate-400">
                                                    Realizado em {format(opp.lastDate, "dd/MM/yyyy")}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 w-full md:w-auto mt-2 md:mt-0">
                                        <div className="text-right flex-1 md:flex-none">
                                            <p className={cn(
                                                "font-bold text-sm",
                                                opp.daysUntilDue < 0 ? "text-red-600" : "text-amber-600"
                                            )}>
                                                {opp.daysUntilDue < 0 ? `Venceu há ${Math.abs(opp.daysUntilDue)} dias` : `Vence em ${opp.daysUntilDue} dias`}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                Meta: {format(opp.dueDate, "dd/MM/yyyy")}
                                            </p>
                                        </div>
                                        <Button
                                            className="bg-emerald-500 hover:bg-emerald-600 text-white gap-2 shadow-lg shadow-emerald-500/20"
                                            onClick={() => handleWhatsApp(opp)}
                                        >
                                            <MessageCircle className="w-4 h-4" />
                                            <span className="hidden md:inline">Contatar</span>
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
