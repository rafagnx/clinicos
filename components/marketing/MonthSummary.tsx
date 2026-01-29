import { useMemo } from 'react';
import { CalendarEvent } from '@/hooks/useCalendarData';
import { getHolidays } from '@/utils/holidays';
import { isSameMonth } from 'date-fns';
import { cn } from '@/lib/utils';
import { BarChart3 } from 'lucide-react';

interface MonthSummaryProps {
    currentMonth: number;
    currentYear: number;
    events: CalendarEvent[];
}

export function MonthSummary({ currentMonth, currentYear, events }: MonthSummaryProps) {
    const summary = useMemo(() => {
        const targetDate = new Date(currentYear, currentMonth, 1);
        const holidays = getHolidays(currentYear).filter(h => isSameMonth(h.date, targetDate));

        // Filter events for current month
        const monthEvents = events.filter(e => {
            const d = new Date(e.date);
            return isSameMonth(d, targetDate);
        });

        const stats: Record<string, number> = {};

        // Count events by category
        monthEvents.forEach(e => {
            const cat = e.category || 'gray';
            stats[cat] = (stats[cat] || 0) + 1;
        });

        // Add holidays to stats if any
        if (holidays.length > 0) {
            stats['holiday'] = holidays.length;
        }

        return { stats, total: monthEvents.length + holidays.length };
    }, [currentMonth, currentYear, events]);

    const colorMap: Record<string, string> = {
        blue: 'bg-calendar-blue',
        yellow: 'bg-calendar-yellow',
        'green-light': 'bg-calendar-green-light',
        pink: 'bg-calendar-pink',
        green: 'bg-calendar-green',
        purple: 'bg-calendar-purple',
        gray: 'bg-calendar-gray',
        holiday: 'bg-calendar-holiday',
    };

    const labelMap: Record<string, string> = {
        blue: 'TRÁFEGO BITTENCOURT',
        yellow: 'TRÁFEGO LETÍCIA',
        'green-light': 'DIVULGAÇÃO BITTENCOURT',
        pink: 'DIVULGAÇÃO LETÍCIA',
        green: 'CRIAR ARTES',
        purple: 'OUTRAS CIDADES',
        gray: 'GERAL',
        holiday: 'FERIADO',
    };

    const monthName = new Date(currentYear, currentMonth).toLocaleString('pt-BR', { month: 'long' });

    return (
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">
                    Resumo de {monthName}
                </h3>
            </div>

            <p className="text-xs text-muted-foreground mb-4">
                Quantidade de dias com cada campanha
            </p>

            <div className="space-y-3">
                {Object.entries(summary.stats).map(([key, count]) => (
                    <div key={key} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                            <div className={cn("w-3 h-3 rounded-full", colorMap[key] || 'bg-gray-400')} />
                            <span className="font-medium text-foreground/80 text-xs">
                                {labelMap[key] || key.toUpperCase()}
                            </span>
                        </div>
                        <span className="font-bold text-foreground">
                            {count} {count === 1 ? 'dia' : 'dias'}
                        </span>
                    </div>
                ))}
            </div>

            <div className="mt-4 pt-4 border-t flex justify-between text-xs font-medium">
                <span className="text-muted-foreground">Total de dias com eventos</span>
                <span className="text-foreground">{summary.total}</span>
            </div>
        </div>
    );
}
