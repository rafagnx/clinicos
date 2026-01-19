import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Bell, Check, Trash2, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function NotificationList({ onClose }: { onClose: () => void }) {
    const queryClient = useQueryClient();

    const { data: notifications = [], isLoading } = useQuery({
        queryKey: ["notifications"],
        queryFn: () => base44.read("Notification", {
            sort: [{ field: "created_date", direction: "desc" }]
        })
    });

    const markAsReadMutation = useMutation({
        mutationFn: (id: string) => base44.update("Notification", id, { read: true }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => base44.delete("Notification", id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
            toast.success("Notificação removida");
        }
    });

    const markAllReadMutation = useMutation({
        mutationFn: async () => {
            const unread = notifications.filter((n: any) => !n.read);
            await Promise.all(unread.map((n: any) => base44.update("Notification", n.id, { read: true })));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
            toast.success("Todas marcadas como lidas");
        }
    });

    if (isLoading) {
        return <div className="p-4 text-center text-slate-500">Carregando...</div>;
    }

    return (
        <div className="flex flex-col h-full w-full max-w-sm bg-white shadow-lg border-l">
            <div className="flex items-center justify-between p-4 border-b">
                <h2 className="font-semibold text-lg flex items-center gap-2">
                    <Bell className="w-5 h-5 text-blue-600" />
                    Notificações
                </h2>
                <div className="flex items-center gap-1">
                    {notifications.some((n: any) => !n.read) && (
                        <Button
                            variant="ghost"
                            size="icon"
                            title="Marcar todas como lidas"
                            onClick={() => markAllReadMutation.mutate()}
                        >
                            <Check className="w-4 h-4 text-blue-600" />
                        </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            <ScrollArea className="flex-1">
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-slate-500 p-4 font-bold">
                        <Bell className="w-8 h-8 mb-2 opacity-20" />
                        <p>Nenhuma notificação</p>
                    </div>
                ) : (
                    <div className="divide-y">
                        {notifications.map((notification: any) => (
                            <div
                                key={notification.id}
                                className={cn(
                                    "p-4 hover:bg-slate-50 transition-colors relative group",
                                    !notification.read && "bg-blue-50/50"
                                )}
                            >
                                <div className="flex justify-between items-start gap-3">
                                    <div className="flex-1 space-y-1">
                                        <p className={cn("text-sm text-slate-900", !notification.read && "font-semibold")}>
                                            {notification.title}
                                        </p>
                                        <p className="text-xs text-slate-500 line-clamp-2">
                                            {notification.message}
                                        </p>
                                        <p className="text-[10px] text-slate-400">
                                            {notification.created_date ? formatDistanceToNow(new Date(notification.created_date), { addSuffix: true, locale: ptBR }) : 'Agora'}
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {!notification.read && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={() => markAsReadMutation.mutate(notification.id)}
                                                title="Marcar como lida"
                                            >
                                                <div className="w-2 h-2 rounded-full bg-blue-600" />
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-slate-400 hover:text-rose-600"
                                            onClick={() => deleteMutation.mutate(notification.id)}
                                            title="Remover"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}
