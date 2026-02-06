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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface BlockDayModalProps {
    isOpen: boolean;
    onClose: () => void;
    professionalId: number | null;
    professionals?: any[];
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
    professionals = [],
    initialDate,
    onBlockCreated
}: BlockDayModalProps) {
    // Helper to identify clinical professionals
    const isClinical = (p: any) => {
        const role = (p.role_type || "").toLowerCase();
        const specialty = (p.specialty || "").toLowerCase();
        // Include common clinical roles
        return ["hof", "biomedico", "biomédico", "doutor", "medico", "médico", "esteticista", "dentista"].some(r => role.includes(r) || specialty.includes(r));
    };

    const clinicalProfessionals = React.useMemo(() => {
        return professionals.filter(p => isClinical(p));
    }, [professionals]);

    const [selectedProfessionalId, setSelectedProfessionalId] = useState<string>(professionalId ? String(professionalId) : '');
    const [startDate, setStartDate] = useState<Date>(initialDate || new Date());
    const [endDate, setEndDate] = useState<Date>(initialDate || new Date());
    const [reason, setReason] = useState<string>('');
    const [conflicts, setConflicts] = useState<any[] | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [showStartCalendar, setShowStartCalendar] = useState<boolean>(false);
    const [showEndCalendar, setShowEndCalendar] = useState<boolean>(false);

    const handleSubmit = async (confirmConflicts = false) => {
        if (!selectedProfessionalId) {
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

            // Handle "All Professionals" selection - Simplified clinic-wide approach
            if (selectedProfessionalId === 'all') {
                const result = await base44.blockedDays.create({
                    professionalId: 'all' as any, // Backend now handles 'all' as clinic-wide (null)
                    startDate: format(startDate, 'yyyy-MM-dd'),
                    endDate: format(endDate, 'yyyy-MM-dd'),
                    reason,
                    confirmConflicts
                });

                if (result.conflicts && !confirmConflicts) {
                    setConflicts(result.conflicts);
                    setIsLoading(false);
                    return;
                }

                if (onBlockCreated) {
                    onBlockCreated(result);
                }
                resetAndClose();
                return;
            }

            // Normal single professional flow
            const result = await base44.blockedDays.create({
                professionalId: parseInt(selectedProfessionalId),
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
                    {/* Professional Selection */}
                    <div className="space-y-2">
                        <Label>Profissional</Label>
                        <div className="flex items-center space-x-2 mb-2">
                            <Switch
                                id="block-all"
                                checked={selectedProfessionalId === 'all'}
                                onCheckedChange={(checked) => {
                                    setSelectedProfessionalId(checked ? 'all' : (professionalId ? String(professionalId) : ''));
                                }}
                            // enable switch even if professionalId is present
                            />
                            <Label htmlFor="block-all" className="cursor-pointer">Bloquear para <strong>Toda a Equipe</strong></Label>
                        </div>

                        <Select
                            value={selectedProfessionalId}
                            onValueChange={setSelectedProfessionalId}
                            disabled={selectedProfessionalId === 'all'}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione o profissional" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all" className="font-semibold text-indigo-600">
                                    Todos os Profissionais
                                </SelectItem>
                                {clinicalProfessionals.map((p) => (
                                    <SelectItem key={p.id} value={String(p.id)}>
                                        {p.full_name || p.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

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
