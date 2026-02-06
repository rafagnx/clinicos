import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/lib/base44Client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface TimeBlockDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
    professionals?: any[];
    initialProfessionalId?: string | number;
}

export default function TimeBlockDialog({ open, onOpenChange, onSuccess, professionals = [], initialProfessionalId }: TimeBlockDialogProps) {
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

    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        date: "",
        start_time: "",
        end_time: "",
        professional_id: initialProfessionalId ? String(initialProfessionalId) : "",
        reason: ""
    });

    // Reset professional when modal opens or initial prop changes
    React.useEffect(() => {
        if (open && initialProfessionalId) {
            setFormData(prev => ({ ...prev, professional_id: String(initialProfessionalId) }));
        }
    }, [open, initialProfessionalId]);

    // Remove internal professionals query if passed as prop, or keep as fallback? 
    // Agenda passes it, so we use the prop.

    const mutation = useMutation({
        mutationFn: async (data: any) => {
            // Combine date and time to ISO strings
            const startDateTime = new Date(`${data.date}T${data.start_time}`);
            const endDateTime = new Date(`${data.date}T${data.end_time}`);

            const payload = {
                ...data,
                type: "bloqueio",
                start_time: startDateTime.toISOString(),
                end_time: endDateTime.toISOString(),
                procedure_name: data.reason, // Map reason to procedure_name so it shows in title
                notes: data.reason,
                status: "confirmed" // Blocked slots are effectively confirmed
            };

            // Remove helper fields that might not exist in DB
            delete payload.reason;

            if (data.professional_id === 'all') {
                const promises = professionals.map(p =>
                    base44.entities.Appointment.create({ ...payload, professional_id: p.id })
                );
                return Promise.all(promises);
            }
            return base44.entities.Appointment.create(payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["appointments"] });
            toast.success("Bloqueio criado com sucesso!");
            onSuccess?.();
            onOpenChange(false);
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Ensure we don't send "all" to the backend directly which would cause a DB error
        mutation.mutate(formData);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Bloquear Horário</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Data</Label>
                            <Input type="date" required onChange={e => setFormData({ ...formData, date: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Profissional</Label>
                            <Select
                                value={formData.professional_id}
                                onValueChange={v => setFormData({ ...formData, professional_id: v })}
                            >
                                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    {clinicalProfessionals.map((p: any) => (
                                        <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Início</Label>
                            <Input type="time" required onChange={e => setFormData({ ...formData, start_time: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Fim</Label>
                            <Input type="time" required onChange={e => setFormData({ ...formData, end_time: e.target.value })} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Motivo</Label>
                        <Input placeholder="Ex: Almoço, Reunião..." required onChange={e => setFormData({ ...formData, reason: e.target.value })} />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Bloquear
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

