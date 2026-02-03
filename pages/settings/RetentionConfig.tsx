import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/lib/base44Client";
import { PROCEDURE_CATEGORIES } from "@/lib/procedures";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
    Clock, Calendar, Sparkles, Save, RotateCcw,
    Bell, TrendingUp, Zap
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
            // Updates is an array of { id, return_interval }
            const promises = updates.map(update =>
                base44.entities.ProcedureType.update(update.id, { return_interval: update.return_interval })
            );
            await Promise.all(promises);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["procedure-types"] });
            toast.success("Intervalos de retorno atualizados!");
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
        if (!confirm("Isso irá restaurar TODOS os intervalos para os valores padrão recomendados e aplicar imediatamente. Continuar?")) return;

        const defaults: Record<string, number> = {};
        const updates: UpdateItem[] = [];

        // Build defaults and updates list
        Object.entries(PROCEDURE_CATEGORIES).forEach(([catName, data]) => {
            const defaultInterval = data.interval || 0;
            defaults[catName] = defaultInterval;

            // Find all procedures in this category
            procedures.forEach(proc => {
                const matches = data.items.some(item =>
                    proc.name.toLowerCase().includes(item.toLowerCase())
                );

                if (matches) {
                    updates.push({ id: proc.id, return_interval: defaultInterval });
                }
            });
        });

        // Update local state
        setCategoryIntervals(defaults);

        // Apply to database immediately
        if (updates.length > 0) {
            toast.info(`Aplicando valores padrão em ${updates.length} procedimentos...`);
            updateMutation.mutate(updates);
        } else {
            toast.warning("Nenhum procedimento encontrado para atualizar.");
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
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <Clock className="w-8 h-8 text-indigo-600" />
                        Configuração de renovação
                    </h1>
                    <p className="text-slate-500 mt-2">
                        Defina o tempo ideal de renovação para cada categoria de procedimento.
                        Isso alimenta o <strong>Smart Retention</strong> com alertas personalizados.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={handleReset}
                        disabled={updateMutation.isPending}
                    >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Restaurar Padrões
                    </Button>
                    <Button
                        className={cn(
                            "bg-indigo-600 hover:bg-indigo-700",
                            hasChanges && "animate-pulse"
                        )}
                        onClick={handleSave}
                        disabled={!hasChanges || updateMutation.isPending}
                    >
                        <Save className="w-4 h-4 mr-2" />
                        {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                    </Button>
                </div>
            </div>

            {/* Categories Grid */}
            {isLoading ? (
                <div className="text-center py-10 text-slate-500">Carregando procedimentos...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.entries(PROCEDURE_CATEGORIES).map(([catName, catData]) => {
                        const Icon = CATEGORY_ICONS[catName] || Clock;
                        const interval = categoryIntervals[catName] || 0;
                        const color = catData.color;

                        // Count procedures in this category
                        const procCount = procedures.filter(p =>
                            catData.items.some(item =>
                                p.name.toLowerCase().includes(item.toLowerCase())
                            )
                        ).length;

                        return (
                            <Card
                                key={catName}
                                className="border-2 hover:shadow-lg transition-all"
                                style={{ borderColor: color + '30' }}
                            >
                                <CardHeader className="pb-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm"
                                                style={{
                                                    backgroundColor: color + '15',
                                                    color: color
                                                }}
                                            >
                                                <Icon className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg">{catName}</CardTitle>
                                                <CardDescription className="text-xs">
                                                    {procCount} {procCount === 1 ? 'procedimento' : 'procedimentos'}
                                                </CardDescription>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Display Current Interval */}
                                    <div className="text-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                                            Intervalo de renovação
                                        </p>
                                        <p className="text-3xl font-black text-slate-900">
                                            {interval}
                                            <span className="text-sm text-slate-400 font-normal ml-2">dias</span>
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            ≈ {formatDuration(interval)}
                                        </p>
                                    </div>

                                    {/* Slider */}
                                    <div className="space-y-2">
                                        <Slider
                                            value={[interval]}
                                            onValueChange={(value: number[]) => handleIntervalChange(catName, value[0])}
                                            max={730}
                                            step={15}
                                            className="cursor-pointer"
                                        />
                                        <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                                            <span>0 dias</span>
                                            <span>2 anos</span>
                                        </div>
                                    </div>

                                    {/* Quick Presets */}
                                    <div className="flex gap-2 flex-wrap">
                                        {[30, 60, 90, 120, 180, 270, 365, 730, 1095].map(days => (
                                            <Badge
                                                key={days}
                                                variant={interval === days ? "default" : "outline"}
                                                className={cn(
                                                    "cursor-pointer hover:bg-slate-100 transition-all text-xs",
                                                    interval === days && "shadow-md"
                                                )}
                                                style={interval === days ? {
                                                    backgroundColor: color,
                                                    color: 'white',
                                                    borderColor: color
                                                } : {}}
                                                onClick={() => handleIntervalChange(catName, days)}
                                            >
                                                {formatDuration(days)}
                                            </Badge>
                                        ))}
                                        <Badge
                                            variant={interval === 0 ? "default" : "outline"}
                                            className={cn(
                                                "cursor-pointer hover:bg-slate-100 transition-all",
                                                interval === 0 && "bg-slate-900 text-white"
                                            )}
                                            onClick={() => handleIntervalChange(catName, 0)}
                                        >
                                            Sem renovação
                                        </Badge>
                                    </div>

                                    {/* Manual Input */}
                                    <div className="pt-2 border-t border-slate-100">
                                        <label className="text-xs font-semibold text-slate-500 mb-1 block">
                                            Ou digite o valor exato:
                                        </label>
                                        <Input
                                            type="number"
                                            min="0"
                                            max={730}
                                            value={interval}
                                            onChange={(e) => handleIntervalChange(catName, parseInt(e.target.value) || 0)}
                                            className="text-center font-bold"
                                            placeholder="Dias"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Info Footer */}
            <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white flex-shrink-0">
                            <Bell className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-blue-900 mb-1">Como funciona o Smart Retention?</h3>
                            <p className="text-sm text-blue-700 leading-relaxed">
                                Quando você registra um procedimento em um prontuário, o sistema calcula automaticamente
                                a <strong>data ideal de retorno</strong> somando o intervalo configurado aqui.
                                Quando essa data se aproxima (até 45 dias antes), o paciente aparece na página de
                                <strong> Oportunidades</strong>, permitindo que você entre em contato via WhatsApp
                                com uma mensagem personalizada.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

