import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/lib/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { format } from "date-fns";

export default function Financial() {
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Fetch Transactions
    const { data: transactions = [], isLoading } = useQuery({
        queryKey: ["financial-transactions"],
        queryFn: () => base44.entities.FinancialTransaction.list()
    });

    // Calculate Totals
    const summary = React.useMemo(() => {
        const income = transactions
            .filter(t => t.type === 'income')
            .reduce((acc, curr) => acc + Number(curr.amount), 0);
        const expense = transactions
            .filter(t => t.type === 'expense')
            .reduce((acc, curr) => acc + Number(curr.amount), 0);
        return {
            income,
            expense,
            balance: income - expense
        };
    }, [transactions]);

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen dark:bg-[#0B0E14]">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Financeiro</h1>
                    <p className="text-slate-500 dark:text-slate-400">Gestão de fluxo de caixa da clínica.</p>
                </div>
                <NewTransactionDialog
                    open={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                />
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="dark:bg-[#151A25] dark:border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium dark:text-slate-200">Receitas (Total)</CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summary.income)}
                        </div>
                    </CardContent>
                </Card>
                <Card className="dark:bg-[#151A25] dark:border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium dark:text-slate-200">Despesas (Total)</CardTitle>
                        <TrendingDown className="h-4 w-4 text-rose-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summary.expense)}
                        </div>
                    </CardContent>
                </Card>
                <Card className="dark:bg-[#151A25] dark:border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium dark:text-slate-200">Saldo Atual</CardTitle>
                        <DollarSign className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${summary.balance >= 0 ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400"}`}>
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summary.balance)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Transactions Table */}
            <Card className="dark:bg-[#151A25] dark:border-slate-800">
                <CardHeader>
                    <CardTitle className="dark:text-slate-100">Histórico de Transações</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="dark:border-slate-800">
                                <TableHead className="dark:text-slate-400">Data</TableHead>
                                <TableHead className="dark:text-slate-400">Descrição</TableHead>
                                <TableHead className="dark:text-slate-400">Categoria</TableHead>
                                <TableHead className="dark:text-slate-400">Tipo</TableHead>
                                <TableHead className="text-right dark:text-slate-400">Valor</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 dark:text-slate-400">Carregando...</TableCell>
                                </TableRow>
                            ) : transactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-slate-500 dark:text-slate-400">Nenhuma transação registrada.</TableCell>
                                </TableRow>
                            ) : (
                                transactions.map((t) => (
                                    <TableRow key={t.id} className="dark:border-slate-800">
                                        <TableCell className="dark:text-slate-300">{t.date ? format(new Date(t.date), 'dd/MM/yyyy') : '-'}</TableCell>
                                        <TableCell className="font-medium dark:text-slate-200">{t.description}</TableCell>
                                        <TableCell className="dark:text-slate-300">{t.category || '-'}</TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${t.type === 'income' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                                                {t.type === 'income' ? 'Receita' : 'Despesa'}
                                            </span>
                                        </TableCell>
                                        <TableCell className={`text-right font-medium ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                            {t.type === 'expense' ? '-' : '+'}
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(t.amount))}
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

function NewTransactionDialog({ open, onOpenChange }) {
    const queryClient = useQueryClient();
    const defaultForm = {
        description: "",
        amount: "",
        type: "expense",
        category: "Outros",
        date: format(new Date(), "yyyy-MM-dd")
    };
    const [formData, setFormData] = useState(defaultForm);

    const createMutation = useMutation({
        mutationFn: (data: any) => base44.entities.FinancialTransaction.create({
            ...data,
            amount: parseFloat(data.amount)
        }),
        onSuccess: () => {
            toast.success("Transação registrada!");
            queryClient.invalidateQueries({ queryKey: ["financial-transactions"] });
            setFormData(defaultForm);
            onOpenChange(false);
        },
        onError: () => toast.error("Erro ao registrar.")
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        createMutation.mutate(formData);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4" />
                    Nova Transação
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Nova Transação</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Descrição</Label>
                        <Input
                            placeholder="Ex: Aluguel, Consulta..."
                            required
                            value={formData.description}
                            onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Valor (R$)</Label>
                            <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                required
                                value={formData.amount}
                                onChange={e => setFormData(p => ({ ...p, amount: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Data</Label>
                            <Input
                                type="date"
                                required
                                value={formData.date}
                                onChange={e => setFormData(p => ({ ...p, date: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Tipo</Label>
                        <div className="flex gap-4">
                            <Button
                                type="button"
                                variant={formData.type === 'income' ? 'default' : 'outline'}
                                className={`flex-1 ${formData.type === 'income' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                                onClick={() => setFormData(p => ({ ...p, type: 'income' }))}
                            >
                                Receita
                            </Button>
                            <Button
                                type="button"
                                variant={formData.type === 'expense' ? 'destructive' : 'outline'}
                                className="flex-1"
                                onClick={() => setFormData(p => ({ ...p, type: 'expense' }))}
                            >
                                Despesa
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Categoria</Label>
                        <Select
                            value={formData.category}
                            onValueChange={v => setFormData(p => ({ ...p, category: v }))}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Consultas">Consultas</SelectItem>
                                <SelectItem value="Procedimentos">Procedimentos</SelectItem>
                                <SelectItem value="Vendas">Vendas</SelectItem>
                                <SelectItem value="Aluguel">Aluguel</SelectItem>
                                <SelectItem value="Equipamentos">Equipamentos</SelectItem>
                                <SelectItem value="Marketing">Marketing</SelectItem>
                                <SelectItem value="Pessoal">Pessoal</SelectItem>
                                <SelectItem value="Impostos">Impostos</SelectItem>
                                <SelectItem value="Outros">Outros</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                        {createMutation.isPending ? "Salvando..." : "Registrar"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}

