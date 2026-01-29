import { ChevronLeft, ChevronRight, List, Search, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MONTHS_PT } from '@/types/calendar';

interface CalendarHeaderProps {
    month: number;
    year: number;
    onPrevMonth: () => void;
    onNextMonth: () => void;
}

export function CalendarHeader({
    month,
    year,
    onPrevMonth,
    onNextMonth,
}: CalendarHeaderProps) {
    return (
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onPrevMonth}
                    className="hover:bg-muted"
                >
                    <ChevronLeft className="w-5 h-5" />
                </Button>
                <h1 className="text-4xl md:text-5xl font-light tracking-wide text-foreground">
                    {MONTHS_PT[month]}
                </h1>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onNextMonth}
                    className="hover:bg-muted"
                >
                    <ChevronRight className="w-5 h-5" />
                </Button>
            </div>

            <div className="flex items-center gap-2">
                <span className="text-2xl md:text-3xl font-bold text-foreground">{year}</span>
                <div className="flex items-center gap-1 ml-4">
                    <Button variant="ghost" size="icon" className="hover:bg-muted">
                        <List className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="hover:bg-muted">
                        <Search className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="hover:bg-muted">
                        <Plus className="w-5 h-5" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
