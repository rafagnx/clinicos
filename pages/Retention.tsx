
import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link, useOutletContext } from "react-router-dom";
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
    const navigate = useNavigate();
    const { isDark } = useOutletContext<{ isDark: boolean }>();
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
        <div className={cn("p-4 lg:p-10 max-w-[1600px] mx-auto space-y-8 min-h-screen relative overflow-hidden flex flex-col")}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[8px] font-black uppercase tracking-widest mb-1">
                        <Clock className="w-2.5 h-2.5" /> INTELIGÊNCIA DE RETORNO
                    </div>
                    <h1 className={cn("text-3xl md:text-4xl font-black mb-1 tracking-tighter leading-[0.9]", isDark ? "text-white" : "text-slate-900")}>
                        SMART <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">RETENTION</span>
                    </h1>
                    <p className={cn("text-sm font-medium flex items-center gap-2", isDark ? "text-slate-400" : "text-slate-600")}>
                        Ciclos automatizados de fidelização clínica.
                        <Link to="/Settings/Retention" className="text-blue-500 hover:text-blue-400 font-bold ml-1 transition-colors">
                            Configurar →
                        </Link>
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative w-full md:w-72 group">
                        <Search className={cn(
                            "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors",
                            isDark ? "text-slate-500 group-focus-within:text-blue-400" : "text-slate-400 group-focus-within:text-blue-600"
                        )} />
                        <Input
                            placeholder="Buscar paciente ou procedimento..."
                            className={cn(
                                "pl-10 h-12 rounded-xl transition-all",
                                isDark
                                    ? "bg-slate-950/40 border-white/5 focus:bg-slate-900/60 focus:border-blue-500/50"
                                    : "bg-white/50 border-slate-200 focus:bg-white focus:border-blue-500/50"
                            )}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className={cn("rounded-2xl p-6 glass-premium border-white/5 transition-all duration-500 hover:scale-[1.02] group relative overflow-hidden", isDark ? "bg-slate-950/40" : "bg-white/40")}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 mb-2 relative z-10">Vencidos (Urgente)</p>
                    <div className="flex items-end justify-between relative z-10">
                        <h3 className={cn("text-4xl font-black leading-none tracking-tighter", isDark ? "text-white" : "text-slate-900")}>
                            {opportunities.filter(o => o.daysUntilDue < 0).length}
                        </h3>
                        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20 shadow-lg shadow-red-500/5">
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className={cn("rounded-2xl p-6 glass-premium border-white/5 transition-all duration-500 hover:scale-[1.02] group relative overflow-hidden", isDark ? "bg-slate-950/40" : "bg-white/40")}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500 mb-2 relative z-10">Próximos 30 dias</p>
                    <div className="flex items-end justify-between relative z-10">
                        <h3 className={cn("text-4xl font-black leading-none tracking-tighter", isDark ? "text-white" : "text-slate-900")}>
                            {opportunities.filter(o => o.daysUntilDue >= 0 && o.daysUntilDue <= 30).length}
                        </h3>
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-lg shadow-amber-500/5">
                            <Clock className="w-5 h-5 text-amber-500" />
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className={cn("rounded-2xl p-6 glass-premium border-white/5 transition-all duration-500 hover:scale-[1.02] group relative overflow-hidden", isDark ? "bg-slate-950/40" : "bg-white/40")}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 mb-2 relative z-10">Total Oportunidades</p>
                    <div className="flex items-end justify-between relative z-10">
                        <h3 className={cn("text-4xl font-black leading-none tracking-tighter", isDark ? "text-white" : "text-slate-900")}>
                            {opportunities.length}
                        </h3>
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-lg shadow-blue-500/5">
                            <ArrowUpRight className="w-5 h-5 text-blue-500" />
                        </div>
                    </div>
                </motion.div>
            </div>

            <div className={cn("rounded-2xl p-5 md:p-6 glass-premium border-white/10 relative z-10", isDark ? "bg-slate-950/40" : "bg-white/40")}>
                <div className="flex items-center justify-between mb-6">
                    <h2 className={cn("text-lg font-black uppercase tracking-tight", isDark ? "text-white" : "text-slate-900")}>Fluxo de Retorno</h2>
                    <div className="h-px flex-1 mx-4 bg-gradient-to-r from-transparent via-slate-500/20 to-transparent" />
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-50">
                        <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
                        <p className={isDark ? "text-slate-400" : "text-slate-500"}>Carregando oportunidades...</p>
                    </div>
                ) : filteredOpportunities.length === 0 ? (
                    <div className={cn(
                        "flex flex-col items-center justify-center py-24 rounded-[2rem] border-2 border-dashed transition-all duration-500",
                        isDark ? "border-slate-800 bg-slate-950/20" : "border-slate-200 bg-slate-50/20"
                    )}>
                        <div className={cn(
                            "w-20 h-20 rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl transition-transform duration-500 hover:scale-110 hover:rotate-6",
                            isDark ? "bg-slate-900 shadow-black/40" : "bg-white shadow-slate-200"
                        )}>
                            <CheckCircle2 className={cn("w-10 h-10 opacity-30", isDark ? "text-blue-400" : "text-blue-600")} />
                        </div>
                        <h3 className={cn("text-2xl font-black mb-2 tracking-tighter uppercase", isDark ? "text-white" : "text-slate-900")}>
                            TUDO EM DIA
                        </h3>
                        <p className={cn("text-slate-500 max-w-sm text-center font-medium", isDark ? "text-slate-400" : "")}>
                            Nenhuma oportunidade de retorno pendente. Verifique seus <br />
                            <Link to="/Settings/Retention" className="text-blue-500 hover:underline">intervalos de retorno</Link> para garantir a precisão.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredOpportunities.map((opp, idx) => (
                            <motion.div
                                key={opp.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className={cn(
                                    "group relative flex flex-col md:flex-row items-start md:items-center justify-between p-4 rounded-2xl glass-premium border-white/5 transition-all duration-500 hover:bg-white/5 hover:translate-x-2 shadow-sm",
                                    isDark ? "bg-slate-950/20" : "bg-white/20"
                                )}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div className={cn(
                                            "absolute -inset-1 rounded-full opacity-40 blur-sm animate-pulse-soft",
                                            opp.daysUntilDue < 0 ? "bg-red-500" : (opp.daysUntilDue < 15 ? "bg-amber-500" : "bg-emerald-500")
                                        )} />
                                        <Avatar className="w-14 h-14 relative border-2 border-white/10 shadow-2xl">
                                            <AvatarImage src={opp.patient.photo_url} />
                                            <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-black text-lg">
                                                {opp.patient.full_name?.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className={cn("text-lg font-black tracking-tight leading-tight group-hover:text-blue-400 transition-colors", isDark ? "text-white" : "text-slate-900")}>
                                            {opp.patient.full_name}
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-3">
                                            <div className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] font-black uppercase tracking-widest">
                                                {opp.procName}
                                            </div>
                                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                                                <Calendar className="w-3 h-3 text-blue-500" /> Realizado em {format(opp.lastDate, "dd/MM/yyyy")}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 w-full md:w-auto mt-6 md:mt-0">
                                    <div className="text-right hidden sm:block">
                                        <p className={cn(
                                            "text-[10px] font-black uppercase tracking-widest mb-1",
                                            opp.daysUntilDue < 0 ? "text-red-500" : "text-amber-500"
                                        )}>
                                            {opp.daysUntilDue < 0 ? `Venceu há ${Math.abs(opp.daysUntilDue)} dias` : `Vence em ${opp.daysUntilDue} dias`}
                                        </p>
                                        <div className="flex items-center justify-end gap-2">
                                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">Meta</span>
                                            <div className={cn(
                                                "px-2 py-0.5 rounded-lg border font-mono text-[10px] font-black",
                                                isDark ? "bg-slate-900 border-white/5 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-600"
                                            )}>
                                                {format(opp.dueDate, "dd/MM/yyyy")}
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        className="h-11 px-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95 group relative overflow-hidden"
                                        onClick={() => handleWhatsApp(opp)}
                                    >
                                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <MessageCircle className="w-4 h-4 mr-2 relative z-10 transition-transform group-hover:rotate-12" />
                                        <span className="relative z-10">Solicitar Retorno</span>
                                    </Button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
