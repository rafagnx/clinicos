import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/lib/base44Client";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, TrendingUp, Users, DollarSign, Calendar, Loader2 } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

import AppointmentsByMonthChart from "@/components/reports/AppointmentsByMonthChart";
import ProceduresChart from "@/components/reports/ProceduresChart";
import RevenueByProfessionalChart from "@/components/reports/RevenueByProfessionalChart";
import AppointmentStatusChart from "@/components/reports/AppointmentStatusChart";
import LeadSourceChart from "@/components/reports/LeadSourceChart";

export default function Reports() {
  const { isDark } = useOutletContext<{ isDark: boolean }>();
  const [timeRange, setTimeRange] = useState("6months");

  const { data: appointments = [], isLoading: loadingAppointments } = useQuery({
    queryKey: ["appointments"],
    queryFn: () => base44.entities.Appointment.list("-date")
  });

  const { data: patients = [], isLoading: loadingPatients } = useQuery({
    queryKey: ["patients"],
    queryFn: () => base44.entities.Patient.list()
  });

  const { data: professionals = [] } = useQuery({
    queryKey: ["professionals"],
    queryFn: () => base44.entities.Professional.list()
  });

  const isLoading = loadingAppointments || loadingPatients;

  // Calcular estatísticas gerais
  const totalAppointments = appointments.length;
  const totalPatients = patients.length;
  const totalRevenue = appointments
    .filter(a => a.value)
    .reduce((sum, a) => sum + (a.value || 0), 0);
  const avgTicket = totalRevenue / (appointments.filter(a => a.value).length || 1);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
        <p className={cn("text-[10px] font-black uppercase tracking-widest", isDark ? "text-slate-400" : "text-slate-500")}>Gerando relatórios...</p>
      </div>
    );
  }

  return (
    <div className={cn("p-4 md:p-10 max-w-[1600px] mx-auto space-y-8 min-h-screen relative overflow-hidden flex flex-col")}>

      {/* Header Liquid Scale */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-[8px] font-black uppercase tracking-widest mb-1">
            <BarChart3 className="w-2.5 h-2.5" /> INTELLIGENCE
          </div>
          <h1 className={cn("text-3xl md:text-4xl font-black mb-1 tracking-tighter leading-[0.9]", isDark ? "text-white" : "text-slate-900")}>
            RELATÓRIOS <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">ESTRATÉGICOS</span>
          </h1>
          <p className={cn("text-sm font-medium", isDark ? "text-slate-400" : "text-slate-600")}>
            Análise detalhada de desempenho financeiro e operacional.
          </p>
        </div>

        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className={cn(
            "w-[180px] h-12 rounded-xl text-xs font-bold uppercase tracking-wide border transition-all",
            isDark ? "bg-slate-900/50 border-white/10 text-slate-200" : "bg-white border-slate-200 text-slate-700"
          )}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className={isDark ? "bg-slate-900 border-slate-800" : ""}>
            <SelectItem value="30days">Últimos 30 dias</SelectItem>
            <SelectItem value="90days">Últimos 90 dias</SelectItem>
            <SelectItem value="6months">Últimos 6 meses</SelectItem>
            <SelectItem value="1year">Último ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
        {[
          {
            label: "Total Consultas",
            value: totalAppointments,
            icon: Calendar,
            color: "text-blue-500",
            bg: "from-blue-500/20 to-indigo-500/20",
            border: "border-blue-500/20"
          },
          {
            label: "Pacientes Ativos",
            value: totalPatients,
            icon: Users,
            color: "text-emerald-500",
            bg: "from-emerald-500/20 to-teal-500/20",
            border: "border-emerald-500/20"
          },
          {
            label: "Faturamento Total",
            value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalRevenue),
            icon: DollarSign,
            color: "text-amber-500",
            bg: "from-amber-500/20 to-orange-500/20",
            border: "border-amber-500/20"
          },
          {
            label: "Ticket Médio",
            value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(avgTicket),
            icon: TrendingUp,
            color: "text-purple-500",
            bg: "from-purple-500/20 to-pink-500/20",
            border: "border-purple-500/20"
          }
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={cn(
              "p-6 rounded-[2rem] glass-premium border-white/5 relative overflow-hidden group",
              isDark ? "bg-slate-950/40" : "bg-white/60"
            )}
          >
            <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-700", stat.bg)} />
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className={cn("text-[10px] font-black uppercase tracking-widest mb-1 opacity-60", isDark ? "text-slate-400" : "text-slate-500")}>{stat.label}</p>
                <h3 className={cn("text-2xl lg:text-3xl font-black tracking-tighter", isDark ? "text-white" : "text-slate-900")}>{stat.value}</h3>
              </div>
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br shadow-lg", stat.bg, stat.color)}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className={cn("p-8 rounded-[2rem] glass-premium border-white/10", isDark ? "bg-slate-950/40" : "bg-white/60")}>
          <h3 className={cn("font-black text-lg mb-6 flex items-center gap-2", isDark ? "text-white" : "text-slate-800")}>
            <BarChart3 className="w-5 h-5 text-blue-500" />
            Volume de Atendimentos
          </h3>
          <AppointmentsByMonthChart appointments={appointments} timeRange={timeRange} />
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className={cn("p-8 rounded-[2rem] glass-premium border-white/10", isDark ? "bg-slate-950/40" : "bg-white/60")}>
          <h3 className={cn("font-black text-lg mb-6 flex items-center gap-2", isDark ? "text-white" : "text-slate-800")}>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            Faturamento por Profissional
          </h3>
          <RevenueByProfessionalChart appointments={appointments} professionals={professionals} timeRange={timeRange} />
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className={cn("p-8 rounded-[2rem] glass-premium border-white/10", isDark ? "bg-slate-950/40" : "bg-white/60")}>
          <h3 className={cn("font-black text-lg mb-6", isDark ? "text-white" : "text-slate-800")}>Procedimentos mais Realizados</h3>
          <ProceduresChart appointments={appointments} timeRange={timeRange} />
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className={cn("p-8 rounded-[2rem] glass-premium border-white/10", isDark ? "bg-slate-950/40" : "bg-white/60")}>
          <h3 className={cn("font-black text-lg mb-6", isDark ? "text-white" : "text-slate-800")}>Status dos Agendamentos</h3>
          <AppointmentStatusChart appointments={appointments} timeRange={timeRange} />
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }} className={cn("p-8 rounded-[2rem] glass-premium border-white/10 lg:col-span-2", isDark ? "bg-slate-950/40" : "bg-white/60")}>
          <h3 className={cn("font-black text-lg mb-6", isDark ? "text-white" : "text-slate-800")}>Origem dos Pacientes</h3>
          <LeadSourceChart patients={patients} />
        </motion.div>
      </div>
    </div>
  );
}

