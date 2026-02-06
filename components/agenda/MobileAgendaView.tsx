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
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";

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
    isLoading?: boolean;
    onUpdateStatus?: (id: number | string, status: string) => void;
    onDelete?: (id: number | string) => void;
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
    onProfessionalChange,
    isLoading = false,
    onUpdateStatus,
    onDelete
}: MobileAgendaViewProps) {

    // Generic date extractor from ISO or space-separated string
    const getDateStr = (apt: any) => {
        if (apt.date && apt.date.length >= 10) return apt.date.substring(0, 10);
        const st = apt.start_time || "";
        if (st.includes("T")) return st.split("T")[0];
        return st.split(" ")[0]; // Fallback
    };

    const sortedAppointments = [...appointments].sort((a, b) => {
        return (a.start_time || "").localeCompare(b.start_time || "");
    });

    // Group by day for Week view
    const groupedByDay: Record<string, any[]> = {};
    if (view === "week") {
        const start = startOfWeek(date, { weekStartsOn: 0 });
        for (let i = 0; i < 7; i++) {
            const dStr = format(addDays(start, i), "yyyy-MM-dd");
            groupedByDay[dStr] = sortedAppointments.filter(a => getDateStr(a) === dStr);
        }
    }

    // Days array for rendering
    const days = view === "week"
        ? Array.from({ length: 7 }).map((_, i) => format(addDays(startOfWeek(date, { weekStartsOn: 0 }), i), "yyyy-MM-dd"))
        : [format(date, "yyyy-MM-dd")];

    return (
        <div className={cn("flex flex-col h-full relative overflow-hidden", isDark ? "bg-[#0B0E14]" : "bg-slate-50")}>
            <div className={cn("fixed inset-0 pointer-events-none opacity-20", isDark ? "bg-grid-white/[0.05]" : "bg-grid-black/[0.05]")} />

            {/* Header: Date Navigation - Compact */}
            <div className={cn(
                "flex-none flex flex-col border-b backdrop-blur-xl transition-colors shadow-sm z-30",
                isDark ? "bg-[#0B0E14]/95 border-white/5" : "bg-white/95 border-slate-200/50"
            )}>
                {/* Top Row: Date & View Toggle - 100% Fluid Responsive */}
                <div className="flex items-center justify-between p-2 pb-1 gap-2 w-full">

                    {/* Date Navigation (Fluida, ocupa o espaço disponível) */}
                    <div className="flex items-center gap-0.5 flex-1 min-w-0 bg-transparent">
                        <Button variant="ghost" size="icon" onClick={() => onDateChange(view === "week" ? -7 : -1)} className="h-8 w-8 rounded-full hover:bg-white/10 shrink-0">
                            <ChevronLeft className={cn("w-5 h-5", isDark ? "text-slate-400" : "text-slate-600")} />
                        </Button>

                        <Popover>
                            <PopoverTrigger asChild>
                                <div className="flex flex-col cursor-pointer active:scale-95 transition-transform px-1 text-center flex-1 min-w-0 overflow-hidden">
                                    <h2 className={cn("text-sm font-black capitalize tracking-tight leading-none truncate w-full", isDark ? "text-white" : "text-slate-900")}>
                                        {view === "week" ? "Esta Semana" : format(date, "EEEE", { locale: ptBR })}
                                    </h2>
                                    <span className={cn("text-[8px] font-bold uppercase tracking-widest opacity-60 truncate w-full block", isDark ? "text-slate-400" : "text-slate-500")}>
                                        {view === "week"
                                            ? `${format(startOfWeek(date, { weekStartsOn: 0 }), "d MMM", { locale: ptBR })} - ${format(addDays(startOfWeek(date, { weekStartsOn: 0 }), 6), "d MMM", { locale: ptBR })}`
                                            : format(date, "d 'de' MMMM", { locale: ptBR })
                                        }
                                    </span>
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

                        <Button variant="ghost" size="icon" onClick={() => onDateChange(view === "week" ? 7 : 1)} className="h-8 w-8 rounded-full hover:bg-white/10 shrink-0">
                            <ChevronRight className={cn("w-5 h-5", isDark ? "text-slate-400" : "text-slate-600")} />
                        </Button>
                    </div>

                    {/* View Switcher - Fixed Size, never shrinks */}
                    <div className={cn(
                        "flex p-0.5 rounded-full border h-7 items-center shrink-0 ml-1",
                        isDark ? "bg-slate-900/50 border-white/10" : "bg-slate-100/50 border-slate-200"
                    )}>
                        <button
                            onClick={() => onViewChange("day")}
                            className={cn(
                                "px-2.5 h-full rounded-full text-[8px] font-black uppercase tracking-widest transition-all",
                                view === "day"
                                    ? (isDark ? "bg-white text-slate-950" : "bg-white text-slate-900 shadow-sm")
                                    : (isDark ? "text-slate-500 hover:text-slate-300" : "text-slate-500 hover:text-slate-900")
                            )}
                        >
                            Dia
                        </button>
                        <button
                            onClick={() => onViewChange("week")}
                            className={cn(
                                "px-2.5 h-full rounded-full text-[8px] font-black uppercase tracking-widest transition-all",
                                view === "week"
                                    ? (isDark ? "bg-white text-slate-950" : "bg-white text-slate-900 shadow-sm")
                                    : (isDark ? "text-slate-500 hover:text-slate-300" : "text-slate-500 hover:text-slate-900")
                            )}
                        >
                            Semana
                        </button>
                    </div>
                </div>

                {/* Filters Row - Compact Horizontal Scroll */}
                <div className="w-full overflow-x-auto pb-2 px-4 touch-pan-x scrollbar-hide flex items-center gap-2">
                    <button
                        onClick={() => onProfessionalChange?.("all")}
                        className={cn(
                            "flex-shrink-0 h-7 px-3 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border flex items-center shadow-sm",
                            selectedProfessionalId === "all"
                                ? "bg-blue-600 border-blue-600 text-white"
                                : (isDark ? "bg-slate-900/50 border-white/10 text-slate-400" : "bg-white border-slate-200 text-slate-600")
                        )}
                    >
                        Todos
                    </button>
                    {professionals.map((prof) => (
                        <button
                            key={prof.id}
                            onClick={() => onProfessionalChange?.(String(prof.id))}
                            className={cn(
                                "flex-shrink-0 h-7 flex items-center gap-2 px-2 pl-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border shadow-sm",
                                selectedProfessionalId === String(prof.id)
                                    ? "bg-blue-600 border-blue-600 text-white"
                                    : (isDark ? "bg-slate-900/50 border-white/10 text-slate-400" : "bg-white border-slate-200 text-slate-600")
                            )}
                        >
                            <Avatar className="w-5 h-5 border border-white/10">
                                <AvatarImage src={prof.photo_url} />
                                <AvatarFallback className={cn("text-[6px] font-black", isDark ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-700")}>
                                    {(prof.full_name || prof.name || "?").charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <span className="whitespace-nowrap translate-y-[0.5px]">{prof.name || prof.full_name?.split(' ')[0]}</span>
                        </button>
                    ))}
                    {/* Spacer for proper end padding */}
                    <div className="w-2 shrink-0" />
                </div>

                {/* Badges Row */}
                {(holiday || (view === 'day' && blockedDays.some(b => {
                    const d = format(date, 'yyyy-MM-dd');
                    const start = b.start_date?.substring(0, 10);
                    const end = b.end_date?.substring(0, 10);
                    return start && end && d >= start && d <= end;
                }))) && (
                        <div className="px-4 pb-2 flex justify-center gap-2 animate-in slide-in-from-top-2">
                            {holiday && (
                                <Badge className={cn(
                                    "border text-[8px] font-black uppercase tracking-widest gap-1.5 py-0.5 px-2 h-5 rounded-full",
                                    holiday.type === 'reminder'
                                        ? "bg-green-500/10 text-green-500 border-green-500/20"
                                        : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                )}>
                                    {holiday.type === 'reminder' ? '⚽' : <Sparkles className="w-2.5 h-2.5" />}
                                    {holiday.name}
                                </Badge>
                            )}
                            {view === 'day' && blockedDays.some(b => {
                                const d = format(date, 'yyyy-MM-dd');
                                const start = b.start_date?.substring(0, 10);
                                const end = b.end_date?.substring(0, 10);
                                return start && end && d >= start && d <= end;
                            }) && (
                                    <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20 text-[8px] font-black uppercase tracking-widest gap-1.5 py-0.5 px-2 h-5 rounded-full">
                                        <Ban className="w-2.5 h-2.5" />
                                        {blockedDays.find(b => {
                                            const d = format(date, 'yyyy-MM-dd');
                                            const start = b.start_date?.substring(0, 10);
                                            const end = b.end_date?.substring(0, 10);
                                            return start && end && d >= start && d <= end;
                                        })?.reason || "Bloqueado"}
                                    </Badge>
                                )}
                        </div>
                    )}
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto min-h-0 relative z-10 p-2 pb-24 touch-pan-y">
                {isLoading ? (
                    <div className="space-y-3 pt-2">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex gap-4 p-3 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-white/10">
                                <Skeleton className="w-12 h-10 rounded-xl" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="w-3/4 h-3 rounded-lg" />
                                    <Skeleton className="w-1/2 h-2.5 rounded-lg" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (sortedAppointments.length === 0 && view === 'day') ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center opacity-70 pointer-events-none">
                        <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center mb-3 shadow-lg backdrop-blur-sm border pointer-events-auto",
                            isDark ? "bg-slate-900/50 border-white/5" : "bg-white/50 border-slate-200"
                        )}>
                            <LucideCalendar className={cn("w-5 h-5 opacity-50", isDark ? "text-slate-400" : "text-slate-400")} />
                        </div>
                        <p className={cn("text-[10px] font-bold uppercase tracking-widest opacity-50 mb-3", isDark ? "text-slate-400" : "text-slate-600")}>
                            Sem agendamentos
                        </p>
                        <Button
                            variant="default"
                            size="sm"
                            className="rounded-full px-4 h-7 text-[10px] font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:scale-105 transition-transform shadow-blue-500/20 pointer-events-auto"
                            onClick={onNewAppointment}
                        >
                            Agendar
                        </Button>
                    </div>
                ) : (
                    view === "week" ? (
                        days.map((dayStr) => (
                            <div key={dayStr} className="mb-2">
                                <div className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 sticky top-0 z-10 backdrop-blur-md rounded-lg mb-2 shadow-sm",
                                    isDark ? "bg-slate-950/80 border-slate-800 text-blue-400" : "bg-white/95 border-slate-200 text-blue-600"
                                )}>
                                    <div className={cn("text-[9px] font-black uppercase tracking-widest flex flex-col leading-none text-center min-w-[24px]", isDark ? "text-slate-400" : "text-slate-500")}>
                                        <span className="text-[7px] opacity-70">{format(new Date(dayStr + "T12:00:00"), "EEE", { locale: ptBR })}</span>
                                        <span className={cn("text-xs", isDark ? "text-white" : "text-slate-900")}>{format(new Date(dayStr + "T12:00:00"), "dd")}</span>
                                    </div>
                                    <div className="w-px h-5 bg-current opacity-10" />
                                    <span className={cn("text-[9px] font-bold uppercase tracking-widest flex-1", isDark ? "text-slate-300" : "text-slate-700")}>
                                        {format(new Date(dayStr + "T12:00:00"), "MMMM", { locale: ptBR })}
                                    </span>

                                    {/* Badges */}
                                    {(() => {
                                        const dayHoliday = holidays.find(h => format(h.date, 'yyyy-MM-dd') === dayStr);
                                        const isBlocked = blockedDays.some(b => dayStr >= b.start_date.split('T')[0] && dayStr <= b.end_date.split('T')[0]);

                                        return (
                                            <div className="flex gap-1">
                                                {dayHoliday && (
                                                    <div className={cn(
                                                        "w-1.5 h-1.5 rounded-full",
                                                        dayHoliday.type === 'reminder' ? "bg-green-500" : "bg-amber-500"
                                                    )} />
                                                )}
                                                {isBlocked && (
                                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>

                                <div className="space-y-2 pl-2">
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
                                                <div className={cn(
                                                    "p-2.5 rounded-xl border flex items-center gap-3 relative overflow-hidden ml-2",
                                                    isDark ? "bg-rose-950/10 border-rose-500/20" : "bg-rose-50 border-rose-100"
                                                )}>
                                                    <Ban className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-[8px] font-black uppercase tracking-widest text-rose-500">Dia Bloqueado</h4>
                                                        <p className={cn("text-[10px] font-medium truncate opacity-80", isDark ? "text-rose-200" : "text-rose-900")}>{block?.reason || "Indisponível"}</p>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        const dayApts = groupedByDay[dayStr] || [];

                                        if (dayApts.length === 0) {
                                            return (
                                                <div className={cn(
                                                    "py-2 ml-1 rounded-lg text-center border border-dashed",
                                                    isDark ? "border-white/5 bg-white/[0.02]" : "border-slate-200 bg-slate-50/50"
                                                )}>
                                                    <p className={cn("text-[8px] font-bold uppercase tracking-widest opacity-40", isDark ? "text-slate-400" : "text-slate-500")}>
                                                        Sem agendamentos
                                                    </p>
                                                </div>
                                            );
                                        }

                                        return dayApts.map((apt: any) => (
                                            <AppointmentCard
                                                key={apt.id}
                                                apt={apt}
                                                isDark={isDark}
                                                onSelect={onSelectAppointment}
                                                onUpdateStatus={onUpdateStatus}
                                                onDelete={onDelete}
                                            />
                                        ));
                                    })()}
                                </div>
                            </div>
                        ))
                    ) : (
                        sortedAppointments.map((apt) => (
                            <AppointmentCard
                                key={apt.id}
                                apt={apt}
                                isDark={isDark}
                                onSelect={onSelectAppointment}
                                onUpdateStatus={onUpdateStatus}
                                onDelete={onDelete}
                            />
                        ))
                    )
                )}
            </div>

            {/* Floating Action Button - Liquid Gradient */}
            <div className="fixed bottom-24 right-4 z-40">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            size="icon"
                            className="w-12 h-12 rounded-2xl shadow-xl shadow-blue-500/40 bg-gradient-to-br from-blue-600 to-indigo-600 text-white hover:scale-105 active:scale-95 transition-all duration-300 border border-white/20"
                        >
                            <Plus className="w-6 h-6" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className={cn("rounded-2xl border-white/5 p-2 min-w-[200px] mb-2", isDark ? "bg-slate-900/95 backdrop-blur-xl text-slate-200" : "bg-white/95 backdrop-blur-xl")}>
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

function AppointmentCard({
    apt,
    isDark,
    onSelect,
    onUpdateStatus,
    onDelete
}: {
    apt: any,
    isDark: boolean,
    onSelect: (apt: any) => void,
    onUpdateStatus?: (id: number | string, status: string) => void,
    onDelete?: (id: number | string) => void
}) {
    const status = statusConfig[apt.status] || statusConfig.agendado;
    const time = apt.start_time?.substring(0, 5) || "--:--";
    const x = useMotionValue(0);
    const rightBg = useTransform(x, [0, 100], ["rgba(34, 197, 94, 0)", "rgba(34, 197, 94, 1)"]);
    const leftBg = useTransform(x, [-100, 0], ["rgba(239, 68, 68, 1)", "rgba(239, 68, 68, 0)"]);

    const handleDragEnd = (_: any, info: any) => {
        if (info.offset.x > 100) {
            onUpdateStatus?.(apt.id, 'finalizado');
            x.set(0);
        } else if (info.offset.x < -100) {
            if (confirm("Deseja realmente remover este agendamento?")) {
                onDelete?.(apt.id);
            }
            x.set(0);
        } else {
            x.set(0);
        }
    };

    return (
        <div className="relative overflow-hidden rounded-3xl mb-3">
            {/* Swipe Action - Right (Check-in) */}
            <motion.div
                style={{ backgroundColor: rightBg }}
                className="absolute inset-0 flex items-center pl-6 text-white font-black z-0 rounded-3xl"
            >
                <div className="flex flex-col items-center gap-1">
                    <Check className="w-5 h-5" />
                    <span className="text-[10px] uppercase tracking-widest">Atender</span>
                </div>
            </motion.div>

            {/* Swipe Action - Left (Delete) */}
            <motion.div
                style={{ backgroundColor: leftBg }}
                className="absolute inset-0 flex items-center justify-end pr-6 text-white font-black z-0 rounded-3xl"
            >
                <div className="flex flex-col items-center gap-1">
                    <Ban className="w-5 h-5" />
                    <span className="text-[10px] uppercase tracking-widest">Remover</span>
                </div>
            </motion.div>

            <motion.div
                drag="x"
                dragConstraints={{ left: -120, right: 120 }}
                onDragEnd={handleDragEnd}
                style={{ x }}
                className="relative z-10"
            >
                <Card
                    onClick={() => onSelect(apt)}
                    className={cn(
                        "flex items-stretch overflow-hidden border-0 shadow-lg transition-all duration-300 group relative",
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
            </motion.div>
        </div>
    );
}
