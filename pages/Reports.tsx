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
    <div className="min-h-screen bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Relatórios</h1>
            <p className="text-slate-500 mt-1">Análise de desempenho da clínica</p>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px] bg-white">
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
              <Card className="p-6 border-none shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Total Consultas</p>
                    <h3 className="text-2xl font-bold text-slate-900">{totalAppointments}</h3>
                  </div>
                </div>
              </Card>
              <Card className="p-6 border-none shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Pacientes Ativos</p>
                    <h3 className="text-2xl font-bold text-slate-900">{totalPatients}</h3>
                  </div>
                </div>
              </Card>
              <Card className="p-6 border-none shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Faturamento Total</p>
                    <h3 className="text-2xl font-bold text-slate-900">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalRevenue)}
                    </h3>
                  </div>
                </div>
              </Card>
              <Card className="p-6 border-none shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Ticket Médio</p>
                    <h3 className="text-2xl font-bold text-slate-900">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(avgTicket)}
                    </h3>
                  </div>
                </div>
              </Card>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="p-6 border-none shadow-sm">
                <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  Volume de Atendimentos
                </h3>
                <AppointmentsByMonthChart appointments={appointments} />
              </Card>

              <Card className="p-6 border-none shadow-sm">
                <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  Faturamento por Profissional
                </h3>
                <RevenueByProfessionalChart appointments={appointments} professionals={professionals} />
              </Card>

              <Card className="p-6 border-none shadow-sm">
                <h3 className="font-bold text-slate-800 mb-6">Procedimentos mais Realizados</h3>
                <ProceduresChart appointments={appointments} />
              </Card>

              <Card className="p-6 border-none shadow-sm">
                <h3 className="font-bold text-slate-800 mb-6">Status dos Agendamentos</h3>
                <AppointmentStatusChart appointments={appointments} />
              </Card>

              <Card className="p-6 border-none shadow-sm lg:col-span-2">
                <h3 className="font-bold text-slate-800 mb-6">Origem dos Pacientes (Leads)</h3>
                <LeadSourceChart patients={patients} />
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

