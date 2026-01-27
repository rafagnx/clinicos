import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { toast } from "sonner";

export default function NotificationPermissionPrompt() {
    const [permission, setPermission] = useState(Notification.permission);

    useEffect(() => {
        if ('Notification' in window) {
            setPermission(Notification.permission);
        }
    }, []);

    const requestPermission = async () => {
        if (!('Notification' in window)) {
            toast.error("Este navegador não suporta notificações.");
            return;
        }

        try {
            const result = await Notification.requestPermission();
            setPermission(result);
            if (result === 'granted') {
                toast.success("Notificações ativadas!");
                new Notification("ClinicOS", { body: "As notificações estão funcionando!" });
            } else {
                toast.info("Você pode ativar as notificações nas configurações do navegador.");
            }
        } catch (error) {
            console.error("Erro ao solicitar permissão:", error);
        }
    };

    if (permission === 'granted' || permission === 'denied') {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 p-4 bg-white rounded-xl shadow-xl border border-slate-200 w-80 animate-in slide-in-from-bottom-5">
            <div className="flex items-start gap-4">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                    <Bell className="w-5 h-5" />
                </div>
                <div className="flex-1">
                    <h4 className="font-semibold text-slate-900 mb-1">Ativar notificações?</h4>
                    <p className="text-xs text-slate-500 mb-3">
                        Receba alertas sobre novos agendamentos e mensagens importantes.
                    </p>
                    <div className="flex gap-2">
                        <Button size="sm" onClick={requestPermission} className="bg-blue-600 hover:bg-blue-700 text-xs h-8">
                            Ativar
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setPermission('denied')} // Dismiss for session
                            className="text-xs h-8"
                        >
                            Agora não
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
