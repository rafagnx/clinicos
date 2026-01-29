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
import { X, Check } from 'lucide-react';

interface CalendarDayProps {
    day: number;
    dateKey: string;
    isCurrentMonth: boolean;
    dayData?: DayData;
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
    dayData,
    categories = [],
    selectedColor,
    onUpdateDay,
    onClearDay,
}: CalendarDayProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [text, setText] = useState(dayData?.text || '');
    const [tempColor, setTempColor] = useState<CategoryColor>(dayData?.color || null);

    // Sync state when dayData changes or dialog opens
    useEffect(() => {
        if (isOpen) {
            setText(dayData?.text || '');
            setTempColor(dayData?.color || null);
        }
    }, [isOpen, dayData]);

    const handleClick = () => {
        if (selectedColor) {
            // Quick paint mode
            const category = categories.find(c => c.color === selectedColor);
            onUpdateDay(dateKey, {
                color: selectedColor,
                text: dayData?.text || (category ? category.name.toUpperCase() : ''),
            });
        } else {
            // Open dialog for editing
            setIsOpen(true);
        }
    };

    const handleCategorySelect = (color: CategoryColor) => {
        setTempColor(color);
        // Auto-fill text if empty and category name is found
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
        setIsOpen(false);
    };

    const handleClear = () => {
        onClearDay(dateKey);
        setIsOpen(false);
    };

    // Helper to get category name if not passed
    const getCategoryName = (color: string) => {
        return categories.find(c => c.color === color)?.name || color;
    };

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
                    dayData?.color && colorClasses[dayData.color]
                )}
            >
                <span
                    className={cn(
                        'text-xs font-bold mb-1',
                        isCurrentMonth ? 'text-foreground' : 'text-muted-foreground/50',
                        dayData?.color && 'text-foreground/90' // Make day number visible on color
                    )}
                >
                    {day}
                </span>
                {dayData?.text && (
                    <span className="text-[10px] uppercase font-bold text-foreground/90 leading-tight line-clamp-3 text-center w-full break-words">
                        {dayData.text}
                    </span>
                )}
            </button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-md animate-scale-in">
                    <DialogHeader>
                        <DialogTitle>Editar dia {day}</DialogTitle>
                        <div id="dialog-desc" className="sr-only">Edite a cor e o texto do evento</div>
                    </DialogHeader>

                    <div className="py-4 space-y-6" aria-describedby="dialog-desc">
                        {/* Categories List */}
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-muted-foreground">
                                Cores (clique para adicionar/remover)
                            </label>
                            <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-2">
                                {categories.length > 0 ? (
                                    categories.map((cat) => (
                                        <button
                                            key={cat.id}
                                            onClick={() => handleCategorySelect(cat.color)}
                                            className={cn(
                                                "flex items-center gap-3 p-3 rounded-xl border transition-all hover:bg-muted/50 text-left group",
                                                tempColor === cat.color
                                                    ? "border-primary ring-1 ring-primary bg-primary/5"
                                                    : "border-border"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-6 h-6 rounded-full shrink-0 shadow-sm",
                                                colorClasses[cat.color] || 'bg-gray-200'
                                            )} />
                                            <span className="flex-1 text-sm font-medium group-hover:text-primary transition-colors">
                                                {cat.name}
                                            </span>
                                            {tempColor === cat.color && (
                                                <Check className="w-4 h-4 text-primary animate-in fade-in zoom-in" />
                                            )}
                                        </button>
                                    ))
                                ) : (
                                    // Fallback if categories not loaded
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(colorClasses).map(([color, className]) => (
                                            <button
                                                key={color}
                                                onClick={() => handleCategorySelect(color as CategoryColor)}
                                                className={cn(
                                                    'w-10 h-10 rounded-full transition-all hover:scale-110',
                                                    className,
                                                    tempColor === color && 'ring-2 ring-primary ring-offset-2'
                                                )}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Custom Text Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Texto personalizado</label>
                            <Input
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="Ex: Reunião, Evento especial..."
                                className="h-11"
                            />
                        </div>
                    </div>

                    <DialogFooter className="flex gap-2 sm:justify-between w-full">
                        <Button variant="outline" onClick={handleClear} className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10">
                            <X className="w-4 h-4" />
                            Limpar
                        </Button>
                        <Button onClick={handleSave} className="min-w-[100px]">
                            Salvar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
