import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft, Loader2, Calendar, Clock, FileText,
  Tag, CheckCircle2, Phone
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function PatientHistory() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const patientId = urlParams.get("id");

  const { data: patient, isLoading } = useQuery({
    queryKey: ["patient", patientId],
    queryFn: async () => {
      const patients = await base44.entities.Patient.list();
      return patients.find(p => p.id === patientId);
    },
    enabled: !!patientId
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ["appointments"],
    queryFn: () => base44.entities.Appointment.list("-date")
  });

  const { data: medicalRecords = [] } = useQuery({
    queryKey: ["medical-records", patientId],
    queryFn: () => base44.entities.MedicalRecord.filter({ patient_id: patientId }, "-date"),
    enabled: !!patientId
  });

  // Filter appointments for this patient
  const patientAppointments = appointments.filter(a => a.patient_id === patientId);

  // Get patient interests (promotions)
  const patientInterests = (patient?.interests || []).sort((a, b) =>
    new Date(b.date) - new Date(a.date)
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">Paciente não encontrado.</p>
        <Button variant="link" onClick={() => navigate(createPageUrl("Patients"))}>
          Voltar para lista
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12">
      {/* Header Profile */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <Button
            variant="ghost"
            size="sm"
            className="mb-6 -ml-2 text-slate-500 hover:text-slate-900"
            onClick={() => navigate(createPageUrl("Patients"))}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Pacientes
          </Button>

          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <Avatar className="w-24 h-24 border-4 border-slate-50 shadow-sm">
              <AvatarFallback className="bg-blue-50 text-blue-600 text-3xl font-bold">
                {patient.name?.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-bold text-slate-900">{patient.name}</h1>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100">
                  Paciente Ativo
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-slate-500">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  {patient.phone || "Sem telefone"}
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Nasc: {patient.birth_date ? format(parseISO(patient.birth_date), "dd/MM/yyyy") : "Não informado"}
                </div>
              </div>
            </div>

            <div className="flex gap-2 w-full md:w-auto">
              {/* <Button className="flex-1 md:flex-none">Novo Agendamento</Button> */}
              {/* <Button variant="outline" className="flex-1 md:flex-none">Editar Perfil</Button> */}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Timeline Section */}
        <div className="lg:col-span-2 space-y-8">
          <section>
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Prontuários e Evoluções
            </h3>
            <div className="space-y-4">
              {medicalRecords.length > 0 ? medicalRecords.map((record) => (
                <Card key={record.id} className="p-6 hover:shadow-md transition-shadow border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <FileText className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">Evolução Clínica</p>
                        <p className="text-xs text-slate-500">
                          {format(parseISO(record.date), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                      Dr(a). {record.professional_name}
                    </Badge>
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                    {record.content}
                  </p>
                </Card>
              )) : (
                <div className="p-12 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200">
                  <p className="text-slate-400">Nenhum prontuário registrado para este paciente.</p>
                </div>
              )}
            </div>
          </section>

          <section>
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              Histórico de Agendamentos
            </h3>
            <div className="space-y-3">
              {patientAppointments.length > 0 ? patientAppointments.map((app) => (
                <div key={app.id} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200">
                  <div className="w-12 h-12 bg-slate-50 rounded-lg flex flex-col items-center justify-center border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      {format(parseISO(app.date), "MMM", { locale: ptBR })}
                    </span>
                    <span className="text-lg font-bold text-slate-900 leading-none">
                      {format(parseISO(app.date), "dd")}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-900">{app.procedure_name || "Consulta Geral"}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {app.start_time}
                      </span>
                      <span>•</span>
                      <span>Dr(a). {app.professional_name}</span>
                    </div>
                  </div>
                  <Badge className={
                    app.status === "confirmado" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                      app.status === "cancelado" ? "bg-rose-50 text-rose-700 border-rose-100" :
                        "bg-amber-50 text-amber-700 border-amber-100"
                  }>
                    {app.status}
                  </Badge>
                </div>
              )) : (
                <p className="text-center py-8 text-slate-400 bg-white rounded-xl border border-dashed">
                  Sem agendamentos anteriores.
                </p>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card className="p-6 space-y-6 border-slate-200">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <Tag className="w-4 h-4 text-amber-500" />
              Interesses e Promoções
            </h4>
            <div className="space-y-4">
              {patientInterests.length > 0 ? patientInterests.map((interest, idx) => (
                <div key={idx} className="p-3 bg-amber-50/50 rounded-lg border border-amber-100">
                  <p className="text-sm font-bold text-amber-900">{interest.promotion_name}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-amber-700 uppercase font-medium">
                      {format(parseISO(interest.date), "dd/MM/yyyy")}
                    </span>
                    <Badge className="bg-amber-200 text-amber-800 text-[10px] h-5">
                      Interessado
                    </Badge>
                  </div>
                </div>
              )) : (
                <p className="text-xs text-slate-400 italic">Nenhum interesse registrado.</p>
              )}
            </div>
          </Card>

          <Card className="p-6 bg-slate-900 text-white border-none">
            <h4 className="font-bold mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              Resumo do Paciente
            </h4>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-slate-400">Total Consultas</span>
                <span className="font-bold">{patientAppointments.length}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-slate-400">Última Visita</span>
                <span className="font-bold">
                  {patientAppointments[0] ? format(parseISO(patientAppointments[0].date), "dd/MM/yy") : "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Fidelidade</span>
                <Badge className="bg-primary text-slate-900 font-bold">Bronze</Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
