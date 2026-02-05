import { useState, useMemo } from 'react';
import { CategoryColor, CalendarData, DayData } from '@/types/calendar';
import { useCalendarData } from '@/hooks/useCalendarData';
import { CalendarHeader } from './CalendarHeader';
import { CalendarGrid } from './CalendarGrid';
import { CategoryLegend } from './CategoryLegend';
import { NotesSection } from './NotesSection';
import { MonthSummary } from './MonthSummary';
import { UpcomingEvents } from './UpcomingEvents';
import { TimelineView } from './TimelineView';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, GanttChartSquare } from 'lucide-react';
import { getHolidays } from '@/utils/holidays';
import { ConflictWidget } from './ConflictWidget';

export function ContentCalendar() {
    const [currentMonth, setCurrentMonth] = useState(0); // January
    const [currentYear] = useState(2026);
    const [selectedColor, setSelectedColor] = useState<CategoryColor>(null);
    const [viewMode, setViewMode] = useState<'calendar' | 'timeline'>('calendar');

    const {
        events,
        createEvent,
        updateEvent,
        deleteEvent
    } = useCalendarData();

    // Prepare Calendar Grid Data (Including Holidays)
    const calendarData = useMemo(() => {
        const data: CalendarData = {};

        // 1. Add Events
        events.forEach((e: any) => {
            const dateKey = e.date.split('T')[0];
            if (!data[dateKey]) {
                data[dateKey] = [];
            }
            data[dateKey].push({
                color: e.category as CategoryColor,
                text: e.content
            });
        });

        // 2. Add Holidays
        const holidays = getHolidays(currentYear);
        holidays.forEach(h => {
            const y = h.date.getFullYear();
            const m = String(h.date.getMonth() + 1).padStart(2, '0');
            const d = String(h.date.getDate()).padStart(2, '0');
            const dateKey = `${y}-${m}-${d}`;

            if (!data[dateKey]) {
                data[dateKey] = [];
            }
            // Add holiday as an event
            data[dateKey].push({
                color: 'holiday',
                text: h.name,
                // isFixed: true 
            });
        });

        return data;
    }, [events, currentYear]);

    // Calculate Conflicts
    const conflicts = useMemo(() => {
        return Object.entries(calendarData)
            .filter(([_, dayEvents]) => dayEvents.length > 1)
            .map(([date, dayEvents]) => ({
                date,
                events: dayEvents
            }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }, [calendarData]);

    // Notes logic - fallback to localStorage
    const [notes, setNotes] = useState(localStorage.getItem('marketing-notes') || '');
    const handleNotesChange = (val: string) => {
        setNotes(val);
        localStorage.setItem('marketing-notes', val);
    };

    const handlePrevMonth = () => {
        setCurrentMonth((prev) => (prev === 0 ? 11 : prev - 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth((prev) => (prev === 11 ? 0 : prev + 1));
    };

    const handleUpdateDay = async (dateKey: string, data: { color: CategoryColor, text: string }) => {
        // Prevent editing holidays if we added isFixed check, but for now we allow overwriting
        // Check if event exists
        const existing = events.find((e: any) => e.date.startsWith(dateKey));

        if (data.text || data.color) {
            // ALWAYS CREATE for now to support MULTIPLE EVENTS (unless editing specific ID, which requires UI change)
            // But wait, if I want to conflict, I should ADD. 
            // If I want to "Edit" the single one, I should update. 
            // The "Edit" dialog in CalendarDay will need to distinguish Add vs Edit.
            // For now, the handleUpdateDay interface implies "Update the DAY". 
            // Let's modify logic: always CREATE a new event with the data
            createEvent({
                date: dateKey,
                content: data.text,
                category: data.color || 'gray',
                organization_id: ''
            });
        }
    };

    const handleClearDay = (dateKey: string) => {
        // Delete ALL events on that day
        const dayEvents = events.filter((e: any) => e.date.startsWith(dateKey));
        dayEvents.forEach((e: any) => deleteEvent(e.id));
    };

    const categories = [
        { id: '1', name: 'TRÁFEGO BITTENCOURT', color: 'blue' as CategoryColor },
        { id: '2', name: 'TRÁFEGO LETÍCIA', color: 'yellow' as CategoryColor },
        { id: '3', name: 'DIVULGAÇÃO BITTENCOURT', color: 'green-light' as CategoryColor },
        { id: '4', name: 'DIVULGAÇÃO LETÍCIA', color: 'pink' as CategoryColor },
        { id: '5', name: 'CRIAR ARTES', color: 'green' as CategoryColor },
        { id: '6', name: 'OUTRAS CIDADES', color: 'purple' as CategoryColor },
        { id: '7', name: 'FERIADO', color: 'gray' as CategoryColor }, // Added manually to match screenshot/holidays
    ];

    return (
        <div className="min-h-screen bg-background/50 p-4 md:p-6">
            <div className="max-w-[1920px] mx-auto">

                {/* Header Controls */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex bg-card border border-border rounded-lg p-1 gap-1">
                        <Button
                            variant={viewMode === 'calendar' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('calendar')}
                            className="gap-2 text-xs"
                        >
                            <CalendarIcon className="w-4 h-4" />
                            Calendário
                        </Button>
                        <Button
                            variant={viewMode === 'timeline' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('timeline')}
                            className="gap-2 text-xs"
                        >
                            <GanttChartSquare className="w-4 h-4" />
                            Timeline
                        </Button>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-4 h-full">
                    {/* Left Sidebar */}
                    <div className="hidden lg:flex flex-col gap-4 shrink-0 w-52">
                        {/* Categories */}
                        <div className="flex gap-4">
                            <div className="flex flex-col items-center">
                                <div
                                    className="text-xs font-bold tracking-[0.25em] text-calendar-purple/80 mb-2"
                                    style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                                >
                                    CONTEÚDO
                                </div>
                                <div className="w-1.5 flex-1 bg-calendar-purple rounded-full" />
                            </div>
                            <div className="flex-1">
                                <CategoryLegend
                                    categories={categories}
                                    selectedColor={selectedColor}
                                    onSelectColor={setSelectedColor}
                                    onUpdateCategory={() => { }}
                                />
                            </div>
                        </div>

                        {/* CONFLICT WIDGET */}
                        <ConflictWidget conflicts={conflicts} />

                        {/* Summary Widget */}
                        <MonthSummary
                            currentMonth={currentMonth}
                            currentYear={currentYear}
                            events={events}
                        />
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                        {viewMode === 'calendar' ? (
                            <>
                                <CalendarHeader
                                    month={currentMonth}
                                    year={currentYear}
                                    onPrevMonth={handlePrevMonth}
                                    onNextMonth={handleNextMonth}
                                />
                                <CalendarGrid
                                    month={currentMonth}
                                    year={currentYear}
                                    data={calendarData}
                                    categories={categories}
                                    selectedColor={selectedColor}
                                    onUpdateDay={handleUpdateDay}
                                    onClearDay={handleClearDay}
                                />
                            </>
                        ) : (
                            <TimelineView year={currentYear} events={events} />
                        )}
                    </div>

                    {/* Right Sidebar */}
                    <div className="hidden xl:flex flex-col gap-4 w-60 shrink-0">
                        <UpcomingEvents events={events} />
                        <NotesSection notes={notes} onNotesChange={handleNotesChange} />
                    </div>
                </div>

                {/* Mobile Fallback */}
                <div className="lg:hidden space-y-4 mt-6">
                    <UpcomingEvents events={events} />
                    <CategoryLegend
                        categories={categories}
                        selectedColor={selectedColor}
                        onSelectColor={setSelectedColor}
                        onUpdateCategory={() => { }}
                    />
                    <NotesSection notes={notes} onNotesChange={handleNotesChange} />
                </div>
            </div>
        </div>
    );
}
