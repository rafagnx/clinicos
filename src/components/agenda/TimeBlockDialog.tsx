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
}

export default function TimeBlockDialog({ open, onOpenChange, onSuccess, professionals = [] }: TimeBlockDialogProps) {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        date: "",
        start_time: "",
        end_time: "",
        professional_id: "",
        reason: ""
    });

    // Remove internal professionals query if passed as prop, or keep as fallback? 
    // Agenda passes it, so we use the prop.

    const mutation = useMutation({
        mutationFn: (data: any) => base44.entities.Appointment.create({ ...data, type: "bloqueio" }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["appointments"] });
            toast.success("Bloqueio criado com sucesso!");
            onSuccess?.();
            onOpenChange(false);
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
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
                            <Select onValueChange={v => setFormData({ ...formData, professional_id: v })}>
                                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    {professionals.map((p: any) => (
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

