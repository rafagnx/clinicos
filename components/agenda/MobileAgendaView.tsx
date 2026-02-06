import React from "react";
import { format, addDays, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    Calendar as LucideCalendar,
    Clock,
    MapPin,
    MoreVertical,
    ChevronLeft,
    ChevronRight,
    Plus,
    Ban,
    Sparkles,
    LayoutList,
    User,
    Check,
    Loader2,
    CalendarIcon as LucideCalendarIcon
} from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface MobileAgendaViewProps {
    date: Date;
    onDateChange: (days: number) => void;
    onToday: () => void;
    appointments: any[];
    isDark: boolean;
    onSelectAppointment: (apt: any) => void;
    onNewAppointment: () => void;
    view: "day" | "week";
    onViewChange: (view: "day" | "week") => void;
    holiday?: { name: string, type?: 'holiday' | 'reminder' } | null;
    blockedDays?: any[];
    holidays?: any[];
    onTimeBlock?: () => void;
    onBlockDay?: () => void;
    professionals?: any[];
    selectedProfessionalId?: string;
    onProfessionalChange?: (id: string) => void;
}

const statusConfig: any = {
    agendado: { label: "Agendado", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
    confirmado: { label: "Confirmado", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
    aguardando: { label: "Aguardando", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
    em_atendimento: { label: "Em Atend.", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
    finalizado: { label: "Finalizado", color: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300" },
    faltou: { label: "Faltou", color: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300" },
    cancelado: { label: "Cancelado", color: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400" },
};

export default function MobileAgendaView({
    date,
    onDateChange,
    onToday,
    appointments,
    isDark,
    onSelectAppointment,
    onNewAppointment,
    view,
    onViewChange,
    holiday,
    blockedDays = [],
    holidays = [],
    onTimeBlock,
    onBlockDay,
    professionals = [],
    selectedProfessionalId = "all",
    onProfessionalChange
}: MobileAgendaViewProps) {

    // Generic date extractor from ISO or space-separated string
    const getDateStr = (apt: any) => {
        if (apt.date && apt.date.length >= 10) return apt.date.substring(0, 10);
        const st = apt.start_time || "";
        if (st.length >= 10) return st.substring(0, 10);
        return null;
    };

    // Group appointments by day and hour
    const sortedAppointments = [...appointments].sort((a, b) => {
        const dateA = getDateStr(a) || "9999-99-99";
        const dateB = getDateStr(b) || "9999-99-99";
        if (dateA !== dateB) return dateA.localeCompare(dateB);
        return (a.start_time || "").localeCompare(b.start_time || "");
    });

    // Function to group by day
    const groupedByDay = sortedAppointments.reduce((acc: any, apt) => {
        const dateStr = getDateStr(apt);
        if (!dateStr) return acc; // Skip invalid dates

        if (!acc[dateStr]) acc[dateStr] = [];
        acc[dateStr].push(apt);
        return acc;
    }, {});

    // Ensure all days of the week appear in "week" view
    let days: string[] = [];
    if (view === "week") {
        const start = startOfWeek(date, { weekStartsOn: 0 });
        days = Array.from({ length: 7 }).map((_, i) => format(addDays(start, i), "yyyy-MM-dd"));
    } else {
        days = Object.keys(groupedByDay).sort();
    }

    return (
        <div className={cn("min-h-full flex flex-col relative", isDark ? "bg-[#0B0E14]" : "bg-slate-50")}>
            <div className={cn("fixed inset-0 pointer-events-none opacity-20", isDark ? "bg-grid-white/[0.05]" : "bg-grid-black/[0.05]")} />

            {/* Header: Date Navigation - Liquid Glass */}
            <div className={cn(
                "sticky top-0 z-20 flex flex-col border-b backdrop-blur-xl transition-colors",
                isDark ? "bg-[#0B0E14]/80 border-white/5" : "bg-white/80 border-slate-200/50"
            )}>
                <div className="flex items-center justify-between p-4 pb-2">
                    <Button variant="ghost" size="icon" onClick={() => onDateChange(view === "week" ? -7 : -1)} className="rounded-xl hover:bg-white/10">
                        <ChevronLeft className={cn("w-6 h-6", isDark ? "text-slate-400" : "text-slate-600")} />
                    </Button>

                    <Popover>
                        <PopoverTrigger asChild>
                            <div className="flex flex-col items-center cursor-pointer active:scale-95 transition-transform">
                                <h2 className={cn("text-xl font-black capitalize tracking-tight leading-none mb-0.5", isDark ? "text-white" : "text-slate-900")}>
                                    {view === "week" ? "Esta Semana" : format(date, "EEEE", { locale: ptBR })}
                                </h2>
                                <div className="flex items-center gap-1.5 opacity-60">
                                    <span className={cn("text-[10px] font-bold uppercase tracking-[0.2em]", isDark ? "text-slate-400" : "text-slate-500")}>
                                        {view === "week"
                                            ? `${format(addDays(date, -date.getDay()), "d/MM")} - ${format(addDays(date, 6 - date.getDay()), "d/MM")}`
                                            : format(date, "d 'de' MMMM", { locale: ptBR })
                                        }
                                    </span>
                                    <LucideCalendar className="w-2.5 h-2.5" />
                                </div>
                            </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 rounded-2xl border-white/10" align="center" side="bottom">
                            <CalendarComponent
                                mode="single"
                                selected={date}
                                onSelect={(newDate) => {
                                    if (newDate) {
                                        const diff = Math.floor((newDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
                                        onDateChange(diff);
                                    }
                                }}
                                initialFocus
                                locale={ptBR}
                                className={isDark ? "bg-slate-900 text-white" : "bg-white"}
                            />
                        </PopoverContent>
                    </Popover>

                    <Button variant="ghost" size="icon" onClick={() => onDateChange(view === "week" ? 7 : 1)} className="rounded-xl hover:bg-white/10">
                        <ChevronRight className={cn("w-6 h-6", isDark ? "text-slate-400" : "text-slate-600")} />
                    </Button>
                </div>

                {/* Holiday Badge */}
                {holiday && (
                    <div className="px-4 pb-2 flex justify-center">
                        <Badge className={cn(
                            "border text-[9px] font-black uppercase tracking-widest gap-1.5 py-1 px-3 rounded-full",
                            holiday.type === 'reminder'
                                ? "bg-green-500/10 text-green-500 border-green-500/20"
                                : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                        )}>
                            {holiday.type === 'reminder' ? '⚽' : <Sparkles className="w-3 h-3" />}
                            {holiday.name}
                        </Badge>
                    </div>
                )}

                {/* Day Block Banner */}
                {view === 'day' && blockedDays.some(b => {
                    const d = format(date, 'yyyy-MM-dd');
                    const start = b.start_date?.substring(0, 10);
                    const end = b.end_date?.substring(0, 10);
                    return start && end && d >= start && d <= end;
                }) && (
                        <div className="px-4 pb-2 flex justify-center">
                            <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20 text-[9px] font-black uppercase tracking-widest gap-1.5 py-1 px-3 rounded-full">
                                <Ban className="w-3 h-3" />
                                DIA BLOQUEADO: {blockedDays.find(b => {
                                    const d = format(date, 'yyyy-MM-dd');
                                    const start = b.start_date?.substring(0, 10);
                                    const end = b.end_date?.substring(0, 10);
                                    return start && end && d >= start && d <= end;
                                })?.reason || "Indisponível"}
                            </Badge>
                        </div>
                    )}

                {/* View Switcher Mobile */}
                <div className="flex flex-col p-2 gap-3 w-full overflow-hidden">
                    {/* Professional Filter - Liquid Horizontal Scroll */}
                    {professionals.length > 0 && (
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 px-2 w-full touch-pan-x scrollbar-thin">
                            <button
                                onClick={() => onProfessionalChange?.("all")}
                                className={cn(
                                    "flex-shrink-0 h-10 px-6 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border",
                                    selectedProfessionalId === "all"
                                        ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20"
                                        : (isDark ? "bg-slate-900/50 border-white/5 text-slate-400" : "bg-white border-slate-200 text-slate-600")
                                )}
                            >
                                Todos
                            </button>
                            {professionals.map((prof) => (
                                <button
                                    key={prof.id}
                                    onClick={() => onProfessionalChange?.(String(prof.id))}
                                    className={cn(
                                        "flex-shrink-0 h-10 flex items-center gap-2 px-3 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border",
                                        selectedProfessionalId === String(prof.id)
                                            ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20"
                                            : (isDark ? "bg-slate-900/50 border-white/5 text-slate-400" : "bg-white border-slate-200 text-slate-600")
                                    )}
                                >
                                    <Avatar className="w-4 h-4 border-white/20">
                                        <AvatarImage src={prof.photo_url} />
                                        <AvatarFallback className="text-[6px] font-black">
                                            {(prof.full_name || prof.name || "?").charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="whitespace-nowrap">{prof.name || prof.full_name?.split(' ')[0]}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    <div className={cn(
                        "flex p-1 rounded-xl glass-premium border-white/5 self-center shrink-0",
                        isDark ? "bg-slate-950/60" : "bg-white/60"
                    )}>
                        <button
                            onClick={() => onViewChange("day")}
                            className={cn(
                                "px-8 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                view === "day"
                                    ? "text-white bg-blue-600 shadow-[0_4px_12px_-4px_rgba(37,99,235,0.6)]"
                                    : (isDark ? "text-slate-500 hover:text-slate-300" : "text-slate-500 hover:text-slate-900")
                            )}
                        >
                            Dia
                        </button>
                        <button
                            onClick={() => onViewChange("week")}
                            className={cn(
                                "px-8 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                view === "week"
                                    ? "text-white bg-blue-600 shadow-[0_4px_12px_-4px_rgba(37,99,235,0.6)]"
                                    : (isDark ? "text-slate-500 hover:text-slate-300" : "text-slate-500 hover:text-slate-900")
                            )}
                        >
                            Semana
                        </button>
                    </div>
                </div>
            </div>

            {/* List Content */}
            <div className="flex-1 px-4 py-6 space-y-6 overflow-y-auto pb-32 relative z-10">
                {(sortedAppointments.length === 0 && view === 'day') ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-60 min-h-[50vh]">
                        <div className={cn(
                            "w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-xl backdrop-blur-sm border",
                            isDark ? "bg-slate-900/50 border-white/5" : "bg-white/50 border-slate-200"
                        )}>
                            <LucideCalendar className={cn("w-8 h-8 opacity-50", isDark ? "text-slate-400" : "text-slate-400")} />
                        </div>
                        <p className={cn("text-sm font-bold uppercase tracking-widest opacity-50 mb-4", isDark ? "text-slate-400" : "text-slate-600")}>
                            Sem agendamentos
                        </p>
                        <Button
                            variant="default"
                            size="sm"
                            className="rounded-full px-6 font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:scale-105 transition-transform shadow-lg shadow-blue-500/20"
                            onClick={onNewAppointment}
                        >
                            Agendar agora
                        </Button>
                    </div>
                ) : (
                    view === "week" ? (
                        days.map((dayStr) => (
                            <div key={dayStr} className="space-y-3">
                                <div className={cn(
                                    "flex items-center gap-3 px-2 py-1 sticky top-0 z-10 backdrop-blur-md rounded-lg",
                                    isDark ? "bg-slate-950/60 text-blue-400" : "bg-white/60 text-blue-600"
                                )}>
                                    <span className="text-[10px] font-black uppercase tracking-widest">
                                        {format(new Date(dayStr + "T12:00:00"), "EEEE, d 'de' MMMM", { locale: ptBR })}
                                    </span>
                                    {/* Holiday & Block Badges for Week View */}
                                    {(() => {
                                        const dayHoliday = holidays.find(h => format(h.date, 'yyyy-MM-dd') === dayStr);
                                        const isBlocked = blockedDays.some(b => dayStr >= b.start_date.split('T')[0] && dayStr <= b.end_date.split('T')[0]);

                                        return (
                                            <div className="flex gap-1">
                                                {dayHoliday && (
                                                    <Badge className={cn(
                                                        "border-0 text-[8px] h-4 px-1",
                                                        dayHoliday.type === 'reminder'
                                                            ? "bg-green-500/10 text-green-500"
                                                            : "bg-amber-500/10 text-amber-500"
                                                    )}>
                                                        {dayHoliday.type === 'reminder' ? '⚽' : <Sparkles className="w-2 h-2 mr-1" />}
                                                        {dayHoliday.name}
                                                    </Badge>
                                                )}
                                                {isBlocked && (
                                                    <Badge className="bg-rose-500/10 text-rose-500 border-0 text-[8px] h-4 px-1">
                                                        <Ban className="w-2 h-2 mr-1" /> BLOQUEADO
                                                    </Badge>
                                                )}
                                            </div>
                                        );
                                    })()}
                                    <div className="h-px flex-1 bg-current opacity-10" />
                                </div>
                                <div className="space-y-2">
                                    {(() => {
                                        const isBlocked = blockedDays.some(b => {
                                            const start = typeof b.start_date === 'string' ? b.start_date.split('T')[0] : format(new Date(b.start_date), 'yyyy-MM-dd');
                                            const end = typeof b.end_date === 'string' ? b.end_date.split('T')[0] : format(new Date(b.end_date), 'yyyy-MM-dd');
                                            return dayStr >= start && dayStr <= end;
                                        });

                                        const block = blockedDays.find(b => {
                                            const start = typeof b.start_date === 'string' ? b.start_date.split('T')[0] : format(new Date(b.start_date), 'yyyy-MM-dd');
                                            const end = typeof b.end_date === 'string' ? b.end_date.split('T')[0] : format(new Date(b.end_date), 'yyyy-MM-dd');
                                            return dayStr >= start && dayStr <= end;
                                        });

                                        if (isBlocked) {
                                            return (
                                                <Card className={cn(
                                                    "p-3 border-0 shadow-md flex items-center gap-3 relative overflow-hidden",
                                                    isDark ? "bg-rose-950/20 border border-rose-500/10" : "bg-rose-50 border border-rose-100"
                                                )}>
                                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500" />
                                                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", isDark ? "bg-rose-500/20" : "bg-rose-100")}>
                                                        <Ban className="w-4 h-4 text-rose-500" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className={cn("text-[8px] font-black uppercase tracking-widest text-rose-500")}>Dia Bloqueado</h4>
                                                        <p className={cn("text-xs font-bold truncate", isDark ? "text-slate-300" : "text-slate-700")}>{block?.reason || "Indisponível"}</p>
                                                    </div>
                                                </Card>
                                            );
                                        }

                                        return (
                                            <>
                                                {(groupedByDay[dayStr] || []).map((apt: any) => (
                                                    <AppointmentCard key={apt.id} apt={apt} isDark={isDark} onSelect={onSelectAppointment} />
                                                ))}
                                                {(!groupedByDay[dayStr] || groupedByDay[dayStr].length === 0) && (
                                                    <div className={cn(
                                                        "py-2 rounded-lg border border-dashed text-center opacity-40",
                                                        isDark ? "border-white/5 bg-white/5" : "border-slate-200 bg-slate-50/50"
                                                    )}>
                                                        <span className={cn("text-[8px] font-bold uppercase tracking-[0.2em]", isDark ? "text-slate-400" : "text-slate-500")}>
                                                            Vazio
                                                        </span>
                                                    </div>
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        ))
                    ) : (
                        sortedAppointments.map((apt) => (
                            <AppointmentCard key={apt.id} apt={apt} isDark={isDark} onSelect={onSelectAppointment} />
                        ))
                    )
                )}
            </div>

            {/* Floating Action Button - Liquid Gradient */}
            <div className="fixed bottom-6 right-6 z-30">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            size="icon"
                            className="w-14 h-14 rounded-2xl shadow-2xl shadow-indigo-500/40 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white hover:scale-110 active:scale-95 transition-all duration-300 border border-white/10 group"
                        >
                            <Plus className="w-7 h-7 group-hover:rotate-90 transition-transform duration-300" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className={cn("rounded-2xl border-white/5 p-2 min-w-[200px]", isDark ? "bg-slate-900/95 backdrop-blur-xl text-slate-200" : "bg-white/95 backdrop-blur-xl")}>
                        <DropdownMenuItem onClick={onNewAppointment} className="gap-3 cursor-pointer p-3 rounded-xl text-xs font-bold uppercase tracking-wider focus:bg-blue-500/10 focus:text-blue-500">
                            <Plus className="w-4 h-4" /> Novo Agendamento
                        </DropdownMenuItem>
                        {onTimeBlock && (
                            <DropdownMenuItem onClick={onTimeBlock} className="gap-3 cursor-pointer p-3 rounded-xl text-xs font-bold uppercase tracking-wider focus:bg-blue-500/10 focus:text-blue-500">
                                <Clock className="w-4 h-4" /> Bloqueio de Horário
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator className={isDark ? "bg-white/5 my-1" : "bg-slate-100 my-1"} />
                        {onBlockDay && (
                            <DropdownMenuItem onClick={onBlockDay} className="gap-3 text-rose-500 focus:text-rose-600 focus:bg-rose-500/10 cursor-pointer p-3 rounded-xl text-xs font-bold uppercase tracking-wider">
                                <Ban className="w-4 h-4" /> Bloquear Dia
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}

function AppointmentCard({ apt, isDark, onSelect }: { apt: any, isDark: boolean, onSelect: (apt: any) => void }) {
    const status = statusConfig[apt.status] || statusConfig.agendado;
    const time = apt.start_time?.substring(0, 5) || "--:--";

    return (
        <Card
            onClick={() => onSelect(apt)}
            className={cn(
                "flex items-stretch overflow-hidden border-0 shadow-lg active:scale-[0.98] transition-all duration-300 group relative",
                apt.type === 'bloqueio'
                    ? (isDark ? "bg-slate-700/90 backdrop-blur-md" : "bg-slate-400/90 backdrop-blur-md")
                    : (isDark ? "bg-slate-900/60 backdrop-blur-md" : "bg-white/80 backdrop-blur-md")
            )}
        >
            {/* Gradient Indicator Bar */}
            <div className={cn(
                "w-1.5 absolute left-0 top-0 bottom-0 bg-gradient-to-b",
                (apt.patient?.temperature === "hot" || apt.patient?.funnel_status === "hot") ? "from-rose-500 to-orange-500" :
                    (apt.patient?.temperature === "warm" || apt.patient?.funnel_status === "warm") ? "from-amber-500 to-yellow-500" :
                        "from-blue-500 to-indigo-500"
            )} />

            {/* Time Column */}
            <div className={cn(
                "w-20 flex flex-col items-center justify-center px-2 py-4 border-r ml-1.5",
                isDark ? "border-white/5 bg-slate-950/30" : "border-slate-100 bg-slate-50/50"
            )}>
                <span className={cn("text-sm font-black tracking-tight", isDark ? "text-white" : "text-slate-900")}>{time}</span>
                <Badge variant="outline" className={cn("mt-1.5 h-4 px-1 text-[8px] font-black uppercase border-0 bg-opacity-10", isDark ? "bg-white text-slate-400" : "bg-black text-slate-500")}>
                    {format(new Date(), "HH:mm") > time && apt.status !== 'finalizado' ? 'ATRASADO' : 'HORÁRIO'}
                </Badge>
            </div>

            {/* Content */}
            <div className="flex-1 p-3 min-w-0 flex flex-col justify-center">
                <div className="flex justify-between items-start mb-1.5">
                    {apt.type === 'bloqueio' ? (
                        <h3 className={cn("font-bold truncate text-sm leading-tight flex items-center gap-2", isDark ? "text-slate-300" : "text-slate-700")}>
                            <Ban className="w-3.5 h-3.5 text-rose-500" />
                            BLOQUEIO: {apt.procedure_name || "Indisponível"}
                        </h3>
                    ) : (
                        <h3 className={cn("font-bold truncate text-sm leading-tight", isDark ? "text-slate-100" : "text-slate-800")}>
                            {apt.patient?.full_name || "Paciente sem nome"}
                            {apt.professional && (
                                <span className="opacity-60 text-[10px] font-normal ml-1 block">
                                    com {apt.professional.name || apt.professional.full_name || "Profissional"}
                                </span>
                            )}
                        </h3>
                    )}
                </div>

                {/* Patient Tags Row - High Ticket Indicators */}
                {apt.type !== 'bloqueio' && (
                    <div className="flex flex-wrap gap-1.5 mb-2.5">
                        {(apt.patient?.temperature || apt.patient?.funnel_status) && (
                            <div className={cn(
                                "text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter flex items-center gap-1",
                                (apt.patient.temperature === "hot" || apt.patient.funnel_status === "hot") ? "bg-rose-500/10 text-rose-500 border border-rose-500/20" :
                                    (apt.patient.temperature === "warm" || apt.patient.funnel_status === "warm") ? "bg-orange-500/10 text-orange-500 border border-orange-500/20" :
                                        "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                            )}>
                                {(apt.patient.temperature === "hot" || apt.patient.funnel_status === "hot") ? "QUENTE" :
                                    (apt.patient.temperature === "warm" || apt.patient.funnel_status === "warm") ? "MORNO" : "FRIO"}
                            </div>
                        )}
                        <Badge variant="outline" className={cn("h-4 text-[8px] px-1.5 border-0 font-black uppercase tracking-wider backdrop-blur-md", status.color)}>
                            {status.label}
                        </Badge>
                    </div>
                )}

                {apt.type !== 'bloqueio' && (
                    <div className="flex items-center gap-1.5 text-xs">
                        <div className={cn("w-1 h-1 rounded-full", isDark ? "bg-slate-600" : "bg-slate-300")} />
                        <span className={cn("truncate font-medium text-[10px] uppercase tracking-wide opacity-70", isDark ? "text-slate-300" : "text-slate-600")}>
                            {apt.type || "Consulta"} • {apt.procedure_name || "Procedimento"}
                        </span>
                    </div>
                )}
            </div>
        </Card>
    );
}
