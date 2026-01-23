import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/lib/base44Client";
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
  MoreVertical, Loader2, Filter, Search, Send, X, Ban, RefreshCw, BarChart3, LayoutList, Calendar as CalendarLucide
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Link, useOutletContext } from "react-router-dom"; // Added useOutletContext
import { cn, createPageUrl } from "@/lib/utils";

import AppointmentForm from "@/components/agenda/AppointmentForm";
import SendNotificationDialog from "@/components/agenda/SendNotificationDialog";
import TimeBlockDialog from "@/components/agenda/TimeBlockDialog";
import RescheduleDialog from "@/components/agenda/RescheduleDialog";
import AdvancedFilters from "@/components/agenda/AdvancedFilters";

const statusConfig = {
  agendado: {
    label: "Agendado",
    class: "bg-gradient-to-r from-slate-100 to-slate-50 text-slate-700 border border-slate-200 dark:from-slate-800 dark:to-slate-900 dark:text-slate-300 dark:border-slate-700 shadow-sm"
  },
  confirmado: {
    label: "Confirmado",
    class: "bg-gradient-to-r from-blue-100 to-cyan-50 text-blue-700 border border-blue-200 dark:from-blue-900/30 dark:to-cyan-900/20 dark:text-blue-400 dark:border-blue-800 shadow-sm"
  },
  aguardando: {
    label: "Aguardando",
    class: "bg-gradient-to-r from-amber-100 to-orange-50 text-amber-700 border border-amber-200 dark:from-amber-900/30 dark:to-orange-900/20 dark:text-amber-400 dark:border-amber-800 shadow-sm"
  },
  em_atendimento: {
    label: "Em atendimento",
    class: "bg-gradient-to-r from-violet-100 to-purple-50 text-violet-700 border border-violet-200 dark:from-violet-900/30 dark:to-purple-900/20 dark:text-violet-400 dark:border-violet-800 shadow-sm"
  },
  finalizado: {
    label: "Finalizado",
    class: "bg-gradient-to-r from-emerald-100 to-teal-50 text-emerald-700 border border-emerald-200 dark:from-emerald-900/30 dark:to-teal-900/20 dark:text-emerald-400 dark:border-emerald-800 shadow-sm"
  },
  faltou: {
    label: "Faltou",
    class: "bg-gradient-to-r from-rose-100 to-pink-50 text-rose-700 border border-rose-200 dark:from-rose-900/30 dark:to-pink-900/20 dark:text-rose-400 dark:border-rose-800 shadow-sm"
  },
  cancelado: {
    label: "Cancelado",
    class: "bg-gradient-to-r from-slate-100 to-slate-50 text-slate-400 border border-slate-200 dark:from-slate-800 dark:to-slate-900 dark:text-slate-500 dark:border-slate-700 shadow-sm"
  },
};

// Função para determinar a cor do card baseado no profissional e tipo
const getAppointmentCardColor = (apt, isDark) => {
  // Compromisso = Cinza
  if (apt.type === "compromisso") {
    return isDark ? "border-l-slate-600 bg-gradient-to-r from-slate-800/80 to-slate-900/80" : "border-l-slate-400 bg-gradient-to-r from-slate-50 to-white";
  }
  return isDark
    ? "border-l-indigo-500 bg-gradient-to-r from-[#1C2333] to-[#232936] hover:from-[#232936] hover:to-[#2A303F]"
    : "border-l-indigo-500 bg-gradient-to-r from-white to-slate-50/50 hover:to-indigo-50/30";
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
  const { isDark } = useOutletContext<{ isDark: boolean }>();
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
    queryFn: () => base44.list("Professional", {
      sort: [{ field: "full_name", direction: "asc" }]
    }),
  });

  const professionals = uniqueProfessionals(rawProfessionals);

  const { data: appointments = [], isLoading: isLoadingApts } = useQuery({
    queryKey: ["appointments", selectedDate, view, filters],
    queryFn: async () => {
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

      const data = await base44.list("Appointment", {
        filter: queryFilter,
        include: ["patient", "professional"],
        sort: [{ field: "start_time", direction: "asc" }]
      });
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
    mutationFn: (id: string | number) => base44.delete("Appointment", id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Agendamento removido");
    },
  });

  // Helpers
  const timeSlots = Array.from({ length: 25 }, (_, i) => {
    const hour = Math.floor(i / 2) + 7; // Start at 07:00
    const minutes = i % 2 === 0 ? "00" : "30";
    return `${hour.toString().padStart(2, "0")}:${minutes}`;
  });

  const filteredAppointments = (appointments || []).filter((apt: any) => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      (apt.patient?.full_name || "").toLowerCase().includes(search) ||
      (apt.procedure_name || "").toLowerCase().includes(search) ||
      (apt.professional?.full_name || "").toLowerCase().includes(search)
    );
  });

  const handleDateChange = (days) => {
    setSelectedDate(prev => addDays(prev, days));
  };

  return (
    <div className={cn(
      "flex flex-col h-full rounded-2xl shadow-sm border overflow-hidden",
      isDark ? "bg-[#151A25] border-slate-800" : "bg-white border-slate-200"
    )}>
      {/* Header Premium */}
      <div className={cn(
        "flex flex-col gap-4 p-5 border-b md:flex-row md:items-center md:justify-between sticky top-0 z-20",
        isDark ? "bg-[#0B0E14] border-slate-800" : "bg-white border-slate-100"
      )}>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <h1 className={cn("text-2xl font-bold tracking-tight", isDark ? "text-white" : "text-slate-900")}>Agenda</h1>
            <Badge variant="secondary" className={cn("ml-2 font-medium", isDark ? "bg-indigo-500/20 text-indigo-300" : "bg-indigo-50 text-indigo-600")}>
              {view === "day" ? "Diária" : "Semanal"}
            </Badge>
          </div>

          <div className={cn(
            "flex items-center p-1 rounded-xl border shadow-sm hidden md:flex",
            isDark ? "bg-[#1C2333] border-slate-700" : "bg-slate-50 border-slate-200"
          )}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setView("day")}
              className={cn(
                "rounded-lg px-4 text-xs font-medium transition-all",
                view === "day"
                  ? (isDark ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "bg-white text-indigo-600 shadow-sm")
                  : (isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-900")
              )}
            >
              <LayoutList className="w-3.5 h-3.5 mr-2" />
              Dia
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setView("week")}
              className={cn(
                "rounded-lg px-4 text-xs font-medium transition-all",
                view === "week"
                  ? (isDark ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "bg-white text-indigo-600 shadow-sm")
                  : (isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-900")
              )}
            >
              <CalendarLucide className="w-3.5 h-3.5 mr-2" />
              Semana
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className={cn("flex items-center gap-1 p-1 rounded-lg border", isDark ? "border-slate-700 bg-[#1C2333]" : "border-slate-200 bg-white")}>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDateChange(-1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" className={cn("h-8 min-w-[160px] justify-center font-medium", isDark ? "text-slate-200" : "text-slate-700")}>
                  {format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDateChange(1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedDate(new Date())}
            className={cn("h-10 border-dashed", isDark ? "border-slate-700 hover:bg-slate-800" : "border-slate-300")}
          >
            Hoje
          </Button>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden md:block"></div>

          <div className="flex items-center gap-2">
            <AdvancedFilters
              professionals={professionals}
              filters={filters}
              setFilters={setFilters}
            />

            <Link to={createPageUrl("AgendaReports")}>
              <Button variant="ghost" size="icon" title="Relatórios" className={cn("h-10 w-10", isDark ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-500 hover:text-indigo-600 hover:bg-indigo-50")}>
                <BarChart3 className="w-5 h-5" />
              </Button>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className={cn(
                  "gap-2 shadow-lg transition-all hover:scale-105 active:scale-95",
                  isDark ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20" : "bg-slate-900 hover:bg-slate-800 text-white shadow-slate-300"
                )}>
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Novo</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className={isDark ? "bg-[#1C2333] border-slate-700 text-slate-200" : ""}>
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

      {/* Calendar Grid Container */}
      <div className={cn("flex-1 overflow-auto relative scrollbar-thin", isDark ? "scrollbar-thumb-slate-700 scrollbar-track-transparent" : "scrollbar-thumb-slate-300")}>
        <div className="min-w-[800px] bg-transparent pb-10">

          {/* Calendar Header Row */}
          <div className={cn(
            "grid grid-cols-[80px_1fr] sticky top-0 z-30 border-b backdrop-blur-sm",
            isDark ? "bg-[#0B0E14]/90 border-slate-800" : "bg-white/95 border-slate-100"
          )}>
            <div className={cn("p-4 text-xs font-semibold uppercase tracking-wider text-center border-r flex items-center justify-center", isDark ? "text-slate-500 border-slate-800" : "text-slate-400 border-slate-100")}>
              Horário
            </div>
            <div className={cn("grid", view === "day" ? "grid-cols-1" : "grid-cols-7")}>
              {view === "day" ? (
                <div className="p-3 flex flex-col items-center justify-center">
                  <div className={cn("text-xs font-medium uppercase tracking-widest mb-1", isDark ? "text-indigo-400" : "text-indigo-600")}>
                    {format(selectedDate, "MMMM", { locale: ptBR })}
                  </div>
                  <div className={cn("text-2xl font-bold", isDark ? "text-white" : "text-slate-900")}>
                    {format(selectedDate, "EEEE, d", { locale: ptBR })}
                  </div>
                </div>
              ) : (
                Array.from({ length: 7 }).map((_, i) => {
                  const date = addDays(startOfWeek(selectedDate, { weekStartsOn: 0 }), i);
                  const isToday = isSameDay(date, new Date());
                  return (
                    <div
                      key={i}
                      className={cn(
                        "p-3 text-center border-r last:border-r-0 flex flex-col items-center gap-1 transition-colors",
                        isDark ? "border-slate-800" : "border-slate-100",
                        isToday ? (isDark ? "bg-indigo-500/10" : "bg-indigo-50/50") : ""
                      )}
                    >
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-wider",
                        isToday ? "text-indigo-500" : (isDark ? "text-slate-500" : "text-slate-400")
                      )}>
                        {format(date, "EEE", { locale: ptBR })}
                      </span>
                      <div className={cn(
                        "w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold transition-all",
                        isToday
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-110"
                          : (isDark ? "text-slate-300" : "text-slate-700")
                      )}>
                        {format(date, "d")}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Calendar Body (Time Slots) */}
          <div className="relative">
            {timeSlots.map((time, i) => (
              <div key={time} className={cn("grid grid-cols-[80px_1fr] group min-h-[50px]", i === timeSlots.length - 1 ? "" : "border-b", isDark ? "border-slate-800/50" : "border-slate-100")}>
                {/* Time Label */}
                <div className={cn("relative p-2 text-xs font-medium text-center border-r flex items-start justify-center pt-3", isDark ? "text-slate-500 border-slate-800 bg-[#11141D]" : "text-slate-400 border-slate-100 bg-slate-50/30")}>
                  {time.endsWith("00") ? <span className={isDark ? "text-slate-400" : "text-slate-600"}>{time}</span> : <span className="opacity-0 group-hover:opacity-50 transition-opacity">{time}</span>}
                </div>

                {/* Slot Cells */}
                <div className={cn("grid relative", view === "day" ? "grid-cols-1" : "grid-cols-7")}>
                  {view === "day" ? (
                    <div
                      className={cn("relative transition-colors border-l-0", isDark ? "hover:bg-slate-800/30" : "hover:bg-slate-50")}
                      onClick={() => {
                        setSelectedAppointment({ start_time: time, date: format(selectedDate, "yyyy-MM-dd") });
                        setIsFormOpen(true);
                      }}
                    >
                      {/* Half-hour guideline */}
                      <div className={cn("absolute top-1/2 w-full border-t border-dashed pointer-events-none opacity-20", isDark ? "border-slate-700" : "border-slate-300")}></div>
                    </div>
                  ) : (
                    Array.from({ length: 7 }).map((_, j) => (
                      <div
                        key={j}
                        className={cn(
                          "border-l relative transition-colors cursor-pointer",
                          isDark ? "border-slate-800/50 hover:bg-slate-800/30" : "border-slate-100 hover:bg-slate-50",
                          j === 0 && "border-l-0"
                        )}
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

            {/* Render Appointments Absolute Overlay */}
            {filteredAppointments.map((apt) => {
              const start = parseISO(`${apt.date}T${apt.start_time}`);
              const end = parseISO(`${apt.date}T${apt.end_time}`);
              const duration = (end.getTime() - start.getTime()) / (1000 * 60);

              // Calculate position
              // Base time is 7:00 (index 0). Each slot is 30 mins (height 50px).
              // Need to map time to px.
              const [h, m] = apt.start_time.split(":").map(Number);
              const minutesSince7 = (h - 7) * 60 + m;
              const slots = minutesSince7 / 30;
              // Each slot row is min-h-[50px]
              const ROW_HEIGHT = 50;
              const top = slots * ROW_HEIGHT;
              const height = (duration / 30) * ROW_HEIGHT;

              let left = "0";
              let width = "100%";

              if (view === "week" && apt.date) {
                const [y, mm, d] = apt.date.split("-").map(Number); // parse date string parts
                const localDate = new Date(y, mm - 1, d); // Construct date
                const dayIndex = localDate.getDay(); // 0 (Sun) - 6 (Sat). Our week starts on Sun (0) per startOfWeek logic above.

                // Adjust for week start 0
                const colWidth = 100 / 7;
                left = `${dayIndex * colWidth}%`;
                width = `${colWidth}%`;
              }

              // Adjust left buffer slightly to avoid border overlap
              const style = {
                top: `${top}px`,
                height: `${height - 2}px`,
                left: `calc(${left} + 2px)`, // +2px margin
                width: `calc(${width} - 4px)` // -4px margin total
              };

              const status = statusConfig[apt.status] || statusConfig.agendado;
              const professional = apt.professional || professionals?.find((p: any) => p.id === apt.professional_id);
              const professionalName = professional?.full_name ? professional.full_name.split(" ")[0] : "";

              return (
                <div
                  key={apt.id}
                  className="absolute z-10 pl-[80px] pointer-events-none w-full" // Offset by timeline width
                  style={{ top: 0, bottom: 0, left: 0, right: 0 }}
                >
                  <div className="relative w-full h-full pointer-events-none">
                    <Card
                      className={cn(
                        "absolute shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer overflow-hidden flex flex-col pointer-events-auto",
                        "border-l-[3px] rounded-r-xl rounded-l-sm border-y border-r backdrop-blur-sm",
                        getAppointmentCardColor(apt, isDark),
                        isDark
                          ? "border-slate-700/50 shadow-black/20"
                          : "border-slate-200/60 shadow-indigo-100/50"
                      )}
                      style={style}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAppointment(apt);
                        setIsFormOpen(true);
                      }}
                    >
                      <div className="p-2 flex flex-col h-full gap-0.5 relative z-10">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={cn(
                            "text-[10px] font-bold px-1.5 py-0.5 rounded-[4px] tracking-tight",
                            isDark ? "bg-black/20 text-white/90" : "bg-white/60 text-indigo-900/80"
                          )}>
                            {apt.start_time}
                          </span>
                          <span className={cn(
                            "text-xs font-semibold truncate tracking-tight",
                            isDark ? "text-slate-100" : "text-slate-900"
                          )}>
                            {apt.patient?.full_name?.split(" ")[0] || "Paciente"}
                          </span>
                        </div>

                        {height > 40 && (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 h-4 border-0 shadow-none font-medium rounded-md bg-opacity-70 backdrop-blur-md", status.class)}>
                              {status.label}
                            </Badge>
                            {/* ... */}
                            {view !== "week" && <span className={cn("text-[9px] opacity-50", isDark ? "text-slate-400" : "text-slate-500")}>•</span>}
                            {apt.procedure_name && (
                              <span className={cn("text-[9px] font-medium uppercase tracking-wide truncate opacity-70", isDark ? "text-slate-300" : "text-slate-600")}>
                                {apt.procedure_name}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Hover Actions */}
                        <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                  "h-6 w-6 rounded-lg transition-colors",
                                  isDark ? "hover:bg-black/20 text-slate-300 hover:text-white" : "hover:bg-white/50 text-slate-500 hover:text-indigo-700"
                                )}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="w-3.5 h-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className={cn("min-w-[140px]", isDark ? "bg-[#1C2333] border-slate-700 text-slate-200" : "")}>
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAppointment(apt);
                                setIsRescheduleOpen(true);
                              }}>
                                Reagendar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className={isDark ? "bg-slate-700" : ""} />
                              {Object.entries(statusConfig).map(([key, config]) => (
                                <DropdownMenuItem
                                  key={key}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateStatusMutation.mutate({ id: apt.id, status: key });
                                  }}
                                >
                                  <span className={cn("w-2 h-2 rounded-full mr-2", config.class.split(" ")[0])}></span>
                                  {config.label}
                                </DropdownMenuItem>
                              ))}
                              <DropdownMenuSeparator className={isDark ? "bg-slate-700" : ""} />
                              <DropdownMenuItem
                                className="text-rose-500 focus:text-rose-500"
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

