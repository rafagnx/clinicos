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
import { supabase } from "@/lib/supabaseClient";

import AppointmentForm from "@/components/agenda/AppointmentForm";
import SendNotificationDialog from "@/components/agenda/SendNotificationDialog";
import TimeBlockDialog from "@/components/agenda/TimeBlockDialog";
import RescheduleDialog from "@/components/agenda/RescheduleDialog";
import AdvancedFilters from "@/components/agenda/AdvancedFilters";
import BlockDayModal from "@/components/agenda/BlockDayModal";
import { AgendaLegend } from "@/components/agenda/AgendaLegend";
import MobileAgendaView from "@/components/agenda/MobileAgendaView";

// ... existing code ...

export default function Agenda() {
  const { isDark } = useOutletContext<{ isDark: boolean }>();
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

  // ... existing code ...

  const handleDateChange = (days) => {
    setSelectedDate(prev => addDays(prev, days));
  };

  if (isMobile) {
    return (
      <MobileAgendaView
        date={selectedDate}
        onDateChange={handleDateChange}
        onToday={() => setSelectedDate(new Date())}
        appointments={filteredAppointments}
        isDark={isDark}
        onSelectAppointment={(apt) => {
          setSelectedAppointment(apt);
          setIsFormOpen(true);
        }}
        onNewAppointment={() => {
          setSelectedAppointment(null);
          setIsFormOpen(true);
        }}
      />
    );
  }

  return (
    <div className={cn(
      "flex flex-col h-full rounded-2xl shadow-sm border overflow-hidden",
      isDark ? "bg-[#151A25] border-slate-800" : "bg-white border-slate-200"
    )}>
      {/* Header Premium */}
      {/* Header Premium Reorganizado */}
      <div className={cn(
        "flex flex-col gap-4 p-5 border-b md:flex-row md:items-center md:justify-between sticky top-0 z-20 transition-colors",
        isDark ? "bg-[#0B0E14] border-slate-800" : "bg-white border-slate-100"
      )}>
        {/* Esquerda: Título + Visualização */}
        <div className="flex items-center gap-4 lg:gap-6">
          <div className="flex items-center gap-3">
            <h1 className={cn("text-2xl font-bold tracking-tight", isDark ? "text-white" : "text-slate-900")}>Agenda</h1>
          </div>

          <div className={cn(
            "flex items-center p-1 rounded-lg border shadow-sm hidden md:flex",
            isDark ? "bg-[#1C2333] border-slate-700" : "bg-slate-50 border-slate-200"
          )}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setView("day")}
              className={cn(
                "rounded-md px-3 h-8 text-xs font-medium transition-all",
                view === "day"
                  ? (isDark ? "bg-indigo-600 text-white shadow-md" : "bg-white text-indigo-600 shadow-sm")
                  : (isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-900")
              )}
            >
              Dia
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setView("week")}
              className={cn(
                "rounded-md px-3 h-8 text-xs font-medium transition-all",
                view === "week"
                  ? (isDark ? "bg-indigo-600 text-white shadow-md" : "bg-white text-indigo-600 shadow-sm")
                  : (isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-900")
              )}
            >
              Semana
            </Button>
          </div>
        </div>

        {/* Direita: Controles e Ações */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full md:w-auto">

          {/* Grupo Navegação Data */}
          <div className={cn(
            "flex items-center p-1 rounded-lg border w-full md:w-auto",
            isDark ? "border-slate-700 bg-[#1C2333]" : "border-slate-200 bg-white"
          )}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-transparent"
              onClick={() => handleDateChange(-1)}
              title="Dia Anterior"
            >
              <ChevronLeft className="w-4 h-4 text-slate-500" />
            </Button>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" className={cn("h-8 min-w-[140px] justify-center font-medium text-sm hover:bg-transparent", isDark ? "text-slate-200" : "text-slate-700")}>
                  <CalendarIcon className="w-3.5 h-3.5 mr-2 opacity-70" />
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

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-transparent"
              onClick={() => handleDateChange(1)}
              title="Próximo Dia"
            >
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </Button>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-2"></div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedDate(new Date())}
              className={cn("h-7 px-2 text-xs font-medium uppercase tracking-wider rounded text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20")}
              title="Ir para Hoje"
            >
              Hoje
            </Button>
          </div>

          {/* Separador Mobile Hidden */}
          <div className="hidden md:block h-6 w-px bg-slate-200 dark:bg-slate-700"></div>

          {/* Grupo Filtros e Ações */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-start">

            {/* Legenda Colapsável */}
            <div className="hidden lg:block">
              <AgendaLegend />
            </div>

            <AdvancedFilters
              professionals={professionals}
              filters={filters}
              setFilters={setFilters}
            />

            <Link to={createPageUrl("AgendaReports")}>
              <Button variant="outline" size="icon" title="Relatórios" className={cn("h-10 w-10 border-dashed", isDark ? "border-slate-700 hover:bg-slate-800" : "border-slate-300 hover:bg-slate-50")}>
                <BarChart3 className="w-4 h-4 text-slate-500" />
              </Button>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className={cn(
                  "gap-2 shadow-lg transition-all hover:scale-105 active:scale-95 h-10 px-6",
                  isDark ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20" : "bg-slate-900 hover:bg-slate-800 text-white shadow-slate-300"
                )}>
                  <Plus className="w-4 h-4" />
                  <span className="font-medium">Novo</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className={isDark ? "bg-[#1C2333] border-slate-700 text-slate-200" : ""}>
                <DropdownMenuItem onClick={() => {
                  setSelectedAppointment(null);
                  setIsFormOpen(true);
                }} className="gap-2 cursor-pointer">
                  <CalendarLucide className="w-4 h-4" /> Agendamento
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsTimeBlockOpen(true)} className="gap-2 cursor-pointer">
                  <Clock className="w-4 h-4" /> Bloqueio de Horário
                </DropdownMenuItem>
                <DropdownMenuSeparator className={isDark ? "bg-slate-700" : ""} />
                <DropdownMenuItem onClick={() => setIsBlockDayOpen(true)} className="gap-2 text-rose-500 focus:text-rose-600 cursor-pointer">
                  <Ban className="w-4 h-4" /> Bloquear Dia/Período
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
                  {getDayHoliday(selectedDate) && (
                    <span className="mt-1 text-sm font-semibold text-amber-500">
                      🎉 {getDayHoliday(selectedDate)?.name}
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
                        "p-3 text-center border-r last:border-r-0 flex flex-col items-center gap-1 transition-colors relative overflow-hidden",
                        isDark ? "border-slate-800" : "border-slate-100",
                        isToday ? (isDark ? "bg-indigo-500/10" : "bg-indigo-50/50") : "",
                        holiday ? (isDark ? "bg-amber-900/10" : "bg-amber-50/40") : ""
                      )}
                    >
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-wider",
                        isToday ? "text-indigo-500" : (isDark ? "text-slate-500" : "text-slate-400"),
                        holiday ? "text-amber-600 dark:text-amber-500" : ""
                      )}>
                        {format(date, "EEE", { locale: ptBR })}
                      </span>
                      <div className={cn(
                        "w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold transition-all relative z-10",
                        isToday
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-110"
                          : (isDark ? "text-slate-300" : "text-slate-700"),
                        holiday && !isToday ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400" : ""
                      )}>
                        {format(date, "d")}
                      </div>

                      {holiday && (
                        <span className="text-[9px] font-medium text-amber-600 dark:text-amber-400 truncate max-w-full px-1" title={holiday.name}>
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
                    (() => {
                      const blocked = isDayBlocked(selectedDate);
                      const holiday = getDayHoliday(selectedDate);
                      return (
                        <div
                          className={cn("relative transition-colors border-l-0",
                            isDark ? "hover:bg-slate-800/30" : "hover:bg-slate-50",
                            blocked ? (isDark ? "bg-slate-900/40 hover:bg-slate-900/40 cursor-not-allowed" : "bg-gray-100/60 hover:bg-gray-100/60 cursor-not-allowed") : "",
                            holiday && !blocked ? (isDark ? "bg-amber-900/5 hover:bg-amber-900/10" : "bg-amber-50/30 hover:bg-amber-50/50") : ""
                          )}
                          onClick={() => {
                            if (blocked) return;
                            setSelectedAppointment({ start_time: time, date: format(selectedDate, "yyyy-MM-dd") });
                            setIsFormOpen(true);
                          }}
                        >
                          {blocked && getBlockReason(selectedDate) && time === "09:00" && (
                            <div className="absolute inset-x-0 top-0 p-2 text-center z-10">
                              <span className="text-xs font-medium text-slate-500 bg-white/80 dark:bg-black/50 px-2 py-1 rounded-md shadow-sm border border-slate-200 dark:border-slate-800">
                                ⛔ {getBlockReason(selectedDate)}
                              </span>
                            </div>
                          )}
                          {holiday && time === "08:00" && !blocked && (
                            <div className="absolute inset-x-0 top-0 p-1 text-center z-0 pointer-events-none opacity-50">
                              <span className="text-xs font-medium text-amber-500 uppercase tracking-widest">
                                🎉 {holiday.name}
                              </span>
                            </div>
                          )}
                          {/* Half-hour guideline */}
                          <div className={cn("absolute top-1/2 w-full border-t border-dashed pointer-events-none opacity-20", isDark ? "border-slate-700" : "border-slate-300")}></div>
                        </div>
                      );
                    })()
                  ) : (
                    Array.from({ length: 7 }).map((_, j) => {
                      const date = addDays(startOfWeek(selectedDate, { weekStartsOn: 0 }), j);
                      const blocked = isDayBlocked(date);
                      const holiday = getDayHoliday(date);

                      return (
                        <div
                          key={j}
                          className={cn(
                            "border-l relative transition-colors cursor-pointer",
                            isDark ? "border-slate-800/50 hover:bg-slate-800/30" : "border-slate-100 hover:bg-slate-50",
                            j === 0 && "border-l-0",
                            blocked ? (isDark ? "bg-slate-900/40 hover:bg-slate-900/40 cursor-not-allowed" : "bg-gray-100/60 hover:bg-gray-100/60 cursor-not-allowed") : "",
                            holiday && !blocked ? (isDark ? "bg-amber-900/5 hover:bg-amber-900/10" : "bg-amber-50/30 hover:bg-amber-50/50") : ""
                          )}
                          onClick={() => {
                            if (blocked) return;
                            const date = addDays(startOfWeek(selectedDate, { weekStartsOn: 0 }), j);
                            setSelectedAppointment({ start_time: time, date: format(date, "yyyy-MM-dd") });
                            setIsFormOpen(true);
                          }}
                        >
                          {blocked && getBlockReason(date) && time === "09:00" && (
                            <div className="absolute inset-x-0 top-0 p-2 text-center z-10 pointer-events-none">
                              <span className="text-[10px] font-medium text-slate-500 bg-white/80 dark:bg-black/50 px-1.5 py-0.5 rounded-md shadow-sm border border-slate-200 dark:border-slate-800 truncate max-w-full inline-block">
                                ⛔ {getBlockReason(date)}
                              </span>
                            </div>
                          )}
                          {holiday && time === "08:00" && !blocked && (
                            <div className="absolute inset-x-0 top-0 p-1 text-center z-0 pointer-events-none opacity-50">
                              <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest truncate w-full block">
                                {holiday.name}
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

              // Correct Strategy: Calculate dateStr from start_time in LOCAL context if missing or invalid
              let dateStr = apt.date;
              if (!dateStr || dateStr.includes('T')) {
                // Convert UTC string to Date object (Browser handles conversion to Local)
                const localDate = new Date(apt.start_time);
                // Format as YYYY-MM-DD in Local time
                dateStr = format(localDate, 'yyyy-MM-dd');
              }

              const startDateTime = new Date(`${dateStr}T${timeDisplay}`);

              // Determine end time
              let durationMinutes = 30; // default
              if (apt.end_time) {
                const end = parseTime(apt.end_time);
                durationMinutes = (end.h * 60 + end.m) - (h * 60 + m);
              } else if (apt.duration) {
                durationMinutes = apt.duration;
              }

              // Handle overnight or negative duration safety
              if (durationMinutes < 15) durationMinutes = 30;

              // Calculate position
              // Base time is 7:00. 
              const minutesSince7 = (h - 7) * 60 + m;
              // If before 7am, skip or clamp? Let's hide if too early for now, or clamp to 0.
              if (minutesSince7 < 0) return null; // Or render at top

              const slots = minutesSince7 / 30;
              const ROW_HEIGHT = 50;
              const top = slots * ROW_HEIGHT;
              const height = (durationMinutes / 30) * ROW_HEIGHT;

              let left = "0";
              let width = "100%";

              if (view === "week") {
                if (dateStr) {
                  // Handle "2026-01-29T..." vs "2026-01-29"
                  const cleanDate = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
                  const [y, mm, d] = cleanDate.split("-").map(Number);
                  const localDate = new Date(y, mm - 1, d);
                  const dayIndex = localDate.getDay(); // 0 (Sun) - 6 (Sat)

                  const colWidth = 100 / 7;
                  left = `${dayIndex * colWidth}%`;
                  width = `${colWidth}%`;
                }
              }

              // Adjust layout to look like "chips"
              const style = {
                top: `${top + 2}px`, // Slight offset
                height: `${height - 4}px`, // Slight gap
                left: `calc(${left} + 4px)`,
                width: `calc(${width} - 8px)`
              };

              // Safety check for max height (don't overflow day)
              // max slots = 25 (7:00 to 19:00+). 

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
                    <Card
                      className={cn(
                        "absolute cursor-pointer overflow-hidden flex flex-col pointer-events-auto",
                        "shadow-sm hover:shadow-lg hover:scale-[1.02] hover:z-50 transition-all duration-200",
                        "rounded-lg border-l-4 border-y border-r-0 backdrop-blur-sm",
                        cardColorClass,
                        isDark ? "border-slate-700/50" : "border-slate-200/60"
                      )}
                      style={style}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAppointment(apt);
                        setIsFormOpen(true);
                      }}
                    >
                      <div className="p-1.5 flex flex-col h-full gap-0.5 relative z-10">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={cn(
                            "text-[10px] font-bold px-1.5 py-0.5 rounded-md tracking-tight shadow-sm",
                            isDark ? "bg-black/40 text-white" : "bg-white/80 text-slate-700"
                          )}>
                            {timeDisplay}
                          </span>
                          <span className={cn(
                            "text-xs font-bold truncate leading-none",
                            isDark ? "text-slate-100" : "text-slate-800"
                          )}>
                            {apt.patient?.full_name || apt.patient?.name || "Paciente"}
                            {professional && (
                              <span className={cn("text-[10px] ml-1 opacity-75 font-normal", isDark ? "text-slate-300" : "text-slate-600")}>
                                - {professional.name || professional.full_name || "Dr(a)."}
                              </span>
                            )}
                          </span>
                        </div>

                        {height > 40 && (
                          <div className="flex flex-col gap-0.5 mt-0.5 pointer-events-none">
                            {/* Line 1: Badges - Temperature & Profile */}
                            <div className="flex flex-wrap gap-1 mb-0.5 items-center">
                              {/* Temperature Badge (New & Legacy Support) */}
                              {(apt.patient?.temperature || apt.patient?.conscience_level === "Pronto para Compra") && (
                                <Badge variant="secondary" className={cn(
                                  "text-[9px] px-1 h-3.5 border-0 rounded-sm font-bold shadow-sm items-center gap-0.5 pointer-events-auto",
                                  (apt.patient.temperature === 'hot' || apt.patient.conscience_level === "Pronto para Compra") ? "bg-rose-500 text-white shadow-rose-500/20 hover:bg-rose-600" :
                                    apt.patient.temperature === 'warm' ? "bg-orange-400 text-white shadow-orange-400/20 hover:bg-orange-500" :
                                      "bg-cyan-500 text-white shadow-cyan-500/20 hover:bg-cyan-600"
                                )}>
                                  {(apt.patient.temperature === 'hot' || apt.patient.conscience_level === "Pronto para Compra") ? '🔥 Quente' :
                                    apt.patient.temperature === 'warm' ? '🌡️ Morno' : '❄️ Frio'}
                                </Badge>
                              )}

                              {/* Profile Badge */}
                              {apt.patient?.temperament && (
                                <Badge variant="secondary" className={cn("text-[9px] px-1 h-3.5 border-0 rounded-sm font-medium items-center gap-0.5 pointer-events-auto", isDark ? "bg-indigo-900/40 text-indigo-300" : "bg-indigo-50 text-indigo-700")}>
                                  🧠 {apt.patient.temperament}
                                </Badge>
                              )}

                              {/* Source Badge */}
                              {apt.patient?.marketing_source && (
                                <Badge variant="secondary" className={cn("text-[9px] px-1 h-3.5 border-0 rounded-sm font-medium items-center gap-0.5 pointer-events-auto", isDark ? "bg-emerald-900/40 text-emerald-300" : "bg-emerald-50 text-emerald-700")}>
                                  📢 {apt.patient.marketing_source === 'trafego_pago' ? 'Ads' : 'Ind.'}
                                </Badge>
                              )}
                            </div>

                            {/* Line 2: Status & Procedure */}
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Badge variant="outline" className={cn("text-[8px] px-1 py-0 h-3.5 border-0 shadow-none font-medium rounded-sm bg-opacity-70 backdrop-blur-md uppercase tracking-wider shrink-0", status.class)}>
                                {status.label}
                              </Badge>
                              <span className={cn(
                                "text-[9px] truncate opacity-90 font-medium",
                                isDark ? "text-slate-300" : "text-slate-600"
                              )}>
                                • {apt.procedure_name || "Consulta"}
                              </span>
                            </div>
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
    </div >
  );
}
