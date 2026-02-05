
import React, { useState, useEffect } from "react";
import { base44 } from "@/lib/base44Client";
import { useForm } from "react-hook-form";
import { PROCEDURE_CATEGORIES, getGroupedProcedures } from "@/lib/procedures";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Stethoscope, Plus, Trash2, Edit2, Clock, DollarSign, Sparkles, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useOutletContext } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function ProcedureTypes() {
    const { isDark } = useOutletContext<{ isDark: boolean }>();
    const [procedures, setProcedures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

    const [hasAutoSeeded, setHasAutoSeeded] = useState(false);

    const fetchProcedures = async () => {
        try {
            setLoading(true);
            const data = await base44.entities.ProcedureType.list();
            setProcedures(data);

            // AUTO-SEED: If list is empty and haven't seeded yet, do it automatically
            if (data.length === 0 && !hasAutoSeeded) {
                handleImportDefaults(true); // true = silent/auto mode
            }
        } catch (error) {
            console.error("Failed to load procedures", error);
            toast.error("Erro ao carregar procedimentos.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProcedures();
    }, []);

    const onSubmit = async (data) => {
        try {
            // Ensure numeric types
            const payload = {
                ...data,
                duration_minutes: parseInt(data.duration_minutes),
                price: parseFloat(data.price),
                return_interval: parseInt(data.return_interval || 0),
                active: true
            };

            if (editingId) {
                await base44.entities.ProcedureType.update(editingId, payload);
                toast.success("Procedimento atualizado!");
            } else {
                try {
                    await base44.entities.ProcedureType.create(payload);
                } catch (err) {
                    // Fallback for missing column
                    const { return_interval, ...safePayload } = payload;
                    await base44.entities.ProcedureType.create(safePayload);
                }
                toast.success("Procedimento criado!");
            }

            setIsOpen(false);
            reset();
            setEditingId(null);
            fetchProcedures();
        } catch (error) {
            console.error(error);
            toast.error("Erro ao salvar procedimento.");
        }
    };

    const handleEdit = (proc) => {
        setEditingId(proc.id);
        setValue("name", proc.name);
        setValue("duration_minutes", proc.duration_minutes);
        setValue("price", proc.price);
        setValue("color", proc.color);
        setValue("return_interval", proc.return_interval);
        setIsOpen(true);
    };

    const handleDelete = async (id) => {
        if (!confirm("Tem certeza que deseja excluir?")) return;
        try {
            await base44.entities.ProcedureType.delete(id);
            toast.success("Procedimento removido.");
            fetchProcedures();
        } catch (error) {
            toast.error("Erro ao remover.");
        }
    };

    const handleNew = () => {
        setEditingId(null);
        reset({
            duration_minutes: 60,
            price: 0,
            return_interval: 0,
            color: "#3b82f6"
        });
        setIsOpen(true);
    }

    const handleImportDefaults = async (isAuto = false) => {
        if (!isAuto && !confirm("Isso irá verificar os procedimentos padrão e padronizar a duração para 1h (60min). Deseja continuar?")) return;

        if (isAuto) {
            setHasAutoSeeded(true); // Prevent loops
            toast.info("Configurando procedimentos...");
        }

        const FULL_PROCEDURES = [];
        Object.entries(PROCEDURE_CATEGORIES).forEach(([cat, data]: [string, any]) => {
            data.items.forEach(item => {
                let name = item;
                // Add prefix context if needed
                if (cat === "Preenchimentos" && !item.toLowerCase().includes("preenchimento") && !item.includes("8point")) {
                    name = `Preenchimento ${item} `;
                }

                FULL_PROCEDURES.push({
                    name: name,
                    duration_minutes: data.duration, // 60 from config
                    price: 0,
                    color: data.color,
                    return_interval: data.interval || 0
                });
            });
        });

        setLoading(true);
        try {
            let createdCount = 0;
            let updatedCount = 0;

            for (const proc of FULL_PROCEDURES) {
                // Check if already exists (fuzzy match or exact?)
                const exists = procedures.find(p => p.name.toLowerCase() === proc.name.toLowerCase());

                if (exists) {
                    // UPDATE: Standardize duration if different
                    if (exists.duration_minutes !== proc.duration_minutes) {
                        await base44.entities.ProcedureType.update(exists.id, { duration_minutes: proc.duration_minutes });
                        updatedCount++;
                    }
                } else {
                    // CREATE
                    try {
                        await base44.entities.ProcedureType.create({ ...proc, active: true });
                        createdCount++;
                    } catch (err) {
                        console.warn(`Retry create ${proc.name} without interval...`);
                        // Fallback for missing column
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        const { return_interval, ...safeProc } = proc;
                        await base44.entities.ProcedureType.create({ ...safeProc, active: true });
                        createdCount++;
                    }
                }
            }

            if (createdCount > 0 || updatedCount > 0) {
                toast.success(`${createdCount} criados, ${updatedCount} atualizados para 60min!`);
                const newData = await base44.entities.ProcedureType.list();
                setProcedures(newData);
            } else {
                if (!isAuto) toast.info("Todos procedimentos já estão atualizados.");
            }
        } catch (error) {
            console.error(error);
            toast.error("Erro ao configurar padrões.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={cn("p-4 md:p-10 max-w-[1600px] mx-auto space-y-8 min-h-screen relative overflow-hidden flex flex-col")}>

            {/* Header Liquid Scale */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 text-[8px] font-black uppercase tracking-widest mb-1">
                        <Stethoscope className="w-2.5 h-2.5" /> CLINICAL MANAGEMENT
                    </div>
                    <h1 className={cn("text-3xl md:text-4xl font-black mb-1 tracking-tighter leading-[0.9]", isDark ? "text-white" : "text-slate-900")}>
                        TIPOS DE <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">PROCEDIMENTO</span>
                    </h1>
                    <p className={cn("text-sm font-medium", isDark ? "text-slate-400" : "text-slate-600")}>
                        Gerencie o catálogo de serviços, preços e duração dos atendimentos.
                    </p>
                </div>

                <div className="flex gap-3">
                    <Dialog open={isOpen} onOpenChange={setIsOpen}>
                        <DialogTrigger asChild>
                            <Button
                                onClick={handleNew}
                                className="h-12 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Novo Procedimento
                            </Button>
                        </DialogTrigger>

                        <DialogContent className={isDark ? "bg-slate-900 border-slate-800" : ""}>
                            <DialogHeader>
                                <DialogTitle className={isDark ? "text-white" : ""}>{editingId ? "Editar Procedimento" : "Novo Procedimento"}</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className={isDark ? "text-slate-300" : ""}>Nome do Procedimento</Label>
                                    <Input
                                        id="name"
                                        placeholder="Ex: Consulta Inicial"
                                        {...register("name", { required: "Nome é obrigatório" })}
                                        list="procedure-suggestions"
                                        className={isDark ? "bg-slate-800 border-slate-700 text-white" : ""}
                                    />
                                    <datalist id="procedure-suggestions">
                                        {Object.values(PROCEDURE_CATEGORIES).flatMap((cat: any) => cat.items).map(proc => (
                                            <option key={proc} value={proc} />
                                        ))}
                                    </datalist>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="duration" className={isDark ? "text-slate-300" : ""}>Duração (min)</Label>
                                        <div className="relative">
                                            <Clock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                            <Input
                                                id="duration"
                                                type="number"
                                                className={cn("pl-9", isDark ? "bg-slate-800 border-slate-700 text-white" : "")}
                                                placeholder="60"
                                                {...register("duration_minutes", { required: true, min: 5 })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="price" className={isDark ? "text-slate-300" : ""}>Preço (R$)</Label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                            <Input
                                                id="price"
                                                type="number"
                                                step="0.01"
                                                className={cn("pl-9", isDark ? "bg-slate-800 border-slate-700 text-white" : "")}
                                                placeholder="0.00"
                                                {...register("price", { required: true, min: 0 })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="return_interval" className={isDark ? "text-slate-300" : ""}>Alerta de Retorno (dias)</Label>
                                    <div className="relative">
                                        <Clock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                        <Input
                                            id="return_interval"
                                            type="number"
                                            className={cn("pl-9", isDark ? "bg-slate-800 border-slate-700 text-white" : "")}
                                            placeholder="Ex: 90 para 3 meses"
                                            {...register("return_interval")}
                                        />
                                        <p className="text-xs text-slate-500 mt-1">Deixe 0 ou vazio para não alertar.</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="color" className={isDark ? "text-slate-300" : ""}>Cor na Agenda</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="color"
                                            type="color"
                                            className="h-10 w-20 p-1 cursor-pointer"
                                            {...register("color")}
                                            defaultValue="#3b82f6"
                                        />
                                        <div className="text-xs text-slate-500 flex items-center">
                                            Escolha uma cor para identificar este procedimento na agenda.
                                        </div>
                                    </div>
                                </div>

                                <Button type="submit" className="w-full font-bold uppercase tracking-widest">{editingId ? "Salvar Alterações" : "Criar Procedimento"}</Button>
                            </form>
                        </DialogContent>
                    </Dialog>

                    <Button
                        variant="outline"
                        onClick={() => handleImportDefaults(false)}
                        disabled={loading}
                        className={cn(
                            "h-12 px-6 rounded-xl border font-bold uppercase tracking-widest text-[10px]",
                            isDark ? "bg-slate-900/50 border-white/10 hover:bg-slate-800" : "bg-white/50 border-slate-200 hover:bg-white"
                        )}
                    >
                        <Sparkles className="w-4 h-4 mr-2 text-amber-500" />
                        Restaurar Padrões
                    </Button>
                </div>
            </div>

            {(() => {
                const groupedList = getGroupedProcedures(procedures);

                return (
                    <div className="space-y-8 relative z-10 pb-20">
                        {groupedList.map((group, groupIndex) => (
                            <motion.div
                                key={group.title}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: groupIndex * 0.1 }}
                                className={cn(
                                    "rounded-[1.5rem] overflow-hidden border",
                                    isDark ? "bg-slate-950/40 border-white/5" : "bg-white/60 border-slate-200 shadow-sm"
                                )}
                            >
                                <div className={cn(
                                    "px-6 py-4 flex items-center gap-3 border-b",
                                    isDark ? "bg-slate-900/50 border-white/5" : "bg-slate-50/80 border-slate-100"
                                )}>
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                    <h3 className={cn("text-sm font-black uppercase tracking-widest", isDark ? "text-slate-300" : "text-slate-700")}>
                                        {group.title}
                                    </h3>
                                </div>

                                <div className="p-0">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className={cn("hover:bg-transparent border-b", isDark ? "border-white/5" : "border-slate-100")}>
                                                <TableHead className="w-[80px] pl-6 text-[10px] font-black uppercase tracking-widest text-slate-400">ID Visual</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Procedimento</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Duração</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Valor</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Retorno</TableHead>
                                                <TableHead className="text-right pr-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Gestão</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {group.items.map((proc) => (
                                                <TableRow key={proc.id} className={cn("transition-colors border-b last:border-0", isDark ? "hover:bg-white/5 border-white/5" : "hover:bg-slate-50 border-slate-100")}>
                                                    <TableCell className="pl-6">
                                                        <div
                                                            className="w-8 h-8 rounded-lg shadow-sm flex items-center justify-center text-xs font-bold text-white/90"
                                                            style={{ backgroundColor: proc.color }}
                                                        >
                                                            {proc.name.substring(0, 1)}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className={cn("font-bold text-sm", isDark ? "text-slate-200" : "text-slate-800")}>
                                                        {proc.name}
                                                    </TableCell>
                                                    <TableCell className="text-xs font-medium opacity-70">
                                                        {proc.duration_minutes} min
                                                    </TableCell>
                                                    <TableCell className="font-mono text-xs font-bold text-emerald-500">
                                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(proc.price)}
                                                    </TableCell>
                                                    <TableCell>
                                                        {proc.return_interval > 0 ? (
                                                            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-500/10 text-blue-500 text-[10px] font-bold uppercase tracking-wide">
                                                                <Clock className="w-3 h-3" />
                                                                {proc.return_interval} dias
                                                            </div>
                                                        ) : <span className="text-slate-400 text-xs opacity-50">-</span>}
                                                    </TableCell>
                                                    <TableCell className="text-right pr-6">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-slate-500 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                                                                onClick={() => handleEdit(proc)}
                                                            >
                                                                <Edit2 className="w-3.5 h-3.5" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                                                                onClick={() => handleDelete(proc.id)}
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                );
            })()}
        </div>
    );
}

