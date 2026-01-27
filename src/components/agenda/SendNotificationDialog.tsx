import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/lib/base44Client";
import { format } from "date-fns";
import { MessageSquare, Send, Copy } from "lucide-react";
import { toast } from "sonner";

interface SendNotificationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    appointment: any;
}

const TEMPLATE_OPTIONS = [
    { value: "lembrete_24h", label: "Lembrete 24h Antes" },
    { value: "lembrete_2h", label: "Lembrete 2h Antes" },
    { value: "confirmacao", label: "Confirmação" },
    { value: "pos_consulta", label: "Pós-Consulta" },
    { value: "promocao", label: "Promoção" }
];

const DEFAULT_TEMPLATES = {
    lembrete_24h: "Olá {nome}! 👋\n\nLembrando sua consulta marcada para amanhã:\n📅 {data} às {hora}\n👨‍⚕️ Com {profissional}\n\nConfirma sua presença? Digite 1 para SIM ou 2 para NÃO.",
    lembrete_2h: "Oi {nome}! 🔔\n\nSua consulta é daqui a 2 horas:\n🕒 Hoje às {hora}\n👨‍⚕️ Com {profissional}\n\nJá estamos te esperando! 🏥",
    confirmacao: "Olá {nome}! ✅\n\nSua consulta foi agendada:\n📅 {data} às {hora}\n👨‍⚕️ Com {profissional}\n\nObrigado por escolher nossa clínica! ✨",
    pos_consulta: "Olá {nome}! 💜\n\nObrigado por sua visita hoje!\n\nComo foi sua experiência? Conte-nos! 👇\n[Link de Avaliação]",
    promocao: "Oi {nome}! ✨\n\nTemos uma promoção especial para você:\n\n🔥 {promocao}\n💰 Por apenas R$ {valor}\n\nResponda EU QUERO para aproveitar! 🚀"
};

export default function SendNotificationDialog({ open, onOpenChange, appointment }: SendNotificationDialogProps) {
    const [selectedTemplate, setSelectedTemplate] = useState("confirmacao");
    const [message, setMessage] = useState("");

    const { data: clinic } = useQuery({
        queryKey: ["clinic"],
        queryFn: async () => {
            const clinics = await base44.entities.Clinic.list();
            return clinics[0];
        }
    });

    useEffect(() => {
        if (open && appointment && clinic) {
            generateMessage(selectedTemplate);
        }
    }, [open, appointment, clinic, selectedTemplate]);

    const generateMessage = (templateKey: string) => {
        let template = "";

        // Try getting from clinic settings first, fallback to default
        if (clinic?.whatsapp_templates && clinic.whatsapp_templates[templateKey]) {
            template = clinic.whatsapp_templates[templateKey];
        } else {
            template = DEFAULT_TEMPLATES[templateKey as keyof typeof DEFAULT_TEMPLATES] || "";
        }

        if (!appointment) return;

        // Extract variables
        const patientName = appointment.patient?.full_name?.split(" ")[0] || "Paciente";
        const profissionalName = appointment.professional?.full_name?.split(" ")[0] || "Dr(a).";

        // Format Date
        let dateStr = appointment.date;
        if (dateStr.includes("T")) dateStr = dateStr.split("T")[0];
        const [y, m, d] = dateStr.split("-");
        const formattedDate = `${d}/${m}`; // Simple DD/MM

        const formattedTime = appointment.start_time;

        // Replace placeholders
        const finalMessage = template
            .replace(/{nome}/g, patientName)
            .replace(/{data}/g, formattedDate)
            .replace(/{hora}/g, formattedTime)
            .replace(/{profissional}/g, profissionalName)
            .replace(/{promocao}/g, "Consulta Especial") // Default placeholder
            .replace(/{valor}/g, "0,00");

        setMessage(finalMessage);
    };

    const handleSend = () => {
        if (!appointment?.patient?.phone) {
            toast.error("Paciente sem telefone cadastrado!");
            return;
        }

        // Clean phone number
        let phone = appointment.patient.phone.replace(/\D/g, "");

        // Add Brazil country code if missing (assuming 11 digits: 21 99999-9999 or 10 digits)
        if (phone.length <= 11) {
            phone = "55" + phone;
        }

        const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        window.open(url, "_blank");
        onOpenChange(false);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(message);
        toast.success("Mensagem copiada!");
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-green-600" />
                        Enviar Mensagem WhatsApp
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label>Modelo de Mensagem</Label>
                        <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {TEMPLATE_OPTIONS.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Pré-visualização da Mensagem</Label>
                        <Textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="min-h-[150px] bg-slate-50 border-slate-200"
                        />
                    </div>

                    {appointment?.patient && (
                        <div className="bg-slate-50 p-3 rounded-lg border text-sm text-slate-600 flex justify-between items-center">
                            <span>Enviando para: <span className="font-semibold text-slate-900">{appointment.patient.full_name}</span></span>
                            <span className="text-xs font-mono bg-slate-200 px-2 py-1 rounded">{appointment.patient.phone || "Sem telefone"}</span>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={handleCopy} title="Copiar texto">
                        <Copy className="w-4 h-4 mr-2" />
                        Copiar
                    </Button>
                    <Button onClick={handleSend} className="bg-[#25D366] hover:bg-[#128C7E] text-white">
                        <Send className="w-4 h-4 mr-2" />
                        Enviar no WhatsApp
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

