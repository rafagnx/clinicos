import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/lib/base44Client";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, TrendingUp, Users, DollarSign, Calendar, Loader2 } from "lucide-react";

import AppointmentsByMonthChart from "@/components/reports/AppointmentsByMonthChart";
import ProceduresChart from "@/components/reports/ProceduresChart";
import RevenueByProfessionalChart from "@/components/reports/RevenueByProfessionalChart";
import AppointmentStatusChart from "@/components/reports/AppointmentStatusChart";
import LeadSourceChart from "@/components/reports/LeadSourceChart";

export default function Reports() {
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

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-[#0B0E14]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Relatórios</h1>
            <p className="text-slate-500 mt-1 dark:text-slate-400">Análise de desempenho da clínica</p>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px] bg-white dark:bg-[#151A25] dark:border-slate-800 border-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30days">Últimos 30 dias</SelectItem>
              <SelectItem value="90days">Últimos 90 dias</SelectItem>
              <SelectItem value="6months">Últimos 6 meses</SelectItem>
              <SelectItem value="1year">Último ano</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-6 border-none shadow-sm dark:bg-[#151A25] dark:border dark:border-slate-800">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-50 rounded-xl text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Consultas</p>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{totalAppointments}</h3>
                  </div>
                </div>
              </Card>
              <Card className="p-6 border-none shadow-sm dark:bg-[#151A25] dark:border dark:border-slate-800">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Pacientes Ativos</p>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{totalPatients}</h3>
                  </div>
                </div>
              </Card>
              <Card className="p-6 border-none shadow-sm dark:bg-[#151A25] dark:border dark:border-slate-800">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-50 rounded-xl text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Faturamento Total</p>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalRevenue)}
                    </h3>
                  </div>
                </div>
              </Card>
              <Card className="p-6 border-none shadow-sm dark:bg-[#151A25] dark:border dark:border-slate-800">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-50 rounded-xl text-purple-600 dark:bg-purple-900/20 dark:text-purple-400">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Ticket Médio</p>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(avgTicket)}
                    </h3>
                  </div>
                </div>
              </Card>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="p-6 border-none shadow-sm dark:bg-[#151A25] dark:border dark:border-slate-800">
                <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 dark:text-slate-100">
                  <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Volume de Atendimentos
                </h3>
                <AppointmentsByMonthChart appointments={appointments} timeRange={timeRange} />
              </Card>

              <Card className="p-6 border-none shadow-sm dark:bg-[#151A25] dark:border dark:border-slate-800">
                <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 dark:text-slate-100">
                  <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  Faturamento por Profissional
                </h3>
                <RevenueByProfessionalChart appointments={appointments} professionals={professionals} timeRange={timeRange} />
              </Card>

              <Card className="p-6 border-none shadow-sm dark:bg-[#151A25] dark:border dark:border-slate-800">
                <h3 className="font-bold text-slate-800 mb-6 dark:text-slate-100">Procedimentos mais Realizados</h3>
                <ProceduresChart appointments={appointments} timeRange={timeRange} />
              </Card>

              <Card className="p-6 border-none shadow-sm dark:bg-[#151A25] dark:border dark:border-slate-800">
                <h3 className="font-bold text-slate-800 mb-6 dark:text-slate-100">Status dos Agendamentos</h3>
                <AppointmentStatusChart appointments={appointments} timeRange={timeRange} />
              </Card>

              <Card className="p-6 border-none shadow-sm lg:col-span-2 dark:bg-[#151A25] dark:border dark:border-slate-800">
                <h3 className="font-bold text-slate-800 mb-6 dark:text-slate-100">Origem dos Pacientes</h3>
                <LeadSourceChart patients={patients} />
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

