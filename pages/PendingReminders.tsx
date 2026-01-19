import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Bell, Loader2, Mail, Send, Calendar, Clock, User, Phone, Copy, Check } from "lucide-react";
import { format, parseISO, addHours, isBefore, isAfter, differenceInHours } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PendingReminders() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [copiedId, setCopiedId] = useState(null);

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me()
  });

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["appointments"],
    queryFn: () => base44.entities.Appointment.list("-date")
  });

  const { data: patients = [] } = useQuery({
    queryKey: ["patients"],
    queryFn: () => base44.entities.Patient.list()
  });

  const sendReminderMutation = useMutation({
    mutationFn: async ({ appointment, patient }) => {
      const settings = user?.reminder_settings || {};
      const template = settings.reminder_message_template || 
        "Olá {patient_name}! Lembramos que você tem uma consulta agendada para {date} às {time} com {professional_name}.";

      const message = template
        .replace("{patient_name}", patient.full_name)
        .replace("{date}", format(parseISO(appointment.date), "dd/MM/yyyy", { locale: ptBR }))
        .replace("{time}", appointment.start_time)
        .replace("{professional_name}", appointment.professional_name);

      await base44.integrations.Core.SendEmail({
        to: patient.email,
        subject: "Lembrete de Consulta - Clínica Integrada",
        body: message
      });

      await base44.entities.Notification.create({
        user_id: patient.id,
        title: "Lembrete de Consulta",
        content: message,
        type: "reminder",
        read: false,
        created_date: new Date().toISOString()
      });

      // Update appointment to mark reminder as sent
      await base44.entities.Appointment.update(appointment.id, {
        reminder_sent: true,
        reminder_sent_at: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Lembrete enviado com sucesso!");
    }
  });

  const pendingReminders = appointments.filter(app => {
    const patient = patients.find(p => p.id === app.patient_id);
    if (!patient || app.status === "cancelado" || app.reminder_sent) return false;

    const appDate = parseISO(app.date);
    const now = new Date();
    
    // Only show reminders for future appointments (next 48 hours)
    const isFuture = isAfter(appDate, now);
    const isSoon = differenceInHours(appDate, now) <= 48;

    return isFuture && isSoon;
  });

  const handleCopyWhatsApp = (appointment, patient) => {
    const text = `Olá ${patient.full_name}! Confirmamos sua consulta para o dia ${format(parseISO(appointment.date), "dd/MM/yyyy")} às ${appointment.start_time}. Podemos confirmar sua presença?`;
    navigator.clipboard.writeText(text);
    setCopiedId(appointment.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("Mensagem copiada!");
  };

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Lembretes Pendentes</h1>
          <p className="text-slate-500">Envie confirmações para as consultas das próximas 48h</p>
        </div>
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 px-4 py-1">
          {pendingReminders.length} Pendentes
        </Badge>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
          </div>
        ) : pendingReminders.length === 0 ? (
          <Card className="p-12 text-center border-dashed border-2">
            <Bell className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900">Tudo em dia!</h3>
            <p className="text-slate-500">Não há lembretes pendentes para as próximas 48 horas.</p>
          </Card>
        ) : (
          pendingReminders.map(app => {
            const patient = patients.find(p => p.id === app.patient_id);
            return (
              <Card key={app.id} className="p-5 hover:shadow-md transition-shadow border-slate-200">
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  <div className="flex items-center gap-4 min-w-[250px]">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={patient?.photo_url} />
                      <AvatarFallback className="bg-blue-50 text-blue-600 font-bold">
                        {patient?.full_name?.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-bold text-slate-900">{patient?.full_name}</h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {patient?.phone}
                      </p>
                    </div>
                  </div>

                  <div className="flex-1 grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Data e Hora</p>
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Calendar className="w-4 h-4 text-blue-500" />
                        {format(parseISO(app.date), "dd/MM/yyyy")} às {app.start_time}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Procedimento</p>
                      <p className="text-sm font-medium truncate">{app.procedure_name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 md:flex-none"
                      onClick={() => handleCopyWhatsApp(app, patient)}
                    >
                      {copiedId === app.id ? <Check className="w-4 h-4 mr-2 text-green-600" /> : <Copy className="w-4 h-4 mr-2" />}
                      WhatsApp
                    </Button>
                    <Button 
                      size="sm" 
                      className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700"
                      onClick={() => sendReminderMutation.mutate({ appointment: app, patient })}
                      disabled={sendReminderMutation.isPending}
                    >
                      {sendReminderMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
                      E-mail
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
