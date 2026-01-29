import { Category, CategoryColor } from '@/types/calendar';
import { cn } from '@/lib/utils';
interface CategoryLegendProps {
    categories: Category[];
    selectedColor: CategoryColor;
    onSelectColor: (color: CategoryColor) => void;
    onUpdateCategory: (id: string, updates: Partial<Category>) => void;
}

const colorClasses: Record<string, { bg: string; dot: string }> = {
    blue: { bg: 'bg-calendar-blue', dot: 'bg-[hsl(220,70%,55%)]' },
    yellow: { bg: 'bg-calendar-yellow', dot: 'bg-[hsl(45,85%,55%)]' },
    'green-light': { bg: 'bg-calendar-green-light', dot: 'bg-[hsl(140,50%,50%)]' },
    pink: { bg: 'bg-calendar-pink', dot: 'bg-[hsl(350,60%,65%)]' },
    green: { bg: 'bg-calendar-green', dot: 'bg-[hsl(155,50%,45%)]' },
    purple: { bg: 'bg-calendar-purple', dot: 'bg-[hsl(270,50%,60%)]' },
    gray: { bg: 'bg-calendar-gray', dot: 'bg-[hsl(0,0%,60%)]' },
    holiday: { bg: 'bg-calendar-holiday', dot: 'bg-[hsl(0,0%,65%)]' },
};

export function CategoryLegend({
    categories,
    selectedColor,
    onSelectColor,
    onUpdateCategory,
}: CategoryLegendProps) {
    return (
        <div className="bg-card rounded-xl border border-border p-4 space-y-2.5">
            {categories.map((category) => {
                const colors = colorClasses[category.color || 'gray'];
                return (
                    <button
                        key={category.id}
                        onClick={() => onSelectColor(category.color === selectedColor ? null : category.color)}
                        className={cn(
                            'w-full flex items-center gap-3 transition-all duration-200 group',
                            selectedColor === category.color && 'scale-[1.02]'
                        )}
                    >
                        {/* Small colored dot */}
                        <div
                            className={cn(
                                'w-2.5 h-2.5 rounded-full shrink-0 transition-transform',
                                colors.dot,
                                selectedColor === category.color && 'scale-125'
                            )}
                        />
                        {/* Colored pill with text */}
                        <div
                            className={cn(
                                'min-w-[140px] rounded-full px-4 py-1.5 transition-all',
                                colors.bg,
                                selectedColor === category.color
                                    ? 'ring-2 ring-primary/50 ring-offset-1 ring-offset-card shadow-md'
                                    : 'group-hover:shadow-sm'
                            )}
                        >
                            <input
                                type="text"
                                value={category.name}
                                onChange={(e) => onUpdateCategory(category.id, { name: e.target.value })}
                                onClick={(e) => e.stopPropagation()}
                                className={cn(
                                    'w-full bg-transparent text-[11px] font-bold text-foreground/90 tracking-wide whitespace-nowrap',
                                    'border-none outline-none text-center',
                                    'focus:bg-foreground/5 rounded transition-colors duration-200'
                                )}
                            />
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
