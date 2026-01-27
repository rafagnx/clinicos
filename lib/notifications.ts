import { base44 } from "@/lib/base44Client";

export type NotificationType = 'appointment' | 'payment' | 'alert' | 'success' | 'info';

interface CreateNotificationParams {
    title: string;
    message: string;
    type: NotificationType;
    userId?: string;
    organizationId?: string;
    metadata?: Record<string, any>;
}

/**
 * Create a new notification
 */
export async function createNotification(params: CreateNotificationParams) {
    try {
        const notification = await base44.create("Notification", {
            title: params.title,
            message: params.message,
            type: params.type,
            user_id: params.userId,
            organization_id: params.organizationId,
            metadata: params.metadata ? JSON.stringify(params.metadata) : null,
            read: false,
            created_date: new Date().toISOString()
        });

        // Optional: Play notification sound
        if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'granted') {
                new Notification(params.title, {
                    body: params.message,
                    icon: '/favicon.ico'
                });
            }
        }

        return notification;
    } catch (error) {
        console.error('Failed to create notification:', error);
        return null;
    }
}

/**
 * Notification templates for common events
 */
export const NotificationTemplates = {
    appointmentCreated: (patientName: string, date: string) => ({
        title: '📅 Novo Agendamento',
        message: `Consulta marcada para ${patientName} em ${date}`,
        type: 'appointment' as NotificationType
    }),

    appointmentCanceled: (patientName: string) => ({
        title: '❌ Consulta Cancelada',
        message: `A consulta de ${patientName} foi cancelada`,
        type: 'alert' as NotificationType
    }),

    paymentReceived: (amount: number, patientName: string) => ({
        title: '💰 Pagamento Recebido',
        message: `R$ ${amount.toFixed(2)} de ${patientName}`,
        type: 'payment' as NotificationType
    }),

    subscriptionExpiring: (daysLeft: number) => ({
        title: '⚠️ Assinatura Expirando',
        message: `Sua assinatura PRO expira em ${daysLeft} dias`,
        type: 'alert' as NotificationType
    }),

    subscriptionActivated: () => ({
        title: '✨ Assinatura Ativada',
        message: 'Bem-vindo ao ClinicOS PRO! Aproveite todos os recursos.',
        type: 'success' as NotificationType
    }),

    newTeamMember: (memberName: string) => ({
        title: '👥 Novo Membro',
        message: `${memberName} foi adicionado à equipe`,
        type: 'info' as NotificationType
    })
};

/**
 * Request browser notification permission
 */
export function requestNotificationPermission() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }
}

