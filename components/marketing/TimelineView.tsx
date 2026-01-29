import { CalendarEvent } from '@/hooks/useCalendarData';
import { getHolidays } from '@/utils/holidays';
import { format, getMonth, isSameMonth, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { BarChart3 } from 'lucide-react';

interface TimelineViewProps {
    year: number;
    events: CalendarEvent[];
}

export function TimelineView({ year, events }: TimelineViewProps) {
    const holidays = getHolidays(year);
    const months = Array.from({ length: 12 }, (_, i) => i);

    const getEventsForMonth = (monthIndex: number) => {
        const monthEvents = events.filter(e => {
            const d = new Date(e.date);
            return getMonth(d) === monthIndex;
        }).map(e => ({ ...e, isHoliday: false }));

        const monthHolidays = holidays.filter(h => getMonth(h.date) === monthIndex)
            .map(h => ({
                id: `hol-${h.date.getTime()}`,
                date: h.date.toISOString(), // Norm to string
                content: h.name,
                category: 'holiday',
                isHoliday: true
            }));

        return [...monthEvents, ...monthHolidays].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    };

    const colorClassMap: Record<string, string> = {
        blue: 'bg-calendar-blue text-blue-900',
        yellow: 'bg-calendar-yellow text-yellow-900',
        'green-light': 'bg-calendar-green-light text-green-900',
        pink: 'bg-calendar-pink text-pink-900',
        green: 'bg-calendar-green text-green-900',
        purple: 'bg-calendar-purple text-purple-900',
        gray: 'bg-calendar-gray text-slate-700',
        holiday: 'bg-calendar-holiday text-slate-600',
    };

    return (
        <div className="overflow-x-auto pb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                TIMELINE {year}
            </h2>

            <div className="flex gap-4 min-w-max">
                {months.map((monthIndex) => {
                    const monthItems = getEventsForMonth(monthIndex);
                    const monthName = format(new Date(year, monthIndex), 'MMM', { locale: ptBR }).toUpperCase();

                    return (
                        <div key={monthIndex} className="w-40 bg-card/50 rounded-lg border border-border p-2 flex flex-col h-[400px]">
                            <div className="text-center py-2 border-b border-border/50 mb-2">
                                <span className="text-xs font-bold text-muted-foreground">{monthName}</span>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                {monthItems.length > 0 ? (
                                    monthItems.map((item, idx) => {
                                        const day = new Date(item.date).getDate();
                                        return (
                                            <div
                                                key={idx}
                                                className={cn(
                                                    "p-2 rounded text-[10px] font-medium leading-tight shadow-sm",
                                                    colorClassMap[item.category || 'gray'] || 'bg-gray-200'
                                                )}
                                            >
                                                <div className="font-bold opacity-70 mb-0.5">{day}</div>
                                                <div className="line-clamp-3">{item.content}</div>
                                            </div>
                                        )
                                    })
                                ) : (
                                    <div className="flex items-center justify-center h-full text-[10px] text-muted-foreground opacity-50">
                                        Sem eventos
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(155,155,155,0.3); border-radius: 4px; }
            `}</style>
        </div>
    );
}
