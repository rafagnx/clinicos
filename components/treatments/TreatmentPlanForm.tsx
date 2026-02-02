import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { base44 } from "@/lib/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export default function TreatmentPlanForm({ plan, onSuccess, onCancel }) {
    const queryClient = useQueryClient();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch patients and procedure types
    const { data: patients = [] } = useQuery({
        queryKey: ["patients"],
        queryFn: () => base44.entities.Patient.list()
    });

    const { data: procedureTypes = [] } = useQuery({
        queryKey: ["procedure-types"],
        queryFn: () => base44.entities.ProcedureType.list()
    });

    const form = useForm({
        defaultValues: plan || {
            name: "",
            patient_id: "",
            description: "",
            status: "orcamento",
            items: [{ procedureName: "", quantity: 1, unitPrice: 0 }]
        }
    });

    const { register, control, handleSubmit, watch, setValue, formState: { errors } } = form;
    const { fields, append, remove } = useFieldArray({ control, name: "items" });

    // Watch items to calculate total
    const items = watch("items");
    const totalValue = items.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.unitPrice || 0)), 0);

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        try {
            const planData = {
                ...data,
                patient_id: Number(data.patient_id),
                total_value: totalValue
            };

            // Separate items from plan data
            const { items: planItems, ...mainPlan } = planData;

            let planId = plan?.id;

            if (planId) {
                await base44.entities.TreatmentPlan.update(planId, mainPlan);
            } else {
                const newPlan = await base44.entities.TreatmentPlan.create(mainPlan);
                planId = newPlan.id; // Corrected: base44 returns object with [0] or direct object? Usually [0] for insert
                if (Array.isArray(newPlan)) planId = newPlan[0].id;
                else planId = newPlan.id;
            }

            // Handle items - for simplicity delete all and recreate on edit (or just create for new)
            // A more robust app would diff them. For MVP we'll just add new ones for now if new plan

            if (planItems && planItems.length > 0) {
                // Creating items one by one or bulk if supported
                for (const item of planItems) {
                    await base44.entities.TreatmentPlanItem.create({
                        plan_id: planId,
                        procedure_name: item.procedureName,
                        quantity: Number(item.quantity),
                        unit_price: Number(item.unitPrice),
                        total_price: Number(item.quantity) * Number(item.unitPrice),
                        status: 'pendente'
                    });
                }
            }

            toast.success(plan ? "Plano atualizado!" : "Plano criado com sucesso!");
            queryClient.invalidateQueries({ queryKey: ["treatment-plans"] });
            onSuccess();
        } catch (error) {
            console.error(error);
            toast.error("Erro ao salvar plano");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <DialogHeader>
                <DialogTitle>{plan ? "Editar Plano" : "Novo Plano de Tratamento"}</DialogTitle>
                <DialogDescription>Crie um orçamento ou protocolo para o paciente.</DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Paciente</Label>
                    <Select
                        onValueChange={v => setValue("patient_id", v)}
                        defaultValue={String(plan?.patient_id || "")}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                            {patients.map(p => (
                                <SelectItem key={p.id} value={String(p.id)}>{p.full_name || p.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Nome do Plano</Label>
                    <Input {...register("name", { required: true })} placeholder="Ex: Harmonização Facial Completa" />
                </div>

                <div className="col-span-2 space-y-2">
                    <Label>Descrição / Notas</Label>
                    <Textarea {...register("description")} placeholder="Detalhes do tratamento..." />
                </div>
            </div>

            <div className="space-y-3 border rounded-lg p-4 bg-slate-50/50">
                <div className="flex justify-between items-center">
                    <Label className="font-bold text-slate-700">Itens do Plano</Label>
                    <Button type="button" variant="outline" size="sm" onClick={() => append({ procedureName: "", quantity: 1, unitPrice: 0 })}>
                        <Plus className="w-3 h-3 mr-2" /> Adicionar Item
                    </Button>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                    {fields.map((field, index) => (
                        <div key={field.id} className="flex gap-2 items-end bg-white p-3 rounded border shadow-sm">
                            <div className="flex-1 space-y-1">
                                <Label className="text-xs">Procedimento</Label>
                                <Input
                                    {...register(`items.${index}.procedureName` as const)}
                                    placeholder="Nome do procedimento"
                                    list="procedures-list"
                                />
                            </div>
                            <div className="w-20 space-y-1">
                                <Label className="text-xs">Qtd</Label>
                                <Input type="number" {...register(`items.${index}.quantity` as const)} />
                            </div>
                            <div className="w-28 space-y-1">
                                <Label className="text-xs">Valor Unit.</Label>
                                <Input type="number" step="0.01" {...register(`items.${index}.unitPrice` as const)} />
                            </div>
                            <Button type="button" variant="ghost" size="icon" className="mb-0.5 text-rose-500 hover:bg-rose-50" onClick={() => remove(index)}>
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    ))}
                </div>

                <div className="flex justify-end pt-2 border-t font-bold text-lg text-slate-800">
                    Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}
                </div>
            </div>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
                <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700">
                    {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Plano
                </Button>
            </DialogFooter>

            <datalist id="procedures-list">
                {procedureTypes.map(p => <option key={p.id} value={p.name} />)}
            </datalist>
        </form>
    );
}
