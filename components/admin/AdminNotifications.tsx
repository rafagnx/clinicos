import React, { useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Bell, CreditCard, UserPlus, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function AdminNotifications() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (open) {
            // Mock fetching important alerts
            // In a real scenario, this would hit /api/admin/notifications
            const mocks = [
                { id: 1, title: "Nova Assinatura PRO", desc: "Clínica Estética Avançada atualizou para o plano PRO.", type: 'payment', time: new Date(Date.now() - 1000 * 60 * 30) },
                { id: 2, title: "Nova Empresa Cadastrada", desc: "Dr. João Silva criou uma nova organização.", type: 'user', time: new Date(Date.now() - 1000 * 60 * 60 * 2) },
                { id: 3, title: "Alerta de Sistema", desc: "Taxa de erro no WhatsApp API subiu para 2%.", type: 'alert', time: new Date(Date.now() - 1000 * 60 * 60 * 5) },
                { id: 4, title: "Backup Realizado", desc: "Backup diário do banco de dados concluído com sucesso.", type: 'system', time: new Date(Date.now() - 1000 * 60 * 60 * 12) },
            ];
            setNotifications(mocks);
        }
    }, [open]);

    const getIcon = (type: string) => {
        switch (type) {
            case 'payment': return <CreditCard className="w-4 h-4 text-green-500" />;
            case 'user': return <UserPlus className="w-4 h-4 text-blue-500" />;
            case 'alert': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
            default: return <Bell className="w-4 h-4 text-slate-500" />;
        }
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full relative hover:bg-slate-800">
                    <Bell className="w-5 h-5 text-slate-400" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0B0E14] animate-pulse"></span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 mr-4 bg-[#1C2333] border-slate-700 text-slate-200 shadow-xl" align="end">
                <div className="p-4 border-b border-slate-700 bg-slate-900/50">
                    <h4 className="font-semibold text-white">Notificações Admin</h4>
                    <p className="text-xs text-slate-400">Atualizações importantes do sistema</p>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                    {notifications.map(n => (
                        <div key={n.id} className="p-4 border-b border-slate-800 hover:bg-slate-800/50 transition-colors flex gap-3 cursor-default">
                            <div className="mt-1 bg-slate-800 p-2 rounded-full h-fit border border-slate-700">
                                {getIcon(n.type)}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-white">{n.title}</p>
                                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{n.desc}</p>
                                <p className="text-[10px] text-slate-500 mt-2 font-mono">
                                    {formatDistanceToNow(n.time, { addSuffix: true, locale: ptBR })}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="p-2 border-t border-slate-700 bg-slate-900/50 text-center">
                    <Button variant="ghost" size="sm" className="text-xs text-indigo-400 hover:text-indigo-300 w-full">
                        Ver Todas
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
