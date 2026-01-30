import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface BlockDayModalProps {
    isOpen: boolean;
    onClose: () => void;
    professionalId: number | null;
    initialDate?: Date;
    onBlockCreated?: (result: any) => void;
}

/**
 * BlockDayModal Component
 * Allows users to block single days or date ranges with a reason
 * Handles conflict detection for existing appointments
 */
export default function BlockDayModal({
    isOpen,
    onClose,
    professionalId,
    initialDate,
    onBlockCreated
}: BlockDayModalProps) {
    const [startDate, setStartDate] = useState<Date>(initialDate || new Date());
    const [endDate, setEndDate] = useState<Date>(initialDate || new Date());
    const [reason, setReason] = useState<string>('');
    const [conflicts, setConflicts] = useState<any[] | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [showStartCalendar, setShowStartCalendar] = useState<boolean>(false);
    const [showEndCalendar, setShowEndCalendar] = useState<boolean>(false);

    const handleSubmit = async (confirmConflicts = false) => {
        if (!professionalId) {
            alert('Por favor, selecione um profissional primeiro');
            return;
        }

        if (!reason.trim()) {
            alert('Por favor, informe o motivo do bloqueio');
            return;
        }

        setIsLoading(true);

        try {
            const { base44 } = await import('@/lib/base44Client');

            const result = await base44.blockedDays.create({
                professionalId,
                startDate: format(startDate, 'yyyy-MM-dd'),
                endDate: format(endDate, 'yyyy-MM-dd'),
                reason,
                confirmConflicts
            });

            // Check if API returned conflicts
            if (result.conflicts && !confirmConflicts) {
                setConflicts(result.conflicts);
                setIsLoading(false);
                return;
            }

            // Success - block created
            if (onBlockCreated) {
                onBlockCreated(result);
            }

            resetAndClose();
        } catch (error: any) {
            console.error('Error creating block:', error);
            alert(`Erro ao criar bloqueio: ${error?.message || 'Erro desconhecido'}`);
            setIsLoading(false);
        }
    };

    const resetAndClose = () => {
        setReason('');
        setConflicts(null);
        setIsLoading(false);
        onClose();
    };

    const daysDifference = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    return (
        <Dialog open={isOpen} onOpenChange={resetAndClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Bloquear Período</DialogTitle>
                    <DialogDescription>
                        Selecione o período e informe o motivo do bloqueio
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Date Range Selection */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Start Date */}
                        <div className="space-y-2">
                            <Label>Data Início</Label>
                            <Popover open={showStartCalendar} onOpenChange={setShowStartCalendar}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !startDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {startDate ? format(startDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione'}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={startDate}
                                        onSelect={(date) => {
                                            if (date) {
                                                setStartDate(date);
                                                // Auto-adjust end date if it's before start date
                                                if (endDate < date) {
                                                    setEndDate(date);
                                                }
                                                setShowStartCalendar(false);
                                            }
                                        }}
                                        locale={ptBR}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* End Date */}
                        <div className="space-y-2">
                            <Label>Data Fim</Label>
                            <Popover open={showEndCalendar} onOpenChange={setShowEndCalendar}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !endDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {endDate ? format(endDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione'}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={endDate}
                                        onSelect={(date) => {
                                            if (date) {
                                                setEndDate(date);
                                                setShowEndCalendar(false);
                                            }
                                        }}
                                        disabled={(date) => date < startDate}
                                        locale={ptBR}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    {/* Period Summary */}
                    <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                        📅 Bloqueando <strong>{daysDifference}</strong> dia{daysDifference > 1 ? 's' : ''}
                        {daysDifference > 1 && ` (${format(startDate, 'dd/MM', { locale: ptBR })} - ${format(endDate, 'dd/MM', { locale: ptBR })})`}
                    </div>

                    {/* Reason Input */}
                    <div className="space-y-2">
                        <Label htmlFor="reason">Motivo do Bloqueio</Label>
                        <Input
                            id="reason"
                            placeholder="Ex: Férias, Licença médica, Congresso..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            maxLength={100}
                        />
                        <p className="text-xs text-muted-foreground">
                            Este motivo será exibido na agenda
                        </p>
                    </div>

                    {/* Conflicts Alert */}
                    {conflicts && conflicts.length > 0 && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                <strong>{conflicts.length} consulta{conflicts.length > 1 ? 's' : ''} encontrada{conflicts.length > 1 ? 's' : ''}</strong>
                                <ul className="mt-2 ml-4 list-disc text-sm">
                                    {conflicts.slice(0, 3).map((apt) => (
                                        <li key={apt.id}>
                                            {format(new Date(apt.start_time), 'dd/MM HH:mm', { locale: ptBR })}
                                        </li>
                                    ))}
                                    {conflicts.length > 3 && <li>...e mais {conflicts.length - 3}</li>}
                                </ul>
                                <p className="mt-2 text-sm">
                                    As consultas não serão canceladas. Deseja bloquear mesmo assim?
                                </p>
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={resetAndClose} disabled={isLoading}>
                        Cancelar
                    </Button>
                    {conflicts && conflicts.length > 0 ? (
                        <Button onClick={() => handleSubmit(true)} disabled={isLoading}>
                            {isLoading ? 'Bloqueando...' : 'Confirmar Bloqueio'}
                        </Button>
                    ) : (
                        <Button onClick={() => handleSubmit(false)} disabled={isLoading}>
                            {isLoading ? 'Verificando...' : 'Bloquear Período'}
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
