import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/lib/base44Client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Loader2, Send, Users, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function SendPromotionModal({ open, onOpenChange, promotion }) {
  const queryClient = useQueryClient();
  const [selectedPatients, setSelectedPatients] = useState([]);
  const [message, setMessage] = useState("");

  const { data: patients = [] } = useQuery({
    queryKey: ["patients"],
    queryFn: () => base44.entities.Patient.filter({ status: "ativo" })
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["whatsapp-templates"],
    queryFn: () => base44.entities.WhatsAppTemplate.filter({ type: "promocao", enabled: true })
  });

  React.useEffect(() => {
    if (promotion && templates.length > 0) {
      const template = templates[0];
      let msg = template.message;
      msg = msg.replace(/{promocao}/g, promotion.name || "");
      msg = msg.replace(/{procedimento}/g, promotion.procedure || "");
      msg = msg.replace(/{valor}/g, promotion.promotional_price?.toFixed(2) || "");
      msg = msg.replace(/{profissional}/g, promotion.professional_name || "");
      setMessage(msg);
    }
  }, [promotion, templates]);

  const sendMutation = useMutation({
    mutationFn: async () => {
      // Send WhatsApp messages
      const messagePromises = selectedPatients.map(patientId => {
        const patient = patients.find(p => p.id === patientId);
        if (!patient) return null;

        const personalizedMsg = message.replace(/{nome}/g, patient.full_name);
        
        return base44.entities.WhatsAppMessage.create({
          patient_id: patient.id,
          content: personalizedMsg,
          status: "pending",
          type: "promotion",
          promotion_id: promotion.id
        });
      });

      await Promise.all(messagePromises.filter(Boolean));
    },
    onSuccess: () => {
      toast.success("Mensagens enviadas para a fila de processamento!");
      onOpenChange(false);
      setSelectedPatients([]);
    },
    onError: () => {
      toast.error("Erro ao enviar mensagens. Tente novamente.");
    }
  });

  const togglePatient = (id) => {
    setSelectedPatients(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedPatients.length === patients.length) {
      setSelectedPatients([]);
    } else {
      setSelectedPatients(patients.map(p => p.id));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Send className="w-6 h-6 text-primary" />
            Enviar Promoção: {promotion?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 py-6">
          {/* Seleção de Pacientes */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-bold">Selecionar Pacientes</Label>
              <Button variant="ghost" size="sm" onClick={selectAll}>
                {selectedPatients.length === patients.length ? "Desmarcar Todos" : "Selecionar Todos"}
              </Button>
            </div>
            
            <div className="border rounded-xl divide-y max-h-[400px] overflow-y-auto bg-slate-50">
              {patients.map(patient => (
                <div 
                  key={patient.id} 
                  className="flex items-center gap-3 p-3 hover:bg-white transition-colors cursor-pointer"
                  onClick={() => togglePatient(patient.id)}
                >
                  <Checkbox checked={selectedPatients.includes(patient.id)} />
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={patient.photo_url} />
                    <AvatarFallback>{patient.full_name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{patient.full_name}</p>
                    <p className="text-xs text-slate-500">{patient.phone}</p>
                  </div>
                  {patient.tags?.map(tag => (
                    <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                  ))}
                </div>
              ))}
            </div>
            <p className="text-sm text-slate-500">
              {selectedPatients.length} pacientes selecionados de {patients.length} ativos.
            </p>
          </div>

          {/* Mensagem e Preview */}
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-lg font-bold">Mensagem WhatsApp</Label>
              <Textarea 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[200px] text-base leading-relaxed"
                placeholder="Escreva sua mensagem aqui..."
              />
              <p className="text-xs text-slate-400">
                Dica: Use <code className="bg-slate-100 px-1 rounded">{"{nome}"}</code> para personalizar com o nome do paciente.
              </p>
            </div>

            <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 space-y-4">
              <h4 className="font-bold text-emerald-800 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Preview da Mensagem
              </h4>
              <div className="bg-white p-4 rounded-xl shadow-sm text-sm text-slate-700 whitespace-pre-wrap">
                {message.replace(/{nome}/g, "João Silva")}
              </div>
            </div>

            <Button 
              className="w-full py-6 text-lg gap-2 shadow-xl shadow-primary/20"
              disabled={selectedPatients.length === 0 || sendMutation.isPending}
              onClick={() => sendMutation.mutate()}
            >
              {sendMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
              Enviar para {selectedPatients.length} Pacientes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

