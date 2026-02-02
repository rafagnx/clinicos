import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Calendar, DollarSign, MessageSquare, AlertCircle, BarChart3 } from "lucide-react";

const AVAILABLE_WIDGETS = [
    {
        id: "upcoming_appointments",
        name: "Próximas Consultas",
        description: "Visualize as próximas consultas agendadas",
        icon: Calendar,
        color: "text-blue-600"
    },
    {
        id: "financial_reports",
        name: "Relatórios Financeiros",
        description: "Gráficos de faturamento, ranking e métricas",
        icon: BarChart3,
        color: "text-emerald-600"
    },
    {
        id: "chat_activity",
        name: "Atividade do Chat",
        description: "Veja as conversas mais recentes",
        icon: MessageSquare,
        color: "text-indigo-600"
    },
    {
        id: "urgent_reminders",
        name: "Lembretes Urgentes",
        description: "Alertas e ações importantes do dia",
        icon: AlertCircle,
        color: "text-rose-600"
    }
];

export default function WidgetSelector({ open, onOpenChange, widgets, onToggleWidget }) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Personalizar Dashboard</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <p className="text-sm text-slate-500">
                        Selecione quais widgets deseja exibir no seu dashboard
                    </p>

                    {AVAILABLE_WIDGETS.map((widget) => {
                        const isEnabled = widgets.find(w => w.id === widget.id)?.enabled ?? true;
                        return (
                            <div key={widget.id} className="flex items-start gap-4 p-4 rounded-lg border hover:bg-slate-50 transition-colors">
                                <widget.icon className={`w-6 h-6 shrink-0 ${widget.color}`} />
                                <div className="flex-1 min-w-0">
                                    <Label className="text-base font-medium text-slate-800">{widget.name}</Label>
                                    <p className="text-sm text-slate-500 mt-1">{widget.description}</p>
                                </div>
                                <Switch
                                    checked={isEnabled}
                                    onCheckedChange={() => onToggleWidget(widget.id)}
                                />
                            </div>
                        );
                    })}
                </div>

                <div className="flex justify-end pt-4 border-t">
                    <Button onClick={() => onOpenChange(false)}>
                        Fechar
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
