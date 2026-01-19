import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format, addDays, startOfWeek, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  ChevronLeft, ChevronRight, Plus, CalendarIcon, Clock,
  MoreVertical, Loader2, Filter, Search, Send, X, Ban, RefreshCw
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

import AppointmentForm from "@/components/agenda/AppointmentForm";
import SendNotificationDialog from "@/components/agenda/SendNotificationDialog";
import TimeBlockDialog from "@/components/agenda/TimeBlockDialog";
import RescheduleDialog from "@/components/agenda/RescheduleDialog";
import AdvancedFilters from "@/components/agenda/AdvancedFilters";
import { createPageUrl } from "@/lib/utils";
import { Link } from "react-router-dom";
import { BarChart3 } from "lucide-react";

const statusConfig = {
  agendado: { label: "Agendado", class: "bg-slate-100 text-slate-700 border-slate-200" },
  confirmado: { label: "Confirmado", class: "bg-blue-100 text-blue-700 border-blue-200" },
  aguardando: { label: "Aguardando", class: "bg-amber-100 text-amber-700 border-amber-200" },
  em_atendimento: { label: "Em atendimento", class: "bg-violet-100 text-violet-700 border-violet-200" },
  finalizado: { label: "Finalizado", class: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  faltou: { label: "Faltou", class: "bg-rose-100 text-rose-700 border-rose-200" },
  cancelado: { label: "Cancelado", class: "bg-slate-100 text-slate-400 border-slate-200" },
};

// Função para determinar a cor do card baseado no profissional e tipo
const getAppointmentCardColor = (apt, professionals) => {
  const prof = professionals.find(p => p.id === apt.professional_id);
  const profName = prof?.full_name?.toLowerCase() || "";
  const procedureName = apt.procedure_name?.toLowerCase() || "";

  // Compromisso = Cinza
  if (apt.type === "compromisso") {
    return "border-l-slate-400 bg-slate-50/50";
  }

  return "border-l-primary bg-white";
};

// Helper to deduplicate professionals
const uniqueProfessionals = (profs) => {
  const seen = new Set();
  return profs.filter(p => {
    const duplicate = seen.has(p.id);
    seen.add(p.id);
    return !duplicate;
  });
};

export default function Agenda() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState("day"); // 'day' or 'week'
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [isTimeBlockOpen, setIsTimeBlockOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    professional_id: "all",
    status: "all",
  });

  // Queries
  const { data: rawProfessionals = [], isLoading: isLoadingProfs } = useQuery({
    queryKey: ["professionals"],
    queryFn: () => base44.read("Professional", {
      filter: { is_active: true },
      sort: [{ field: "full_name", direction: "asc" }]
    }),
  });

  const professionals = uniqueProfessionals(rawProfessionals);

  const { data: appointments = [], isLoading: isLoadingApts } = useQuery({
    queryKey: ["appointments", selectedDate, view, filters],
    queryFn: async () => {
      console.log("Agenda: Fetching appointments...");
      const start = view === "day" ? selectedDate : startOfWeek(selectedDate, { weekStartsOn: 0 });
      const end = addDays(start, view === "day" ? 1 : 7);

      const queryFilter: Record<string, any> = {
        date: {
          _gte: format(start, "yyyy-MM-dd"),
          _lt: format(end, "yyyy-MM-dd"),
        }
      };

      if (filters.professional_id !== "all") {
        queryFilter.professional_id = filters.professional_id;
      }
      if (filters.status !== "all") {
        queryFilter.status = filters.status;
      }

      console.log("Agenda: Query Params", { filter: queryFilter });

      const data = await base44.read("Appointment", {
        filter: queryFilter,
        include: ["patient", "professional"],
        sort: [{ field: "start_time", direction: "asc" }]
      });
      console.log("Agenda: Fetched data", data);
      return data;
    },
  });

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string | number, status: string }) => base44.update("Appointment", id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Status atualizado com sucesso");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.delete("Appointment", id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Agendamento removido");
    },
  });

  // Helpers
  const timeSlots = Array.from({ length: 21 }, (_, i) => {
    const hour = Math.floor(i / 2) + 8;
    const minutes = i % 2 === 0 ? "00" : "30";
    return `${hour.toString().padStart(2, "0")}:${minutes}`;
  });

  const filteredAppointments = (appointments || []).filter((apt: any) => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      apt.patient?.full_name?.toLowerCase().includes(search) ||
      apt.procedure_name?.toLowerCase().includes(search) ||
      apt.professional?.full_name?.toLowerCase().includes(search)
    );
  });

  const handleDateChange = (days) => {
    setSelectedDate(prev => addDays(prev, days));
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex flex-col gap-4 p-4 bg-white border-b md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-slate-900">Agenda</h1>
          <div className="flex items-center p-1 bg-slate-100 rounded-lg">
            <Button
              variant={view === "day" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("day")}
              className={view === "day" ? "shadow-sm bg-white" : ""}
            >
              Dia
            </Button>
            <Button
              variant={view === "week" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("week")}
              className={view === "week" ? "shadow-sm bg-white" : ""}
            >
              Semana
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 mr-2">
            <Button variant="outline" size="icon" onClick={() => handleDateChange(-1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="min-w-[200px] justify-start font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(selectedDate, "PPPP", { locale: ptBR })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Button variant="outline" size="icon" onClick={() => handleDateChange(1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedDate(new Date())}
              className="ml-1"
            >
              Hoje
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar..."
                className="pl-9 w-[200px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <AdvancedFilters
              professionals={professionals}
              filters={filters}
              setFilters={setFilters}
            />

            <Link to={createPageUrl("AgendaReports")}>
              <Button variant="outline" size="icon" title="Relatórios">
                <BarChart3 className="w-4 h-4" />
              </Button>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Novo
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => {
                  setSelectedAppointment(null);
                  setIsFormOpen(true);
                }}>
                  Agendamento
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsTimeBlockOpen(true)}>
                  Bloqueio de Horário
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto p-4">
        <div className="min-w-[800px] bg-white rounded-xl border shadow-sm overflow-hidden">
          {/* Grid Header */}
          <div className="grid grid-cols-[100px_1fr] border-b bg-slate-50/50">
            <div className="p-3 text-xs font-medium text-slate-500 text-center border-r">
              Horário
            </div>
            <div className={`grid ${view === "day" ? "grid-cols-1" : "grid-cols-7"}`}>
              {view === "day" ? (
                <div className="p-3 text-sm font-semibold text-slate-900 text-center">
                  {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
                </div>
              ) : (
                Array.from({ length: 7 }).map((_, i) => {
                  const date = addDays(startOfWeek(selectedDate, { weekStartsOn: 0 }), i);
                  const isToday = isSameDay(date, new Date());
                  return (
                    <div
                      key={i}
                      className={`p-3 text-center border-r last:border-r-0 ${isToday ? "bg-primary/5" : ""}`}
                    >
                      <div className="text-xs font-medium text-slate-500 uppercase">
                        {format(date, "EEE", { locale: ptBR })}
                      </div>
                      <div className={`text-lg font-bold ${isToday ? "text-primary" : "text-slate-900"}`}>
                        {format(date, "d")}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Grid Body */}
          <div className="relative">
            {timeSlots.map((time, i) => (
              <div key={time} className="grid grid-cols-[100px_1fr] border-b last:border-b-0 group">
                <div className="p-3 text-xs text-slate-400 text-center border-r bg-slate-50/30">
                  {time}
                </div>
                <div className={`grid ${view === "day" ? "grid-cols-1" : "grid-cols-7"} relative min-h-[60px]`}>
                  {view === "day" ? (
                    <div
                      className="absolute inset-0 hover:bg-slate-50/50 cursor-pointer transition-colors"
                      onClick={() => {
                        setSelectedAppointment({ start_time: time, date: format(selectedDate, "yyyy-MM-dd") });
                        setIsFormOpen(true);
                      }}
                    />
                  ) : (
                    Array.from({ length: 7 }).map((_, j) => (
                      <div
                        key={j}
                        className="border-r last:border-r-0 hover:bg-slate-50/50 cursor-pointer transition-colors"
                        onClick={() => {
                          const date = addDays(startOfWeek(selectedDate, { weekStartsOn: 0 }), j);
                          setSelectedAppointment({ start_time: time, date: format(date, "yyyy-MM-dd") });
                          setIsFormOpen(true);
                        }}
                      />
                    ))
                  )}
                </div>
              </div>
            ))}

            {/* Appointments Overlay */}
            {filteredAppointments.map((apt) => {
              const start = parseISO(`${apt.date}T${apt.start_time}`);
              const end = parseISO(`${apt.date}T${apt.end_time}`);
              const duration = (end.getTime() - start.getTime()) / (1000 * 60);

              // Calculate position
              const [hours, minutes] = apt.start_time.split(":").map(Number);
              const top = ((hours - 8) * 2 + (minutes >= 30 ? 1 : 0)) * 60;
              const height = (duration / 30) * 60;

              // Calculate horizontal position for week view
              let left = "0";
              let width = "100%";
              if (view === "week") {
                // Ensure date string YYYY-MM-DD is parsed as local date
                const [y, m, d] = apt.date.split("-").map(Number);
                const localDate = new Date(y, m - 1, d);
                const dayIndex = localDate.getDay();
                left = `${(dayIndex * 100) / 7}%`;
                width = `${100 / 7}%`;
              }

              const status = statusConfig[apt.status] || statusConfig.agendado;

              const professional = apt.professional || professionals?.find((p: any) => p.id === apt.professional_id);
              const professionalName = professional?.full_name || "Dr(a).";

              return (
                <div
                  key={apt.id}
                  className={`absolute p-1 transition-all z-10`}
                  style={{ top: `${top}px`, height: `${height}px`, left, width }}
                >
                  <Card
                    className={`h-full border-l-4 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col ${getAppointmentCardColor(apt, professionals)}`}
                    onClick={() => {
                      setSelectedAppointment(apt);
                      setIsFormOpen(true);
                    }}
                  >
                    <div className="p-2 flex flex-col h-full gap-0.5">
                      <div className="flex items-center gap-1 font-bold text-[10px] text-slate-700 leading-tight">
                        <span>{apt.start_time}</span>
                        <span className="truncate flex-1">- {apt.patient?.full_name?.split(" ")[0]}</span>
                        <Badge variant="outline" className={`text-[8px] px-1 py-0 h-3 border-none shrink-0 ${status.class}`}>
                          {status.label}
                        </Badge>
                      </div>

                      <div className="flex flex-col">
                        <p className="text-[10px] items-center text-slate-600 line-clamp-1 leading-tight font-medium">
                          {apt.procedure_name && <span className="uppercase">{apt.procedure_name}</span>}
                        </p>
                        <p className="text-[9px] text-slate-500 line-clamp-1 leading-tight">
                          {apt.type} • {professionalName}
                        </p>
                        <p className="text-[9px] text-slate-400 mt-0.5">
                          {apt.start_time} - {apt.end_time}
                        </p>
                      </div>

                      <div className="mt-auto flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-slate-400 hover:text-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAppointment(apt);
                            setIsNotificationOpen(true);
                          }}
                        >
                          <Send className="w-3 h-3" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-slate-400"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="w-3 h-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAppointment(apt);
                              setIsRescheduleOpen(true);
                            }}>
                              Reagendar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {Object.entries(statusConfig).map(([key, config]) => (
                              <DropdownMenuItem
                                key={key}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateStatusMutation.mutate({ id: apt.id, status: key });
                                }}
                              >
                                Marcar como {config.label}
                              </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-rose-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm("Deseja realmente excluir este agendamento?")) {
                                  deleteMutation.mutate(apt.id);
                                }
                              }}
                            >
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </div >

      {/* Dialogs */}
      <AppointmentForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        appointment={selectedAppointment}
        professionals={professionals}
      />

      <RescheduleDialog
        open={isRescheduleOpen}
        onOpenChange={setIsRescheduleOpen}
        appointment={selectedAppointment}
      />

      <TimeBlockDialog
        open={isTimeBlockOpen}
        onOpenChange={setIsTimeBlockOpen}
        professionals={professionals}
      />

      <SendNotificationDialog
        open={isNotificationOpen}
        onOpenChange={setIsNotificationOpen}
        appointment={selectedAppointment}
      />
    </div>
  );
}
