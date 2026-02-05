import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/lib/base44Client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
    Calendar, CheckCircle2, Clock,
    AlertCircle, DollarSign, User, ArrowLeft,
    Printer, Share2, Edit2
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import TreatmentPlanForm from "@/components/treatments/TreatmentPlanForm";

export default function TreatmentPlanDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [isFormOpen, setIsFormOpen] = useState(false);

    const { data: plan, isLoading } = useQuery({
        queryKey: ["treatment-plan", id],
        queryFn: () => base44.entities.TreatmentPlan.read(id).then(res => Array.isArray(res) ? res[0] : res),
        enabled: !!id
    });

    const { data: items = [] } = useQuery({
        queryKey: ["treatment-plan-items", id],
        queryFn: () => base44.entities.TreatmentPlanItem.filter({ plan_id: id }),
        enabled: !!id
    });

    const { data: patient } = useQuery({
        queryKey: ["patient", plan?.patient_id],
        queryFn: () => base44.entities.Patient.read(plan?.patient_id).then(res => res[0]),
        enabled: !!plan?.patient_id
    });

    if (isLoading) return <div className="p-10 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
    if (!plan) return <div className="p-10 text-center">Plano não encontrado</div>;

    const totalPerformed = items.filter(i => i.status === 'realizado').reduce((acc, i) => acc + Number(i.total_price || 0), 0);
    const progress = (totalPerformed / (Number(plan.total_value) || 1)) * 100;

    return (
        <div className="px-6 lg:px-4 pb-6 lg:pb-4 pt-0 max-w-5xl mx-auto space-y-6">
            <Button variant="ghost" onClick={() => navigate("/TreatmentPlans")} className="mb-2 pl-0 hover:bg-transparent hover:text-indigo-600">
                <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para lista
            </Button>

            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">{plan.name}</h1>
                    <div className="flex items-center gap-2 mt-2 text-slate-500">
                        <User className="w-4 h-4" />
                        <span className="font-medium">{patient?.full_name || patient?.name}</span>
                        <span className="mx-2">•</span>
                        <Calendar className="w-4 h-4" />
                        <span>{format(parseISO(plan.created_at), "d 'de' MMMM, yyyy", { locale: ptBR })}</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => window.print()}>
                        <Printer className="w-4 h-4 mr-2" /> Imprimir
                    </Button>
                    <Button onClick={() => setIsFormOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
                        <Edit2 className="w-4 h-4 mr-2" /> Editar Plano
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="col-span-2 p-6 space-y-6">
                    <div>
                        <h3 className="font-bold text-lg mb-4 text-slate-800">Itens do Plano</h3>
                        <div className="space-y-4">
                            {items.map(item => (
                                <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-10 h-10 rounded-full flex items-center justify-center",
                                            item.status === 'realizado' ? "bg-emerald-100 text-emerald-600" : "bg-slate-200 text-slate-500"
                                        )}>
                                            {item.status === 'realizado' ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-900">{item.procedure_name}</p>
                                            <p className="text-sm text-slate-500">{item.quantity}x {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.unit_price)}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-slate-900">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.total_price)}</p>
                                        <Badge variant="outline" className={cn(
                                            "mt-1 capitalize",
                                            item.status === 'realizado' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600"
                                        )}>
                                            {item.status}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {plan.description && (
                        <div>
                            <h3 className="font-bold text-lg mb-2 text-slate-800">Notas</h3>
                            <p className="text-slate-600 bg-amber-50/50 p-4 rounded-lg border border-amber-100/50">
                                {plan.description}
                            </p>
                        </div>
                    )}
                </Card>

                <div className="space-y-6">
                    <Card className="p-6 bg-slate-900 text-white border-slate-800">
                        <h3 className="text-slate-400 font-medium mb-1">Valor Total</h3>
                        <p className="text-3xl font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(plan.total_value)}</p>

                        <div className="mt-6 pt-6 border-t border-slate-800">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-slate-400">Progresso Financeiro</span>
                                <span className="font-bold text-emerald-400">{Math.round(progress)}%</span>
                            </div>
                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${progress}%` }} />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <h3 className="font-bold text-slate-800 mb-4">Status</h3>
                        <SelectStatus
                            currentStatus={plan.status}
                            onChange={(s) => base44.entities.TreatmentPlan.update(plan.id, { status: s }).then(() => { /* invalidate */ })}
                        />
                    </Card>
                </div>
            </div>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="max-w-2xl">
                    <TreatmentPlanForm
                        plan={{ ...plan, items }} // Pass items too
                        onSuccess={() => { setIsFormOpen(false); /* invalidate */ }}
                        onCancel={() => setIsFormOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}

function SelectStatus({ currentStatus, onChange }) {
    // Simplified status selector
    return (
        <div className="space-y-2">
            {['orcamento', 'aprovado', 'concluido', 'cancelado'].map(s => (
                <button
                    key={s}
                    onClick={() => onChange(s)}
                    className={cn(
                        "w-full text-left px-4 py-3 rounded-lg border transition-all capitalize font-medium flex justify-between items-center group",
                        currentStatus === s
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50"
                    )}
                >
                    {s}
                    {currentStatus === s && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                </button>
            ))}
        </div>
    );
}



