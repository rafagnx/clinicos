import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/lib/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MessageCircle, Send, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

// Default templates if none exist in settings
const defaultTemplates = {
    lembrete_24h: "Olá {nome}! 👋\n\nLembrando sua consulta marcada para amanhã:\n📅 {data} às {hora}\n👨‍⚕️ Com {profissional}\n\nConfirma sua presença?",
    confirmacao: "Olá {nome}! ✅\n\nSua consulta foi agendada:\n📅 {data} às {hora}\n👨‍⚕️ Com {profissional}\n\nObrigado por escolher nossa clínica!",
    pos_consulta: "Olá {nome}! 💜\n\nObrigado por sua visita hoje!\n\nComo foi sua experiência? Conte-nos!",
    custom: ""
};

const templateLabels = {
    lembrete_24h: "Lembrete 24h Antes",
    confirmacao: "Confirmação de Agendamento",
    pos_consulta: "Pós-Consulta",
    custom: "Mensagem Personalizada"
};

interface WhatsAppModalProps {
    patient: any;
    isOpen: boolean;
    onClose: () => void;
}

export default function WhatsAppModal({ patient, isOpen, onClose }: WhatsAppModalProps) {
    const [selectedTemplate, setSelectedTemplate] = useState("lembrete_24h");
    const [message, setMessage] = useState("");
    const [copied, setCopied] = useState(false);

    // Fetch clinic settings for templates
    const { data: clinic } = useQuery({
        queryKey: ["clinic"],
        queryFn: async () => {
            const clinics = await base44.entities.Clinic.list();
            return clinics[0];
        }
    });

    // Fetch next appointment for this patient to populate variables
    const { data: nextAppointment } = useQuery({
        queryKey: ["next-appointment", patient?.id],
        queryFn: async () => {
            if (!patient?.id) return null;
            // Fetch appointments and find the next upcoming one
            const apps = await base44.entities.Appointment.list("-date");
            const patientApps = apps.filter((a: any) =>
                a.patient_id === patient.id &&
                new Date(a.date) >= new Date(new Date().setHours(0, 0, 0, 0))
            );
            // Sort by date ascending to get the nearest upcoming
            return patientApps.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
        },
        enabled: !!patient?.id && isOpen
    });

    useEffect(() => {
        if (isOpen && patient) {
            generateMessage(selectedTemplate);
        }
    }, [isOpen, selectedTemplate, clinic, nextAppointment, patient]);

    const generateMessage = (templateKey: string) => {
        let rawTemplate = "";

        if (templateKey === "custom") {
            rawTemplate = ""; // Start empty for custom
        } else if (clinic?.whatsapp_templates && clinic.whatsapp_templates[templateKey]) {
            rawTemplate = clinic.whatsapp_templates[templateKey];
        } else {
            rawTemplate = defaultTemplates[templateKey as keyof typeof defaultTemplates] || "";
        }

        // Replace variables
        let finalMessage = rawTemplate
            .replace(/{nome}/g, patient?.name || patient?.full_name || "")
            .replace(/{telefone}/g, patient?.phone || "");

        if (nextAppointment) {
            finalMessage = finalMessage
                .replace(/{data}/g, format(new Date(nextAppointment.date), "dd/MM"))
                .replace(/{hora}/g, nextAppointment.start_time || "")
                .replace(/{profissional}/g, nextAppointment.professional_name || "Dr(a).");
        } else {
            // If no appointment, clean up unreplaced variables roughly or leave them empty
            finalMessage = finalMessage
                .replace(/{data}/g, "[DATA]")
                .replace(/{hora}/g, "[HORA]")
                .replace(/{profissional}/g, "[PROFISSIONAL]");
        }

        setMessage(finalMessage);
    };

    const handleSend = () => {
        if (!patient?.phone) {
            toast.error("Paciente sem telefone cadastrado.");
            return;
        }

        const cleanPhone = patient.phone.replace(/\D/g, '');
        const encodedMessage = encodeURIComponent(message);
        const url = `https://wa.me/55${cleanPhone}?text=${encodedMessage}`;

        window.open(url, '_blank');
        onClose();
        toast.success("WhatsApp aberto com a mensagem!");
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(message);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success("Mensagem copiada!");
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-emerald-500" />
                        Enviar WhatsApp
                    </DialogTitle>
                    <DialogDescription>
                        Selecione um modelo ou escreva uma mensagem personalizada para {patient?.name?.split(' ')[0]}.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Modelo de Mensagem</Label>
                        <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(templateLabels).map(([key, label]) => (
                                    <SelectItem key={key} value={key}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Mensagem</Label>
                        <Textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="h-40 resize-none bg-slate-50 focus:bg-white transition-colors"
                            placeholder="Digite sua mensagem..."
                        />
                        <p className="text-xs text-slate-400 text-right">
                            {message.length} caracteres
                        </p>
                    </div>
                </div>

                <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
                    <Button variant="outline" onClick={handleCopy} className="w-full sm:w-auto">
                        {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                        {copied ? "Copiado" : "Copiar Texto"}
                    </Button>
                    <Button onClick={handleSend} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white">
                        <Send className="w-4 h-4 mr-2" />
                        Enviar via WhatsApp
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
