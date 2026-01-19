import React, { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, XCircle, Calendar, Clock, User, Loader2 } from "lucide-react";

export default function ConfirmAppointment() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token");
  const [confirmed, setConfirmed] = useState(false);

  const { data: confirmationData, isLoading } = useQuery({
    queryKey: ["confirmation", token],
    queryFn: async () => {
      const confirmations = await base44.entities.AppointmentConfirmation.filter({ token });
      return confirmations[0];
    },
    enabled: !!token
  });

  const { data: appointment } = useQuery({
    queryKey: ["appointment", confirmationData?.appointment_id],
    queryFn: async () => {
      const apts = await base44.entities.Appointment.filter({ id: confirmationData.appointment_id });
      return apts[0];
    },
    enabled: !!confirmationData?.appointment_id
  });

  const confirmMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.AppointmentConfirmation.update(confirmationData.id, {
        confirmed: true,
        confirmed_at: new Date().toISOString()
      });
      await base44.entities.Appointment.update(appointment.id, { status: "confirmado" });
    },
    onSuccess: () => {
      setConfirmed(true);
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-50 flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!token || (!confirmationData && !isLoading)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center">
            <XCircle className="w-10 h-10 text-rose-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Link Inválido</h1>
          <p className="text-slate-500">Este link de confirmação expirou ou é inválido. Por favor, entre em contato com a clínica.</p>
        </Card>
      </div>
    );
  }

  if (confirmed || confirmationData?.confirmed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Presença Confirmada!</h1>
          <p className="text-slate-500">Obrigado por confirmar seu agendamento. Esperamos por você!</p>
          {appointment && (
            <div className="mt-6 p-4 bg-slate-50 rounded-lg text-left space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Calendar className="w-4 h-4" />
                <span>{format(new Date(appointment.date), "PPPP", { locale: ptBR })}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Clock className="w-4 h-4" />
                <span>{appointment.start_time}</span>
              </div>
            </div>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-slate-900">Confirmar Agendamento</h1>
          <p className="text-slate-500">Olá! Por favor, confirme sua presença para o agendamento abaixo:</p>
        </div>

        {appointment && (
          <div className="space-y-4 p-6 bg-blue-50/50 rounded-xl border border-blue-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Paciente</p>
                <p className="font-semibold text-slate-900">{appointment.patient_name}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-blue-100">
              <div>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Data</p>
                <p className="font-medium text-slate-900">{format(new Date(appointment.date), "dd/MM/yyyy")}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Horário</p>
                <p className="font-medium text-slate-900">{appointment.start_time}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-blue-100">
              <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Procedimento</p>
              <p className="font-medium text-slate-900">{appointment.procedure_name}</p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <Button 
            className="w-full h-12 text-lg font-semibold shadow-lg shadow-blue-200"
            onClick={() => confirmMutation.mutate()}
            disabled={confirmMutation.isPending}
          >
            {confirmMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Confirmar Presença"}
          </Button>
          <p className="text-center text-xs text-slate-400">
            Ao confirmar, seu horário será garantido em nossa agenda.
          </p>
        </div>
      </Card>
    </div>
  );
}
