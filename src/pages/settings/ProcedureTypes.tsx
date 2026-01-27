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
                                />
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

