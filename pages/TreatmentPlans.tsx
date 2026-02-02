import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/lib/base44Client";
import { cn, createPageUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
    Search, Plus, FileText, CheckCircle2, Clock,
    AlertCircle, MoreHorizontal, DollarSign, Calendar,
    User, ArrowRight
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useOutletContext } from "react-router-dom";
import TreatmentPlanForm from "@/components/treatments/TreatmentPlanForm";

export default function TreatmentPlans() {
    const navigate = useNavigate();
    const { isDark } = useOutletContext<{ isDark: boolean }>();
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("todos");
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);

    const { data: plans = [], isLoading } = useQuery({
        queryKey: ["treatment-plans"],
        queryFn: () => base44.entities.TreatmentPlan.list("-created_at")
    });

    const { data: patients = [] } = useQuery({
        queryKey: ["patients"],
        queryFn: () => base44.entities.Patient.list()
    });

    const filteredPlans = React.useMemo(() => {
        return plans.filter(plan => {
            const patient = patients.find(p => p.id === plan.patient_id);
            const patientName = patient?.full_name || patient?.name || "";

            const matchesSearch =
                plan.name?.toLowerCase().includes(search.toLowerCase()) ||
                patientName.toLowerCase().includes(search.toLowerCase());

            const matchesStatus = statusFilter === "todos" || plan.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [plans, patients, search, statusFilter]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'aprovado': return "bg-emerald-100 text-emerald-700 border-emerald-200";
            case 'concluido': return "bg-blue-100 text-blue-700 border-blue-200";
            case 'cancelado': return "bg-rose-100 text-rose-700 border-rose-200";
            default: return "bg-amber-100 text-amber-700 border-amber-200";
        }
    };

    const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

    return (
        <div className="p-6 lg:p-10 max-w-[1600px] mx-auto space-y-8 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className={cn("text-3xl font-bold tracking-tight", isDark ? "text-white" : "text-slate-900")}>
                        Planos de Tratamento
                    </h1>
                    <p className={cn("text-lg mt-2", isDark ? "text-slate-400" : "text-slate-600")}>
                        Gerencie orçamentos e protocolos complexos.
                    </p>
                </div>
                <Button
                    onClick={() => { setEditingPlan(null); setIsFormOpen(true); }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 transition-all hover:scale-105"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Novo Plano
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white/50 backdrop-blur-sm p-4 rounded-xl border border-slate-200 dark:bg-slate-900/50 dark:border-slate-800">
                <div className="relative flex-1 w-full md:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder="Buscar por paciente ou nome do plano..."
                        className="pl-10 bg-white dark:bg-slate-950"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                    {['todos', 'orcamento', 'aprovado', 'concluido', 'cancelado'].map(status => (
                        <Button
                            key={status}
                            variant={statusFilter === status ? "default" : "outline"}
                            size="sm"
                            onClick={() => setStatusFilter(status)}
                            className="capitalize whitespace-nowrap"
                        >
                            {status === 'orcamento' ? 'Orçamento' : status}
                        </Button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredPlans.map(plan => {
                    const patient = patients.find(p => p.id === plan.patient_id);
                    return (
                        <Card
                            key={plan.id}
                            className="group relative overflow-hidden transition-all hover:shadow-lg hover:border-indigo-200 cursor-pointer bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                            onClick={() => navigate(`/TreatmentPlanDetails?id=${plan.id}`)}
                        >
                            <div className="absolute top-0 right-0 p-4">
                                <Badge variant="outline" className={cn("capitalize font-bold", getStatusColor(plan.status))}>
                                    {plan.status}
                                </Badge>
                            </div>

                            <div className="p-6">
                                <div className="mb-4 pr-12">
                                    <h3 className="font-bold text-lg text-slate-900 dark:text-white line-clamp-1" title={plan.name}>
                                        {plan.name}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                                        <User className="w-3.5 h-3.5" />
                                        <span>{patient?.full_name || patient?.name || "Paciente desconhecido"}</span>
                                    </div>
                                </div>

                                <div className="space-y-3 py-4 border-t border-slate-100 dark:border-slate-800">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500">Valor Total</span>
                                        <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(plan.total_value)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500">Criado em</span>
                                        <span className="text-slate-700 dark:text-slate-300">
                                            {plan.created_at ? format(parseISO(plan.created_at), "dd/MM/yyyy") : "-"}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-2 pt-4 flex justify-between items-center">
                                    <div className="flex gap-2">
                                        {/* Progress bar placeholder - could be calculated from items */}
                                        <div className="h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-indigo-500 w-[0%]" />
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 p-0 h-auto font-medium">
                                        Ver detalhes <ArrowRight className="w-4 h-4 ml-1" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    );
                })}

                {filteredPlans.length === 0 && (
                    <div className="col-span-full py-20 text-center border-2 border-dashed rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                        <FileText className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Nenhum plano encontrado</h3>
                        <p className="text-slate-500 dark:text-slate-500 mb-6">Comece criando um novo plano de tratamento.</p>
                        <Button onClick={() => setIsFormOpen(true)}>
                            <Plus className="w-4 h-4 mr-2" /> Criar Plano
                        </Button>
                    </div>
                )}
            </div>

            {/* Form Dialog/Sheet can be added here */}
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="max-w-2xl">
                    <TreatmentPlanForm
                        onSuccess={() => { setIsFormOpen(false); /* invalidate queries */ }}
                        onCancel={() => setIsFormOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}
