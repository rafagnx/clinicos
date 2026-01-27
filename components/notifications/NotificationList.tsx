import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/lib/base44Client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Bell, Check, Trash2, X, Calendar, DollarSign, AlertCircle, Info, CheckCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const getNotificationIcon = (type: string) => {
    switch (type) {
        case 'appointment':
            return { Icon: Calendar, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950' };
        case 'payment':
            return { Icon: DollarSign, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950' };
        case 'alert':
            return { Icon: AlertCircle, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950' };
        case 'success':
            return { Icon: CheckCircle, color: 'text-green-500 bg-green-50 dark:bg-green-950' };
        default:
            return { Icon: Info, color: 'text-slate-500 bg-slate-50 dark:bg-slate-900' };
    }
};

export default function NotificationList({ notifications, onMarkAsRead, onDelete, user }: any) {
    const queryClient = useQueryClient();

    const markAsReadMutation = useMutation({
        mutationFn: onMarkAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: onDelete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
            toast.success("Notificação removida");
        }
    });

    const markAllReadMutation = useMutation({
        mutationFn: async () => {
            const unread = notifications.filter((n: any) => !n.read);
            await Promise.all(unread.map((n: any) => onMarkAsRead(n.id)));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
            toast.success("Todas marcadas como lidas");
        }
    });

    if (!notifications) {
        return <div className="p-4 text-center text-slate-500">Carregando...</div>;
    }

    const unreadCount = notifications.filter((n: any) => !n.read).length;

    return (
        <div className="w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Notificações</span>
                    {unreadCount > 0 && (
                        <span className="px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full animate-pulse">
                            {unreadCount}
                        </span>
                    )}
                </div>
                {unreadCount > 0 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => markAllReadMutation.mutate()}
                    >
                        <Check className="w-3 h-3 mr-1" />
                        Marcar todas
                    </Button>
                )}
            </div>

            {/* List */}
            {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                    <Bell className="w-12 h-12 mb-3 opacity-20" />
                    <p className="text-sm font-medium">Nenhuma notificação</p>
                    <p className="text-xs">Você está em dia! 🎉</p>
                </div>
            ) : (
                <div className="space-y-1">
                    {notifications.map((notification: any) => {
                        const { Icon, color } = getNotificationIcon(notification.type);
                        return (
                            <div
                                key={notification.id}
                                className={cn(
                                    "group relative p-3 rounded-lg transition-all hover:shadow-md cursor-pointer",
                                    !notification.read
                                        ? "bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900"
                                        : "bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800"
                                )}
                            >
                                <div className="flex gap-3">
                                    {/* Icon */}
                                    <div className={cn("w-9 h-9 rounded-full flex items-center justify-center shrink-0", color)}>
                                        <Icon className="w-4 h-4" />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className={cn(
                                                "text-sm leading-tight",
                                                !notification.read ? "font-semibold text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300"
                                            )}>
                                                {notification.title}
                                            </p>
                                            {!notification.read && (
                                                <div className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1" />
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                                            {notification.message}
                                        </p>
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                                            {notification.created_date
                                                ? formatDistanceToNow(new Date(notification.created_date), { addSuffix: true, locale: ptBR })
                                                : 'Agora'}
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {!notification.read && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    markAsReadMutation.mutate(notification.id);
                                                }}
                                                title="Marcar como lida"
                                            >
                                                <Check className="w-3 h-3" />
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-slate-400 hover:text-rose-600"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteMutation.mutate(notification.id);
                                            }}
                                            title="Remover"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

