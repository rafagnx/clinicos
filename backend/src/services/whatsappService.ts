import axios from 'axios';
import { prisma } from './prisma.js';

export class WhatsAppService {
    private async getConfig(organizationId: string) {
        const org = await (prisma.organization as any).findUnique({
            where: { id: organizationId },
            select: {
                evolutionBaseUrl: true,
                evolutionInstanceName: true,
                evolutionToken: true,
                whatsappTemplates: true
            }
        }) as any;

        if (!org || !org.evolutionInstanceName || !org.evolutionToken) {
            throw new Error('WhatsApp service not configured for this organization');
        }

        return org;
    }

    async sendMessage(organizationId: string, phone: string, message: string) {
        try {
            const config = await this.getConfig(organizationId);
            const baseUrl = config.evolutionBaseUrl || 'https://api.evolution-api.com';

            // Format phone: remove non-digits, ensure country code (55 for Brazil default)
            let formattedPhone = phone.replace(/\D/g, '');
            if (formattedPhone.length <= 11) {
                formattedPhone = '55' + formattedPhone;
            }

            const url = `${baseUrl}/message/sendText/${config.evolutionInstanceName}`;

            const response = await axios.post(url, {
                number: formattedPhone,
                text: message,
                options: {
                    delay: 1200,
                    presence: 'composing',
                    linkPreview: false
                }
            }, {
                headers: {
                    'apikey': config.evolutionToken
                }
            });

            // Log message
            await prisma.message.create({
                data: {
                    organizationId,
                    content: message,
                    // sender_id: system? We might need to handle this. For now just content.
                }
            });

            return response.data;
        } catch (error: any) {
            console.error('Error sending WhatsApp message:', error.response?.data || error.message);
            throw error;
        }
    }

    async sendTemplateMessage(organizationId: string, phone: string, templateType: string, variables: Record<string, string>) {
        const config = await this.getConfig(organizationId);
        const templates = config.whatsappTemplates as Record<string, string> || {};
        let message = templates[templateType];

        if (!message) {
            // Default templates fallback (if not in DB yet)
            const defaults: Record<string, string> = {
                lembrete_24h: "Olá {nome}! 👋\n\nLembrando sua consulta marcada para amanhã:\n📅 {data} às {hora}\n👨‍⚕️ Com {profissional}\n\nConfirma sua presença? Digite 1 para SIM ou 2 para NÃO.",
                pos_consulta: "Olá {nome}! Tudo bem? ✨\n\nComo foi sua consulta com {profissional}? Adoraríamos saber sua opinião! Responda com uma nota de 1 a 10.",
                promocao: "Olá {nome}! 🎁\n\n{promocao}\n\nAgende agora mesmo falando conosco por aqui!"
            };
            message = defaults[templateType];
        }

        if (!message) {
            throw new Error(`Template ${templateType} not found`);
        }

        // Replace variables
        for (const [key, value] of Object.entries(variables)) {
            message = message.replace(new RegExp(`{${key}}`, 'g'), value);
        }

        return this.sendMessage(organizationId, phone, message);
    }
}

export const whatsappService = new WhatsAppService();
