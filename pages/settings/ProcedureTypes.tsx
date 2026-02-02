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

export default function ProcedureTypes() {
    const [procedures, setProcedures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

    const fetchProcedures = async () => {
        try {
            setLoading(true);
            const data = await base44.entities.ProcedureType.list();
            setProcedures(data);
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
                await base44.entities.ProcedureType.create(payload);
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

    const handleImportDefaults = async () => {
        if (!confirm("Isso irá criar vários procedimentos padrão (Toxina, Preenchimentos, etc). Deseja continuar?")) return;

        const DEFAULT_PROCEDURES = [
            { name: "Toxina Botulínica", duration_minutes: 30, price: 0, return_interval: 120, color: "#3b82f6" },
            { name: "Preenchimento Labial", duration_minutes: 45, price: 0, return_interval: 270, color: "#ec4899" },
            { name: "Preenchimento Malar", duration_minutes: 60, price: 0, return_interval: 365, color: "#ec4899" },
            { name: "Preenchimento Olheiras", duration_minutes: 45, price: 0, return_interval: 365, color: "#ec4899" },
            { name: "Preenchimento Mandíbula", duration_minutes: 60, price: 0, return_interval: 365, color: "#ec4899" },
            { name: "Preenchimento Mento", duration_minutes: 45, price: 0, return_interval: 365, color: "#ec4899" },
            { name: "Fios PDO Liso", duration_minutes: 45, price: 0, return_interval: 180, color: "#8b5cf6" },
            { name: "Fios PDO Tração", duration_minutes: 90, price: 0, return_interval: 240, color: "#8b5cf6" },
            { name: "Bioestimulador (Sessão)", duration_minutes: 45, price: 0, return_interval: 30, color: "#10b981" },
            { name: "Bioestimulador (Manutenção)", duration_minutes: 45, price: 0, return_interval: 365, color: "#10b981" },
            { name: "Microagulhamento", duration_minutes: 45, price: 0, return_interval: 30, color: "#f59e0b" },
            { name: "Lavieen", duration_minutes: 30, price: 0, return_interval: 30, color: "#f43f5e" },
            { name: "Endolaser", duration_minutes: 120, price: 0, return_interval: 0, color: "#ef4444" },
            { name: "Lipo de Papada", duration_minutes: 60, price: 0, return_interval: 0, color: "#ef4444" },
            { name: "Bichectomia", duration_minutes: 60, price: 0, return_interval: 0, color: "#ef4444" },
        ];

        setLoading(true);
        try {
            for (const proc of DEFAULT_PROCEDURES) {
                // Check if already exists to avoid duplicates
                const exists = procedures.find(p => p.name === proc.name);
                if (!exists) {
                    await base44.entities.ProcedureType.create({ ...proc, active: true });
                }
            }
            toast.success("Procedimentos padrão importados!");
            fetchProcedures();
        } catch (error) {
            console.error(error);
            toast.error("Erro ao importar.");
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

                    <Button variant="outline" onClick={handleImportDefaults} disabled={loading} className="ml-2">
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
                                            placeholder="30"
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

            <Card>
                <CardHeader>
                    <CardTitle>Lista de Procedimentos</CardTitle>
                    <CardDescription>Procedimentos personalizados da sua clínica.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Cor</TableHead>
                                <TableHead>Nome</TableHead>
                                <TableHead>Duração</TableHead>
                                <TableHead>Preço</TableHead>
                                <TableHead>Retorno</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                                        Carregando...
                                    </TableCell>
                                </TableRow>
                            ) : procedures.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                                        Nenhum procedimento cadastrado.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                procedures.map((proc) => (
                                    <TableRow key={proc.id}>
                                        <TableCell>
                                            <div
                                                className="w-6 h-6 rounded-full border border-slate-200 shadow-sm"
                                                style={{ backgroundColor: proc.color }}
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {proc.name}
                                        </TableCell>
                                        <TableCell>{proc.duration_minutes} min</TableCell>
                                        <TableCell>
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(proc.price)}
                                        </TableCell>
                                        <TableCell>
                                            {proc.return_interval > 0 ? (
                                                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                                    {proc.return_interval} dias
                                                </Badge>
                                            ) : <span className="text-slate-400 text-xs">-</span>}
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(proc)}>
                                                <Edit2 className="w-4 h-4 text-slate-500" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(proc.id)}>
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

