import React, { useState, useEffect } from "react";
import { base44 } from "@/lib/base44Client";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Stethoscope, Plus, Trash2, Edit2, Clock, DollarSign } from "lucide-react";
import { toast } from "sonner";

// Centralized Configuration
const CATEGORIES_CONFIG = {
    "Toxina": { color: "#3b82f6", items: ["Toxina Botulínica"], duration: 60, interval: 120 },
    "Preenchimentos": { color: "#ec4899", items: ["8point", "Comissura", "Lábio", "Malar", "Mandíbula", "Mento", "Pré Jowls", "Nariz", "Olheira", "Sulco Naso", "Têmpora", "Glabela", "Marionete"], duration: 60, interval: 365 },
    "Fios": { color: "#8b5cf6", items: ["Fio PDO Liso", "Fio PDO Tração"], duration: 60, interval: 180 },
    "Bioestimuladores": { color: "#10b981", items: ["Bioestimulador", "PDRN", "Exossomos", "Lavieen", "Hipro", "Bioestimulador Corporal", "Bioestimulador Glúteo"], duration: 60, interval: 90 },
    "Corporal": { color: "#f97316", items: ["Glúteo Max", "Gordura Localizada", "Preenchimento Glúteo", "Protocolo 40 dias", "Protocolo Hipertrofia"], duration: 60, interval: 30 },
    "Tratamentos": { color: "#06b6d4", items: ["Microagulhamento", "Hialuronidase", "Endolaser Full Face", "Endolaser Região", "Endolaser Pescoço"], duration: 60, interval: 30 },
    "Transplante": { color: "#64748b", items: ["TP1", "TP2", "TP3"], duration: 60, interval: 0 },
    "Cirurgias": { color: "#ef4444", items: ["Alectomia", "Bichectomia", "Brow Lift", "Lip Lift", "Slim Tip", "Lipo de Papada", "Blefaro", "Rinoplastia"], duration: 60, interval: 0 }
};

export default function ProcedureTypes() {
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
        reset();
        setIsOpen(true);
    }

    const handleImportDefaults = async (isAuto = false) => {
        if (!isAuto && !confirm("Isso irá verificar os procedimentos padrão e padronizar a duração para 1h (60min). Deseja continuar?")) return;

        if (isAuto) {
            setHasAutoSeeded(true); // Prevent loops
            toast.info("Configurando procedimentos...");
        }

        const FULL_PROCEDURES = [];
        Object.entries(CATEGORIES_CONFIG).forEach(([cat, data]: [string, any]) => {
            data.items.forEach(item => {
                let name = item;
                // Add prefix context if needed
                if (cat === "Preenchimentos" && !item.toLowerCase().includes("preenchimento") && !item.includes("8point")) {
                    name = `Preenchimento ${item}`;
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
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Tipos de Procedimento</h1>
                    <p className="text-slate-500 mt-2">Gerencie os procedimentos disponíveis para agendamento.</p>
                </div>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleNew}>
                            <Plus className="w-4 h-4 mr-2" />
                            Novo Procedimento
                        </Button>
                    </DialogTrigger>

                    <Button variant="outline" onClick={() => handleImportDefaults(false)} disabled={loading} className="ml-2">
                        <DollarSign className="w-4 h-4 mr-2" />
                        Importar Padrões
                    </Button>

                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingId ? "Editar Procedimento" : "Nova Procedimento"}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nome do Procedimento</Label>
                                <Input
                                    id="name"
                                    placeholder="Ex: Consulta Inicial"
                                    {...register("name", { required: "Nome é obrigatório" })}
                                    list="procedure-suggestions"
                                />
                                <datalist id="procedure-suggestions">
                                    {/* Flattened list from NewMedicalRecord.tsx */}
                                    {["Toxina Botulínica", "Preenchimentos", "8point", "Comissura", "Lábio", "Malar", "Mandíbula", "Mento", "Pré Jowls", "Nariz", "Olheira", "Sulco Naso", "Têmpora", "Glabela", "Marionete",
                                        "Fio PDO Liso", "Fio PDO Tração",
                                        "Bioestimuladores", "Bioestimulador", "PDRN", "Exossomos", "Lavieen", "Hipro", "Bioestimulador Corporal", "Bioestimulador Glúteo",
                                        "Glúteo Max", "Gordura Localizada", "Preenchimento Glúteo", "Protocolo 40 dias", "Protocolo Hipertrofia",
                                        "Microagulhamento", "Hialuronidase", "Endolaser Full Face", "Endolaser Região", "Endolaser Pescoço",
                                        "Alectomia", "Bichectomia", "Brow Lift", "Lip Lift", "Slim Tip", "Lipo de Papada", "Blefaro", "Rinoplastia"
                                    ].map(proc => (
                                        <option key={proc} value={proc} />
                                    ))}
                                </datalist>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="duration">Duração (min)</Label>
                                    <div className="relative">
                                        <Clock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                        <Input
                                            id="duration"
                                            type="number"
                                            className="pl-9"
                                            placeholder="60"
                                            {...register("duration_minutes", { required: true, min: 5 })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="price">Preço (R$)</Label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                        <Input
                                            id="price"
                                            type="number"
                                            step="0.01"
                                            className="pl-9"
                                            placeholder="0.00"
                                            {...register("price", { required: true, min: 0 })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="return_interval">Alerta de Retorno (dias)</Label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                    <Input
                                        id="return_interval"
                                        type="number"
                                        className="pl-9"
                                        placeholder="Ex: 90 para 3 meses"
                                        {...register("return_interval")}
                                    />
                                    <p className="text-xs text-slate-500 mt-1">Deixe 0 ou vazio para não alertar.</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="color">Cor na Agenda</Label>
                                <Input
                                    id="color"
                                    type="color"
                                    className="h-10 w-full p-1 cursor-pointer"
                                    {...register("color")}
                                    defaultValue="#3b82f6"
                                />
                            </div>

                            <Button type="submit" className="w-full">{editingId ? "Salvar Alterações" : "Criar Procedimento"}</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {(() => {
                const groupedList = [];
                const renderedIds = new Set();

                if (loading) {
                    return (
                        <Card>
                            <CardContent className="py-8 text-center text-slate-500">
                                Carregando procedimentos...
                            </CardContent>
                        </Card>
                    );
                }

                if (procedures.length === 0) {
                    return (
                        <Card>
                            <CardContent className="py-8 text-center text-slate-500">
                                Nenhum procedimento cadastrado.
                            </CardContent>
                        </Card>
                    );
                }

                // 1. UNIQUE PROCEDURES (Deduplicate by name)
                const uniqueProcedures = procedures.filter((proc, index, self) =>
                    index === self.findIndex((t) => t.name.toLowerCase().trim() === proc.name.toLowerCase().trim())
                );

                // 2. Process Defined Categories
                Object.entries(CATEGORIES_CONFIG).forEach(([catName, data]) => {
                    const items = uniqueProcedures.filter(p => {
                        if (renderedIds.has(p.id)) return false;

                        // Strict Match: Use Word Boundaries
                        return data.items.some(k => {
                            const escapedKey = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                            const regex = new RegExp(`\\b${escapedKey}\\b`, 'i');
                            if (k.includes(' ')) {
                                return p.name.toLowerCase().includes(k.toLowerCase());
                            }
                            return regex.test(p.name);
                        });
                    });

                    if (items.length > 0) {
                        items.forEach(p => renderedIds.add(p.id));
                        groupedList.push({ title: catName, items });
                    }
                });

                // 3. Process "Outros"
                const others = uniqueProcedures.filter(p => !renderedIds.has(p.id));
                if (others.length > 0) {
                    groupedList.push({ title: "Outros Procedimentos", items: others });
                }

                return (
                    <div className="space-y-6">
                        {groupedList.map((group) => (
                            <Card key={group.title} className="shadow-sm overflow-hidden">
                                <CardHeader className="bg-slate-50/50 border-b pb-3">
                                    <CardTitle className="text-base font-semibold uppercase tracking-wider text-slate-700">
                                        {group.title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="hover:bg-transparent">
                                                <TableHead className="w-[50px] pl-4">Cor</TableHead>
                                                <TableHead>Nome</TableHead>
                                                <TableHead>Duração</TableHead>
                                                <TableHead>Preço</TableHead>
                                                <TableHead>Retorno</TableHead>
                                                <TableHead className="text-right pr-4">Ações</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {group.items.map((proc) => (
                                                <TableRow key={proc.id}>
                                                    <TableCell className="pl-4">
                                                        <div
                                                            className="w-5 h-5 rounded-full border border-slate-200 shadow-sm"
                                                            style={{ backgroundColor: proc.color }}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="font-medium text-slate-900">
                                                        {proc.name}
                                                    </TableCell>
                                                    <TableCell>{proc.duration_minutes} min</TableCell>
                                                    <TableCell>
                                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(proc.price)}
                                                    </TableCell>
                                                    <TableCell>
                                                        {proc.return_interval > 0 ? (
                                                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 font-normal">
                                                                {proc.return_interval} dias
                                                            </Badge>
                                                        ) : <span className="text-slate-400 text-xs">-</span>}
                                                    </TableCell>
                                                    <TableCell className="text-right pr-4 space-x-1">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-blue-600" onClick={() => handleEdit(proc)}>
                                                            <Edit2 className="w-4 h-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500" onClick={() => handleDelete(proc.id)}>
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                );
            })()}
        </div>
    );
}

