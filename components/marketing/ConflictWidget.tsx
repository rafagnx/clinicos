import { useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { DayData, CategoryColor } from '@/types/calendar';
import { cn } from '@/lib/utils';

interface ConflictWidgetProps {
    conflicts: { date: string; events: DayData[] }[];
}

const colorClasses: Record<string, string> = {
    blue: 'bg-calendar-blue',
    yellow: 'bg-calendar-yellow',
    'green-light': 'bg-calendar-green-light',
    pink: 'bg-calendar-pink',
    green: 'bg-calendar-green',
    purple: 'bg-calendar-purple',
    gray: 'bg-calendar-gray',
    holiday: 'bg-calendar-holiday',
};

export function ConflictWidget({ conflicts }: ConflictWidgetProps) {
    if (conflicts.length === 0) return null;

    return (
        <div className="bg-[#FFF9F0] border border-[#FDE6C6] rounded-xl p-4 shadow-sm animate-pulse-subtle">
            <div className="flex items-start gap-3 mb-3">
                <div className="bg-[#FBC02D] rounded-full p-1.5 shrink-0 animate-pulse">
                    <AlertTriangle className="w-5 h-5 text-white" fill="white" />
                </div>
                <div>
                    <h3 className="font-bold text-[#8C4E00] text-sm">
                        {conflicts.length} CONFLITO{conflicts.length > 1 ? 'S' : ''}
                    </h3>
                    <p className="text-xs text-[#B3792B]">
                        Dias com múltiplas campanhas
                    </p>
                </div>
            </div>

            <div className="space-y-3 pl-1">
                {conflicts.map((conflict) => {
                    const [year, month, day] = conflict.date.split('-');
                    return (
                        <div key={conflict.date} className="space-y-1.5">
                            <p className="text-xs font-bold text-[#8C4E00]">
                                {day}/{month}
                            </p>
                            <div className="flex flex-col gap-1">
                                {conflict.events.map((event, idx) => (
                                    <div
                                        key={idx}
                                        className={cn(
                                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase w-fit text-foreground/90",
                                            event.color && colorClasses[event.color]
                                        )}
                                    >
                                        {event.text}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
