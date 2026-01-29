import { useState, useEffect } from 'react';
import { DayData, CategoryColor, Category } from '@/types/calendar';
import { cn } from '@/lib/utils';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Check, Plus, Trash2 } from 'lucide-react';

interface CalendarDayProps {
    day: number;
    dateKey: string;
    isCurrentMonth: boolean;
    dayData?: DayData[];
    categories?: Category[];
    selectedColor: CategoryColor;
    onUpdateDay: (dateKey: string, data: DayData) => void;
    onClearDay: (dateKey: string) => void;
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

export function CalendarDay({
    day,
    dateKey,
    isCurrentMonth,
    dayData = [],
    categories = [],
    selectedColor,
    onUpdateDay,
    onClearDay,
}: CalendarDayProps) {
    const [isOpen, setIsOpen] = useState(false);

    // State for the NEW/EDITED event in the dialog
    const [text, setText] = useState('');
    const [tempColor, setTempColor] = useState<CategoryColor>(null);

    const hasConflict = dayData.length > 1;

    const handleClick = () => {
        if (selectedColor) {
            // Quick paint mode
            // Always APPEND event (Create new)
            const category = categories.find(c => c.color === selectedColor);
            onUpdateDay(dateKey, {
                color: selectedColor,
                text: category ? category.name.toUpperCase() : '',
            });
        } else {
            // Open dialog
            setText('');
            setTempColor(null);
            setIsOpen(true);
        }
    };

    const handleCategorySelect = (color: CategoryColor) => {
        setTempColor(color);
        if (!text && color) {
            const cat = categories.find(c => c.color === color);
            if (cat) {
                setText(cat.name.toUpperCase());
            }
        }
    };

    const handleSave = () => {
        if (text || tempColor) {
            onUpdateDay(dateKey, {
                color: tempColor,
                text,
            });
        }
        setText('');
        setTempColor(null);
        setIsOpen(false);
    };

    const handleClear = () => {
        onClearDay(dateKey);
        setIsOpen(false);
    };

    // Render logic for the cell
    const renderCellContent = () => {
        if (dayData.length === 0) return null;

        if (hasConflict) {
            // Conflict / Multi-event view
            return (
                <div className="flex flex-col gap-0.5 w-full mt-1 animate-pulse">
                    {dayData.slice(0, 3).map((evt, idx) => (
                        <div key={idx} className="flex items-center gap-1">
                            <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", colorClasses[evt.color || 'gray'])} />
                            <div className="h-0.5 flex-1 bg-muted-foreground/20 rounded-full" />
                        </div>
                    ))}
                    {dayData.length > 3 && (
                        <span className="text-[8px] text-muted-foreground text-center">+ {dayData.length - 3}</span>
                    )}
                </div>
            );
        }

        // Single Event
        const event = dayData[0];
        return (
            <span className="text-[10px] uppercase font-bold text-foreground/90 leading-tight line-clamp-3 text-center w-full break-words mt-1">
                {event.text}
            </span>
        );
    };

    const singleEventColor = !hasConflict && dayData.length > 0 ? colorClasses[dayData[0].color || ''] : undefined;

    return (
        <>
            <button
                onClick={handleClick}
                className={cn(
                    'relative w-full aspect-square rounded-lg border border-border/50 p-1.5',
                    'flex flex-col items-start justify-start',
                    'transition-all duration-200 hover:shadow-md hover:scale-[1.02]',
                    'focus:outline-none focus:ring-2 focus:ring-primary/30',
                    isCurrentMonth ? 'bg-card' : 'bg-muted/30',
                    // If conflict, show warning bg? or just the dots
                    singleEventColor,
                    hasConflict && "ring-1 ring-orange-400 bg-orange-50/50"
                )}
            >
                <span
                    className={cn(
                        'text-xs font-bold mb-0.5',
                        isCurrentMonth ? 'text-foreground' : 'text-muted-foreground/50',
                        (singleEventColor || hasConflict) && 'text-foreground/90'
                    )}
                >
                    {day}
                </span>
                {renderCellContent()}
            </button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-md animate-scale-in">
                    <DialogHeader>
                        <DialogTitle>Editar dia {day}</DialogTitle>
                        <div id="dialog-desc" className="sr-only">Edite ou adicione eventos</div>
                    </DialogHeader>

                    <div className="py-4 space-y-6" aria-describedby="dialog-desc">
                        {/* List existing events if any */}
                        {dayData.length > 0 && (
                            <div className="space-y-2 mb-4 p-3 bg-muted/20 rounded-lg">
                                <label className="text-xs font-medium text-muted-foreground uppercase">Eventos Atuais</label>
                                <div className="space-y-2">
                                    {dayData.map((evt, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-sm p-2 bg-background rounded border border-border shadow-sm">
                                            <div className="flex items-center gap-2">
                                                <div className={cn("w-3 h-3 rounded-full", colorClasses[evt.color || 'gray'])} />
                                                <span className="font-medium uppercase text-xs">{evt.text}</span>
                                            </div>
                                            {/* Note: Delete specific event would go here */}
                                        </div>
                                    ))}
                                </div>
                                <div className="text-[10px] text-muted-foreground mt-2">
                                    * Use "Limpar Tudo" para remover todos os eventos deste dia.
                                </div>
                            </div>
                        )}

                        <div className="border-t border-border pt-4">
                            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                                <Plus className="w-4 h-4" /> Adicionar Novo Evento
                            </h4>
                            {/* Categories List */}
                            <div className="space-y-3">
                                <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto pr-2">
                                    {categories.map((cat) => (
                                        <button
                                            key={cat.id}
                                            onClick={() => handleCategorySelect(cat.color)}
                                            className={cn(
                                                "flex items-center gap-3 p-2 rounded-lg border transition-all hover:bg-muted/50 text-left group",
                                                tempColor === cat.color
                                                    ? "border-primary ring-1 ring-primary bg-primary/5"
                                                    : "border-border"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-4 h-4 rounded-full shrink-0 shadow-sm",
                                                colorClasses[cat.color] || 'bg-gray-200'
                                            )} />
                                            <span className="flex-1 text-xs font-medium group-hover:text-primary transition-colors">
                                                {cat.name}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Text Input */}
                            <div className="mt-3">
                                <Input
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    placeholder="Nome do evento (ex: REUNIÃO)"
                                    className="h-9 text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="flex gap-2 sm:justify-between w-full">
                        <Button variant="outline" onClick={handleClear} className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="w-4 h-4" />
                            Limpar Tudo
                        </Button>
                        <Button onClick={handleSave} className="min-w-[100px]">
                            Adicionar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
