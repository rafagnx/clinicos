import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function SendWhatsAppButton({ appointment, patient, className }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [message, setMessage] = useState("");

  const { data: templates = [] } = useQuery({
    queryKey: ["whatsapp-templates"],
    queryFn: () => base44.entities.WhatsAppTemplate.filter({ enabled: true })
  });

  const sendMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.WhatsAppMessage.create(data);
      const whatsappUrl = `https://wa.me/${patient.whatsapp || patient.phone}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-messages"] });
      setOpen(false);
      toast.success("WhatsApp aberto!");
    }
  });

  const applyTemplate = (templateId) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    let msg = template.message;
    msg = msg.replace(/{nome}/g, patient.full_name || "");
    msg = msg.replace(/{data}/g, appointment?.date ? new Date(appointment.date).toLocaleDateString('pt-BR') : "");
    msg = msg.replace(/{hora}/g, appointment?.start_time || "");
    msg = msg.replace(/{profissional}/g, appointment?.professional_name || "");
    msg = msg.replace(/{procedimento}/g, appointment?.procedure_name || "");

    setMessage(msg);
  };

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        className={className}
        onClick={() => setOpen(true)}
      >
        <MessageSquare className="w-4 h-4 mr-2" />
        WhatsApp
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Mensagem WhatsApp</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Modelo de Mensagem</Label>
              <Select onValueChange={applyTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um modelo..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Mensagem</Label>
              <Textarea 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
              />
            </div>

            <Button 
              className="w-full"
              disabled={!message || sendMutation.isPending}
              onClick={() => sendMutation.mutate({
                patient_id: patient.id,
                appointment_id: appointment?.id,
                content: message,
                status: "sent"
              })}
            >
              {sendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <MessageSquare className="w-4 h-4 mr-2" />}
              Abrir WhatsApp
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
