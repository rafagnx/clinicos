import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  MoreVertical, Loader2, Filter, Search, Send, X, Ban, RefreshCw, BarChart3, LayoutList, Calendar as CalendarLucide, Sparkles
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
import { getHolidays } from "@/utils/holidays";
import { supabase } from "@/lib/supabaseClient";

import AppointmentForm from "@/components/agenda/AppointmentForm";
import SendNotificationDialog from "@/components/agenda/SendNotificationDialog";
import TimeBlockDialog from "@/components/agenda/TimeBlockDialog";
import RescheduleDialog from "@/components/agenda/RescheduleDialog";
import AdvancedFilters from "@/components/agenda/AdvancedFilters";
import BlockDayModal from "@/components/agenda/BlockDayModal";
import { AgendaLegend } from "@/components/agenda/AgendaLegend";
import MobileAgendaView from "@/components/agenda/MobileAgendaView";

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

const typeConfig: any = {
  "Consulta": { color: "text-blue-500", border: "border-l-blue-500", bg: "bg-blue-500/10" },
  "Retorno": { color: "text-amber-500", border: "border-l-amber-500", bg: "bg-amber-500/10" },
  "Exame": { color: "text-purple-500", border: "border-l-purple-500", bg: "bg-purple-500/10" },
  "Procedimento": { color: "text-emerald-500", border: "border-l-emerald-500", bg: "bg-emerald-500/10" },
  "Encaixe": { color: "text-rose-500", border: "border-l-rose-500", bg: "bg-rose-500/10" },
  "Compromisso": { color: "text-slate-500", border: "border-l-slate-500", bg: "bg-slate-500/10" },
  "bloqueio": { color: "text-white dark:text-white", border: "border-l-slate-800 dark:border-l-slate-500", bg: "bg-slate-600 dark:bg-slate-800" },
};

// Função para determinar a cor do card baseado no profissional e tipo
// Helper to safely parse time string (HH:mm or ISO)
const parseTime = (timeStr: string) => {
  if (!timeStr) return { h: 0, m: 0, str: "00:00" };

  // ISO Format (2026-01-29T10:30:00.000Z)
  if (timeStr.includes("T")) {
    const date = new Date(timeStr);
    if (!isNaN(date.getTime())) {
      const h = date.getHours();
      const m = date.getMinutes();
      return { h, m, str: `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}` };
    }
  }

  // Simple HH:mm
  if (timeStr.includes(":")) {
    const [hStr, mStr] = timeStr.split(":");
    const h = parseInt(hStr || "0");
    const m = parseInt(mStr || "0");
    return { h, m, str: `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}` };
  }

  return { h: 0, m: 0, str: "00:00" };
};

// Função para determinar a cor do card baseado no profissional e tipo
const getAppointmentCardColor = (apt, isDark) => {
  if (!apt) return "";

  const glassBase = isDark ? "bg-slate-900/40 backdrop-blur-md" : "bg-white/40 backdrop-blur-md";

  // 1. By Status
  if (apt.status === "finalizado") return cn(glassBase, "border-l-emerald-500 shadow-emerald-500/10");
  if (apt.status === "cancelado") return cn(glassBase, "border-l-slate-400 opacity-60 shadow-none");
  if (apt.status === "faltou") return cn(glassBase, "border-l-rose-500 shadow-rose-500/10");

  // 2. By Type
  if (apt.type === "Compromisso") return cn(glassBase, "border-l-slate-500 grayscale");
  if (apt.type === "Retorno") return cn(glassBase, "border-l-amber-500 shadow-amber-500/10");

  // 3. By Professional (Vibrant Gradients)
  const vibrantGrades = [
    cn(glassBase, "border-l-blue-500 shadow-blue-500/10"),
    cn(glassBase, "border-l-indigo-500 shadow-indigo-500/10"),
    cn(glassBase, "border-l-purple-500 shadow-purple-500/10"),
    cn(glassBase, "border-l-cyan-500 shadow-cyan-500/10"),
  ];

  const hash = String(apt.professional_id || "").split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return vibrantGrades[hash % vibrantGrades.length];
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
  const [view, setView] = useState<'day' | 'week'>("day"); // 'day' or 'week'
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [isTimeBlockOpen, setIsTimeBlockOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isBlockDayOpen, setIsBlockDayOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    professional_id: "all",
    status: "all",
  });
  const [isMobile, setIsMobile] = useState(false);

  // Check for mobile viewport
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch current user professional profile to auto-select in block modal
  const { data: currentProfessional } = useQuery({
    queryKey: ["me-professional"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) return null;

      const profs = await base44.list("Professional", {
        filter: { email: user.email, limit: 1 }
      });
      return profs?.[0] || null;
    },
    staleTime: 1000 * 60 * 30 // 30 mins
  });

  // Queries
  const { data: rawProfessionals = [], isLoading: isLoadingProfs } = useQuery({
    queryKey: ["professionals"],
    queryFn: async () => {
      const data = await base44.list("Professional", {
        sort: [{ field: "full_name", direction: "asc" }]
      });
      // Filter for valid agenda roles
      return data.filter(p => {
        const role = (p.role_type || "").toLowerCase();
        const specialty = (p.specialty || "").toLowerCase();
        // Allow: HOF, Biomédico, Doutor, Esteticista, Dentista
        // Removed "profissional" as it's too generic and includes staff
        return ["hof", "biomedico", "biomédico", "doutor", "medico", "médico", "esteticista", "dentista", "profissional"].some(r => role.includes(r) || specialty.includes(r));
      });
    },
  });


  const professionals = uniqueProfessionals(rawProfessionals);

  // Fetch Patients for robust name lookup
  const { data: patients = [] } = useQuery({
    queryKey: ["patients-list"],
    queryFn: () => base44.list("Patient", { limit: 1000 }), // Fetch list for lookup
    staleTime: 1000 * 60 * 5 // Cache for 5 mins
  });

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

  // Enrich appointments with patient/professional data from separate queries
  const enrichedAppointments = React.useMemo(() => {
    if (!appointments || appointments.length === 0) return [];

    const patientMap = new Map(patients.map(p => [String(p.id), p]));
    const professionalMap = new Map(professionals.map(p => [String(p.id), p]));

    return appointments.map(apt => ({
      ...apt,
      patient: apt.patient || patientMap.get(String(apt.patient_id)) || { full_name: 'Paciente' },
      professional: apt.professional || professionalMap.get(String(apt.professional_id)) || { full_name: 'Profissional' }
    }));
  }, [appointments, patients, professionals]);

  // Fetch blocked days (keep existing)
  const { data: blockedDays = [] } = useQuery({
    queryKey: ["blocked-days", selectedDate, view, filters.professional_id],
    queryFn: async () => {
      const start = view === "day" ? selectedDate : startOfWeek(selectedDate, { weekStartsOn: 0 });
      const end = addDays(start, view === "day" ? 1 : 7);

      const params: any = {
        startDate: format(start, "yyyy-MM-dd"),
        endDate: format(end, "yyyy-MM-dd")
      };

      if (filters.professional_id !== "all") {
        params.professionalId = parseInt(filters.professional_id);
      }

      try {
        return await base44.blockedDays.list(params);
      } catch (err) {
        console.error('Error fetching blocked days:', err);
        return [];
      }
    },
  });

  // Local Holidays Calculation (Reliable)
  const holidays = React.useMemo(() => {
    return getHolidays(selectedDate.getFullYear());
  }, [selectedDate]);

  // Helper functions for blocked days and holidays
  const isDayBlocked = (date: Date) => {
    if (!blockedDays || blockedDays.length === 0) return false;
    const target = format(date, 'yyyy-MM-dd');

    return blockedDays.some((block: any) => {
      const s = block.start_date;
      const e = block.end_date;
      if (!s || !e) return false;

      // Ensure we compare strings in YYYY-MM-DD format
      const start = typeof s === 'string' ? s.split('T')[0] : format(new Date(s), 'yyyy-MM-dd');
      const end = typeof e === 'string' ? e.split('T')[0] : format(new Date(e), 'yyyy-MM-dd');

      return target >= start && target <= end;
    });
  };

  const getBlockReason = (date: Date) => {
    if (!blockedDays || blockedDays.length === 0) return null;
    const target = format(date, 'yyyy-MM-dd');

    const block = blockedDays.find((b: any) => {
      const s = b.start_date;
      const e = b.end_date;
      if (!s || !e) return false;

      const start = typeof s === 'string' ? s.split('T')[0] : format(new Date(s), 'yyyy-MM-dd');
      const end = typeof e === 'string' ? e.split('T')[0] : format(new Date(e), 'yyyy-MM-dd');

      return target >= start && target <= end;
    });

    return block?.reason || 'Bloqueado';
  };

  const getDayHoliday = (date: Date) => {
    if (!holidays || holidays.length === 0) return null;
    return holidays.find((h) => isSameDay(h.date, date));
  };

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

  const deleteBlockedDayMutation = useMutation({
    mutationFn: (id: string | number) => base44.blockedDays.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blocked-days"] });
      toast.success("Dia desbloqueado com sucesso!");
    },
    onError: () => toast.error("Erro ao desbloquear o dia.")
  });

  // Helpers
  const timeSlots = Array.from({ length: 25 }, (_, i) => {
    const hour = Math.floor(i / 2) + 7; // Start at 07:00
    const minutes = i % 2 === 0 ? "00" : "30";
    return `${hour.toString().padStart(2, "0")}:${minutes}`;
  });

  const filteredAppointments = (enrichedAppointments || []).filter((apt: any) => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      (apt.patient?.full_name || apt.patient?.name || "").toLowerCase().includes(search) ||
      (apt.procedure_name || "").toLowerCase().includes(search) ||
      (apt.professional?.full_name || "").toLowerCase().includes(search)
    );
  });

  const handleDateChange = (days) => {
    setSelectedDate(prev => addDays(prev, days));
  };


  return (
    <>
      {isMobile ? (
        <MobileAgendaView
          date={selectedDate}
          onDateChange={handleDateChange}
          onToday={() => setSelectedDate(new Date())}
          appointments={filteredAppointments}
          blockedDays={blockedDays}
          holidays={holidays}
          isDark={isDark}
          onSelectAppointment={(apt) => {
            setSelectedAppointment(apt);
            setIsFormOpen(true);
          }}
          onNewAppointment={() => {
            setSelectedAppointment(null);
            setIsFormOpen(true);
          }}
          view={view}
          onViewChange={setView}
          holiday={getDayHoliday(selectedDate)}
        />
      ) : (
        <div className={cn("px-4 md:px-6 lg:px-4 pb-4 md:pb-6 lg:pb-4 pt-0 max-w-[1600px] mx-auto space-y-4 md:space-y-6 min-h-screen relative overflow-hidden flex flex-col")}>
          {/* Header Liquid Scale */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10"
          >
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[8px] font-black uppercase tracking-widest mb-1 backdrop-blur-md">
                <CalendarLucide className="w-2.5 h-2.5" /> GESTÃO DE FLUXO
              </div>
              <h1 className={cn("text-3xl md:text-5xl font-black mb-1 tracking-tighter leading-[0.85] filter drop-shadow-sm", isDark ? "text-white" : "text-slate-900")}>
                AGENDA <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 animate-gradient-x select-none">INTEGRADA</span>
              </h1>
              <p className={cn("text-xs md:text-sm font-bold tracking-tight opacity-60 flex items-center gap-2", isDark ? "text-slate-400" : "text-slate-600")}>
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                Otimize o tempo e maximize os resultados da clínica.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* View Selector Glass */}
              <div className={cn(
                "flex p-1.5 rounded-2xl glass-premium border-white/5",
                isDark ? "bg-slate-950/60" : "bg-white/60"
              )}>
                <button
                  onClick={() => setView("day")}
                  className={cn(
                    "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300 relative overflow-hidden group/btn",
                    view === "day"
                      ? "text-white shadow-lg"
                      : (isDark ? "text-slate-500 hover:text-slate-300" : "text-slate-500 hover:text-slate-900")
                  )}
                >
                  <span className="relative z-10">Dia</span>
                  {view === "day" && (
                    <motion.div
                      layoutId="view-bg"
                      className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </button>
                <button
                  onClick={() => setView("week")}
                  className={cn(
                    "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300 relative overflow-hidden group/btn",
                    view === "week"
                      ? "text-white shadow-lg"
                      : (isDark ? "text-slate-500 hover:text-slate-300" : "text-slate-500 hover:text-slate-900")
                  )}
                >
                  <span className="relative z-10">Semana</span>
                  {view === "week" && (
                    <motion.div
                      layoutId="view-bg"
                      className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className={cn(
                  "flex items-center gap-1 p-1 rounded-xl glass-premium border-white/5",
                  isDark ? "bg-slate-950/40" : "bg-white/40"
                )}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-white/10 rounded-lg"
                    onClick={() => handleDateChange(-1)}
                  >
                    <ChevronLeft className="w-4 h-4 text-slate-500" />
                  </Button>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" className={cn("h-8 min-w-[120px] justify-center font-bold text-[10px] uppercase tracking-widest hover:bg-white/10 rounded-lg", isDark ? "text-slate-200" : "text-slate-700")}>
                        {format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="center">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => date && setSelectedDate(date)}
                        locale={ptBR}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-white/10 rounded-lg"
                    onClick={() => handleDateChange(1)}
                  >
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedDate(new Date())}
                  className={cn("h-10 px-4 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                    isDark ? "text-blue-400 hover:bg-blue-500/10" : "text-blue-600 hover:bg-blue-50")}
                >
                  Hoje
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Toolbar Sub-Header */}
          <div className={cn(
            "rounded-[1.5rem] p-4 glass-premium border-white/5 flex flex-wrap items-center justify-between gap-4 relative z-10 transition-colors",
            isDark ? "bg-slate-950/40" : "bg-white/60"
          )}>
            <div className="flex items-center gap-4 flex-1 min-w-[200px]">
              <div className="relative flex-1 max-w-sm group">
                <Search className={cn(
                  "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors",
                  isDark ? "text-slate-500 group-focus-within:text-blue-400" : "text-slate-400 group-focus-within:text-blue-600"
                )} />
                <input
                  type="text"
                  placeholder="Buscar paciente, procedimento..."
                  className={cn(
                    "pl-11 pr-4 h-11 rounded-xl text-xs font-medium w-full border transition-all focus:outline-none placeholder:text-[10px] placeholder:uppercase placeholder:tracking-wider",
                    isDark
                      ? "bg-slate-900/60 border-white/5 focus:bg-slate-900/80 focus:border-blue-500/50 text-white placeholder:text-slate-600"
                      : "bg-white/60 border-slate-200/50 focus:bg-white focus:border-blue-500/50 text-slate-900 placeholder:text-slate-400"
                  )}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="hidden xl:block">
                <AgendaLegend />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <AdvancedFilters
                professionals={professionals}
                filters={filters}
                setFilters={setFilters}
              />

              <Link to={createPageUrl("AgendaReports")}>
                <Button variant="ghost" size="icon" title="Relatórios" className="h-11 w-11 text-slate-500 hover:bg-white/10 rounded-xl border border-transparent hover:border-white/5">
                  <BarChart3 className="w-5 h-5" />
                </Button>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="h-11 px-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95 group relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Sparkles className="w-3.5 h-3.5 mr-2 relative z-10" />
                    <span className="relative z-10">Novo Agendamento</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className={cn("rounded-2xl border-white/5 p-2 min-w-[200px]", isDark ? "bg-slate-900/95 backdrop-blur-xl text-slate-200" : "bg-white/95 backdrop-blur-xl")}>
                  <DropdownMenuItem onClick={() => {
                    setSelectedAppointment(null);
                    setIsFormOpen(true);
                  }} className="gap-3 cursor-pointer p-2.5 rounded-xl text-xs font-bold uppercase tracking-wider focus:bg-blue-500/10 focus:text-blue-500">
                    <CalendarLucide className="w-4 h-4" /> Agendamento
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsTimeBlockOpen(true)} className="gap-3 cursor-pointer p-2.5 rounded-xl text-xs font-bold uppercase tracking-wider focus:bg-blue-500/10 focus:text-blue-500">
                    <Clock className="w-4 h-4" /> Bloqueio de Horário
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className={isDark ? "bg-white/5 my-1" : "bg-slate-100 my-1"} />
                  <DropdownMenuItem onClick={() => setIsBlockDayOpen(true)} className="gap-3 text-rose-500 focus:text-rose-600 focus:bg-rose-500/10 cursor-pointer p-2.5 rounded-xl text-xs font-bold uppercase tracking-wider">
                    <Ban className="w-4 h-4" /> Bloquear Dia
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Calendar Grid Container */}
          <div className={cn("flex-1 overflow-hidden relative rounded-[2rem] border glass-premium flex flex-col shadow-2xl shadow-black/5", isDark ? "bg-slate-950/40 border-white/5" : "bg-white/60 border-white/40")}>

            {/* Calendar Header Row */}
            <div className={cn(
              "grid grid-cols-[80px_1fr] border-b backdrop-blur-md z-20 relative",
              isDark ? "bg-[#0B0E14]/80 border-white/5" : "bg-white/80 border-slate-100"
            )}>
              <div className={cn("p-4 text-[10px] font-black uppercase tracking-widest text-center border-r flex items-center justify-center opacity-50", isDark ? "text-slate-400 border-white/5" : "text-slate-500 border-slate-100")}>
                Horário
              </div>
              <div className={cn("grid", view === "day" ? "grid-cols-1" : "grid-cols-7")}>
                {view === "day" ? (
                  <div className="p-4 flex flex-col items-center justify-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className={cn("text-[10px] font-black uppercase tracking-[0.2em] mb-1", isDark ? "text-blue-400" : "text-blue-600")}>
                      {format(selectedDate, "MMMM", { locale: ptBR })}
                    </div>
                    <div className={cn("text-2xl font-black tracking-tight", isDark ? "text-white" : "text-slate-900")}>
                      {format(selectedDate, "EEEE, d", { locale: ptBR })}
                    </div>
                    {getDayHoliday(selectedDate) && (
                      <span className="mt-1 text-[10px] font-bold uppercase tracking-widest text-amber-500 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> {getDayHoliday(selectedDate)?.name}
                      </span>
                    )}
                  </div>
                ) : (
                  Array.from({ length: 7 }).map((_, i) => {
                    const date = addDays(startOfWeek(selectedDate, { weekStartsOn: 0 }), i);
                    const isToday = isSameDay(date, new Date());
                    const holiday = getDayHoliday(date);

                    return (
                      <div
                        key={i}
                        className={cn(
                          "p-3 text-center border-r last:border-r-0 flex flex-col items-center gap-1.5 transition-all relative overflow-hidden group",
                          isDark ? "border-white/5" : "border-slate-100",
                          isToday ? (isDark ? "bg-blue-500/5" : "bg-blue-50/50") : "hover:bg-white/5"
                        )}
                      >
                        <span className={cn(
                          "text-[9px] font-black uppercase tracking-[0.15em]",
                          isToday ? "text-blue-500" : (isDark ? "text-slate-500" : "text-slate-400"),
                          holiday ? "text-amber-500" : ""
                        )}>
                          {format(date, "EEE", { locale: ptBR })}
                        </span>
                        <div className={cn(
                          "w-8 h-8 flex items-center justify-center rounded-xl text-sm font-black transition-all relative z-10",
                          isToday
                            ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-110"
                            : (isDark ? "text-slate-300 group-hover:bg-white/10" : "text-slate-700 group-hover:bg-slate-100"),
                          holiday && !isToday ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400" : ""
                        )}>
                          {format(date, "d")}
                        </div>

                        {holiday && (
                          <span className="text-[8px] font-black text-amber-500/80 dark:text-amber-400/80 truncate max-w-full px-1 uppercase tracking-tighter" title={holiday.name}>
                            {holiday.name.split(' ')[0]}
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Calendar Body (Time Slots) */}
            <div className={cn("relative overflow-auto flex-1 scrollbar-thin", isDark ? "scrollbar-thumb-slate-800 scrollbar-track-transparent" : "scrollbar-thumb-slate-200 scrollbar-track-slate-50")}>
              <div className="absolute inset-x-0 min-h-[1250px]"> {/* Ensure scrollable area */}
                {timeSlots.map((time, i) => (
                  <div key={time} className={cn("grid grid-cols-[80px_1fr] group h-[60px] relative", i === timeSlots.length - 1 ? "" : "border-b", isDark ? "border-white/5" : "border-slate-100")}>
                    {/* Time Label */}
                    <div className={cn(
                      "relative p-2 text-xs font-medium text-center border-r flex items-start justify-center pt-3 select-none",
                      isDark ? "text-slate-600 border-white/5 bg-[#0B0E14]/30" : "text-slate-300 border-slate-100 bg-slate-50/50"
                    )}>
                      {time.endsWith("00") ? <span className={isDark ? "text-slate-500 font-bold" : "text-slate-400 font-bold"}>{time}</span> : <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px]">{time}</span>}
                    </div>

                    {/* Slot Cells */}
                    <div className={cn("grid relative", view === "day" ? "grid-cols-1" : "grid-cols-7")}>
                      {view === "day" ? (
                        (() => {
                          const blocked = isDayBlocked(selectedDate);
                          const holiday = getDayHoliday(selectedDate);
                          const reason = blocked ? getBlockReason(selectedDate) : "";
                          const getEmoji = (r: string) => {
                            const lower = r.toLowerCase();
                            if (lower.includes('férias') || lower.includes('ferias')) return '🏖️';
                            if (lower.includes('reforma') || lower.includes('obra')) return '🛠️';
                            if (lower.includes('curso') || lower.includes('congresso') || lower.includes('estudo')) return '📚';
                            if (lower.includes('pessoal') || lower.includes('folga')) return '🏠';
                            if (lower.includes('luto')) return '🖤';
                            return '⛔';
                          };
                          const emoji = getEmoji(reason);

                          return (
                            <div
                              className={cn("relative transition-colors border-l-0 cursor-pointer group",
                                isDark ? "hover:bg-white/[0.02]" : "hover:bg-slate-50",
                                blocked ? (isDark ? "bg-[#1E293B]/95" : "bg-slate-300/90") : "",
                                !blocked && holiday ? (isDark ? "bg-[#1E293B]/95" : "bg-slate-200/80") : ""
                              )}
                              onClick={() => {
                                if (blocked) {
                                  const target = format(selectedDate, 'yyyy-MM-dd');
                                  const block = blockedDays.find((b: any) => {
                                    const s = typeof b.start_date === 'string' ? b.start_date.split('T')[0] : format(new Date(b.start_date), 'yyyy-MM-dd');
                                    const e = typeof b.end_date === 'string' ? b.end_date.split('T')[0] : format(new Date(b.end_date), 'yyyy-MM-dd');
                                    return target >= s && target <= e;
                                  });

                                  if (block && block.id) {
                                    if (confirm(`Deseja desbloquear este dia (${reason})?`)) {
                                      deleteBlockedDayMutation.mutate(String(block.id));
                                    }
                                  }
                                  return;
                                }
                                setSelectedAppointment({ start_time: time, date: format(selectedDate, "yyyy-MM-dd") });
                                setIsFormOpen(true);
                              }}
                            >
                              {blocked && time === "08:00" && (
                                <div className="absolute inset-x-0 top-0 bottom-0 flex items-center justify-center z-0 pointer-events-none opacity-40 overflow-hidden">
                                  <span className={cn(
                                    "text-[10px] md:text-xs font-black uppercase tracking-[0.2em] transform -rotate-90 md:rotate-0 whitespace-nowrap",
                                    isDark ? "text-slate-400" : "text-slate-600"
                                  )}>
                                    {reason}
                                  </span>
                                </div>
                              )}

                              {blocked && time === "09:00" && (
                                <div className="absolute inset-x-4 top-2 text-center z-10">
                                  <span className={cn(
                                    "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg backdrop-blur-sm border flex items-center justify-center gap-2",
                                    isDark ? "bg-slate-800 text-white border-slate-600" : "bg-white text-slate-800 border-slate-300"
                                  )}>
                                    {emoji} {reason} <span className="opacity-50 text-[8px]">(Clique p/ desbloquear)</span>
                                  </span>
                                </div>
                              )}

                              {!blocked && holiday && time === "08:00" && (
                                <div className="absolute inset-x-0 top-0 bottom-0 flex items-center justify-center z-0 pointer-events-none opacity-30 overflow-hidden">
                                  <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] transform -rotate-90 md:rotate-0 whitespace-nowrap text-amber-600 dark:text-amber-500">
                                    {holiday.name}
                                  </span>
                                </div>
                              )}
                              {!blocked && holiday && time === "09:00" && (
                                <div className="absolute inset-x-4 top-2 text-center z-10">
                                  <span className={cn(
                                    "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg backdrop-blur-sm border",
                                    isDark ? "bg-slate-800 text-amber-500 border-slate-700" : "bg-white text-amber-600 border-slate-200"
                                  )}>
                                    🎉 {holiday.name}
                                  </span>
                                </div>
                              )}
                              {/* Half-hour guideline */}
                              <div className={cn("absolute top-1/2 w-full border-t border-dashed pointer-events-none opacity-10", isDark ? "border-white" : "border-slate-400")}></div>
                            </div>
                          );
                        })()
                      ) : (
                        Array.from({ length: 7 }).map((_, j) => {
                          const date = addDays(startOfWeek(selectedDate, { weekStartsOn: 0 }), j);
                          const blocked = isDayBlocked(date);
                          const holiday = getDayHoliday(date);
                          const reason = blocked ? getBlockReason(date) : "";
                          const getEmoji = (r: string) => {
                            const lower = r.toLowerCase();
                            if (lower.includes('férias') || lower.includes('ferias')) return '🏖️';
                            if (lower.includes('reforma') || lower.includes('obra')) return '🛠️';
                            if (lower.includes('curso') || lower.includes('congresso') || lower.includes('estudo')) return '📚';
                            if (lower.includes('pessoal') || lower.includes('folga')) return '🏠';
                            if (lower.includes('luto')) return '🖤';
                            return '⛔';
                          };
                          const emoji = getEmoji(reason);

                          return (
                            <div
                              key={j}
                              className={cn(
                                "border-l relative transition-colors cursor-pointer",
                                isDark ? "border-white/5" : "border-slate-100",
                                j === 0 && "border-l-0",
                                blocked ? (isDark ? "bg-[#1E293B]/60 cursor-not-allowed" : "bg-slate-100/80 cursor-not-allowed") : "",
                                !blocked && holiday ? (isDark ? "bg-[#1E293B]/60" : "bg-slate-100/80") : (isDark ? "hover:bg-white/[0.02]" : "hover:bg-slate-50")
                              )}
                              onClick={() => {
                                if (blocked) return;
                                const date = addDays(startOfWeek(selectedDate, { weekStartsOn: 0 }), j);
                                setSelectedAppointment({ start_time: time, date: format(date, "yyyy-MM-dd") });
                                setIsFormOpen(true);
                              }}
                            >
                              {blocked && time === "08:00" && (
                                <div className="absolute inset-x-0 top-0 bottom-0 flex items-center justify-center z-0 pointer-events-none opacity-20 overflow-hidden">
                                  <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] transform -rotate-90 md:rotate-0 whitespace-nowrap text-slate-500">
                                    {reason}
                                  </span>
                                </div>
                              )}

                              {blocked && time === "09:00" && (
                                <div className="absolute inset-x-1 top-1 text-center z-10 pointer-events-none">
                                  <span className={cn(
                                    "text-[8px] font-black uppercase tracking-wider truncate max-w-full inline-block px-2 py-0.5 rounded-full shadow-sm",
                                    isDark ? "bg-slate-800 text-slate-400 border border-slate-700" : "bg-white text-slate-500 border border-slate-200"
                                  )}>
                                    {emoji} {reason}
                                  </span>
                                </div>
                              )}

                              {!blocked && holiday && time === "08:00" && (
                                <div className="absolute inset-x-0 top-0 bottom-0 flex items-center justify-center z-0 pointer-events-none opacity-20 overflow-hidden">
                                  <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] transform -rotate-90 md:rotate-0 whitespace-nowrap text-slate-500">
                                    {holiday.name}
                                  </span>
                                </div>
                              )}
                              {!blocked && holiday && time === "09:00" && (
                                <div className="absolute inset-x-1 top-1 text-center z-10 pointer-events-none">
                                  <span className={cn(
                                    "text-[8px] font-black uppercase tracking-wider truncate max-w-full inline-block px-2 py-0.5 rounded-full shadow-sm",
                                    isDark ? "bg-slate-800 text-slate-400 border border-slate-700" : "bg-white text-slate-500 border border-slate-200"
                                  )}>
                                    🎉 {holiday.name}
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                ))}

                {/* Render Appointments Absolute Overlay */}
                {filteredAppointments.map((apt) => {
                  if (!apt.start_time) return null;

                  const { h, m, str: timeDisplay } = parseTime(apt.start_time);
                  let dateStr = apt.date;
                  if (!dateStr || dateStr.includes('T')) {
                    const localDate = new Date(apt.start_time);
                    dateStr = format(localDate, 'yyyy-MM-dd');
                  }

                  // Determine end time
                  let durationMinutes = 30; // default
                  if (apt.end_time) {
                    const end = parseTime(apt.end_time);
                    durationMinutes = (end.h * 60 + end.m) - (h * 60 + m);
                  } else if (apt.duration) {
                    durationMinutes = apt.duration;
                  }

                  if (durationMinutes < 15) durationMinutes = 30;

                  // Base time is 7:00
                  const minutesSince7 = (h - 7) * 60 + m;
                  if (minutesSince7 < 0) return null;

                  const slots = minutesSince7 / 30;
                  const ROW_HEIGHT = 60;
                  const top = slots * ROW_HEIGHT;
                  const height = (durationMinutes / 30) * ROW_HEIGHT;

                  let left = "0";
                  let width = "100%";

                  if (view === "week") {
                    if (dateStr) {
                      const cleanDate = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
                      const [y, mm, d] = cleanDate.split("-").map(Number);
                      const localDate = new Date(y, mm - 1, d);
                      const dayIndex = localDate.getDay();

                      const colWidth = 100 / 7;
                      left = `${dayIndex * colWidth}%`;
                      width = `${colWidth}%`;
                    }
                  }

                  const style = {
                    top: `${top + 1}px`,
                    height: `${height - 2}px`,
                    left: `calc(${left} + 2px)`,
                    width: `calc(${width} - 4px)`
                  };

                  const status = statusConfig[apt.status] || statusConfig.agendado;
                  const professional = apt.professional || professionals?.find((p: any) => p.id === apt.professional_id);
                  const cardColorClass = getAppointmentCardColor(apt, isDark);

                  return (
                    <div
                      key={apt.id}
                      className="absolute z-10 pl-[80px] pointer-events-none w-full transition-all duration-300 ease-in-out"
                      style={{ top: 0, bottom: 0, left: 0, right: 0 }}
                    >
                      <div className="relative w-full h-full pointer-events-none">
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className={cn(
                            "absolute cursor-pointer overflow-hidden flex flex-col pointer-events-auto",
                            "shadow-lg hover:shadow-2xl hover:z-50 transition-all duration-300",
                            "rounded-xl border-l-[4px] border-y-0 border-r-0 backdrop-blur-md",
                            cardColorClass,
                            isDark ? "border-white/5 hover:bg-white/10" : "border-slate-200/40 hover:bg-white/60"
                          )}
                          style={style}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAppointment(apt);
                            setIsFormOpen(true);
                          }}
                        >
                          <div className={cn(
                            "flex items-stretch h-full w-full overflow-hidden rounded-xl border-l-[3px] shadow-sm transition-all hover:shadow-md group",
                            isDark ? "bg-[#1E293B] border-l-slate-600" : "bg-white border-l-slate-300",
                            // Apply type-based border color override
                            (() => {
                              const t = (apt.type || "Consulta").trim();
                              const key = Object.keys(typeConfig).find(k => k.toLowerCase() === t.toLowerCase());
                              return (typeConfig[key || t] || typeConfig["Consulta"]).border;
                            })()
                          )}>

                            {/* Left: Time Block */}
                            <div className={cn(
                              "flex flex-col items-center justify-center min-w-[50px] px-1 py-1 gap-0.5",
                              isDark ? "bg-slate-800/50" : "bg-slate-50"
                            )}>
                              <span className={cn("text-[11px] font-black leading-none", isDark ? "text-slate-300" : "text-slate-700")}>
                                {timeDisplay}
                              </span>
                              {durationMinutes >= 30 && (
                                <span className="text-[7px] font-bold uppercase opacity-50">
                                  {durationMinutes} min
                                </span>
                              )}
                            </div>

                            {/* Right: Content */}
                            <div className="flex-1 flex flex-col justify-center px-3 py-1 min-w-0 relative">
                              {apt.type === 'bloqueio' ? (
                                <div className="relative w-full h-full flex flex-col justify-center overflow-hidden min-h-[30px]">
                                  {/* Background Watermark */}
                                  <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center text-[10px] sm:text-xs font-black uppercase tracking-[0.5em] opacity-10 select-none transform scale-150 whitespace-nowrap pointer-events-none">
                                    BLOQUEIO
                                  </span>
                                  {/* Foreground Badge */}
                                  <div className="relative z-10 flex items-center gap-2">
                                    <span className={cn(
                                      "text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border shadow-sm backdrop-blur-md flex items-center gap-1.5",
                                      isDark ? "bg-black/20 border-white/10 text-white" : "bg-white/20 border-white/40 text-white"
                                    )}>
                                      <Ban className="w-3 h-3" /> {apt.procedure_name || "Indisponível"}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  {/* Row 1: Name */}
                                  <h4 className={cn(
                                    "text-[12px] font-black truncate leading-tight mb-0.5",
                                    isDark ? "text-white" : "text-slate-900"
                                  )}>
                                    {(apt.patient?.full_name?.split(' ').slice(0, 2).join(' ') || "Paciente")}
                                  </h4>

                                  {/* Row 2: Details */}
                                  <div className="flex items-center gap-1.5 min-w-0 text-[10px] leading-tight opacity-90">
                                    {professional && (
                                      <span className={cn("truncate font-medium flex items-center gap-1 hidden sm:flex", isDark ? "text-slate-400" : "text-slate-600")}>
                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                                        {professional.name || professional.full_name?.split(' ')[0] || "Pro"}
                                      </span>
                                    )}

                                    <span className="opacity-30 hidden sm:inline">•</span>

                                    <span className={cn(
                                      "font-black uppercase tracking-wider",
                                      (() => {
                                        const t = (apt.type || "Consulta").trim();
                                        const key = Object.keys(typeConfig).find(k => k.toLowerCase() === t.toLowerCase());
                                        return (typeConfig[key || t] || typeConfig["Consulta"]).color;
                                      })()
                                    )}>
                                      {apt.type || "Consulta"}
                                    </span>

                                    {apt.procedure_name && (
                                      <>
                                        <span className="opacity-30 hidden md:inline">•</span>
                                        <span className={cn("truncate hidden md:inline opacity-70", isDark ? "text-slate-400" : "text-slate-600")}>
                                          {apt.procedure_name}
                                        </span>
                                      </>
                                    )}
                                  </div>

                                  {/* Row 3: Badges */}
                                  {apt.patient && (
                                    <div className="flex flex-wrap gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                      {/* Origin Badge */}
                                      {(apt.patient.origin || apt.source) && (
                                        <span className={cn(
                                          "text-[8px] px-1 py-0.5 rounded-full font-bold uppercase tracking-wider",
                                          (apt.patient.origin || apt.source).toLowerCase().includes('ads') ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
                                            (apt.patient.origin || apt.source).toLowerCase().includes('indica') ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" :
                                              "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
                                        )}>
                                          {apt.patient.origin || apt.source}
                                        </span>
                                      )}

                                      {/* Profile Badge */}
                                      {apt.patient.behavior_profile && (
                                        <span className={cn(
                                          "text-[8px] px-1 py-0.5 rounded-full font-bold uppercase tracking-wider",
                                          apt.patient.behavior_profile.toLowerCase() === 'analítico' ? "bg-purple-500/10 text-purple-600 dark:text-purple-400" :
                                            apt.patient.behavior_profile.toLowerCase() === 'emocional' ? "bg-pink-500/10 text-pink-600 dark:text-pink-400" :
                                              apt.patient.behavior_profile.toLowerCase() === 'exigente' ? "bg-slate-800/10 text-slate-700 dark:text-slate-300" :
                                                "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                        )}>
                                          {apt.patient.behavior_profile.substring(0, 3)}
                                        </span>
                                      )}

                                      {/* Temperature Badge */}
                                      {(apt.patient.temperature || apt.patient.funnel_status) && (
                                        <span className={cn(
                                          "text-[8px] px-1 py-0.5 rounded-full font-bold uppercase tracking-wider",
                                          (apt.patient.temperature === 'hot' || apt.patient.funnel_status === 'hot') ? "bg-rose-500/10 text-rose-600 dark:text-rose-400" :
                                            (apt.patient.temperature === 'warm' || apt.patient.funnel_status === 'warm') ? "bg-orange-500/10 text-orange-600 dark:text-orange-400" :
                                              "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                        )}>
                                          {(apt.patient.temperature || apt.patient.funnel_status) === 'hot' ? 'QUENTE' : (apt.patient.temperature || apt.patient.funnel_status) === 'warm' ? 'MORNO' : 'FRIO'}
                                        </span>
                                      )}

                                      {/* Temperament Badge */}
                                      {apt.patient.temperament && (
                                        <span className={cn(
                                          "text-[8px] px-1 py-0.5 rounded-full font-bold uppercase tracking-wider bg-violet-500/10 text-violet-600 dark:text-violet-400"
                                        )}>
                                          {apt.patient.temperament === 'analitico' ? '🧠 ANALÍTICO' :
                                            apt.patient.temperament === 'executor' ? '🚀 EXECUTOR' :
                                              apt.patient.temperament === 'comunicador' ? '💬 COMUNICADOR' :
                                                apt.patient.temperament === 'planejador' ? '📋 PLANEJADOR' :
                                                  apt.patient.temperament.toUpperCase()}
                                        </span>
                                      )}

                                      {/* Motivation Badge */}
                                      {apt.patient.main_motivation && (
                                        <span className={cn(
                                          "text-[8px] px-1 py-0.5 rounded-full font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                        )}>
                                          {apt.patient.main_motivation === 'dor' ? '💊 DOR' :
                                            apt.patient.main_motivation === 'prazer' ? '✨ PRAZER' :
                                              apt.patient.main_motivation === 'status' ? '💎 STATUS' :
                                                apt.patient.main_motivation === 'seguranca' ? '🛡️ SEGURANÇA' :
                                                  apt.patient.main_motivation.toUpperCase()}
                                        </span>
                                      )}

                                      {/* Conscience Level Badge */}
                                      {apt.patient.conscience_level && (
                                        <span className={cn(
                                          "text-[8px] px-1 py-0.5 rounded-full font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
                                        )}>
                                          {apt.patient.conscience_level === 'unaware' ? 'INCONSCIENTE' :
                                            apt.patient.conscience_level === 'problem_aware' ? 'PROBLEMA' :
                                              apt.patient.conscience_level === 'solution_aware' ? 'SOLUÇÃO' :
                                                apt.patient.conscience_level === 'product_aware' ? 'PRODUTO' :
                                                  apt.patient.conscience_level === 'most_aware' ? 'TOTALMENTE' :
                                                    apt.patient.conscience_level.toUpperCase()}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </>
                              )}
                            </div>

                            {/* Hover Menu Button (Absolute) */}
                            <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" onClick={(e) => e.stopPropagation()}>
                                    <MoreVertical className="w-3 h-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className={cn("min-w-[140px]", isDark ? "bg-[#1C2333] border-slate-700 text-slate-200" : "")}>
                                  {apt.type === 'bloqueio' ? (
                                    <DropdownMenuItem
                                      className="text-rose-500 focus:text-rose-500 font-bold"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm("Desbloquear este horário?")) {
                                          deleteMutation.mutate(apt.id);
                                        }
                                      }}
                                    >
                                      Remover Bloqueio
                                    </DropdownMenuItem>
                                  ) : (
                                    <>
                                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedAppointment(apt); setIsRescheduleOpen(true); }}>
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
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div >
        </div >
      )
      }

      {/* GLOBAL MODALS / DIALOGS (Liquid Scale Refined) */}
      <AppointmentForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        appointment={selectedAppointment}
        professionals={professionals}
      />
      <TimeBlockDialog
        open={isTimeBlockOpen}
        onOpenChange={setIsTimeBlockOpen}
        professionals={professionals}
        initialProfessionalId={
          filters.professional_id !== "all"
            ? filters.professional_id
            : (currentProfessional?.id || null)
        }
      />
      <BlockDayModal
        isOpen={isBlockDayOpen}
        onClose={() => setIsBlockDayOpen(false)}
        professionalId={
          filters.professional_id !== "all"
            ? parseInt(filters.professional_id)
            : (currentProfessional?.id || null)
        }
        initialDate={selectedDate}
        onBlockCreated={() => {
          queryClient.invalidateQueries({ queryKey: ['blocked-days'] });
          toast.success('Período bloqueado com sucesso!');
        }}
        professionals={professionals}
      />
      <RescheduleDialog open={isRescheduleOpen} onOpenChange={setIsRescheduleOpen} appointment={selectedAppointment} />
      <SendNotificationDialog open={isNotificationOpen} onOpenChange={setIsNotificationOpen} appointment={selectedAppointment} />
    </>
  );
}



