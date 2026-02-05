import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/lib/base44Client";
import { PROCEDURE_CATEGORIES } from "@/lib/procedures";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
    Clock, Calendar, Sparkles, Save, RotateCcw,
    Bell, TrendingUp, Zap, Settings, Activity
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate, useOutletContext } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    "Toxina": Zap,
    "Preenchimentos": Sparkles,
    "Fios": TrendingUp,
    "Bioestimuladores": Bell,
    "Corporal": TrendingUp,
    "Tecnologias": Bell,
    "Transplante": Calendar,
    "Cirurgias": Calendar
};

type UpdateItem = { id: number | string; return_interval: number };

export default function RetentionConfig() {
    const { isDark } = useOutletContext<{ isDark: boolean }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [categoryIntervals, setCategoryIntervals] = useState<Record<string, number>>({});
    const [hasChanges, setHasChanges] = useState(false);

    const { data: procedures = [], isLoading } = useQuery({
        queryKey: ["procedure-types"],
        queryFn: () => base44.entities.ProcedureType.list()
    });

    // Initialize intervals from DEFAULT values (not database)
    useEffect(() => {
        const intervals: Record<string, number> = {};
        Object.entries(PROCEDURE_CATEGORIES).forEach(([catName, data]) => {
            intervals[catName] = data.interval || 0;
        });
        setCategoryIntervals(intervals);
    }, []);

    const updateMutation = useMutation<void, Error, UpdateItem[]>({
        mutationFn: async (updates: UpdateItem[]) => {
            const promises = updates.map(update =>
                base44.entities.ProcedureType.update(update.id, { return_interval: update.return_interval })
            );
            await Promise.all(promises);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["procedure-types"] });
            toast.success("Intervalos atualizados com sucesso!");
            setHasChanges(false);
        },
        onError: () => {
            toast.error("Erro ao atualizar intervalos.");
        }
    });

    const handleIntervalChange = (category: string, value: number) => {
        setCategoryIntervals(prev => ({ ...prev, [category]: value }));
        setHasChanges(true);
    };

    const handleSave = () => {
        const updates: UpdateItem[] = [];

        Object.entries(categoryIntervals).forEach(([catName, interval]) => {
            const catData = PROCEDURE_CATEGORIES[catName];

            // Find all procedures in this category
            procedures.forEach(proc => {
                const matches = catData.items.some(item =>
                    proc.name.toLowerCase().includes(item.toLowerCase())
                );

                if (matches) {
                    updates.push({ id: proc.id, return_interval: interval });
                }
            });
        });

        if (updates.length > 0) {
            updateMutation.mutate(updates);
        } else {
            toast.info("Nenhuma alteração detectada.");
        }
    };

    const handleReset = () => {
        if (!confirm("Isso irá restaurar TODOS os intervalos para os valores padrão recomendados. Continuar?")) return;

        const defaults: Record<string, number> = {};
        const updates: UpdateItem[] = [];

        Object.entries(PROCEDURE_CATEGORIES).forEach(([catName, data]) => {
            const defaultInterval = data.interval || 0;
            defaults[catName] = defaultInterval;

            procedures.forEach(proc => {
                const matches = data.items.some(item =>
                    proc.name.toLowerCase().includes(item.toLowerCase())
                );

                if (matches) {
                    updates.push({ id: proc.id, return_interval: defaultInterval });
                }
            });
        });

        setCategoryIntervals(defaults);

        if (updates.length > 0) {
            toast.info(`Restaurando padrões em ${updates.length} procedimentos...`);
            updateMutation.mutate(updates);
        } else {
            toast.warning("Nenhum procedimento encontrado.");
        }
    };

    const formatDuration = (days: number): string => {
        if (days === 0) return "Sem renovação";
        if (days < 30) return `${days} dias`;
        if (days === 30) return "1 mês";
        if (days < 365) {
            const months = Math.round(days / 30);
            return `${months} ${months === 1 ? 'mês' : 'meses'}`;
        }
        if (days === 365) return "1 ano";
        if (days < 730) {
            const months = Math.round(days / 30);
            return `${months} meses`;
        }
        const years = Math.round(days / 365);
        return `${years} ${years === 1 ? 'ano' : 'anos'}`;
    };

    return (
        <div className={cn(
            "p-4 lg:p-10 max-w-[1600px] mx-auto min-h-screen relative overflow-hidden flex flex-col space-y-8",
            isDark ? "text-slate-100" : "text-slate-900"
        )}>

            {/* Header Liquid Scale */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 text-[8px] font-black uppercase tracking-widest mb-1 backdrop-blur-md">
                        <Activity className="w-2.5 h-2.5" /> SMART RETENTION
                    </div>
                    <h1 className={cn("text-3xl md:text-5xl font-black mb-1 tracking-tighter leading-[0.85] filter drop-shadow-sm", isDark ? "text-white" : "text-slate-900")}>
                        CONFIGURAÇÃO DE <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">RENOVAÇÃO</span>
                    </h1>
                    <p className={cn("text-sm font-bold tracking-tight opacity-60 flex items-center gap-2", isDark ? "text-slate-400" : "text-slate-600")}>
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                        Defina o ciclo de vida ideal para cada procedimento e automatize o retorno.
                    </p>
                </div>

                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={() => navigate('/Settings/ProcedureTypes')}
                        className={cn(
                            "h-12 px-6 rounded-xl border font-bold uppercase tracking-widest text-[10px] transition-all hover:scale-105 active:scale-95",
                            isDark ? "bg-slate-900/40 border-white/10 text-slate-300 hover:bg-slate-800" : "bg-white/60 border-slate-200 hover:bg-white"
                        )}
                    >
                        <Settings className="w-4 h-4 mr-2" />
                        Gerenciar Procedimentos
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={handleReset}
                        disabled={updateMutation.isPending}
                        className={cn("h-12 w-12 rounded-xl p-0", isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900")}
                        title="Restaurar Padrões"
                    >
                        <RotateCcw className="w-5 h-5" />
                    </Button>
                    <Button
                        className={cn(
                            "h-12 px-8 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95",
                            hasChanges && "animate-pulse ring-2 ring-indigo-500/50 ring-offset-2 ring-offset-slate-950"
                        )}
                        onClick={handleSave}
                        disabled={!hasChanges || updateMutation.isPending}
                    >
                        {updateMutation.isPending ? <Sparkles className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                    </Button>
                </div>
            </div>

            {/* Categories Grid */}
            {isLoading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 relative z-10 pb-20">
                    <AnimatePresence>
                        {Object.entries(PROCEDURE_CATEGORIES).map(([catName, catData], idx) => {
                            const Icon = CATEGORY_ICONS[catName] || Clock;
                            const interval = categoryIntervals[catName] || 0;
                            const color = catData.color;

                            const procCount = procedures.filter(p =>
                                catData.items.some(item =>
                                    p.name.toLowerCase().includes(item.toLowerCase())
                                )
                            ).length;

                            return (
                                <motion.div
                                    key={catName}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className={cn(
                                        "group relative overflow-hidden rounded-[2rem] border transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 p-6 flex flex-col gap-6",
                                        isDark ? "bg-slate-950/40 border-white/5 hover:border-white/10" : "bg-white/60 border-slate-200 hover:border-indigo-200"
                                    )}
                                >
                                    {/* Glass Effect BG */}
                                    <div className={cn("absolute inset-0 backdrop-blur-md transition-opacity opacity-0 group-hover:opacity-100", isDark ? "bg-white/[0.02]" : "bg-indigo-50/30")} />

                                    {/* Header */}
                                    <div className="flex items-center justify-between relative z-10">
                                        <div className="flex items-center gap-4">
                                            <div
                                                className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110"
                                                style={{
                                                    backgroundColor: isDark ? color + '20' : color + '15',
                                                    color: color,
                                                    borderColor: color + '30',
                                                    borderWidth: 1
                                                }}
                                            >
                                                <Icon className="w-7 h-7" />
                                            </div>
                                            <div>
                                                <h3 className={cn("text-lg font-black tracking-tight", isDark ? "text-slate-100" : "text-slate-900")}>{catName}</h3>
                                                <p className={cn("text-[10px] font-bold uppercase tracking-widest opacity-60", isDark ? "text-slate-400" : "text-slate-500")}>
                                                    {procCount} {procCount === 1 ? 'procedimento' : 'procedimentos'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Main Value Display */}
                                    <div className={cn(
                                        "relative z-10 rounded-2xl p-6 text-center border transition-colors group-hover:bg-opacity-50",
                                        isDark ? "bg-slate-900/50 border-white/5" : "bg-slate-50 border-slate-100"
                                    )}>
                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">
                                            RENOVAÇÃO EM
                                        </p>
                                        <div className="flex items-baseline justify-center gap-1">
                                            <span className={cn("text-4xl font-black tracking-tighter", isDark ? "text-white" : "text-slate-900")}>
                                                {interval}
                                            </span>
                                            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">DIAS</span>
                                        </div>
                                        <div className={cn("inline-block mt-2 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide", isDark ? "bg-white/5 text-slate-400" : "bg-slate-200/50 text-slate-600")}>
                                            ≈ {formatDuration(interval)}
                                        </div>
                                    </div>

                                    {/* Controls */}
                                    <div className="space-y-4 relative z-10 flex-1">
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                <span>Ajuste Rápido</span>
                                                <span>{interval} dias</span>
                                            </div>
                                            <Slider
                                                value={[interval]}
                                                onValueChange={(value) => handleIntervalChange(catName, value[0])}
                                                max={730}
                                                step={15}
                                                className="cursor-pointer"
                                            />
                                        </div>

                                        {/* Presets */}
                                        <div className="flex flex-wrap gap-2 pt-2">
                                            {[30, 90, 180, 365].map(days => (
                                                <button
                                                    key={days}
                                                    onClick={() => handleIntervalChange(catName, days)}
                                                    className={cn(
                                                        "px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border",
                                                        interval === days
                                                            ? (isDark ? "bg-white text-slate-900 border-white" : "bg-slate-900 text-white border-slate-900")
                                                            : (isDark ? "bg-slate-800/50 text-slate-400 border-white/5 hover:bg-slate-800" : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200")
                                                    )}
                                                >
                                                    {formatDuration(days)}
                                                </button>
                                            ))}
                                            <button
                                                onClick={() => handleIntervalChange(catName, 0)}
                                                className={cn(
                                                    "px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border ml-auto",
                                                    interval === 0
                                                        ? "bg-red-500 text-white border-red-500"
                                                        : (isDark ? "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20" : "bg-red-50 text-red-600 border-red-100 hover:bg-red-100")
                                                )}
                                            >
                                                OFF
                                            </button>
                                        </div>

                                        {/* Manual Input */}
                                        {/* <div className="pt-4 mt-auto">
                                        <div className={cn("relative rounded-xl overflow-hidden border", isDark ? "bg-slate-950/50 border-white/10" : "bg-white border-slate-200")}>
                                             <input
                                                type="number"
                                                value={interval}
                                                onChange={(e) => handleIntervalChange(catName, parseInt(e.target.value) || 0)}
                                                className={cn("w-full bg-transparent border-0 text-center text-xs font-bold h-9 outline-none focus:ring-0", isDark ? "text-white" : "text-slate-900")}
                                             />
                                             <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[9px] font-black opacity-40">DIAS</div>
                                        </div>
                                     </div> */}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}

            {/* Info Footer */}
            <div className={cn(
                "rounded-[2rem] p-8 border relative z-10 overflow-hidden",
                isDark ? "bg-indigo-950/20 border-indigo-500/20" : "bg-indigo-50/50 border-indigo-100"
            )}>
                <div className="flex flex-col md:flex-row gap-6 items-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-xl flex-shrink-0 animate-pulse-slow">
                        <Sparkles className="w-8 h-8" />
                    </div>
                    <div className="space-y-2 text-center md:text-left">
                        <h3 className={cn("text-xl font-black tracking-tight", isDark ? "text-white" : "text-indigo-900")}>
                            Como funciona o Smart Retention?
                        </h3>
                        <p className={cn("text-sm font-medium leading-relaxed max-w-3xl", isDark ? "text-indigo-200/80" : "text-indigo-700/80")}>
                            Quando você registra um procedimento no prontuário do paciente, nosso sistema calcula automaticamente quando ele deve retornar com base nesses intervalos.
                            Faltando 45 dias para o vencimento, o paciente aparecerá automaticamente na aba <strong>Oportunidades</strong>, pronto para ser recontactado.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
