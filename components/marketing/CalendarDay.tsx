import { useState } from 'react';
import { DayData, CategoryColor } from '@/types/calendar';
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
import { X } from 'lucide-react';

interface CalendarDayProps {
    day: number;
    dateKey: string;
    isCurrentMonth: boolean;
    dayData?: DayData;
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
    selectedColor,
    onUpdateDay,
    onClearDay,
}: CalendarDayProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [text, setText] = useState(dayData?.text || '');

    const handleClick = () => {
        if (selectedColor) {
            // Quick paint mode
            onUpdateDay(dateKey, {
                color: selectedColor,
                text: dayData?.text || '',
            });
        } else {
            // Open dialog for editing
            setText(dayData?.text || '');
            setIsOpen(true);
        }
    };

    const handleSave = () => {
        if (text || dayData?.color) {
            onUpdateDay(dateKey, {
                color: dayData?.color || null,
                text,
            });
        }
        setIsOpen(false);
    };

    const handleClear = () => {
        onClearDay(dateKey);
        setIsOpen(false);
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
                        'text-xs font-medium',
                        isCurrentMonth ? 'text-foreground' : 'text-muted-foreground/50'
                    )}
                >
                    {day}
                </span>
                {dayData?.text && (
                    <span className="text-[9px] font-medium text-foreground/80 mt-0.5 leading-tight line-clamp-2 text-left w-full break-words">
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
                    <div className="space-y-4 py-4" aria-describedby="dialog-desc">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Cor</label>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(colorClasses).map(([color, className]) => (
                                    <button
                                        key={color}
                                        onClick={() =>
                                            onUpdateDay(dateKey, { color: color as CategoryColor, text })
                                        }
                                        className={cn(
                                            'w-8 h-8 rounded-full transition-all',
                                            className,
                                            dayData?.color === color && 'ring-2 ring-primary ring-offset-2'
                                        )}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Texto</label>
                            <Input
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="Ex: Fortaleza, Reunião..."
                            />
                        </div>
                    </div>
                    <DialogFooter className="flex gap-2">
                        <Button variant="outline" onClick={handleClear} className="gap-1">
                            <X className="w-4 h-4" />
                            Limpar
                        </Button>
                        <Button onClick={handleSave}>Salvar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
