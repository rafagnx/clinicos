import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import { Plus, TrendingUp, TrendingDown, DollarSign, Wallet, ArrowUpRight, ArrowDownRight, Search, Filter } from "lucide-react";
import { format } from "date-fns";
import { Link, useOutletContext } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function Financial() {
    const { isDark } = useOutletContext<{ isDark: boolean }>();
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
        <div className={cn("p-4 lg:p-4 max-w-[1600px] mx-auto space-y-4 min-h-screen relative overflow-hidden flex flex-col")}>

            {/* Header Liquid Scale */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[8px] font-black uppercase tracking-widest mb-1">
                        <Wallet className="w-2.5 h-2.5" /> GESTÃO DE CAIXA
                    </div>
                    <h1 className={cn("text-3xl md:text-4xl font-black mb-1 tracking-tighter leading-[0.9]", isDark ? "text-white" : "text-slate-900")}>
                        FLUXO <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">FINANCEIRO</span>
                    </h1>
                    <p className={cn("text-sm font-medium", isDark ? "text-slate-400" : "text-slate-600")}>
                        Acompanhe a saúde financeira da sua clínica em tempo real.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <NewTransactionDialog
                        open={isDialogOpen}
                        onOpenChange={setIsDialogOpen}
                        isDark={isDark}
                    />
                </div>
            </div>

            {/* Summary Cards Liquid Scale */}
            <div className="grid gap-6 grid-cols-1 md:grid-cols-3 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className={cn(
                        "p-6 rounded-[2rem] glass-premium border-white/5 transition-all duration-500 hover:scale-[1.02] group relative overflow-hidden",
                        isDark ? "bg-slate-950/40" : "bg-white/60"
                    )}
                >
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
                        <TrendingUp className="w-24 h-24 text-emerald-500 transform -rotate-12" />
                    </div>
                    <div className="space-y-4 relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-2 border border-emerald-500/20">
                            <ArrowUpRight className="w-6 h-6" />
                        </div>
                        <div>
                            <p className={cn("text-[10px] font-black uppercase tracking-[0.2em] mb-1", isDark ? "text-slate-400" : "text-slate-500")}>
                                ENTRADAS TOTAIS
                            </p>
                            <div className={cn("text-3xl lg:text-4xl font-black tracking-tighter leading-none transition-transform group-hover:scale-105 origin-left", isDark ? "text-white" : "text-slate-900")}>
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summary.income)}
                            </div>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className={cn(
                        "p-6 rounded-[2rem] glass-premium border-white/5 transition-all duration-500 hover:scale-[1.02] group relative overflow-hidden",
                        isDark ? "bg-slate-950/40" : "bg-white/60"
                    )}
                >
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
                        <TrendingDown className="w-24 h-24 text-rose-500 transform -rotate-12" />
                    </div>
                    <div className="space-y-4 relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 mb-2 border border-rose-500/20">
                            <ArrowDownRight className="w-6 h-6" />
                        </div>
                        <div>
                            <p className={cn("text-[10px] font-black uppercase tracking-[0.2em] mb-1", isDark ? "text-slate-400" : "text-slate-500")}>
                                SAÍDAS TOTAIS
                            </p>
                            <div className={cn("text-3xl lg:text-4xl font-black tracking-tighter leading-none transition-transform group-hover:scale-105 origin-left", isDark ? "text-white" : "text-slate-900")}>
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summary.expense)}
                            </div>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className={cn(
                        "p-6 rounded-[2rem] glass-premium border-white/5 transition-all duration-500 hover:scale-[1.02] group relative overflow-hidden",
                        isDark ? "bg-slate-950/40" : "bg-white/60"
                    )}
                >
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
                        <DollarSign className="w-24 h-24 text-blue-500 transform -rotate-12" />
                    </div>
                    <div className="space-y-4 relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 mb-2 border border-blue-500/20">
                            <Wallet className="w-6 h-6" />
                        </div>
                        <div>
                            <p className={cn("text-[10px] font-black uppercase tracking-[0.2em] mb-1", isDark ? "text-slate-400" : "text-slate-500")}>
                                SALDO EM CAIXA
                            </p>
                            <div className={cn("text-3xl lg:text-4xl font-black tracking-tighter leading-none transition-transform group-hover:scale-105 origin-left", summary.balance >= 0 ? (isDark ? "text-white" : "text-slate-900") : "text-rose-500")}>
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summary.balance)}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Transactions Table Liquid Scale */}
            <div className={cn(
                "flex-1 rounded-[2rem] glass-premium border-white/5 relative z-10 overflow-hidden min-h-[500px] flex flex-col",
                isDark ? "bg-slate-950/40" : "bg-white/60"
            )}>
                <div className={cn(
                    "p-6 md:p-8 border-b flex flex-col md:flex-row md:items-center justify-between gap-4",
                    isDark ? "border-white/5" : "border-slate-100"
                )}>
                    <div>
                        <h2 className={cn("text-lg font-black tracking-tight", isDark ? "text-white" : "text-slate-900")}>Histórico de Transações</h2>
                        <p className={cn("text-xs font-medium mt-1", isDark ? "text-slate-400" : "text-slate-500")}>Visualize e filtre todas as movimentações financeiras.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar..."
                                className={cn(
                                    "h-10 pl-10 pr-4 rounded-xl text-xs font-medium outline-none border transition-all w-full md:w-64",
                                    isDark ? "bg-slate-900/50 border-white/10 text-white placeholder:text-slate-500 focus:border-emerald-500/50" : "bg-white border-slate-200 text-slate-700 placeholder:text-slate-400 focus:border-emerald-500/50"
                                )}
                            />
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            className={cn(
                                "h-10 w-10 rounded-xl border",
                                isDark ? "bg-slate-900/50 border-white/10 hover:bg-slate-800 text-slate-400" : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"
                            )}
                        >
                            <Filter className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                <div className="overflow-x-auto flex-1">
                    <Table>
                        <TableHeader>
                            <TableRow className={cn("hover:bg-transparent border-b", isDark ? "border-white/5" : "border-slate-100")}>
                                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] h-12 pl-8 text-slate-400">Data</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] h-12 text-slate-400">Descrição</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] h-12 text-slate-400">Categoria</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] h-12 text-center text-slate-400">Tipo</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] h-12 text-right pr-8 text-slate-400">Valor</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-20 opacity-50 font-black uppercase tracking-widest text-[10px]">Sincronizando caixa...</TableCell>
                                </TableRow>
                            ) : transactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-24">
                                        <div className="flex flex-col items-center justify-center opacity-30">
                                            <Wallet className="w-16 h-16 mb-4" />
                                            <p className="font-black uppercase tracking-widest text-xs">Sem movimentações registradas</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                [...transactions].reverse().map((t, idx) => (
                                    <motion.tr
                                        key={t.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.03 }}
                                        className={cn(
                                            "group transition-all cursor-default border-b last:border-0",
                                            isDark ? "hover:bg-white/5 border-white/5" : "hover:bg-slate-50/80 border-slate-100"
                                        )}
                                    >
                                        <TableCell className="pl-8 py-4">
                                            <div className={cn(
                                                "inline-flex px-2.5 py-1 rounded-lg font-mono text-[10px] font-bold tracking-tight",
                                                isDark ? "bg-slate-900 text-slate-400" : "bg-slate-100 text-slate-500"
                                            )}>
                                                {t.date ? format(new Date(t.date), 'dd/MM/yyyy') : '-'}
                                            </div>
                                        </TableCell>
                                        <TableCell className={cn("font-bold text-sm min-w-[200px] tracking-tight transition-colors uppercase", isDark ? "text-slate-300 group-hover:text-white" : "text-slate-700 group-hover:text-slate-900")}>
                                            {t.description}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-slate-400/50" />
                                                <span className={cn("text-[10px] font-black uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity", isDark ? "text-slate-400" : "text-slate-500")}>
                                                    {t.category || 'Geral'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className={cn(
                                                "inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm",
                                                t.type === 'income'
                                                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                                    : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                                            )}>
                                                {t.type === 'income' ? 'Entrada' : 'Saída'}
                                            </div>
                                        </TableCell>
                                        <TableCell className={cn(
                                            "text-right font-black text-sm pr-8 tracking-tighter",
                                            t.type === 'income' ? 'text-emerald-500' : 'text-rose-500'
                                        )}>
                                            <span className="text-[10px] mr-1 opacity-50">{t.type === 'expense' ? '-' : '+'}</span>
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(t.amount))}
                                        </TableCell>
                                    </motion.tr>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}

function NewTransactionDialog({ open, onOpenChange, isDark }) {
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
                <Button className="h-12 px-8 bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95 group relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Plus className="w-3.5 h-3.5 mr-2 relative z-10" />
                    <span className="relative z-10">Nova Transação</span>
                </Button>
            </DialogTrigger>
            <DialogContent className={cn(
                "sm:max-w-[425px] border-0 backdrop-blur-2xl shadow-2xl overflow-hidden",
                isDark ? "bg-slate-900/80 text-white ring-1 ring-white/10" : "bg-white/80 ring-1 ring-slate-900/5"
            )}>
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-blue-500/5 pointer-events-none" />

                <DialogHeader className="relative z-10">
                    <DialogTitle className={cn("text-xl font-black tracking-tight flex items-center gap-2", isDark ? "text-white" : "text-slate-900")}>
                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                            <Wallet className="w-5 h-5" />
                        </div>
                        Nova Transação
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5 py-4 relative z-10">
                    <div className="space-y-2">
                        <Label className={cn("text-xs font-bold uppercase tracking-wider opacity-70", isDark ? "text-slate-300" : "text-slate-600")}>Descrição</Label>
                        <Input
                            placeholder="Ex: Aluguel, Consulta..."
                            required
                            value={formData.description}
                            onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                            className={cn(
                                "h-11 rounded-xl transition-all",
                                isDark
                                    ? "bg-black/20 border-white/10 focus:bg-black/40 text-white placeholder:text-slate-500 focus:border-emerald-500/50"
                                    : "bg-white/60 border-slate-200 focus:bg-white text-slate-900 focus:border-emerald-500/50"
                            )}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className={cn("text-xs font-bold uppercase tracking-wider opacity-70", isDark ? "text-slate-300" : "text-slate-600")}>Valor (R$)</Label>
                            <div className="relative">
                                <span className={cn("absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black", isDark ? "text-slate-500" : "text-slate-400")}>R$</span>
                                <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    required
                                    value={formData.amount}
                                    onChange={e => setFormData(p => ({ ...p, amount: e.target.value }))}
                                    className={cn(
                                        "h-11 pl-8 rounded-xl transition-all font-mono font-bold",
                                        isDark
                                            ? "bg-black/20 border-white/10 focus:bg-black/40 text-white placeholder:text-slate-500 focus:border-emerald-500/50"
                                            : "bg-white/60 border-slate-200 focus:bg-white text-slate-900 focus:border-emerald-500/50"
                                    )}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className={cn("text-xs font-bold uppercase tracking-wider opacity-70", isDark ? "text-slate-300" : "text-slate-600")}>Data</Label>
                            <Input
                                type="date"
                                required
                                value={formData.date}
                                onChange={e => setFormData(p => ({ ...p, date: e.target.value }))}
                                className={cn(
                                    "h-11 rounded-xl transition-all",
                                    isDark
                                        ? "bg-black/20 border-white/10 focus:bg-black/40 text-white"
                                        : "bg-white/60 border-slate-200 focus:bg-white text-slate-900"
                                )}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className={cn("text-xs font-bold uppercase tracking-wider opacity-70", isDark ? "text-slate-300" : "text-slate-600")}>Tipo de Movimentação</Label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setFormData(p => ({ ...p, type: 'income' }))}
                                className={cn(
                                    "flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border transition-all duration-300 relative overflow-hidden group",
                                    formData.type === 'income'
                                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-500"
                                        : (isDark ? "border-white/5 bg-black/20 text-slate-500 hover:bg-black/40" : "border-slate-200 bg-white/50 text-slate-500 hover:bg-white")
                                )}
                            >
                                <div className={cn("w-full h-1 absolute bottom-0 left-0 transition-all duration-300", formData.type === 'income' ? "bg-emerald-500" : "bg-transparent group-hover:bg-emerald-500/30")} />
                                <ArrowUpRight className="w-5 h-5" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Entrada</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData(p => ({ ...p, type: 'expense' }))}
                                className={cn(
                                    "flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border transition-all duration-300 relative overflow-hidden group",
                                    formData.type === 'expense'
                                        ? "border-rose-500 bg-rose-500/10 text-rose-500"
                                        : (isDark ? "border-white/5 bg-black/20 text-slate-500 hover:bg-black/40" : "border-slate-200 bg-white/50 text-slate-500 hover:bg-white")
                                )}
                            >
                                <div className={cn("w-full h-1 absolute bottom-0 left-0 transition-all duration-300", formData.type === 'expense' ? "bg-rose-500" : "bg-transparent group-hover:bg-rose-500/30")} />
                                <ArrowDownRight className="w-5 h-5" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Saída</span>
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className={cn("text-xs font-bold uppercase tracking-wider opacity-70", isDark ? "text-slate-300" : "text-slate-600")}>Categoria</Label>
                        <Select
                            value={formData.category}
                            onValueChange={v => setFormData(p => ({ ...p, category: v }))}
                        >
                            <SelectTrigger className={cn(
                                "h-11 rounded-xl transition-all",
                                isDark
                                    ? "bg-black/20 border-white/10 focus:bg-black/40 text-white"
                                    : "bg-white/60 border-slate-200 focus:bg-white text-slate-900"
                            )}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className={cn("backdrop-blur-xl", isDark ? "bg-slate-900/95 border-slate-800" : "bg-white/95 border-slate-100")}>
                                {["Consultas", "Procedimentos", "Vendas", "Aluguel", "Equipamentos", "Marketing", "Pessoal", "Impostos", "Outros"].map(cat => (
                                    <SelectItem key={cat} value={cat} className="cursor-pointer font-medium text-xs uppercase tracking-wide">
                                        {cat}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-12 rounded-xl font-black uppercase tracking-widest mt-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-emerald-500/20"
                        disabled={createMutation.isPending}
                    >
                        {createMutation.isPending ? "Salvando..." : "Confirmar Transação"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}




