import { useMemo } from 'react';
import { CalendarEvent } from '@/hooks/useCalendarData';
import { getHolidays } from '@/utils/holidays';
import { format, isAfter, isSameDay, addDays, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';

interface UpcomingEventsProps {
    events: CalendarEvent[];
}

export function UpcomingEvents({ events }: UpcomingEventsProps) {
    const upcoming = useMemo(() => {
        const today = startOfDay(new Date());
        // For debugging/demo, let's look ahead 30 days
        const limit = addDays(today, 60);

        const holidays = getHolidays(today.getFullYear())
            .filter(h => isAfter(h.date, today) || isSameDay(h.date, today))
            .map(h => ({
                id: `hol-${h.date.getTime()}`,
                date: h.date,
                content: h.name,
                category: 'holiday',
                isHoliday: true
            }));

        const activeEvents = events
            .filter(e => {
                const d = new Date(e.date);
                // Fix timezone offset issue by treating date string as local YYYY-MM-DD
                const parts = e.date.split('T')[0].split('-');
                const localDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
                return (isAfter(localDate, today) || isSameDay(localDate, today)) && !isAfter(localDate, limit);
            })
            .map(e => {
                const parts = e.date.split('T')[0].split('-');
                const localDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
                return {
                    ...e,
                    date: localDate,
                    isHoliday: false
                };
            });

        const combined = [...activeEvents, ...holidays].sort((a, b) => a.date.getTime() - b.date.getTime());
        return combined.slice(0, 5); // Take top 5
    }, [events]);

    const colorDotMap: Record<string, string> = {
        blue: 'bg-calendar-blue',
        yellow: 'bg-calendar-yellow',
        'green-light': 'bg-calendar-green-light',
        pink: 'bg-calendar-pink',
        green: 'bg-calendar-green',
        purple: 'bg-calendar-purple',
        gray: 'bg-calendar-gray',
        holiday: 'bg-calendar-holiday',
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <h3 className="font-bold text-xs uppercase tracking-wider">Próximos Eventos</h3>
            </div>

            <div className="space-y-3">
                {upcoming.map((item) => {
                    const diffDays = Math.ceil((item.date.getTime() - startOfDay(new Date()).getTime()) / (1000 * 60 * 60 * 24));

                    return (
                        <div key={item.id} className="bg-card p-3 rounded-lg border border-border shadow-sm flex items-start gap-3">
                            <div className="flex flex-col items-center min-w-[30px]">
                                <span className={cn(
                                    "text-2xl font-bold leading-none",
                                    item.isHoliday ? "text-muted-foreground" : "text-foreground"
                                )}>
                                    {format(item.date, 'd')}
                                </span>
                                <span className="text-[10px] text-muted-foreground mt-1">
                                    {diffDays === 0 ? 'dias' : 'dias'}
                                </span>
                            </div>

                            <div className="flex-1 min-w-0 pt-0.5">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className={cn("w-2 h-2 rounded-full", colorDotMap[item.category || 'gray'] || 'bg-gray-400')} />
                                    <span className="text-xs font-bold truncate text-foreground/90">
                                        {item.content}
                                    </span>
                                </div>
                                <span className="text-[10px] text-muted-foreground capitalize">
                                    {format(item.date, "dd 'de' MMM", { locale: ptBR })}
                                </span>
                            </div>
                        </div>
                    );
                })}

                {upcoming.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-xs">
                        Nenhum evento próximo
                    </div>
                )}
            </div>
        </div>
    );
}
