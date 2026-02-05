import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/lib/base44Client";
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, LineChart, Line
} from "recharts";
import { CalendarIcon, Download, Loader2, TrendingUp } from "lucide-react";
import { toast } from "sonner";

const statusConfig = {
  agendado: { label: "Agendado", color: "#E2E8F0" },
  confirmado: { label: "Confirmado", color: "#3B82F6" },
  aguardando: { label: "Aguardando", color: "#F59E0B" },
  em_atendimento: { label: "Em atendimento", color: "#8B5CF6" },
  finalizado: { label: "Finalizado", color: "#10B981" },
  faltou: { label: "Faltou", color: "#EF4444" },
  cancelado: { label: "Cancelado", color: "#6B7280" }
};

export default function AgendaReports() {
  const [dateRange, setDateRange] = useState({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) });
  const [selectedProfessional, setSelectedProfessional] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedType, setSelectedType] = useState("all");

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["appointments"],
    queryFn: () => base44.entities.Appointment.list("-date")
  });

  const { data: professionals = [] } = useQuery({
    queryKey: ["professionals"],
    queryFn: () => base44.entities.Professional.list()
  });

  // Filter appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter(apt => {
      const aptDate = parseISO(apt.date);
      const inDateRange = isWithinInterval(aptDate, { start: dateRange.from, end: dateRange.to });
      if (!inDateRange) return false;
      if (selectedProfessional !== "all" && apt.professional_id !== selectedProfessional) return false;
      if (selectedStatus !== "all" && apt.status !== selectedStatus) return false;
      if (selectedType !== "all" && apt.type !== selectedType) return false;
      return true;
    });
  }, [appointments, dateRange, selectedProfessional, selectedStatus, selectedType]);

  // Analytics
  const stats = useMemo(() => {
    const total = filteredAppointments.length;
    const finished = filteredAppointments.filter(a => a.status === "finalizado").length;
    const canceled = filteredAppointments.filter(a => a.status === "cancelado").length;
    const missed = filteredAppointments.filter(a => a.status === "faltou").length;
    
    const conversionRate = total > 0 ? ((finished / total) * 100).toFixed(1) : 0;
    const absenceRate = total > 0 ? ((missed / total) * 100).toFixed(1) : 0;

    return { total, finished, canceled, missed, conversionRate, absenceRate };
  }, [filteredAppointments]);

  // Chart Data: Appointments by Status
  const statusData = useMemo(() => {
    const counts = filteredAppointments.reduce((acc, apt) => {
      acc[apt.status] = (acc[apt.status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(statusConfig).map(([key, config]) => ({
      name: config.label,
      value: counts[key] || 0,
      color: config.color
    })).filter(d => d.value > 0);
  }, [filteredAppointments]);

  // Chart Data: Appointments by Professional
  const professionalData = useMemo(() => {
    const counts = filteredAppointments.reduce((acc, apt) => {
      const prof = professionals.find(p => p.id === apt.professional_id);
      const name = prof?.full_name || "Não atribuído";
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredAppointments, professionals]);

  // Chart Data: Appointments over time
  const timelineData = useMemo(() => {
    const days = filteredAppointments.reduce((acc, apt) => {
      const day = format(parseISO(apt.date), "dd/MM");
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(days)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredAppointments]);

  const handleExport = () => {
    toast.info("Exportação em CSV iniciada...");
    // Logic for CSV export would go here
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Relatórios da Agenda</h1>
          <p className="text-slate-500">Análise de desempenho e produtividade</p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="w-4 h-4 mr-2" />
          Exportar Dados
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Período</Label>
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dateRange.from, "dd/MM/yy")} - {format(dateRange.to, "dd/MM/yy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range) => range?.from && range?.to && setDateRange({ from: range.from, to: range.to })}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Profissional</Label>
            <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Profissionais</SelectItem>
                {professionals.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="consulta">Consulta</SelectItem>
                <SelectItem value="procedimento">Procedimento</SelectItem>
                <SelectItem value="compromisso">Compromisso</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 space-y-2">
          <p className="text-sm font-medium text-slate-500">Total de Agendamentos</p>
          <div className="flex items-baseline justify-between">
            <h3 className="text-3xl font-bold">{stats.total}</h3>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
        </Card>
        <Card className="p-6 space-y-2">
          <p className="text-sm font-medium text-slate-500">Taxa de Conversão</p>
          <div className="flex items-baseline justify-between">
            <h3 className="text-3xl font-bold">{stats.conversionRate}%</h3>
            <span className="text-xs font-medium text-emerald-600">Finalizados</span>
          </div>
        </Card>
        <Card className="p-6 space-y-2">
          <p className="text-sm font-medium text-slate-500">Taxa de Absenteísmo</p>
          <div className="flex items-baseline justify-between">
            <h3 className="text-3xl font-bold">{stats.absenceRate}%</h3>
            <span className="text-xs font-medium text-rose-600">Faltas</span>
          </div>
        </Card>
        <Card className="p-6 space-y-2">
          <p className="text-sm font-medium text-slate-500">Cancelamentos</p>
          <div className="flex items-baseline justify-between">
            <h3 className="text-3xl font-bold">{stats.canceled}</h3>
            <span className="text-xs font-medium text-slate-400">Total</span>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-6">Distribuição por Status</h3>
          <div className="h-[300px]">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                Sem dados para o período selecionado
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-6">Agendamentos por Profissional</h3>
          <div className="h-[300px]">
            {professionalData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={professionalData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                Sem dados para o período selecionado
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold mb-6">Volume de Agendamentos no Tempo</h3>
          <div className="h-[300px]">
            {timelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    dot={{ r: 4, fill: "#3B82F6" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                Sem dados para o período selecionado
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}




