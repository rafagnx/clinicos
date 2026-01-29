import { useMemo } from 'react';
import { CalendarData, CategoryColor, DayData, WEEKDAYS_PT } from '@/types/calendar';
import { CalendarDay } from './CalendarDay';

interface CalendarGridProps {
    month: number;
    year: number;
    data: CalendarData;
    selectedColor: CategoryColor;
    onUpdateDay: (dateKey: string, data: DayData) => void;
    onClearDay: (dateKey: string) => void;
}

interface CalendarCell {
    day: number;
    dateKey: string;
    isCurrentMonth: boolean;
}

export function CalendarGrid({
    month,
    year,
    data,
    selectedColor,
    onUpdateDay,
    onClearDay,
}: CalendarGridProps) {
    const cells = useMemo(() => {
        const result: CalendarCell[] = [];

        // First day of month
        const firstDay = new Date(year, month, 1);
        const startWeekday = firstDay.getDay();

        // Days in current month
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Days in previous month
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        // Previous month days
        for (let i = startWeekday - 1; i >= 0; i--) {
            const day = daysInPrevMonth - i;
            const prevMonth = month === 0 ? 11 : month - 1;
            const prevYear = month === 0 ? year - 1 : year;
            const dateKey = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            result.push({ day, dateKey, isCurrentMonth: false });
        }

        // Current month days
        for (let day = 1; day <= daysInMonth; day++) {
            const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            result.push({ day, dateKey, isCurrentMonth: true });
        }

        // Next month days to complete the grid (6 rows * 7 = 42 cells)
        const remainingCells = 42 - result.length;
        for (let day = 1; day <= remainingCells; day++) {
            const nextMonth = month === 11 ? 0 : month + 1;
            const nextYear = month === 11 ? year + 1 : year;
            const dateKey = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            result.push({ day, dateKey, isCurrentMonth: false });
        }

        return result;
    }, [month, year]);

    return (
        <div className="space-y-1">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1.5">
                {WEEKDAYS_PT.map((day) => (
                    <div
                        key={day}
                        className="text-center text-xs font-semibold text-muted-foreground py-1.5"
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar cells */}
            <div className="grid grid-cols-7 gap-1.5">
                {cells.map((cell, index) => (
                    <CalendarDay
                        key={`${cell.dateKey}-${index}`}
                        day={cell.day}
                        dateKey={cell.dateKey}
                        isCurrentMonth={cell.isCurrentMonth}
                        dayData={data[cell.dateKey]}
                        selectedColor={selectedColor}
                        onUpdateDay={onUpdateDay}
                        onClearDay={onClearDay}
                    />
                ))}
            </div>
        </div>
    );
}
