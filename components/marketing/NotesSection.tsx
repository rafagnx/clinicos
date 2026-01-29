import { Textarea } from '@/components/ui/textarea';

interface NotesSectionProps {
    notes: string;
    onNotesChange: (notes: string) => void;
}

export function NotesSection({ notes, onNotesChange }: NotesSectionProps) {
    return (
        <div className="bg-card rounded-xl border border-border p-4 space-y-3">
            <h3 className="font-bold text-sm text-foreground tracking-wide">IMPORTANTE</h3>
            <Textarea
                value={notes}
                onChange={(e) => onNotesChange(e.target.value)}
                placeholder="Adicione suas notas importantes aqui..."
                className="min-h-[120px] resize-none bg-transparent border-none text-sm text-muted-foreground placeholder:text-muted-foreground/50 focus-visible:ring-0"
            />
        </div>
    );
}
