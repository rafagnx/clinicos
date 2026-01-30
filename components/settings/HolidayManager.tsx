import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/lib/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar as CalendarIcon, Plus, Trash2, Download } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Holiday {
    id: number;
    organization_id: number;
    date: string;
    name: string;
    type: 'national' | 'local';
    created_at?: string;
}

/**
 * HolidayManager Component
 * Admin-only interface for managing holidays (national + local)
 */
export default function HolidayManager() {
    const queryClient = useQueryClient();
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [newHolidayDate, setNewHolidayDate] = useState(new Date());
    const [newHolidayName, setNewHolidayName] = useState('');
    const [showCalendar, setShowCalendar] = useState(false);

    const currentYear = new Date().getFullYear();

    // Fetch holidays
    const { data: holidays, isLoading } = useQuery<Holiday[]>({
        queryKey: ['holidays', currentYear],
        queryFn: () => base44.holidays.list({ year: currentYear })
    });

    // Seed national holidays mutation
    const seedMutation = useMutation<any, Error, void>({
        mutationFn: () => base44.holidays.seed(),
        onSuccess: (data) => {
            toast.success(data.message || 'Feriados importados com sucesso!');
            queryClient.invalidateQueries({ queryKey: ['holidays'] });
        },
        onError: (error) => {
            toast.error(`Erro ao importar feriados: ${error.message}`);
        }
    });

    // Create local holiday mutation
    const createMutation = useMutation<any, Error, { date: string; name: string }>({
        mutationFn: (data) => base44.holidays.create(data),
        onSuccess: () => {
            toast.success('Feriado local criado com sucesso!');
            queryClient.invalidateQueries({ queryKey: ['holidays'] });
            setShowAddDialog(false);
            setNewHolidayName('');
            setNewHolidayDate(new Date());
        },
        onError: (error) => {
            toast.error(`Erro ao criar feriado: ${error.message}`);
        }
    });

    // Delete holiday mutation
    const deleteMutation = useMutation<any, Error, number>({
        mutationFn: (id) => base44.holidays.delete(String(id)),
        onSuccess: () => {
            toast.success('Feriado local removido com sucesso!');
            queryClient.invalidateQueries({ queryKey: ['holidays'] });
        },
        onError: (error) => {
            toast.error(`Erro ao remover feriado: ${error.message}`);
        }
    });

    const handleCreateHoliday = () => {
        if (!newHolidayName.trim()) {
            toast.error('Por favor, informe o nome do feriado');
            return;
        }

        createMutation.mutate({
            date: format(newHolidayDate, 'yyyy-MM-dd'),
            name: newHolidayName
        });
    };

    const handleDeleteHoliday = (holiday) => {
        if (holiday.type === 'national') {
            toast.error('Feriados nacionais não podem ser removidos');
            return;
        }

        if (confirm(`Tem certeza que deseja remover o feriado "${holiday.name}"?`)) {
            deleteMutation.mutate(holiday.id);
        }
    };

    // Group holidays by month
    const groupedHolidays = holidays?.reduce((acc: Record<string, Holiday[]>, holiday) => {
        const month = format(new Date(holiday.date), 'MMMM', { locale: ptBR });
        if (!acc[month]) acc[month] = [];
        acc[month].push(holiday);
        return acc;
    }, {} as Record<string, Holiday[]>) || {};

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Feriados</CardTitle>
                        <CardDescription>
                            Gerencie feriados nacionais e locais que aparecem na agenda
                        </CardDescription>
                    </div>
                    <div className="flex space-x-2">

                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="text-center py-8 text-muted-foreground">
                        Carregando feriados...
                    </div>
                ) : Object.keys(groupedHolidays).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <p>Nenhum feriado cadastrado para {currentYear}</p>
                        <p className="text-xs mt-2">Os feriados nacionais são carregados automaticamente.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {Object.entries(groupedHolidays).map(([month, monthHolidays]: [string, Holiday[]]) => (
                            <div key={month}>
                                <h3 className="font-semibold text-sm text-muted-foreground uppercase mb-2">
                                    {month}
                                </h3>
                                <div className="space-y-2">
                                    {monthHolidays.map((holiday) => (
                                        <div
                                            key={holiday.id}
                                            className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div className="text-sm font-medium">
                                                    {format(new Date(holiday.date), 'dd/MM')}
                                                </div>
                                                <div className="text-sm">{holiday.name}</div>
                                                <Badge variant={holiday.type === 'national' ? 'default' : 'secondary'}>
                                                    {holiday.type === 'national' ? 'Nacional' : 'Local'}
                                                </Badge>
                                            </div>
                                            {holiday.type === 'local' && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDeleteHoliday(holiday)}
                                                    disabled={deleteMutation.isPending}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card >
    );
}
