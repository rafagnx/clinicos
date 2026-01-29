import { useState } from 'react';
import { CategoryColor } from '@/types/calendar';
import { useCalendarData } from '@/hooks/useCalendarData';
import { CalendarHeader } from './CalendarHeader';
import { CalendarGrid } from './CalendarGrid';
import { CategoryLegend } from './CategoryLegend';
import { NotesSection } from './NotesSection';

export function ContentCalendar() {
    const [currentMonth, setCurrentMonth] = useState(0); // January
    const [currentYear] = useState(2026);
    const [selectedColor, setSelectedColor] = useState<CategoryColor>(null);

    // Note: we might want to allow year navigation too, but for now fixed to 2026 as per original
    // or dynamic based on date. Let's make it simple.

    const {
        events,
        // notes, setNotes, // API doesn't have general notes yet, maybe store in localStorage or new table?
        // For now we'll mock notes or omit if not critical, or use localStorage like before just for notes?
        // Let's implement local state for notes for now or localStorage until we add a backend field.
        createEvent,
        updateEvent,
        deleteEvent,
        getDayEvents
    } = useCalendarData();

    // Re-implementing the data structure transformation for the grid
    // The grid expects { "YYYY-MM-DD": { color, text } }
    // Our API returns a list of events.
    // We need to map the list to the object.
    // Also, the API supports multiple events per day, but the UI seems designed for one?
    // The UI `CalendarDay` shows `dayData.text`.
    // If we have multiple events, we might need to join them or pick the first.

    const calendarData: any = {};
    events.forEach((e: any) => {
        // Basic mapping: color based on some logic or stored? 
        // The original `calendar_events` table has `category`, `platform`.
        // We didn't add a 'color' column to the DB table explicitly? 
        // Ah, Step 123 `calendar_events` has `category`, `platform`, `status`.
        // It does NOT have `color`.
        // We should map `category` (string) to color, or add `color` column.
        // Or we store the color in `category` if it's one of the presets.

        // Let's assume we store the "color name" in `category` for simplicity, 
        // OR we map `platform` to color?
        // The original code used `category` with color property.

        // Let's check `DEFAULT_CATEGORIES` in types/calendar.ts
        // { id: '1', name: 'TRÁFEGO BITTENCOURT', color: 'blue' }

        // So if the event has a category name that matches, we get the color.
        // If we just saved the color name in the DB as `category`, that works too.

        // For this implementation, let's look for a matching category.
        // Ideally, we persist the chosen "category" (which implies color).

        calendarData[e.date.split('T')[0]] = {
            color: e.category as CategoryColor, // We'll save the color name in the 'category' column
            text: e.content
        };
    });

    // Notes logic - fallback to localStorage or temporary
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
        // Check if event exists
        const existing = events.find((e: any) => e.date.startsWith(dateKey));

        if (data.text || data.color) {
            if (existing) {
                updateEvent({
                    id: existing.id,
                    data: {
                        date: dateKey,
                        content: data.text,
                        category: data.color || 'gray'
                    }
                });
            } else {
                createEvent({
                    date: dateKey,
                    content: data.text,
                    category: data.color || 'gray',
                    organization_id: '' // backend sets this
                });
            }
        }
    };

    const handleClearDay = (dateKey: string) => {
        const existing = events.find((e: any) => e.date.startsWith(dateKey));
        if (existing) {
            deleteEvent(existing.id);
        }
    };

    // Categories management - mostly static for now unless we add DB table for categories
    const categories = [
        { id: '1', name: 'TRÁFEGO BITTENCOURT', color: 'blue' as CategoryColor },
        { id: '2', name: 'TRÁFEGO LETÍCIA', color: 'yellow' as CategoryColor },
        { id: '3', name: 'DIVULGAÇÃO BITTENCOURT', color: 'green-light' as CategoryColor },
        { id: '4', name: 'DIVULGAÇÃO LETÍCIA', color: 'pink' as CategoryColor },
        { id: '5', name: 'CRIAR ARTES', color: 'green' as CategoryColor },
        { id: '6', name: 'OUTRAS CIDADES', color: 'purple' as CategoryColor },
        { id: '7', name: 'FERIADO', color: 'gray' as CategoryColor },
    ];

    return (
        <div className="min-h-screen bg-background p-4 md:p-6">
            <div className="max-w-[1200px] mx-auto">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left sidebar with vertical text and legend */}
                    <div className="hidden lg:flex items-stretch gap-3 shrink-0">
                        {/* Vertical text */}
                        <div className="flex items-center">
                            <div
                                className="text-xs font-bold tracking-[0.25em] text-calendar-purple/80"
                                style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                            >
                                CONTEÚDO
                            </div>
                        </div>
                        {/* Vertical purple bar */}
                        <div className="w-1.5 bg-calendar-purple rounded-full" />
                        {/* Legend */}
                        <div className="w-48">
                            <CategoryLegend
                                categories={categories}
                                selectedColor={selectedColor}
                                onSelectColor={setSelectedColor}
                                onUpdateCategory={() => { }} // Not implementing category edit for now
                            />
                        </div>
                    </div>

                    {/* Main calendar */}
                    <div className="flex-1">
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
                            selectedColor={selectedColor}
                            onUpdateDay={handleUpdateDay}
                            onClearDay={handleClearDay}
                        />
                    </div>

                    {/* Right sidebar with notes */}
                    <div className="hidden lg:block w-56 shrink-0">
                        <NotesSection notes={notes} onNotesChange={handleNotesChange} />
                    </div>
                </div>

                {/* Mobile layout */}
                <div className="lg:hidden space-y-4 mt-6">
                    <CategoryLegend
                        categories={categories}
                        selectedColor={selectedColor}
                        onSelectColor={setSelectedColor}
                        onUpdateCategory={() => { }}
                    />
                    <NotesSection notes={notes} onNotesChange={handleNotesChange} />
                </div>

                {/* Instructions */}
                <div className="mt-8 text-center text-xs text-muted-foreground">
                    <p>Selecione uma cor e clique nos dias para pintar • Clique sem cor selecionada para adicionar texto</p>
                </div>
            </div>
        </div>
    );
}
